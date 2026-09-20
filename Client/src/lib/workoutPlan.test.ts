import {
  defaultTypes,
  emptyPlan,
  loadPlan,
  recommendWorkouts,
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
