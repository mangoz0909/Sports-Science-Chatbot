/**
 * Where a user goes once they are signed in, shared by both ways in.
 *
 * Google sign-in (AuthCallback) checked for an unfinished profile and sent the
 * athlete to onboarding; email sign-in (AuthPage) always went to /dashboard.
 * An athlete who signed up by email with confirmation on never reached
 * onboarding at all, and every AI feature then worked from an empty profile.
 * Both paths also dropped the page the user was trying to open when the
 * login wall stopped them.
 */
import { supabase } from "./supabaseClient";

/** Survives the round trip to Google, which loses React Router state. */
const RETURN_TO_KEY = "sportlab:return-to";

const DEFAULT_PATH = "/dashboard";

/**
 * Only an in-app path is followed. Anything else — an absolute URL, a
 * protocol-relative "//evil.com", or the auth pages themselves — falls back to
 * the default, so the value can never become an open redirect or a loop.
 */
export function safeReturnPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  if (value === "/auth" || value.startsWith("/auth?") || value.startsWith("/auth/")) return null;
  if (value.startsWith("/reset-password")) return null;

  return value;
}

function sessionStore(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Called just before leaving for Google. */
export function rememberReturnPath(path: string | null) {
  const safe = safeReturnPath(path);
  const store = sessionStore();

  try {
    if (safe) store?.setItem(RETURN_TO_KEY, safe);
    else store?.removeItem(RETURN_TO_KEY);
  } catch {
    // Private mode or storage blocked: the user just lands on the default.
  }
}

/** Read once and cleared, so a later unrelated login doesn't reuse it. */
export function takeReturnPath(): string | null {
  const store = sessionStore();

  try {
    const value = store?.getItem(RETURN_TO_KEY) ?? null;
    store?.removeItem(RETURN_TO_KEY);
    return safeReturnPath(value);
  } catch {
    return null;
  }
}

/**
 * True when the athlete has not finished the survey. Throws on a query error;
 * callers decide whether that blocks sign-in.
 */
export async function needsOnboarding(userId: string): Promise<boolean> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("primary_sport, experience_level, main_goal")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;

  return !profile?.primary_sport || !profile?.experience_level || !profile?.main_goal;
}

export type PostLoginTarget = {
  path: string;
  /** Passed as router state: OnboardingSurvey reads `returnTo` when it finishes. */
  state?: { returnTo: string };
};

export function postLoginTarget(onboarding: boolean, from: string | null): PostLoginTarget {
  const destination = safeReturnPath(from) ?? DEFAULT_PATH;

  if (onboarding) {
    return { path: "/onboarding", state: { returnTo: destination } };
  }

  return { path: destination };
}

/**
 * An OAuth failure arrives as `?error=…&error_description=…` or in the hash.
 * Read it up front instead of polling for a session that will never come.
 */
export function readOAuthError(search: string, hash: string): { code: string; description: string | null } | null {
  for (const raw of [search, hash]) {
    const params = new URLSearchParams(raw.replace(/^[?#]/, ""));
    const code = params.get("error");

    if (code) {
      return { code, description: params.get("error_description") };
    }
  }

  return null;
}
