/**
 * What a signed-in session leaves in this browser, and when it goes.
 *
 * Sign-out and account deletion left every cached plan, the full workout log
 * and the remembered email behind. On a shared computer the next person could
 * read them straight out of storage, and a deleted account's email kept
 * pre-filling the login form.
 */
import { removeStored, removeStoredByPrefix } from "./safeStorage";

/** Set by AuthPage's "Remember me". */
export const REMEMBERED_EMAIL_KEY = "rememberedEmail";

/**
 * On sign-out: today's AI plans (Supabase holds the real copy and they reload
 * on the next sign-in) and any pending post-login destination.
 *
 * The workout log (`sportlab:workout-plan:<id>`) is deliberately kept — it
 * lives only in this browser, so clearing it on sign-out would erase the
 * athlete's training history. The remembered email is kept too; keeping it is
 * the whole point of "Remember me".
 */
export function clearSessionStorage() {
  removeStoredByPrefix("sportlab:plan:");

  try {
    window.sessionStorage.removeItem("sportlab:return-to");
  } catch {
    /* storage blocked: nothing was stored either */
  }
}

/** On account deletion: everything this app ever stored for the user. */
export function clearAllUserStorage(userId: string) {
  clearSessionStorage();
  removeStoredByPrefix(`sportlab:workout-plan:${userId}`);
  removeStored(REMEMBERED_EMAIL_KEY);
}
