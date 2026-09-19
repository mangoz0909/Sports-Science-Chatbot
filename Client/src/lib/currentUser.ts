/**
 * Resolving the signed-in athlete, without treating "signed out" as a failure.
 *
 * `supabase.auth.getUser()` reports a missing session as an
 * AuthSessionMissingError rather than as `{ user: null }`. Every service in
 * this codebase opened with the same pair:
 *
 *     if (userError) throw userError;
 *     if (!user) return null;      // ← unreachable
 *
 * so the first line always fired and the graceful guest branch below it never
 * ran. `/sports` and `/sports-list` are demo routes open to signed-out
 * visitors, and both filled the console with AuthSessionMissingError on every
 * load; anything that relied on the documented null return got an exception
 * instead.
 *
 * These two helpers make the distinction explicit at the one place it matters:
 * being signed out is a state, and everything else is still an error worth
 * propagating.
 */
import { isAuthSessionMissingError, type User } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

/**
 * The signed-in athlete, or null when nobody is signed in.
 *
 * A genuine failure — network down, a token the server rejected — still
 * throws, because that is not the same thing as having no account and must not
 * be quietly rendered as an empty dashboard.
 */
export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    if (isAuthSessionMissingError(error)) return null;

    throw error;
  }

  return user;
}

/**
 * The signed-in athlete, or a message they can act on.
 *
 * For the write paths — saving a check-in, a plan, a profile — where there is
 * nothing sensible to do without an account. `message` names the action so the
 * athlete is told what did not happen, rather than "Auth session missing!".
 */
export async function requireCurrentUser(message: string): Promise<User> {
  const user = await getCurrentUser();

  if (!user) throw new Error(message);

  return user;
}
