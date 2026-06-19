import { supabase } from "../lib/supabaseClient";

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

  const user = data.user;

  if (user) {
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        name: cleanName,
        email: cleanEmail,
      },
      {
        onConflict: "id",
      }
    );

    if (profileError) throw profileError;
  }

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

export async function syncGoogleProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) return null;

  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User";

  const email = user.email || "";

  const { data: existingProfile, error: existingError } = await supabase
    .from("profiles")
    .select("id, name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (existingError) throw existingError;

  if (!existingProfile) {
    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      name,
      email,
    });

    if (insertError) throw insertError;
  }

  return user;
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut();

  if (error) throw error;
}

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;

  return user;
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

export async function updatePassword(newPassword: string) {
  if (newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
}