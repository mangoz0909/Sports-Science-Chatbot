import {
  readCachedPlan,
  writeCachedPlan,
} from "./planCache";

type Plan = { summary: string };

const USER = "athlete-1";
const TODAY = "2026-08-15";
const YESTERDAY = "2026-08-14";

beforeEach(() => {
  window.localStorage.clear();
});

describe("plan cache", () => {
  it("returns null when nothing has been cached yet", () => {
    expect(readCachedPlan<Plan>("workout", USER, TODAY)).toBeNull();
  });

  it("returns a plan written on the same day", () => {
    writeCachedPlan<Plan>("workout", USER, { summary: "Push day" }, TODAY);

    expect(readCachedPlan<Plan>("workout", USER, TODAY)).toEqual({
      summary: "Push day",
    });
  });

  it("drops a plan generated on a previous day", () => {
    // The whole point of the cache: it holds for the day, then regenerates
    // once on the first visit of the next one.
    writeCachedPlan<Plan>("workout", USER, { summary: "Push day" }, YESTERDAY);

    expect(readCachedPlan<Plan>("workout", USER, TODAY)).toBeNull();
  });

  it("keeps workout and nutrition plans separate", () => {
    writeCachedPlan<Plan>("workout", USER, { summary: "Push day" }, TODAY);
    writeCachedPlan<Plan>("nutrition", USER, { summary: "High carb" }, TODAY);

    expect(readCachedPlan<Plan>("workout", USER, TODAY)).toEqual({
      summary: "Push day",
    });
    expect(readCachedPlan<Plan>("nutrition", USER, TODAY)).toEqual({
      summary: "High carb",
    });
  });

  it("does not serve one athlete's plan to another on a shared browser", () => {
    writeCachedPlan<Plan>("workout", USER, { summary: "Push day" }, TODAY);

    expect(readCachedPlan<Plan>("workout", "athlete-2", TODAY)).toBeNull();
  });

  it("treats an unparseable entry as a miss instead of throwing", () => {
    window.localStorage.setItem(`sportlab:plan:workout:${USER}`, "not json");

    expect(readCachedPlan<Plan>("workout", USER, TODAY)).toBeNull();
  });
});
