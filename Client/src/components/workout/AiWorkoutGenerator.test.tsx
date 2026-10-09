import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { vi } from "vitest";
import AiWorkoutGenerator from "./AiWorkoutGenerator";
import ExerciseCard from "./ExerciseCard";
import { sessionFromType, type WorkoutType } from "../../lib/workoutPlan";

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
  mocks.load.mockResolvedValue(generated);
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
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
