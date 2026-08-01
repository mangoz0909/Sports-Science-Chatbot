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
  age?: string;
  height_cm?: string;
  weight_kg?: string;
  activity_level?: string;
  workout_duration?: string;
  equipment_access?: string;
  dietary_preference?: string;
  food_allergies?: string;
  foods_avoid?: string;
  meals_per_day?: string;
  cooking_access?: string;
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
      athlete_type,
      age,
      height_cm,
      weight_kg,
      activity_level,
      workout_duration,
      equipment_access,
      dietary_preference,
      food_allergies,
      foods_avoid,
      meals_per_day,
      cooking_access
    `
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function saveUserPreferences(preferences: Partial<UserPreferences>) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be logged in.");

  // Upsert rather than update: a user who signed up with email confirmation
  // never got a profiles row created, so `.update()` matched zero rows and
  // `.single()` failed the whole survey with an opaque PGRST116.
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        ...preferences,
        id: user.id,
        email: user.email,
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error) throw error;

  return data;
}