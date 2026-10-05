/**
 * The set of browser origins allowed to call the edge functions.
 *
 * delete-account used to build its own list from a differently named variable
 * (ALLOWED_ORIGIN, singular) while ai-chat and ai-complete read the
 * comma-separated ALLOWED_ORIGINS. Moving the app to a new domain by setting
 * the documented variable then fixed chat and plan generation but left account
 * deletion failing CORS. One parser, used by all three, removes that way to
 * drift.
 */

// Only a fallback so an unset variable can't break prod. 5173 is Vite's
// default port: vite.config.ts asks for 3000 with strictPort:false, so the dev
// server silently moves to 5173 whenever 3000 is taken.
export const DEFAULT_ALLOWED_ORIGINS = [
  "https://sportslabai.onrender.com",
  "http://localhost:3000",
  "http://localhost:5173",
];

function parseOrigins(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/**
 * Defaults, plus ALLOWED_ORIGINS (comma-separated), plus the legacy singular
 * ALLOWED_ORIGIN. The singular name is still honoured so a deployment that
 * only ever set it keeps working; new setups should use ALLOWED_ORIGINS.
 */
export const allowedOrigins = new Set([
  ...DEFAULT_ALLOWED_ORIGINS,
  ...parseOrigins(Deno.env.get("ALLOWED_ORIGINS")),
  ...parseOrigins(Deno.env.get("ALLOWED_ORIGIN")),
]);
