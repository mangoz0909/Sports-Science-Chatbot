/**
 * The workout plan's domain model: workout types, per-day sessions, storage,
 * and the recovery-based recommendation.
 *
 * This lives outside the page because the interesting parts — how a percentage
 * is arrived at, and what a half-written saved plan should degrade to — are
 * worth testing without mounting MUI.
 */

import { readStored, writeStored } from "./safeStorage";

export type SetEntry = {
  id: number;
  /*
   * Reps and weight are the raw input strings, not numbers. Coercing every
   * keystroke through Number() turns a cleared field into 0, so changing 135
   * to 185 means selecting the text first — the box can never be momentarily
   * empty. They are parsed only where arithmetic needs them.
   */
  reps: string;
  weight: string;
  completed: boolean;
};

export type PlannedExercise = {
  id: number;
  name: string;
  targetReps: number;
  /** Short form cues, shown on demand under the exercise. */
  cues: string[];
  sets: SetEntry[];
};

/** A saved default: the exercises a workout type starts from. */
export type TemplateExercise = {
  name: string;
  targetReps: number;
  sets: number;
  cues: string[];
};

export type WorkoutType = {
  id: string;
  name: string;
  color: string;
  exercises: TemplateExercise[];
};

/** One day's session: which type was trained, and the sets actually logged. */
export type DaySession = {
  typeId: string;
  exercises: PlannedExercise[];
};

export type Plan = {
  types: WorkoutType[];
  /** Keyed by local ISO date (YYYY-MM-DD). */
  days: Record<string, DaySession>;
};

/*
 * Date.now() collides whenever two rows are created inside the same
 * millisecond — two quick "Add Set" clicks produce duplicate React keys, and
 * React then reuses the wrong row's DOM node.
 */
let idCounter = 0;
export const nextId = () => {
  idCounter += 1;
  return idCounter;
};

export const toNumber = (value: string) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

/* ── dates ─────────────────────────────────────────────────────────────── */

/**
 * Local ISO date. `toISOString()` would be UTC, which puts anyone west of
 * Greenwich on yesterday's date for part of the evening — the day strip would
 * highlight the wrong square.
 */
