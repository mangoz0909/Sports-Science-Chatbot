import { supabase } from "../lib/supabaseClient";

/**
 * Thrown when the account was created successfully but the project requires
 * the address to be confirmed before a session exists. It is a successful
 * signup, not a failure — callers should show it as such rather than as an
 * error, which is all a bare `Error` let them do.
 */
export class EmailConfirmationRequiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailConfirmationRequiredError";
  }
}

export async function signUpUser(name: string, email: string, password: string) {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: {
        name: cleanName,
        full_name: cleanName,
      },
    },
  });

  if (error) throw error;

  if (!data.session || !data.user) {
    throw new EmailConfirmationRequiredError(
      "Account created — check your email to confirm your address before signing in."
    );
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: data.user.id,
      name: cleanName,
      email: cleanEmail,
    },
    {
      onConflict: "id",
    }
  );

  if (profileError) throw profileError;

  return data;
}

export async function loginUser(email: string, password: string) {
  const cleanEmail = email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error) throw error;

  return data;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;

  return data;
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut();

  if (error) throw error;
}

export async function sendPasswordResetEmail(email: string) {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail) {
    throw new Error("Please enter your email.");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) throw error;
}
