import {
  postLoginTarget,
  readOAuthError,
  rememberReturnPath,
  safeReturnPath,
  takeReturnPath,
} from "./postLogin";

describe("safeReturnPath", () => {
  it.each(["/daily-check-in", "/my-workout-plan?tab=ai", "/health/nutrition"])("keeps in-app path %s", (path) => {
    expect(safeReturnPath(path)).toBe(path);
  });

  it.each([
    "https://evil.example/",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "/auth",
    "/auth?mode=login",
    "/auth/callback",
    "/reset-password",
    "",
    null,
    42,
  ])("rejects %j", (value) => {
    expect(safeReturnPath(value)).toBeNull();
  });
});

describe("postLoginTarget", () => {
  it("sends a finished profile back where it was going", () => {
    expect(postLoginTarget(false, "/daily-check-in")).toEqual({ path: "/daily-check-in" });
  });

  it("defaults to the dashboard", () => {
    expect(postLoginTarget(false, null)).toEqual({ path: "/dashboard" });
    expect(postLoginTarget(false, "https://evil.example")).toEqual({ path: "/dashboard" });
  });

  it("routes an unfinished profile through onboarding, carrying the destination", () => {
    expect(postLoginTarget(true, "/daily-check-in")).toEqual({
      path: "/onboarding",
      state: { returnTo: "/daily-check-in" },
    });
  });
});

describe("return path across the Google redirect", () => {
  beforeEach(() => sessionStorage.clear());

  it("is read once and then cleared", () => {
    rememberReturnPath("/profile");
    expect(takeReturnPath()).toBe("/profile");
    expect(takeReturnPath()).toBeNull();
  });

  it("does not store an unsafe path", () => {
    rememberReturnPath("//evil.example");
    expect(takeReturnPath()).toBeNull();
  });
});

describe("readOAuthError", () => {
  it("reads a cancelled Google sign-in from the query", () => {
    expect(readOAuthError("?error=access_denied&error_description=User+denied", "")).toEqual({
      code: "access_denied",
      description: "User denied",
    });
  });

  it("reads it from the hash", () => {
    expect(readOAuthError("", "#error=server_error&error_description=Oops")).toEqual({
      code: "server_error",
      description: "Oops",
    });
  });

  it("returns null for a normal callback", () => {
    expect(readOAuthError("", "#access_token=abc&refresh_token=def")).toBeNull();
  });
});
