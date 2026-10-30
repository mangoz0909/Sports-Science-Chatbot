type CheckInContext = {
  checkin_date?: string | null;
  readiness_score?: number | null;
  recovery_score?: number | null;
  fatigue?: number | null;
  sleep_hours?: number | null;
  training_intensity?: number | null;
  soreness?: number | null;
  stress?: number | null;
  injury_risk?: number | null;
  hydration?: number | null;
  nutrition?: number | null;
  pain_level?: number | null;
} | null;

/** Stable snapshot of the check-in fields used to generate a plan. */
export function checkInContextKey(checkIn: CheckInContext): string {
  if (!checkIn) return "no-check-in";

  return JSON.stringify([
    checkIn.checkin_date ?? null,
    checkIn.readiness_score ?? null,
    checkIn.recovery_score ?? null,
    checkIn.fatigue ?? null,
    checkIn.sleep_hours ?? null,
    checkIn.training_intensity ?? null,
    checkIn.soreness ?? null,
    checkIn.stress ?? null,
    checkIn.injury_risk ?? null,
    checkIn.hydration ?? null,
    checkIn.nutrition ?? null,
    checkIn.pain_level ?? null,
  ]);
}

/** Unknown or changed check-in context means a saved plan may be out of date. */
export function matchesCheckInContext(
  savedKey: string | null | undefined,
  latest: CheckInContext | undefined
): boolean {
  return latest !== undefined && savedKey === checkInContextKey(latest);
}
