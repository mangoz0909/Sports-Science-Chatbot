import type { CheckInData } from "../../lib/checkInScores";

/*
 * Where the hero's sliders start. The numbers are made up and nothing is saved;
 * the score and the advice are worked out by the same code as the real check-in.
 */
export const exampleCheckIn: CheckInData = {
  sleepHours: 8,
  sleepQuality: 8,
  energy: 7,
  soreness: 6,
  fatigue: 4,
  stress: 3,
  mood: 7,
  hydration: 5,
  nutrition: 7,
  trainingIntensity: 5,
  painLevel: 1,
  notes: "",
};

export type HeroField = "sleepQuality" | "energy" | "soreness" | "fatigue" | "hydration" | "stress";

/** Real field names and 1–10 scales from pages/DailyCheckIn.tsx. */
export const heroRows: { key: HeroField; label: string; invert?: boolean }[] = [
  { key: "sleepQuality", label: "Sleep Quality" },
  { key: "energy", label: "Energy Level" },
  { key: "soreness", label: "Muscle Soreness", invert: true },
  { key: "fatigue", label: "Fatigue", invert: true },
  { key: "hydration", label: "Hydration" },
  { key: "stress", label: "Stress Level", invert: true },
];
