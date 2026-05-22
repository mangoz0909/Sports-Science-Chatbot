import { supabase } from "../lib/supabaseClient";

export type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  primary_sport: string | null;
  goal: string | null;
};

export async function getMyProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("User not logged in.");

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) throw error;

  return data as Profile;
}

export async function updateMyProfile(profile: {
  name: string;
  email: string;
  primary_sport: string;
  goal: string;
}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("User not logged in.");

  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      name: profile.name,
      email: profile.email,
      primary_sport: profile.primary_sport,
      goal: profile.goal,
    })
    .select()
    .single();

  if (error) throw error;

  return data as Profile;
}