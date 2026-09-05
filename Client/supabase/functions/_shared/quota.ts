/**
 * Per-user daily spend cap for the OpenAI-backed functions.
 *
 * Both functions are authenticated but not trusted: any account could loop
 * them and bill the project's OpenAI key without limit. `consume_ai_quota` is
 * a SECURITY DEFINER function in Postgres that increments the caller's counter
 * for today and reports whether they were still under the cap, in one
 * statement — so two requests racing cannot both read the same count and pass.
 *
 * It runs through the caller's own JWT, which is why there is no service-role
 * key here: the SQL function derives the user from auth.uid() rather than
 * trusting anything the request supplies.
 */

export type QuotaResult =
  | { allowed: true; used: number; limit: number }
  | { allowed: false; used: number; limit: number; message: string };

/**
 * Charges one request against today's quota.
 *
 * Fails OPEN: if the quota table or function is unreachable the request is
 * allowed through and the problem is logged. A broken counter should not take
 * the whole assistant down — the cap exists to bound a bill, not to gate
 * access, and the alternative is an outage triggered by a migration that has
 * not been applied yet.
 */
export async function consumeQuota(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  limit: number,
): Promise<QuotaResult> {
  const { data, error } = await supabase.rpc("consume_ai_quota", {
    p_limit: limit,
  });

  if (error) {
    console.error("Could not check the AI quota — allowing the request:", error);

    return { allowed: true, used: 0, limit };
  }

  const row = Array.isArray(data) ? data[0] : data;
  const used = Number(row?.used ?? 0);
  const allowed = row?.allowed !== false;

  if (allowed) return { allowed: true, used, limit };

  return {
    allowed: false,
    used,
    limit,
    message:
      `You have reached today's limit of ${limit} AI requests. ` +
      `This resets at midnight UTC.`,
  };
}