export function toISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fromISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Monday-start week containing `date`. */
export function startOfWeek(date: Date): Date {
  const start = new Date(date);
  const weekday = (start.getDay() + 6) % 7; // Monday = 0
  start.setDate(start.getDate() - weekday);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function weekDays(date: Date): Date[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function daysBetween(fromISO: string, toISO: string): number {
  const from = fromISODate(fromISO);
  const to = fromISODate(toISO);
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

/* ── defaults ──────────────────────────────────────────────────────────── */

export const TYPE_COLORS = [
  "#ef4444",
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
  "#a855f7",
  "#14b8a6",
];

export function defaultTypes(): WorkoutType[] {
  return [
    {
      id: "push",
      name: "Push",
      color: "#ef4444",
      exercises: [
        {
          name: "Bench Press",
          targetReps: 8,
          sets: 3,
          cues: [
            "Set your shoulder blades back and down before unracking.",
            "Lower to mid-chest with elbows about 45° from your body.",
            "Drive through your heels and keep your wrists stacked.",
          ],
        },
        {
          name: "Overhead Press",
          targetReps: 8,
          sets: 3,
          cues: [
            "Brace your core so your lower back does not arch.",
            "Move your head back slightly as the bar passes your face.",
          ],
        },
        {
          name: "Incline Dumbbell Press",
          targetReps: 10,
          sets: 3,
          cues: [
            "Set the bench to about 30° — steeper shifts work to the shoulders.",
            "Stop just short of locking out to keep tension on the chest.",
          ],
        },
        {
          name: "Triceps Pushdown",
          targetReps: 12,
          sets: 3,
          cues: ["Keep your elbows pinned to your sides through the rep."],
        },
      ],
    },
    {
      id: "pull",
      name: "Pull",
      color: "#22c55e",
      exercises: [
        {
          name: "Barbell Row",
          targetReps: 8,
          sets: 3,
          cues: [
            "Hinge to about 45° and hold that angle for every rep.",
            "Pull to your lower ribs, not your collarbone.",
          ],
        },
        {
          name: "Lat Pulldown",
          targetReps: 10,
          sets: 3,
          cues: ["Lead with your elbows and let your chest rise to meet the bar."],
        },
        {
          name: "Face Pull",
          targetReps: 15,
          sets: 3,
          cues: ["Pull towards your forehead and finish with your thumbs back."],
        },
        {
          name: "Biceps Curl",
          targetReps: 12,
          sets: 3,
          cues: ["Keep your elbows still — swinging moves the work to your back."],
        },
      ],
    },
    {
      id: "legs",
      name: "Legs",
      color: "#3b82f6",
      exercises: [
        {
          name: "Back Squat",
          targetReps: 6,
          sets: 4,
          cues: [
            "Brace as if bracing for a punch before you descend.",
            "Push your knees out in line with your toes.",
            "Descend under control; stop where you can keep a neutral back.",
          ],
        },
        {
          name: "Romanian Deadlift",
          targetReps: 8,
          sets: 3,
          cues: [
            "Push your hips back rather than bending your knees.",
            "Stop when you feel your hamstrings stretch, not when the bar hits the floor.",
          ],
        },
        {
          name: "Leg Press",
          targetReps: 12,
          sets: 3,
          cues: ["Keep your lower back flat against the pad the whole way down."],
        },
        {
          name: "Calf Raise",
          targetReps: 15,
          sets: 3,
          cues: ["Pause a beat at the top and lower slowly."],
        },
      ],
    },
  ];
}

/** Turns a type's saved defaults into a fresh, untracked session. */
export function sessionFromType(type: WorkoutType): DaySession {
  return {
    typeId: type.id,
    exercises: type.exercises.map((exercise) => ({
      id: nextId(),
      name: exercise.name,
      targetReps: exercise.targetReps,
      cues: exercise.cues,
      sets: Array.from({ length: Math.max(1, exercise.sets) }, () => ({
        id: nextId(),
        reps: String(exercise.targetReps),
        weight: "0",
        completed: false,
      })),
    })),
  };
}

export const emptyPlan = (): Plan => ({ types: defaultTypes(), days: {} });

/**
 * Signed-out visitors arrive through DemoRoute, which labels the page as demo
 * mode; this seed is what that banner is describing. A signed-in athlete
 * starts from an empty log instead, so invented history is never shown to them
 * as their own.
 */
export function demoPlan(today = new Date()): Plan {
  const types = defaultTypes();
  const push = sessionFromType(types[0]);

  push.exercises[0].sets = [
    { id: nextId(), reps: "8", weight: "135", completed: true },
    { id: nextId(), reps: "8", weight: "135", completed: true },
    { id: nextId(), reps: "6", weight: "135", completed: false },
  ];

  return {
    types,
    days: {
      // A couple of days of history so the recommendation has something to
      // reason from rather than showing an even split.
      [toISODate(addDays(today, -3))]: sessionFromType(types[2]),
      [toISODate(addDays(today, -1))]: sessionFromType(types[1]),
      [toISODate(today)]: push,
    },
  };
}

/* ── recommendation ────────────────────────────────────────────────────── */

export type Recommendation = {
  type: WorkoutType;
  percent: number;
  /** Days since this type was last trained; null if never. */
  daysSince: number | null;
  reason: string;
};

/*
 * A trained muscle group wants roughly 48 hours before it is loaded hard
 * again, so readiness climbs with the gap and flattens out once recovery is
 * done. These are weights, not probabilities — they are normalised below.
 */
function readiness(daysSince: number | null): number {
  if (daysSince === null) return 1;
  if (daysSince <= 0) return 0.05;
  if (daysSince === 1) return 0.2;
  if (daysSince === 2) return 0.65;
  return 1;
}

function reasonFor(daysSince: number | null, name: string): string {
  if (daysSince === null) return `No ${name.toLowerCase()} session logged yet.`;
  if (daysSince <= 0) return "Already trained today.";
  if (daysSince === 1) return "Trained yesterday — still recovering.";
  if (daysSince === 2) return "Trained 2 days ago — nearly recovered.";
  return `Last trained ${daysSince} days ago — fully recovered.`;
}

/** Most recent date strictly before `dateISO` on which `typeId` was trained. */
function daysSinceTrained(
  plan: Plan,
  typeId: string,
  dateISO: string
): number | null {
  let best: number | null = null;

  for (const [day, session] of Object.entries(plan.days)) {
    if (session.typeId !== typeId) continue;

    const gap = daysBetween(day, dateISO);
    if (gap < 0) continue; // a session scheduled after the day in question

    if (best === null || gap < best) best = gap;
  }

  return best;
}

/**
 * How strongly each workout type is recommended for `dateISO`, as whole
 * percentages that add up to exactly 100.
 *
 * Percentages are apportioned by largest remainder: rounding each share on its
 * own leaves the column reading 99% or 101%, which looks broken next to a
 * "recommended split" label.
 */
export function recommendWorkouts(plan: Plan, dateISO: string): Recommendation[] {
  if (plan.types.length === 0) return [];

  const scored = plan.types.map((type) => {
    const daysSince = daysSinceTrained(plan, type.id, dateISO);
    return { type, daysSince, weight: readiness(daysSince) };
  });

  const total = scored.reduce((sum, entry) => sum + entry.weight, 0);

  const raw = scored.map((entry) => ({
    ...entry,
    exact: (entry.weight / total) * 100,
  }));

  const floors = raw.map((entry) => Math.floor(entry.exact));
  let leftover = 100 - floors.reduce((sum, value) => sum + value, 0);

  const order = raw
    .map((entry, index) => ({ index, remainder: entry.exact - floors[index] }))
    .sort((a, b) => b.remainder - a.remainder);

  for (const { index } of order) {
    if (leftover <= 0) break;
    floors[index] += 1;
    leftover -= 1;
  }

  return raw
    .map((entry, index) => ({
      type: entry.type,
      percent: floors[index],
      daysSince: entry.daysSince,
      reason: reasonFor(entry.daysSince, entry.type.name),
    }))
    .sort((a, b) => b.percent - a.percent);
}

/* ── storage ───────────────────────────────────────────────────────────── */

export const storageKeyFor = (userId: string) =>
  `sportlab:workout-plan:${userId}`;

/**
 * Reads a saved plan, tolerating anything that is not the shape we wrote —
 * hand-edited storage, a half-written value, a plan from an older release.
 * A bad read degrades to a fresh plan rather than throwing during render.
 */
export function loadPlan(storageKey: string): Plan {
  const raw = readStored(storageKey);
  if (!raw) return emptyPlan();

  try {
    const parsed = JSON.parse(raw) as Partial<Plan>;
    if (!parsed || typeof parsed !== "object") return emptyPlan();

    const types = Array.isArray(parsed.types) && parsed.types.length
      ? parsed.types.map((type, index) => ({
          id: String(type?.id ?? `type-${index}`),
          name: String(type?.name ?? "Workout"),
          color: String(type?.color ?? TYPE_COLORS[index % TYPE_COLORS.length]),
          exercises: (Array.isArray(type?.exercises) ? type.exercises : []).map(
            (exercise) => ({
              name: String(exercise?.name ?? "Exercise"),
              targetReps: Number(exercise?.targetReps) || 8,
              sets: Number(exercise?.sets) || 3,
              cues: Array.isArray(exercise?.cues)
                ? exercise.cues.map(String)
                : [],
            })
          ),
        }))
      : defaultTypes();

    const days: Record<string, DaySession> = {};

    for (const [day, session] of Object.entries(parsed.days ?? {})) {
      if (!session || typeof session !== "object") continue;

      days[day] = {
        typeId: String(session.typeId ?? ""),
        // Re-key every row through the counter so restored ids stay unique
        // against rows added later in this session.
        exercises: (Array.isArray(session.exercises) ? session.exercises : []).map(
          (exercise) => ({
            id: nextId(),
            name: String(exercise?.name ?? "Exercise"),
            targetReps: Number(exercise?.targetReps) || 8,
            cues: Array.isArray(exercise?.cues) ? exercise.cues.map(String) : [],
            sets: (Array.isArray(exercise?.sets) ? exercise.sets : []).map(
              (set) => ({
                id: nextId(),
                reps: String(set?.reps ?? ""),
                weight: String(set?.weight ?? ""),
                completed: Boolean(set?.completed),
              })
            ),
          })
        ),
      };
    }

    return { types, days };
  } catch {
    return emptyPlan();
  }
}

export function savePlan(storageKey: string, plan: Plan): void {
  writeStored(storageKey, JSON.stringify(plan));
}

/* ── session stats ─────────────────────────────────────────────────────── */

export function sessionProgress(session: DaySession | undefined) {
  if (!session) return { completed: 0, total: 0, percent: 0 };

  const total = session.exercises.reduce(
    (sum, exercise) => sum + exercise.sets.length,
    0
  );

  const completed = session.exercises.reduce(
    (sum, exercise) => sum + exercise.sets.filter((set) => set.completed).length,
    0
  );

  return {
    completed,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

/** Next-session load advice for one exercise, from the sets ticked off today. */
export function weightSuggestion(exercise: PlannedExercise): string {
  const completed = exercise.sets.filter((set) => set.completed);

  if (completed.length === 0) {
    return "Complete your working sets to get a recommendation.";
  }

  const allReachedTarget = completed.every(
    (set) => toNumber(set.reps) >= exercise.targetReps
  );

  const averageWeight =
    completed.reduce((sum, set) => sum + toNumber(set.weight), 0) /
    completed.length;

  if (allReachedTarget && averageWeight > 0) {
    const increase = averageWeight >= 100 ? 5 : 2.5;
    const suggested = Math.round((averageWeight + increase) * 2) / 2;

    return `You hit your target reps. Consider trying about ${suggested} lb next session.`;
  }

  return `Stay around ${Math.round(
    averageWeight
  )} lb next session and aim to complete all ${exercise.targetReps} reps before increasing the load.`;
}
