import {
  defaultTypes,
  workoutTypeFromAI,
  isAIWorkoutSaved,
  replaceWorkoutTypes,
  type AIWorkout,
  emptyPlan,
  loadPlan,
  recommendWorkouts,
  trainingGroups,
  lastWeightFor,
  fuelFromNutritionPlan,
  savePlan,
  sessionFromType,
  sessionProgress,
  startOfWeek,
  toISODate,
  weekDays,
  weightSuggestion,
  type Plan,
} from "./workoutPlan";

const KEY = "sportlab:workout-plan:athlete-1";
const TODAY = "2026-09-17"; // a Thursday

function planWith(days: Plan["days"]): Plan {
  return { types: defaultTypes(), days };
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("dates", () => {
  it("uses the local date, not UTC", () => {
    // Late evening west of Greenwich is already tomorrow in UTC; the day strip
    // would highlight the wrong square if this used toISOString().
    const lateEvening = new Date(2026, 8, 17, 23, 30);

    expect(toISODate(lateEvening)).toBe("2026-09-17");
  });

  it("starts the week on Monday", () => {
    expect(toISODate(startOfWeek(new Date(2026, 8, 17)))).toBe("2026-09-14");
  });

  it("starts the week on Monday for a Sunday, not the day after", () => {
    // Sunday is getDay() === 0, the case a naive offset gets wrong.
    expect(toISODate(startOfWeek(new Date(2026, 8, 20)))).toBe("2026-09-14");
  });

  it("returns seven consecutive days", () => {
    const days = weekDays(new Date(2026, 8, 17)).map(toISODate);

    expect(days).toEqual([
      "2026-09-14",
      "2026-09-15",
      "2026-09-16",
      "2026-09-17",
      "2026-09-18",
      "2026-09-19",
      "2026-09-20",
    ]);
  });
});

describe("recommendations", () => {
  it("always adds up to exactly 100%", () => {
    // Three equal shares are 33.33% each; rounding them independently reads
    // 99%, which looks broken under a "recommended split" label.
    const percentages = recommendWorkouts(emptyPlan(), TODAY).map(
      (entry) => entry.percent
    );

    expect(percentages.reduce((sum, value) => sum + value, 0)).toBe(100);
  });

  it("favours the muscle group with the longest recovery", () => {
    const plan = planWith({
      "2026-09-16": sessionFromType(defaultTypes()[1]), // pull, yesterday
      "2026-09-14": sessionFromType(defaultTypes()[2]), // legs, 3 days ago
    });

    const [first] = recommendWorkouts(plan, TODAY);

    // Push has never been trained, so it is the most rested of the three.
    expect(first.type.id).toBe("push");
  });

  it("ranks a group trained yesterday below one trained three days ago", () => {
    const plan = planWith({
      "2026-09-16": sessionFromType(defaultTypes()[0]), // push, yesterday
      "2026-09-14": sessionFromType(defaultTypes()[1]), // pull, 3 days ago
    });

    const byId = Object.fromEntries(
      recommendWorkouts(plan, TODAY).map((entry) => [entry.type.id, entry])
    );

    expect(byId.pull.percent).toBeGreaterThan(byId.push.percent);
    expect(byId.push.daysSince).toBe(1);
    expect(byId.pull.daysSince).toBe(3);
  });

  it("all but rules out a group already trained today", () => {
    const plan = planWith({ [TODAY]: sessionFromType(defaultTypes()[0]) });

    const byId = Object.fromEntries(
      recommendWorkouts(plan, TODAY).map((entry) => [entry.type.id, entry])
    );

    expect(byId.push.percent).toBeLessThan(10);
    expect(byId.push.reason).toBe("Already trained today.");
  });

  it("ignores sessions logged after the day being planned", () => {
    // Looking back at Monday should not be told Monday is a poor choice
    // because of a session that happens on Wednesday.
    const plan = planWith({ "2026-09-16": sessionFromType(defaultTypes()[0]) });

    const byId = Object.fromEntries(
      recommendWorkouts(plan, "2026-09-14").map((entry) => [entry.type.id, entry])
    );

    expect(byId.push.daysSince).toBeNull();
  });

  it("returns nothing when there are no workout types", () => {
    expect(recommendWorkouts({ types: [], days: {} }, TODAY)).toEqual([]);
  });
});

describe("session progress", () => {
  it("reports zero for a day with no session", () => {
    expect(sessionProgress(undefined)).toEqual({
      completed: 0,
      total: 0,
      percent: 0,
    });
  });

  it("does not divide by zero once every set is removed", () => {
    expect(sessionProgress({ typeId: "push", exercises: [] }).percent).toBe(0);
  });

  it("counts completed sets across exercises", () => {
    const session = sessionFromType(defaultTypes()[0]);
    session.exercises[0].sets[0].completed = true;
    session.exercises[1].sets[0].completed = true;

    const { completed, total } = sessionProgress(session);

    expect(completed).toBe(2);
    expect(total).toBeGreaterThan(2);
  });
});

describe("weight suggestion", () => {
  const exercise = (sets: { reps: string; weight: string }[]) => ({
    id: 1,
    name: "Bench Press",
    targetReps: 8,
    cues: [],
    sets: sets.map((set, index) => ({ id: index, ...set, completed: true })),
  });

  it("asks for completed sets before advising", () => {
    expect(
      weightSuggestion({
        id: 1,
        name: "Bench Press",
        targetReps: 8,
        cues: [],
        sets: [{ id: 1, reps: "8", weight: "135", completed: false }],
      })
    ).toMatch(/Complete your working sets/);
  });

  it("suggests more load once the target reps are met", () => {
    expect(
      weightSuggestion(
        exercise([
          { reps: "8", weight: "135" },
          { reps: "8", weight: "135" },
        ])
      )
    ).toMatch(/140 lb/);
  });

  it("holds the load when a set fell short of the target", () => {
    expect(
      weightSuggestion(
        exercise([
          { reps: "8", weight: "135" },
          { reps: "5", weight: "135" },
        ])
      )
    ).toMatch(/Stay around 135 lb/);
  });

  it("treats a blank weight as zero rather than NaN", () => {
    expect(weightSuggestion(exercise([{ reps: "8", weight: "" }]))).toMatch(
      /Stay around 0 lb/
    );
  });
});

describe("storage", () => {
  it("keeps an intentionally empty workout list after reloading", () => {
    savePlan(KEY, { types: [], days: {} });

    expect(loadPlan(KEY)).toEqual({ types: [], days: {} });
  });

  it("returns a fresh plan when nothing is saved", () => {
    expect(loadPlan(KEY).days).toEqual({});
    expect(loadPlan(KEY).types.length).toBeGreaterThan(0);
  });

  it("round-trips a saved plan", () => {
    const plan = planWith({ [TODAY]: sessionFromType(defaultTypes()[0]) });
    plan.days[TODAY].exercises[0].sets[0].completed = true;

    savePlan(KEY, plan);
    const loaded = loadPlan(KEY);

    expect(loaded.days[TODAY].typeId).toBe("push");
    expect(loaded.days[TODAY].exercises[0].sets[0].completed).toBe(true);
    expect(loaded.types.map((type) => type.name)).toEqual(
      plan.types.map((type) => type.name)
    );
  });

  it("gives every restored row a unique id", () => {
    const plan = planWith({ [TODAY]: sessionFromType(defaultTypes()[0]) });
    savePlan(KEY, plan);

    const ids = loadPlan(KEY).days[TODAY].exercises.flatMap((exercise) => [
      exercise.id,
      ...exercise.sets.map((set) => set.id),
    ]);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("falls back to a fresh plan on unparseable storage", () => {
    window.localStorage.setItem(KEY, "{not json");

    expect(loadPlan(KEY).days).toEqual({});
  });

  it("survives a plan saved in an older shape", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ workoutName: "Push Day" }));

    const loaded = loadPlan(KEY);

    expect(loaded.days).toEqual({});
    expect(loaded.types.length).toBeGreaterThan(0);
  });

  it("drops rubbish inside an otherwise valid plan", () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ types: [{ name: "Push" }], days: { [TODAY]: null } })
    );

    const loaded = loadPlan(KEY);

    expect(loaded.days[TODAY]).toBeUndefined();
    expect(loaded.types[0].exercises).toEqual([]);
  });
});

