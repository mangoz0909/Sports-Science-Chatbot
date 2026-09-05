/**
 * The message an edge function actually sent, rather than the one supabase-js
 * invents.
 *
 * `functions.invoke` rejects any non-2xx with a FunctionsHttpError whose
 * message is the fixed string "Edge Function returned a non-2xx status code" —
 * the JSON body, where every one of these functions puts a written explanation,
 * is left unread on `error.context`. That turned a clear "You have reached
 * today's limit of 120 AI requests" into an error the athlete cannot act on.
 *
 * The body is only readable asynchronously, which is why this is async and why
 * callers have to await it before showing anything.
 */
export async function functionErrorMessage(
  error: unknown,
  fallback: string
): Promise<string> {
  const response = (error as { context?: unknown } | null)?.context;

  if (response instanceof Response) {
    try {
      // clone() so a caller that also wants the body is not handed a used
      // stream.
      const body = await response.clone().json();
      const message = (body as { error?: unknown } | null)?.error;

      if (typeof message === "string" && message.trim()) {
        return message.trim();
      }
    } catch {
      // Not JSON, or already consumed — fall through to the generic message.
    }
  }

  if (error instanceof Error && error.message.trim()) {
    // supabase-js's own placeholder says nothing a user can act on.
    if (!/non-2xx status code/i.test(error.message)) {
      return error.message.trim();
    }
  }

  return fallback;
}
