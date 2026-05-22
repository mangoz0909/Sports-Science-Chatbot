import { supabase } from "../../lib/supabaseClient";

export type DailyCheckInPayload = {
  sleep_hours: number;
  sleep_quality: number;
  energy: number;
  soreness: number;
  fatigue: number;
  stress: number;
  mood: number;
  hydration: number;
  nutrition: number;
  training_intensity: number;
  pain_level: number;
  notes: string;
  readiness_score: number;
  recovery_score: number;
  injury_risk: number;
};

export async function createDailyCheckIn(payload: DailyCheckInPayload) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("User not logged in.");

  const { data, error } = await supabase
    .from("daily_checkins")
    .insert({
      user_id: user.id,
      ...payload,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function getMyDailyCheckIns() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("User not logged in.");

  const { data, error } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
}