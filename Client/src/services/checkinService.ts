import { supabase } from "../lib/supabaseClient";
import { getCurrentUser, requireCurrentUser } from "../lib/currentUser";

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

/**
 * Today's date in the athlete's own timezone, as YYYY-MM-DD.
 *
 * `toISOString()` returns the UTC date: east of UTC an early-morning check-in
 * was filed under yesterday, which both defeated the "already checked in"
 * guard and let the upsert overwrite the previous day's row.
 */
export function localDateString(date: Date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Whether a check-in row is the athlete's entry for today.
 *
 * `getLatestCheckIn` returns the most recent row at ANY date, so anything that
 * calls it and then says "today" can be describing a reading from last week.
 * The workout and nutrition prompts both did exactly that, which had the model
 * plan around a readiness score the athlete no longer has; the status chip on
 * the Sports AI page claimed to be using "today's check-in" on the same basis.
 */
export function isCheckInFromToday(
  checkIn: { checkin_date?: string | null } | null | undefined,
  today: string = localDateString()
): boolean {
  return checkIn?.checkin_date === today;
}

export async function createDailyCheckIn(checkInData: CheckInInput) {
  const user = await requireCurrentUser(
    "You must be logged in to save a check-in."
  );

  const today = localDateString();

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
  const user = await getCurrentUser();

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
  const user = await getCurrentUser();

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
