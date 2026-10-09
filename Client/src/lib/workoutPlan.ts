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

export type Prescription = {
  kind: "reps" | "duration";
  target: string;
  rest: string;
};

export type WorkoutGuidance = {
  intensity: string; duration: string; coachNote: string;
  warmup: string[]; cooldown: string[]; recoveryNote: string;
};

export type PlannedExercise = {
  id: number;
  name: string;
  targetReps: number;
  prescription?: Prescription;
  /** Short form cues, shown on demand under the exercise. */
  cues: string[];
  sets: SetEntry[];
};

/** A saved default: the exercises a workout type starts from. */
export type TemplateExercise = {
  name: string;
  targetReps: number;
  prescription?: Prescription;
  sets: number;
  cues: string[];
};

export type WorkoutType = {
  id: string;
  name: string;
  color: string;
  exercises: TemplateExercise[];
  guidance?: WorkoutGuidance;
  sourceKey?: string;
};

/** One day's session: which type was trained, and the sets actually logged. */
export type DaySession = {
  typeId: string;
  name?: string;
  color?: string;
  guidance?: WorkoutGuidance;
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

export type AIWorkout = {
  focus: string; intensity: string; totalDuration: string; coachNote: string;
  warmup: string[]; cooldown: string[]; recoveryNote: string;
  exercises: { name: string; sets: string; reps: string; rest: string; notes: string }[];
};

export function aiWorkoutSourceKey(plan: AIWorkout): string {
  return JSON.stringify(plan);
}

export function workoutTypeFromAI(plan: AIWorkout, name: string): WorkoutType {
  return {
    id: `ai-${crypto.randomUUID()}`, name: name.trim() || plan.focus, color: "#a855f7",
    sourceKey: aiWorkoutSourceKey(plan),
    guidance: {
      intensity: plan.intensity, duration: plan.totalDuration, coachNote: plan.coachNote,
      warmup: [...plan.warmup], cooldown: [...plan.cooldown], recoveryNote: plan.recoveryNote,
    },
    exercises: plan.exercises.map((exercise) => {
      const timed = /(?:\d\s*(?:sec(?:ond)?s?|min(?:ute)?s?|hours?|s|m)\b)|\b(seconds?|minutes?|hours?)\b/i.test(exercise.reps);
      return {
        name: exercise.name,
        sets: Math.min(10, Math.max(1, Number.parseInt(exercise.sets, 10) || 1)),
        targetReps: timed ? 0 : Math.max(1, Number.parseInt(exercise.reps.match(/[-–]\s*(\d+)/)?.[1] ?? exercise.reps, 10) || 1),
        prescription: { kind: timed ? "duration" as const : "reps" as const, target: exercise.reps, rest: exercise.rest },
        cues: exercise.notes ? [exercise.notes] : [],
      };
    }),
  };
}

/** Legacy imports stored prescriptions and session guidance inside cues. */
function migrateAIExercises<T extends TemplateExercise | PlannedExercise>(exercises: T[]): T[] {
  return exercises.map((exercise) => {
    if (exercise.prescription) return exercise;
    const cue = exercise.cues.find((entry) => entry.startsWith("Prescription: "));
    const match = cue?.match(/^Prescription: .+? sets × (.+); rest (.+)\.$/);
    if (!match) return exercise;
    return { ...exercise,
      prescription: { kind: exercise.targetReps === 0 ? "duration" as const : "reps" as const, target: match[1], rest: match[2] },
      cues: exercise.cues.filter((entry) => entry !== cue),
    };
  });
}

function migrateGuidance(exercises: { cues: string[] }[]): WorkoutGuidance | undefined {
  const cues = exercises[0]?.cues ?? [];
  const intensityIndex = cues.findIndex((cue) => /^(High|Medium|Low|Recovery) intensity · /.test(cue));
  if (intensityIndex < 0) return undefined;
  const [intensity, duration] = cues[intensityIndex].split(" intensity · ");
  const warmupIndex = cues.findIndex((cue) => cue.startsWith("Warm-up: "));
  const cooldownIndex = cues.findIndex((cue) => cue.startsWith("Cooldown: "));
  const split = (index: number, prefix: string) => index < 0 ? [] : cues[index].slice(prefix.length).split("; ").filter(Boolean);
  return { intensity, duration,
    coachNote: warmupIndex > intensityIndex + 1 ? cues.slice(intensityIndex + 1, warmupIndex).join(" ") : "",
    warmup: split(warmupIndex, "Warm-up: "), cooldown: split(cooldownIndex, "Cooldown: "),
    recoveryNote: cooldownIndex < 0 ? "" : cues.slice(cooldownIndex + 1).join(" "),
  };
}

export function isAIWorkoutSaved(types: WorkoutType[], plan: AIWorkout): boolean {
  const key = aiWorkoutSourceKey(plan);
  return types.some((type) => type.sourceKey === key || (
    !type.sourceKey && type.id.startsWith("ai-") && type.guidance?.coachNote === plan.coachNote &&
    type.guidance?.recoveryNote === plan.recoveryNote && type.exercises.length === plan.exercises.length &&
    type.exercises.every((exercise, index) => {
      const source = plan.exercises[index];
      return exercise.name === source.name && exercise.prescription?.target === source.reps &&
        exercise.prescription?.rest === source.rest && (!source.notes || exercise.cues.includes(source.notes)) && exercise.sets === Math.min(10, Math.max(1, Number.parseInt(source.sets, 10) || 1));
    })
  ));
}

/** Muscle overlap is an estimate from exercise names, including custom types. */
export function trainingGroups(exercises: { name: string }[]): Set<string> {
  const groups = new Set<string>();
  for (const exercise of exercises) {
    const name = exercise.name.toLowerCase();
    groups.add(`exercise:${name.replace(/[^a-z0-9]/g, "")}`);
    // Whole words only: "crunch" must not match "run", "throw" not "row".
    if (/\bleg (?:curl|extension)s?\b|\bhamstring curls?\b/.test(name)) { groups.add("lower"); continue; }
    if (/\b(?:squats?|lunges?|leg press(?:es)?|deadlifts?|hamstrings?|calf|calves|step.?ups?|hip thrusts?|run|running|runs|sprints?|sprinting|jumps?|jumping|bike|biking|cycling)\b/.test(name)) groups.add("lower");
    if (!/\bleg press/.test(name) && /\b(?:bench|chest|push.?ups?|press(?:es)?|triceps?|dips?)\b/.test(name)) groups.add("push");
    if (/\b(?:rows?|rowing|pull.?ups?|pull.?downs?|pulldowns?|chin.?ups?|biceps?|curls?|face pulls?)\b/.test(name)) groups.add("pull");
    if (/\b(?:planks?|crunch(?:es)?|sit.?ups?|core|abdominals?|abs)\b/.test(name)) groups.add("core");
  }
  return groups;
}

/** Preserve the identity and instructions of days whose library type is removed. */
export function replaceWorkoutTypes(plan: Plan, types: WorkoutType[]): Plan {
  return { ...plan, types, days: Object.fromEntries(Object.entries(plan.days).map(([date, session]) => {
    const previous = plan.types.find((type) => type.id === session.typeId);
    return [date, { ...session, name: session.name ?? previous?.name, color: session.color ?? previous?.color, guidance: session.guidance ?? previous?.guidance }];
  })) };
}

/** Turns a type's saved defaults into a fresh, untracked session. */
export function sessionFromType(type: WorkoutType): DaySession {
  return {
    typeId: type.id,
    name: type.name,
    color: type.color,
    guidance: type.guidance,
    exercises: type.exercises.map((exercise) => ({
      id: nextId(),
      name: exercise.name,
      targetReps: exercise.targetReps,
      prescription: exercise.prescription,
      cues: exercise.cues,
      sets: Array.from({ length: Math.max(1, exercise.sets) }, () => ({
        id: nextId(),
        reps: exercise.prescription?.kind === "duration" ? exercise.prescription.target : exercise.targetReps > 0 ? String(exercise.targetReps) : "",
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
  if (daysSince === 1) return "This workout or overlapping exercises were planned yesterday — allow recovery.";
  if (daysSince === 2) return "This workout or overlapping exercises were planned 2 days ago.";
  return `Last planned this workout or overlapping exercises ${daysSince} days ago.`;
}

/** Most recent date strictly before `dateISO` on which `typeId` was trained. */
function daysSinceTrained(
  plan: Plan,
  typeId: string,
  dateISO: string
): number | null {
  let best: number | null = null;
  const target = trainingGroups(plan.types.find((type) => type.id === typeId)?.exercises ?? []);

  for (const [day, session] of Object.entries(plan.days)) {
    if (session.typeId !== typeId && !Array.from(trainingGroups(session.exercises)).some((group) => target.has(group))) continue;

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

    let types = Array.isArray(parsed.types)
      ? parsed.types.map((type, index) => ({
          id: String(type?.id ?? `type-${index}`),
          name: String(type?.name ?? "Workout"),
          color: String(type?.color ?? TYPE_COLORS[index % TYPE_COLORS.length]),
          guidance: type?.guidance,
          sourceKey: type?.sourceKey,
          exercises: (Array.isArray(type?.exercises) ? type.exercises : []).map(
            (exercise) => ({
              name: String(exercise?.name ?? "Exercise"),
              prescription: exercise?.prescription,
              targetReps: Number.isFinite(exercise?.targetReps) ? Number(exercise.targetReps) : 8,
              sets: Number(exercise?.sets) || 3,
              cues: Array.isArray(exercise?.cues)
                ? exercise.cues.map(String)
                : [],
            })
          ),
        }))
      : defaultTypes();

    types = types.map((type) => {
      const exercises = migrateAIExercises(type.exercises);
      const guidance = type.guidance ?? migrateGuidance(exercises);
      if (!type.guidance && guidance && exercises[0]) {
        const index = exercises[0].cues.findIndex((cue) => cue.startsWith(`${guidance.intensity} intensity · `));
        exercises[0] = { ...exercises[0], cues: exercises[0].cues.slice(0, index) };
      }
      return { ...type, exercises, guidance };
    });

    const days: Record<string, DaySession> = {};

    for (const [day, session] of Object.entries(parsed.days ?? {})) {
      if (!session || typeof session !== "object") continue;

      days[day] = {
        typeId: String(session.typeId ?? ""),
        name: session.name ?? types.find((type) => type.id === session.typeId)?.name,
        color: session.color ?? types.find((type) => type.id === session.typeId)?.color,
        guidance: session.guidance ?? types.find((type) => type.id === session.typeId)?.guidance,
        // Re-key every row through the counter so restored ids stay unique
        // against rows added later in this session.
        exercises: (Array.isArray(session.exercises) ? session.exercises : []).map(
          (exercise) => ({
            id: nextId(),
            name: String(exercise?.name ?? "Exercise"),
            prescription: exercise?.prescription,
            targetReps: Number.isFinite(exercise?.targetReps) ? Number(exercise.targetReps) : 8,
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

    for (const session of Object.values(days)) {
      session.guidance ??= migrateGuidance(session.exercises);
      session.exercises = migrateAIExercises(session.exercises);
      if (session.guidance && session.exercises[0]) {
        const index = session.exercises[0].cues.findIndex((cue) => /^(High|Medium|Low|Recovery) intensity · /.test(cue));
        if (index >= 0) session.exercises[0].cues = session.exercises[0].cues.slice(0, index);
      }
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
  if (exercise.prescription?.kind === "duration" || exercise.targetReps === 0) return "Follow the prescribed duration and rest in the coaching cues.";

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
