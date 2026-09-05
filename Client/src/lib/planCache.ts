/**
 * Day-scoped browser cache for the generated workout and nutrition plans.
 *
 * The pages held their plan in component state, so routing away unmounted
 * them and coming back re-ran the whole AI call: a fresh loading skeleton and
 * a paid request for a plan that looked the same. A plan is meant to last the
 * day, so it is stored per athlete, per page, per local date and only replaced
 * when the athlete asks for a new one.
 */
import { localDateString } from "../services/checkinService";
import { readStored, removeStored, writeStored } from "./safeStorage";

export type PlanKind = "workout" | "nutrition";

type CacheEntry<T> = {
  date: string;
  plan: T;
};

function storageKey(kind: PlanKind, userId: string) {
  return `sportlab:plan:${kind}:${userId}`;
}

export function readCachedPlan<T>(
  kind: PlanKind,
  userId: string,
  today: string = localDateString()
): T | null {
  const key = storageKey(kind, userId);
  const raw = readStored(key);

  if (!raw) return null;

  let entry: CacheEntry<T> | null;

  try {
    entry = JSON.parse(raw) as CacheEntry<T> | null;
  } catch {
    // Corrupted JSON from an older shape — treat it as a miss.
    removeStored(key);

    return null;
  }

  // Yesterday's plan is stale: drop it so the first visit today regenerates
  // once, then caches again.
  if (!entry || entry.date !== today || entry.plan == null) {
    removeStored(key);

    return null;
  }

  return entry.plan;
}

export function writeCachedPlan<T>(
  kind: PlanKind,
  userId: string,
  plan: T,
  today: string = localDateString()
): void {
  const entry: CacheEntry<T> = { date: today, plan };

  let serialized: string;

  try {
    serialized = JSON.stringify(entry);
  } catch {
    // A plan that cannot be serialised simply is not cached.
    return;
  }

  writeStored(storageKey(kind, userId), serialized);
}
