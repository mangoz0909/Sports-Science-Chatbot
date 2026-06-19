import { supabase } from "../lib/supabaseClient";

export type UserPreferences = {
  primary_sport: string;
  experience_level: string;
  main_goal: string;
  training_days: string;
  competition_level: string;
  injury_areas: string;
  priorities: string;
  sleep_range: string;
  athlete_type: string;
};

export async function getUserPreferences() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
      primary_sport,
      experience_level,
      main_goal,
      training_days,
      competition_level,
      injury_areas,
      priorities,
      sleep_range,
      athlete_type
    `
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function saveUserPreferences(preferences: UserPreferences) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
  
    if (userError) throw userError;
    if (!user) throw new Error("You must be logged in.");
  
    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...preferences,
      })
      .eq("id", user.id)
      .select()
      .single();
  
    if (error) throw error;
  
    return data;
  }