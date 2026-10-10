import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { vi } from "vitest";
import AiWorkoutGenerator, { summarizeWorkouts } from "./AiWorkoutGenerator";
import ExerciseCard from "./ExerciseCard";
import { sessionFromType, type WorkoutType } from "../../lib/workoutPlan";
import { getUserPreferences } from "../../services/preferencesService";
import { saveTodaysPlan } from "../../services/planService";

const mocks = vi.hoisted(() => ({ load: vi.fn(), invoke: vi.fn() }));
vi.mock("../../contexts/AuthContext", () => ({ useAuth: () => ({ session: { user: { id: "athlete" } }, loading: false }) }));
vi.mock("../../lib/supabaseClient", () => ({ supabase: { functions: { invoke: mocks.invoke } } }));
vi.mock("../../services/planService", () => ({ loadTodaysPlan: mocks.load, saveTodaysPlan: vi.fn() }));
vi.mock("../../services/preferencesService", () => ({ getUserPreferences: vi.fn() }));
vi.mock("../../services/checkinService", () => ({ getLatestCheckIn: vi.fn(), getLast7CheckIns: vi.fn(), isCheckInFromToday: vi.fn() }));

const generated = {
  day: "Friday", date: "October 9, 2026", focus: "Conditioning", intensity: "Medium", totalDuration: "30 min",
  coachNote: "Steady effort.", warmup: ["Easy jog"], cooldown: ["Walk"], recoveryNote: "Hydrate.",
  exercises: [{ name: "Shuttle runs", sets: "4", reps: "30 sec", rest: "60 sec", notes: "Smooth turns." }],
};
let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.mocked(getUserPreferences).mockResolvedValue(null);
  mocks.load.mockResolvedValue(generated);
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});

it("waits for an explicit request when no saved workout exists, then generates and caches it", async () => {
  mocks.load.mockResolvedValue(null);
  mocks.invoke.mockResolvedValue({ data: { result: JSON.stringify(generated) }, error: null });
  await act(async () => root.render(<AiWorkoutGenerator />));
  expect(mocks.invoke).not.toHaveBeenCalled();
  const button = Array.from(host.querySelectorAll("button")).find((item) => item.textContent === "Generate Workout")!;
  expect(button.disabled).toBe(false);
  await act(async () => button.click());
  expect(mocks.invoke).toHaveBeenCalledWith("ai-complete", expect.objectContaining({
    timeout: 60_000, body: expect.objectContaining({ task: "workout" }),
  }));
  expect(host.textContent).toContain("Shuttle runs");
  expect(saveTodaysPlan).toHaveBeenCalledWith("workout", "athlete", generated);
});

it("shows the service error and allows a successful retry", async () => {
  mocks.load.mockResolvedValue(null);
  mocks.invoke.mockResolvedValueOnce({ data: null, error: { context: new Response(JSON.stringify({ error: "AI service is busy. Please try again." }), { status: 503 }) } })
    .mockResolvedValueOnce({ data: { result: JSON.stringify(generated) }, error: null });
  await act(async () => root.render(<AiWorkoutGenerator />));
  const button = Array.from(host.querySelectorAll("button")).find((item) => item.textContent === "Generate Workout")!;
  await act(async () => button.click());
  expect(host.textContent).toContain("AI service is busy. Please try again.");
  expect(button.disabled).toBe(false);
  await act(async () => button.click());
  expect(host.textContent).toContain("Shuttle runs");
  expect(host.textContent).not.toContain("AI service is busy");
});

it("explains a profile loading failure and does not generate without restrictions", async () => {
  mocks.load.mockResolvedValue(null);
  vi.mocked(getUserPreferences).mockRejectedValueOnce({ message: "Database unavailable" });
  await act(async () => root.render(<AiWorkoutGenerator />));
  const button = Array.from(host.querySelectorAll("button")).find((item) => item.textContent === "Generate Workout")!;
  await act(async () => button.click());
  expect(host.textContent).toContain("Could not load your athlete profile");
  expect(mocks.invoke).not.toHaveBeenCalled();
  expect(button.disabled).toBe(false);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.clearAllMocks();
});

it("uses the actual save conversion and prevents duplicate saves after remounting", async () => {
  let types: WorkoutType[] = [];
  const onSave = vi.fn((type: WorkoutType) => { types = [...types, type]; });
  const render = () => root.render(<AiWorkoutGenerator workoutTypes={types} onSaveWorkout={onSave} />);
  await act(async () => { render(); });
  const save = Array.from(host.querySelectorAll("button")).find((button) => button.textContent === "Save to My Workouts")!;
  act(() => save.click());
  expect(onSave).toHaveBeenCalledTimes(1);
  expect(types[0].exercises[0].prescription).toEqual({ kind: "duration", target: "30 sec", rest: "60 sec" });
  expect(types[0].guidance!.warmup).toEqual(["Easy jog"]);
  act(() => root.render(null));
  await act(async () => { render(); });
  const saved = Array.from(host.querySelectorAll("button")).find((button) => button.textContent === "Saved to My Workouts")!;
  expect(saved.disabled).toBe(true);
  act(() => saved.click());
  expect(onSave).toHaveBeenCalledTimes(1);
});

it("reports a failed save and leaves the save button available for retry", async () => {
  await act(async () => root.render(<AiWorkoutGenerator onSaveWorkout={() => { throw new Error("Storage unavailable"); }} />));
  const save = Array.from(host.querySelectorAll("button")).find((button) => button.textContent === "Save to My Workouts")!;
  act(() => save.click());
  expect(host.textContent).toContain("Could not save this workout");
  expect(save.disabled).toBe(false);
});

it("provides a duration input without a weight or reps input for timed exercises", () => {
  const exercise = sessionFromType({ id: "timed", name: "Conditioning", color: "#a855f7", exercises: [
    { name: "Shuttle runs", sets: 4, targetReps: 0, cues: [], prescription: { kind: "duration", target: "30 sec", rest: "60 sec" } },
  ] }).exercises[0];
  const update = vi.fn();
  act(() => root.render(<ExerciseCard exercise={exercise} index={0} accent="#a855f7"
    onUpdateSet={update} onNormaliseSet={vi.fn()} onToggleSet={vi.fn()} onAddSet={vi.fn()} onRemoveSet={vi.fn()} onRemove={vi.fn()} />));
  expect(host.querySelector<HTMLInputElement>('input[aria-label="Shuttle runs set 1 duration"]')!.value).toBe("30 sec");
  expect(host.querySelector('input[aria-label$="weight in pounds"]')).toBeNull();
  expect(host.querySelector('input[aria-label$=" reps"]')).toBeNull();
  expect(host.textContent).toContain("Rest 60 sec");
});

describe("summarizeWorkouts", () => {
  it("lists names only and stays under the cap", () => {
    const many = Array.from({ length: 200 }, (_, i) => ({ id: `t${i}`, name: `Workout ${i}`, color: "#000",
      exercises: [{ name: "Squat", targetReps: 5, sets: 3, cues: ["x".repeat(500)] }] }));
    const summary = summarizeWorkouts(many);
    expect(summary.length).toBeLessThanOrEqual(1500);
    expect(summary).not.toContain("xxx");
    expect(summarizeWorkouts([])).toBe("None yet.");
  });
});