const aiSession: AIWorkout = {
  focus: "Strength and conditioning", intensity: "Medium", totalDuration: "45 min",
  coachNote: "Keep effort controlled.", warmup: ["Easy jog"], cooldown: ["Walk"], recoveryNote: "Hydrate.",
  exercises: [
    { name: "Goblet squat", sets: "3", reps: "6-8", rest: "90 sec", notes: "Brace your core." },
    { name: "Shuttle runs", sets: "4", reps: "30 sec", rest: "60 sec", notes: "Smooth turns." },
  ],
};

describe("reusable AI workouts", () => {
  it("keeps prescriptions and session guidance separate through edits, removal, and reload", () => {
    const type = workoutTypeFromAI(aiSession, "My training");
    type.exercises[0].sets = 5;
    type.exercises[0].targetReps = 10;
    type.exercises[0].prescription!.target = "10";
    expect(type.exercises[0].cues).toEqual(["Brace your core."]);
    const session = sessionFromType(type);
    expect(session.exercises[0].sets).toHaveLength(5);
    expect(session.exercises[0].prescription!.target).toBe("10");
    session.exercises.shift();
    savePlan(KEY, { types: [type], days: { [TODAY]: session } });
    const restored = loadPlan(KEY);
    expect(restored.days[TODAY].guidance!.warmup).toEqual(["Easy jog"]);
    expect(restored.days[TODAY].guidance!.recoveryNote).toBe("Hydrate.");
    expect(restored.days[TODAY].exercises[0].prescription!.kind).toBe("duration");
    expect(restored.days[TODAY].exercises[0].sets[0].reps).toBe("30 sec");
    expect(isAIWorkoutSaved(restored.types, aiSession)).toBe(true);
  });

  it("reduces recovery ranking for a newly saved AI workout overlapping yesterday's legs", () => {
    const types = [...defaultTypes(), workoutTypeFromAI(aiSession, "AI squat session")];
    const plan = { types, days: { "2026-09-16": sessionFromType(types[2]) } };
    const ranked = recommendWorkouts(plan, TODAY);
    const ai = ranked.find((entry) => entry.type.id === types[3].id)!;
    expect(ai.daysSince).toBe(1);
    expect(ai.percent).toBeLessThan(ranked.find((entry) => entry.type.id === "push")!.percent);
  });

  it("preserves deleted workout identity and guidance without retaining the library option", () => {
    const type = workoutTypeFromAI(aiSession, "Deleted workout");
    const session = sessionFromType(type);
    const plan = replaceWorkoutTypes({ types: [type], days: { [TODAY]: session } }, []);
    savePlan(KEY, plan);
    const restored = loadPlan(KEY);
    expect(restored.types).toEqual([]);
    expect(restored.days[TODAY].name).toBe("Deleted workout");
    expect(restored.days[TODAY].color).toBe(type.color);
    expect(restored.days[TODAY].guidance).toEqual(type.guidance);
    expect(restored.days[TODAY].exercises).toHaveLength(2);
  });

  it("migrates old AI imports without losing their session guidance", () => {
    const legacy = { id: "ai-old", name: "Old AI", color: "#a855f7", exercises: [
      { name: "Shuttle runs", sets: 4, targetReps: 0, cues: [
        "Prescription: 4 sets × 30 sec; rest 60 sec.", "Smooth turns.",
        "Medium intensity · 45 min", "Keep effort controlled.", "Warm-up: Easy jog", "Cooldown: Walk", "Hydrate.",
      ] },
    ] };
    savePlan(KEY, { types: [legacy], days: { [TODAY]: sessionFromType(legacy) } });
    const restored = loadPlan(KEY);
    expect(restored.types[0].exercises[0].prescription).toEqual({ kind: "duration", target: "30 sec", rest: "60 sec" });
    expect(restored.types[0].exercises[0].cues).toEqual(["Smooth turns."]);
    expect(restored.days[TODAY].guidance!.warmup).toEqual(["Easy jog"]);
    expect(restored.days[TODAY].exercises[0].cues).toEqual(["Smooth turns."]);
  });
});

