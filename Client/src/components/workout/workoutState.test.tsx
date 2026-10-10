import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { vi } from "vitest";
import CustomizeTypesDialog from "./CustomizeTypesDialog";
import MyWorkoutPlan from "../../pages/MyWorkoutPlan";
import { defaultTypes, workoutTypeFromAI, loadPlan, recommendWorkouts, savePlan, sessionFromType, storageKeyFor, type WorkoutType } from "../../lib/workoutPlan";

const auth = vi.hoisted(() => ({ user: { id: "athlete-1" } as { id: string } | null }));
vi.mock("../../contexts/AuthContext", () => ({ useAuth: () => ({ user: auth.user }) }));
vi.mock("react-router-dom", () => ({ useSearchParams: () => [new URLSearchParams("tab=ai"), vi.fn()] }));
vi.mock("../Seo", () => ({ default: () => null }));
vi.mock("./AiWorkoutGenerator", () => ({ default: ({ onSaveWorkout }: { onSaveWorkout: (type: WorkoutType) => void }) => (
  <button onClick={() => onSaveWorkout({ id: "ai-conditioning", name: "Match Conditioning", color: "#a855f7", exercises: [
    { name: "Shuttle runs", sets: 4, targetReps: 0, cues: ["30 sec; rest 60 sec"] },
  ] })}>Save AI workout</button>
) }));
vi.mock("./WeekStrip", () => ({ default: () => null }));
vi.mock("./RecommendationCards", () => ({ default: () => null }));
vi.mock("./ExerciseCard", () => ({ default: () => null }));

// Small controls let these tests focus on state transitions rather than MUI's
// portals and animations. The real components and their handlers still run.
vi.mock("@mui/material", () => {
  const Group = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  const Button = ({ children, onClick }: { children?: React.ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>;
  return {
    Box: Group, Container: Group, Paper: Group, Stack: Group, Typography: Group,
    Chip: () => null, Divider: () => null, LinearProgress: () => null,
    Tab: () => null, Tabs: Group, Tooltip: Group,
    Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) => open ? <div>{children}</div> : null,
    DialogActions: Group, DialogContent: Group, DialogTitle: Group,
    Button, IconButton: Button,
    TextField: ({ label, value, onChange, inputProps }: { label?: string; value?: string | number; onChange?: (event: React.FormEvent<HTMLInputElement>) => void; inputProps?: { "aria-label"?: string } }) => (
      <input aria-label={inputProps?.["aria-label"] ?? label} value={value ?? ""} onInput={onChange} onChange={() => {}} />
    ),
    useTheme: () => ({ breakpoints: { down: () => "" } }), useMediaQuery: () => false,
  };
});

let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  window.localStorage.clear();
  auth.user = { id: "athlete-1" };
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.restoreAllMocks();
});

it("discards canceled workout edits on reopening", () => {
  const types = defaultTypes();
  const render = (open: boolean) => act(() => root.render(
    <CustomizeTypesDialog open={open} types={types} onClose={() => {}} onSave={() => {}} />
  ));
  render(true);
  const name = host.querySelector<HTMLInputElement>('input[aria-label="Workout name"]')!;
  act(() => {
    name.value = "Unsaved workout";
    name.dispatchEvent(new Event("input", { bubbles: true }));
  });
  expect(name.value).toBe("Unsaved workout");
  render(false);
  render(true);
  expect(host.querySelector<HTMLInputElement>('input[aria-label="Workout name"]')!.value).toBe(types[0].name);
});

it("never writes the previous account's plan into the next account's storage", () => {
  savePlan(storageKeyFor("athlete-1"), { types: defaultTypes(), days: {} });
  savePlan(storageKeyFor("athlete-2"), { types: [], days: {} });
  act(() => root.render(<MyWorkoutPlan />));
  const writes = vi.spyOn(Storage.prototype, "setItem");
  auth.user = { id: "athlete-2" };
  act(() => root.render(<MyWorkoutPlan />));

  const nextAccountWrites = writes.mock.calls.filter(([key]) => key === storageKeyFor("athlete-2"));
  expect(nextAccountWrites.length).toBeGreaterThan(0);
  for (const [, value] of nextAccountWrites) {
    expect(JSON.parse(value).types).toEqual([]);
  }
});

it("saves AI workouts as reusable planner options without replacing the user's workouts", () => {
  act(() => root.render(<MyWorkoutPlan />));
  act(() => Array.from(host.querySelectorAll("button")).find((button) => button.textContent === "Save AI workout")!.click());
  const saved = loadPlan(storageKeyFor("athlete-1"));
  expect(saved.types.map((type) => type.name)).toEqual(["Push", "Pull", "Legs", "Match Conditioning"]);
  const option = recommendWorkouts(saved, "2026-10-09").find((entry) => entry.type.id === "ai-conditioning")!;
  const session = sessionFromType(option.type);
  expect(session.exercises[0].sets).toHaveLength(4);
  expect(session.exercises[0].targetReps).toBe(0);
  expect(session.exercises[0].cues).toEqual(["30 sec; rest 60 sec"]);
  expect(session.exercises[0].sets.every((set) => !set.completed)).toBe(true);
});

it("edits a timed prescription without converting it to reps", () => {
  const type = workoutTypeFromAI({ focus: "Conditioning", intensity: "Low", totalDuration: "20 min",
    coachNote: "Easy effort", warmup: [], cooldown: [], recoveryNote: "Rest",
    exercises: [{ name: "Run", sets: "3", reps: "30 sec", rest: "60 sec", notes: "Relax" }],
  }, "Conditioning");
  const onSave = vi.fn();
  act(() => root.render(<CustomizeTypesDialog open types={[type]} onClose={() => {}} onSave={onSave} />));
  const duration = host.querySelector<HTMLInputElement>('input[aria-label="Duration"]')!;
  act(() => { duration.value = "45 sec"; duration.dispatchEvent(new Event("input", { bubbles: true })); });
  act(() => Array.from(host.querySelectorAll("button")).find((button) => button.textContent === "Save")!.click());
  const exercise = onSave.mock.calls[0][0][0].exercises[0];
  expect(exercise.targetReps).toBe(0);
  expect(exercise.prescription).toEqual({ kind: "duration", target: "45 sec", rest: "60 sec" });
  expect(exercise.cues).toEqual(["Relax"]);
});
