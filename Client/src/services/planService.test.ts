import { loadTodaysPlan, saveTodaysPlan, storeTodaysPlan } from "./planService";
import { readCachedPlan, writeCachedPlan } from "../lib/planCache";

const mockGetUser = jest.fn();
const mockMaybeSingle = jest.fn();
const mockUpsert = jest.fn();

jest.mock("../lib/supabaseClient", () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: () => mockMaybeSingle(),
            }),
          }),
        }),
      }),
      upsert: (payload: unknown, options: unknown) =>
        mockUpsert(payload, options),
    }),
  },
}));

type Plan = { summary: string };

const USER = "athlete-1";
const SERVER_PLAN: Plan = { summary: "from the server" };
const LOCAL_PLAN: Plan = { summary: "from this device" };

beforeEach(() => {
  window.localStorage.clear();
  jest.clearAllMocks();

  // Every code path under test logs its own failures; keep the run readable.
  jest.spyOn(console, "error").mockImplementation(() => {});

  mockGetUser.mockResolvedValue({ data: { user: { id: USER } }, error: null });
  mockMaybeSingle.mockResolvedValue({ data: null, error: null });
  mockUpsert.mockResolvedValue({ error: null });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("loadTodaysPlan", () => {
  it("returns the plan saved on the athlete's account", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { plan: SERVER_PLAN },
      error: null,
    });

    await expect(loadTodaysPlan<Plan>("workout", USER)).resolves.toEqual(
      SERVER_PLAN
    );
  });

  it("mirrors the server plan onto this device for later offline visits", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { plan: SERVER_PLAN },
      error: null,
    });

    await loadTodaysPlan<Plan>("workout", USER);

    expect(readCachedPlan<Plan>("workout", USER)).toEqual(SERVER_PLAN);
  });

  it("returns null when the account has no plan for today", async () => {
    // The one case that should spend an AI call.
    await expect(loadTodaysPlan<Plan>("workout", USER)).resolves.toBeNull();
  });

  it("falls back to this device's copy when the request fails", async () => {
    // Offline or a Supabase error. Regenerating here would cost an AI call and
    // hand the athlete a different plan halfway through their day.
    writeCachedPlan<Plan>("workout", USER, LOCAL_PLAN);
    mockMaybeSingle.mockResolvedValue({ data: null, error: { message: "offline" } });

    await expect(loadTodaysPlan<Plan>("workout", USER)).resolves.toEqual(
      LOCAL_PLAN
    );
  });

  it("returns null when the request fails and this device has no copy", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: { message: "offline" } });

    await expect(loadTodaysPlan<Plan>("workout", USER)).resolves.toBeNull();
  });

  it("does not let a workout lookup answer with a nutrition plan", async () => {
    writeCachedPlan<Plan>("nutrition", USER, LOCAL_PLAN);
    mockMaybeSingle.mockResolvedValue({ data: null, error: { message: "offline" } });

    await expect(loadTodaysPlan<Plan>("workout", USER)).resolves.toBeNull();
  });
});

describe("saveTodaysPlan", () => {
  it("stores the plan on the account and on this device", async () => {
    await saveTodaysPlan<Plan>("nutrition", USER, SERVER_PLAN);

    expect(mockUpsert).toHaveBeenCalledTimes(1);
    expect(readCachedPlan<Plan>("nutrition", USER)).toEqual(SERVER_PLAN);
  });

  it("keeps the device copy even when the sync fails", async () => {
    mockUpsert.mockResolvedValue({ error: { message: "offline" } });

    await expect(
      saveTodaysPlan<Plan>("nutrition", USER, SERVER_PLAN)
    ).resolves.toBeUndefined();

    expect(readCachedPlan<Plan>("nutrition", USER)).toEqual(SERVER_PLAN);
  });
});

describe("storeTodaysPlan", () => {
  it("upserts on the athlete/kind/day key so regenerating replaces the row", async () => {
    await storeTodaysPlan<Plan>("workout", SERVER_PLAN, "2026-08-15");

    const [payload, options] = mockUpsert.mock.calls[0];

    expect(payload).toMatchObject({
      user_id: USER,
      plan_kind: "workout",
      plan_date: "2026-08-15",
      plan: SERVER_PLAN,
    });
    expect(options).toEqual({ onConflict: "user_id,plan_kind,plan_date" });
  });

  it("surfaces a write failure to the caller", async () => {
    mockUpsert.mockResolvedValue({ error: { message: "denied" } });

    await expect(
      storeTodaysPlan<Plan>("workout", SERVER_PLAN, "2026-08-15")
    ).rejects.toEqual({ message: "denied" });
  });
});
