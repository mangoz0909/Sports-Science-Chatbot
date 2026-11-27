/**
 * "Not medical advice" on the screens that give AI or score-based advice
 * (bug hunt v4, V4-02, 16 Nov 2026).
 *
 * The only "not medical advice" sentence in the app was on /privacy: the
 * nutrition plan, the check-in's coach summary and the dashboard's coach tip
 * gave training, recovery and calorie advice to teenagers with no note at all.
 * Each now carries the line the home page already uses, next to the advice.
 * The workout plan is covered in AiWorkoutGenerator.test.tsx and the chat in
 * sportsChatSafety.test.tsx.
 */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import NutritionPage from "./NutritionPage";
import Dashboard from "./Dashboard";
import DailyCheckIn from "./DailyCheckIn";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const NOTE = "Educational only, not medical advice.";

vi.mock("../contexts/AuthContext", () => ({ useAuth: () => ({ session: null, loading: false }) }));
vi.mock("../lib/supabaseClient", () => ({ supabase: { functions: { invoke: vi.fn() } } }));
vi.mock("../components/Seo", () => ({ default: () => null, breadcrumbs: () => ({}) }));
vi.mock("../services/planService", () => ({
  loadTodaysPlan: vi.fn().mockResolvedValue(null),
  saveTodaysPlan: vi.fn(),
}));
vi.mock("../services/preferencesService", () => ({ getUserPreferences: vi.fn().mockResolvedValue(null) }));
vi.mock("../services/profileService", () => ({ getMyProfile: vi.fn().mockResolvedValue(null) }));
vi.mock("../services/checkinService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../services/checkinService")>()),
  getLatestCheckIn: vi.fn().mockResolvedValue(null),
  getLast7CheckIns: vi.fn().mockResolvedValue([]),
  getCheckInsForRange: vi.fn().mockResolvedValue([]),
  getCheckInForDate: vi.fn().mockResolvedValue(null),
  createDailyCheckIn: vi.fn(),
}));

class NoopResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

let host: HTMLDivElement;
let root: Root;

beforeAll(() => {
  // The dashboard's charts size themselves with a ResizeObserver; jsdom has none.
  vi.stubGlobal("ResizeObserver", NoopResizeObserver);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

async function render(page: React.ReactElement) {
  await act(async () => root.render(<MemoryRouter>{page}</MemoryRouter>));
}

/** The card (or section) that holds the heading with this text. */
function cardWithHeading(text: string, selector = ".MuiCard-root"): Element {
  const heading = Array.from(host.querySelectorAll("h1, h2, h3, h4, h5, h6")).find(
    (element) => element.textContent?.trim() === text
  );
  expect(heading, `heading "${text}"`).toBeDefined();
  const card = heading!.closest(selector);
  expect(card, `container of "${text}"`).not.toBeNull();
  return card!;
}

it("the nutrition plan (the guests' example plan here) says it is not medical advice", async () => {
  await render(<NutritionPage />);
  expect(cardWithHeading("Daily targets", "section").textContent).toContain(NOTE);
});

it("the check-in's coach summary says it is not medical advice", async () => {
  await render(<DailyCheckIn />);
  expect(cardWithHeading("AI Coach Summary").textContent).toContain(NOTE);
});

it("the dashboard's coach tip says it is not medical advice", async () => {
  await render(<Dashboard />);
  expect(cardWithHeading("My AI Coach").textContent).toContain(NOTE);
});
