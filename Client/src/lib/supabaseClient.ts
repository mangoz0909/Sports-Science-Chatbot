import { createClient } from "@supabase/supabase-js";

/**
 * The address the app was opened at, captured before createClient runs.
 *
 * supabase-js consumes the tokens out of a recovery or OAuth link and then
 * rewrites the address bar, so anything reading `window.location` later can
 * find them already gone — and it starts that work at import time, before
 * React has rendered. ResetPasswordPage needs to know whether a reset link is
 * what brought the user here, which only the original URL can answer.
 *
 * Declared above the environment check on purpose: it must be the first thing
 * this module does.
 */
export const entryLocation = {
  hash: typeof window === "undefined" ? "" : window.location.hash,
  search: typeof window === "undefined" ? "" : window.location.search,
};

const supabaseUrl = import.meta.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in your .env file."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);