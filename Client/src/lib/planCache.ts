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

export type PlanKind = "workout" | "nutrition";

type CacheEntry<T> = {
  date: string;
  plan: T;
};

function storageKey(kind: PlanKind, userId: string) {
  return `sportlab:plan:${kind}:${userId}`;
}

/**
 * Reading `window.localStorage` throws outright when storage is blocked
 * (Safari private browsing, cookies disabled), so every access is guarded and
 * a failure just means the page generates as it did before.
 */
function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readCachedPlan<T>(
  kind: PlanKind,
  userId: string,
  today: string = localDateString()
): T | null {
  const storage = safeStorage();

  if (!storage) return null;

  const key = storageKey(kind, userId);

  try {
    const raw = storage.getItem(key);

    if (!raw) return null;

    const entry = JSON.parse(raw) as CacheEntry<T> | null;

    // Yesterday's plan is stale: drop it so the first visit today regenerates
    // once, then caches again.
    if (!entry || entry.date !== today || entry.plan == null) {
      storage.removeItem(key);
      return null;
    }

    return entry.plan;
  } catch {
    // Corrupted JSON from an older shape — treat it as a miss.
    try {
      storage.removeItem(key);
    } catch {
      /* nothing else to do */
    }

    return null;
  }
}

export function writeCachedPlan<T>(
  kind: PlanKind,
  userId: string,
  plan: T,
  today: string = localDateString()
): void {
  const storage = safeStorage();

  if (!storage) return;

  const entry: CacheEntry<T> = { date: today, plan };

  try {
    storage.setItem(storageKey(kind, userId), JSON.stringify(entry));
  } catch {
    // A full quota is not worth failing the page over. The plan still renders,
    // it just will not survive the next navigation.
  }
}

export function clearCachedPlan(kind: PlanKind, userId: string): void {
  const storage = safeStorage();

  if (!storage) return;

  try {
    storage.removeItem(storageKey(kind, userId));
  } catch {
    /* nothing else to do */
  }
}
