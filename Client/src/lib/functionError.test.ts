import { functionErrorMessage } from "./functionError";

/** Mirrors the FunctionsHttpError supabase-js throws for a non-2xx reply. */
function httpError(status: number, body: unknown) {
  const error = new Error("Edge Function returned a non-2xx status code");
  (error as Error & { context: Response }).context = new Response(
    typeof body === "string" ? body : JSON.stringify(body),
    { status, headers: { "Content-Type": "application/json" } }
  );
  return error;
}

describe("functionErrorMessage", () => {
  it("surfaces the quota message the function actually sent", async () => {
    const error = httpError(429, {
      error: "You have reached today's limit of 120 AI requests. This resets at midnight UTC.",
    });

    await expect(functionErrorMessage(error, "fallback")).resolves.toBe(
      "You have reached today's limit of 120 AI requests. This resets at midnight UTC."
    );
  });

  it("does not show supabase-js's own placeholder to the user", async () => {
    // No body to read: the placeholder is useless, so the caller's fallback wins.
    const error = new Error("Edge Function returned a non-2xx status code");

    await expect(functionErrorMessage(error, "Failed to reach the AI service.")).resolves.toBe(
      "Failed to reach the AI service."
    );
  });

  it("keeps a genuine error message, such as a network failure", async () => {
    await expect(
      functionErrorMessage(new TypeError("Failed to fetch"), "fallback")
    ).resolves.toBe("Failed to fetch");
  });

  it("falls back when the body is not JSON", async () => {
    await expect(functionErrorMessage(httpError(502, "<html>bad gateway"), "fallback"))
      .resolves.toBe("fallback");
  });

  it("falls back when the JSON body carries no error field", async () => {
    await expect(functionErrorMessage(httpError(500, { detail: "nope" }), "fallback"))
      .resolves.toBe("fallback");
  });

  it("leaves the body readable for a caller that also wants it", async () => {
    const error = httpError(429, { error: "Rate limited." });
    const response = (error as Error & { context: Response }).context;

    await functionErrorMessage(error, "fallback");

    await expect(response.json()).resolves.toEqual({ error: "Rate limited." });
  });

  it("handles a non-Error rejection", async () => {
    await expect(functionErrorMessage("something odd", "fallback")).resolves.toBe("fallback");
  });
});
