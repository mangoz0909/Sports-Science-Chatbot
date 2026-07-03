import { supabase } from "../lib/supabaseClient";

export type CheckInInput = {
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

export async function createDailyCheckIn(checkInData: CheckInInput) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be logged in to save a check-in.");

  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("daily_checkins")
    .upsert(
      {
        ...checkInData,
        user_id: user.id,
        checkin_date: today,
      },
      {
        onConflict: "user_id,checkin_date",
      }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getLatestCheckIn() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) return null;

  const { data, error } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("user_id", user.id)
    .order("checkin_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getLast7CheckIns() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) return [];

  const { data, error } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("user_id", user.id)
    .order("checkin_date", { ascending: false })
    .limit(7);

  if (error) throw error;
  return [...(data || [])].reverse();
}