describe("trainingGroups", () => {
  const groups = (name: string) => [...trainingGroups([{ name }])].filter((group) => !group.startsWith("exercise:")).sort();
  it("matches whole words only", () => {
    expect(groups("Crunches")).toEqual(["core"]);
    expect(groups("Medicine ball throw")).toEqual([]);
    expect(groups("Leg curl")).toEqual(["lower"]);
    expect(groups("Leg press")).toEqual(["lower"]);
    expect(groups("Barbell row")).toEqual(["pull"]);
    expect(groups("Overhead press")).toEqual(["push"]);
    expect(groups("Running")).toEqual(["lower"]);
  });
});

describe("lastWeightFor", () => {
  const day = (name: string, sets: [string, boolean][]) => ({ typeId: "x", exercises: [{ id: 1, name, targetReps: 8, cues: [], sets: sets.map(([weight, completed], i) => ({ id: i, reps: "8", weight, completed })) }] });
  const plan = (days: Record<string, ReturnType<typeof day>>) => ({ types: defaultTypes(), days });

  it("uses the heaviest completed set on the most recent earlier day, name-insensitive", () => {
    const p = plan({
      "2026-10-01": day("Bench Press", [["100", true]]),
      "2026-10-05": day("bench-press", [["95", true], ["135", true], ["200", false]]),
      "2026-10-09": day("Bench Press", [["225", false]]),
      "2026-10-20": day("Bench Press", [["300", true]]),
    });
    expect(lastWeightFor(p, "Bench press!", "2026-10-10")).toBe(135);
  });

  it("returns null without usable history and ignores the day itself", () => {
    const p = plan({ "2026-10-10": day("Squat", [["200", true]]) });
    expect(lastWeightFor(p, "Squat", "2026-10-10")).toBeNull();
    expect(lastWeightFor(p, "Deadlift", "2026-10-11")).toBeNull();
  });

  it("pre-fills sessionFromType weights and lastWeight, falling back to 0", () => {
    const types = defaultTypes();
    const p = plan({ "2026-10-05": day("Bench Press", [["135", true]]) });
    const session = sessionFromType(types[0], { plan: p, dateISO: "2026-10-10" });
    expect(session.exercises[0].sets.map((s) => s.weight)).toEqual(["135", "135", "135"]);
    expect(session.exercises[0].sets[0].reps).toBe("8");
    expect(session.exercises[0].lastWeight).toBe(135);
    expect(session.exercises[1].sets[0].weight).toBe("0");
    expect(session.exercises[1].lastWeight).toBeUndefined();
  });
});

describe("fuelFromNutritionPlan", () => {
  it("picks pre/post meals and tolerates bad shapes", () => {
    const fuel = fuelFromNutritionPlan({ meals: [
      { meal: "Pre-workout snack", foods: ["Banana", "Toast"], timing: "1h before" },
      { meal: "Post-workout", foods: "Shake" },
      { meal: "Dinner", foods: "Pasta" },
    ] });
    expect(fuel?.pre[0].foods).toBe("Banana, Toast");
    expect(fuel?.post[0].foods).toBe("Shake");
    expect(fuelFromNutritionPlan(null)).toBeNull();
    // A plan with no pre/post meals is still a plan, not "no plan".
    expect(fuelFromNutritionPlan({ meals: [{ meal: "Dinner", foods: "Pasta" }] })).toEqual({ pre: [], post: [] });
    expect(fuelFromNutritionPlan("x")).toBeNull();
  });
});
