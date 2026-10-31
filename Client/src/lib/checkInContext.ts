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

function snapshot(checkIn: NonNullable<CheckInContext>) {
  return [
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
  ];
}

/**
 * Stable snapshot of the check-in data used to generate a plan: the latest
 * check-in plus the 7-day history, since the prompts read both. Back-filling
 * or editing an earlier day changes the history and so marks the plan stale.
 */
export function checkInContextKey(
  checkIn: CheckInContext,
  history: NonNullable<CheckInContext>[] = []
): string {
  if (!checkIn && history.length === 0) return "no-check-in";

  return JSON.stringify([
    checkIn ? snapshot(checkIn) : null,
    history.map(snapshot),
  ]);
}

/** Unknown or changed check-in context means a saved plan may be out of date. */
export function matchesCheckInContext(
  savedKey: string | null | undefined,
  latest: CheckInContext | undefined,
  history: NonNullable<CheckInContext>[] | undefined
): boolean {
  return (
    latest !== undefined &&
    history !== undefined &&
    savedKey === checkInContextKey(latest, history)
  );
}
