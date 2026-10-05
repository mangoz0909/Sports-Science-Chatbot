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
  | {
    allowed: false;
    used: number;
    limit: number;
    message: string;
    /** 429 when the athlete is over the cap, 503 when the quota is not set up. */
    status: 429 | 503;
  };

/**
 * Error codes that mean the quota machinery itself does not exist, as opposed
 * to a call that failed. 42883 / 42P01 are Postgres's undefined_function and
 * undefined_table; PGRST202 / PGRST205 are PostgREST's "function / table not
 * found in the schema cache".
 */
const MISSING_OBJECT_CODES = new Set(["42883", "42P01", "PGRST202", "PGRST205"]);

function isMissingQuotaObject(
  error: { code?: string; message?: string },
): boolean {
  if (error.code && MISSING_OBJECT_CODES.has(error.code)) return true;

  return /could not find the (function|table)/i.test(error.message ?? "");
}

/**
 * Charges one request against today's quota.
 *
 * Fails CLOSED when `consume_ai_quota` or `ai_usage` does not exist. That state
 * is permanent until a migration is applied, not a blip, and failing open there
 * leaves the endpoint with no spend cap at all — exactly what the cap exists to
 * prevent, and the situation a half-applied baseline migration produces. The
 * request is refused with 503 until the migration is run.
 *
 * Fails OPEN for every other error (a timeout, a dropped connection, a
 * transient PostgREST failure). Those clear on their own, the counter is
 * intact, and refusing every athlete because of one slow query would turn a
 * brief database hiccup into an assistant outage. The cap exists to bound a
 * bill, not to gate access, and one uncounted request during a blip is a
 * bounded cost. The failure is logged either way.
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
    if (isMissingQuotaObject(error)) {
      console.error(
        "AI quota is not set up (consume_ai_quota / ai_usage missing) — " +
          "refusing the request. Apply the baseline migration " +
          "20260905000000_baseline_schema_rls_and_ai_quota.sql.",
        error,
      );

      return {
        allowed: false,
        used: 0,
        limit,
        status: 503,
        message: "AI is temporarily unavailable. Please try again later.",
      };
    }

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
    status: 429,
    message:
      `You have reached today's limit of ${limit} AI requests. ` +
      `This resets at midnight UTC.`,
  };
}
