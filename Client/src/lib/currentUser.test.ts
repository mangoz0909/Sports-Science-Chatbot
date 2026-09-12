/**
 * Being signed out is a state; everything else is still an error.
 *
 * supabase-js reports a missing session as an AuthSessionMissingError rather
 * than `{ user: null }`, so the services' `if (userError) throw userError;
 * if (!user) return null;` pairs always threw and never reached the null
 * branch. These tests pin the distinction that fixed it.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthSessionMissingError } from "@supabase/supabase-js";

type GetUserResult = {
  data: { user: { id: string } | null };
  error: unknown;
};

let result: GetUserResult;

vi.mock("./supabaseClient", () => ({
  supabase: {
    auth: {
      getUser: () => Promise.resolve(result),
    },
  },
}));

const { getCurrentUser, requireCurrentUser } = await import("./currentUser");

describe("getCurrentUser", () => {
  beforeEach(() => {
    result = { data: { user: null }, error: null };
  });

  it("returns the athlete when one is signed in", async () => {
    result = { data: { user: { id: "athlete-1" } }, error: null };

    await expect(getCurrentUser()).resolves.toEqual({ id: "athlete-1" });
  });

  it("returns null for a signed-out visitor instead of throwing", async () => {
    // This is exactly what supabase-js hands back with no session.
    result = { data: { user: null }, error: new AuthSessionMissingError() };

    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("still throws a genuine failure", async () => {
    // A network error or a rejected token is NOT the same as having no
    // account, and must not be quietly rendered as an empty dashboard.
    result = { data: { user: null }, error: new Error("Failed to fetch") };

    await expect(getCurrentUser()).rejects.toThrow("Failed to fetch");
  });
});

describe("requireCurrentUser", () => {
  beforeEach(() => {
    result = { data: { user: null }, error: null };
  });

  it("returns the athlete when one is signed in", async () => {
    result = { data: { user: { id: "athlete-1" } }, error: null };

    await expect(requireCurrentUser("nope")).resolves.toEqual({
      id: "athlete-1",
    });
  });

  it("throws the caller's own wording, not supabase's", async () => {
    result = { data: { user: null }, error: new AuthSessionMissingError() };

    await expect(
      requireCurrentUser("You must be logged in to save a check-in.")
    ).rejects.toThrow("You must be logged in to save a check-in.");
  });

  it("does not mask a genuine failure behind the friendly message", async () => {
    result = { data: { user: null }, error: new Error("Failed to fetch") };

    await expect(requireCurrentUser("You must be logged in.")).rejects.toThrow(
      "Failed to fetch"
    );
  });
});
