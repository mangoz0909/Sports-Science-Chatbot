import { supabase } from "../lib/supabaseClient";
import { getCurrentUser, requireCurrentUser } from "../lib/currentUser";

export type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  primary_sport: string | null;
  goal: string | null;
};

export async function syncGoogleProfile() {
  const user = await getCurrentUser();

  if (!user) return null;

  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "SportLab Athlete";

  const { data, error: upsertError } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      name,
      email: user.email,
    })
    .select()
    .single();

  if (upsertError) throw upsertError;

  return data as Profile;
}

/**
 * Saves the athlete's display name onto their profile row.
 *
 * The name is kept in two places and both are load-bearing: the profile form
 * reads it back from `auth.users.user_metadata`, and syncGoogleProfile
 * re-derives from that metadata on every OAuth sign-in — while the dashboard
 * greeting and getMyProfile read `profiles.name`. The profile page wrote only
 * the metadata, so renaming yourself changed the profile form and left the
 * dashboard greeting on the old name for good. Callers should write both.
 */
export async function saveMyName(name: string) {
  const cleanName = name.trim();

  if (!cleanName) throw new Error("Please enter your name.");

  const user = await requireCurrentUser(
    "You must be logged in to change your name."
  );

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      name: cleanName,
      email: user.email,
    },
    { onConflict: "id" }
  );

  if (error) throw error;
}

export async function getMyProfile() {
  const user = await getCurrentUser();

  // Null rather than a throw: the dashboard reads this for signed-out visitors
  // too, where "no profile" is the ordinary answer and not a failure.
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;

  return data as Profile | null;
}