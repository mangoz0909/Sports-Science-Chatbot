/**
 * Persistence for the generated workout and nutrition plans.
 *
 * Supabase is the source of truth so a plan generated on a phone in the
 * morning is the same plan the laptop shows that evening. The browser copy in
 * planCache is only a fallback for a failed or offline read: regenerating in
 * that case would cost an AI call and hand the athlete a different plan
 * halfway through their day.
 */
import { supabase } from "../lib/supabaseClient";
import { localDateString } from "./checkinService";
import { readCachedPlan, writeCachedPlan } from "../lib/planCache";
import type { PlanKind } from "../lib/planCache";

export type { PlanKind };

const PLANS_TABLE = "daily_plans";

/** Today's saved plan straight from Supabase, or null if none exists yet. */
export async function fetchTodaysPlan<T>(
  kind: PlanKind,
  today: string = localDateString()
): Promise<T | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) return null;

  const { data, error } = await supabase
    .from(PLANS_TABLE)
    .select("plan")
    .eq("user_id", user.id)
    .eq("plan_kind", kind)
    .eq("plan_date", today)
    .maybeSingle();

  if (error) throw error;

  return (data?.plan as T | undefined) ?? null;
}

/** Writes today's plan to Supabase, replacing one generated earlier today. */
export async function storeTodaysPlan<T>(
  kind: PlanKind,
  plan: T,
  today: string = localDateString()
): Promise<void> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be logged in to save a plan.");

  const { error } = await supabase.from(PLANS_TABLE).upsert(
    {
      user_id: user.id,
      plan_kind: kind,
      plan_date: today,
      plan,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,plan_kind,plan_date" }
  );

  if (error) throw error;
}

/**
 * Today's plan for this athlete, wherever it can be found.
 *
 * Returns null only when there genuinely is no plan for today, which is the
 * one case that should trigger a fresh generation.
 */
export async function loadTodaysPlan<T>(
  kind: PlanKind,
  userId: string
): Promise<T | null> {
  try {
    const saved = await fetchTodaysPlan<T>(kind);

    if (saved) {
      // Mirror it locally so a later visit still works without a connection.
      writeCachedPlan<T>(kind, userId, saved);

      return saved;
    }

    return null;
  } catch (err) {
    console.error(`Could not load the saved ${kind} plan:`, err);

    return readCachedPlan<T>(kind, userId);
  }
}

/** Keeps today's plan for this athlete, on the server and on this device. */
export async function saveTodaysPlan<T>(
  kind: PlanKind,
  userId: string,
  plan: T
): Promise<void> {
  writeCachedPlan<T>(kind, userId, plan);

  try {
    await storeTodaysPlan<T>(kind, plan);
  } catch (err) {
    // The plan is already on screen and stored locally, so a failed sync is
    // not worth interrupting the athlete for. It just will not reach their
    // other devices until the next regenerate.
    console.error(`Could not sync the ${kind} plan to your account:`, err);
  }
}
