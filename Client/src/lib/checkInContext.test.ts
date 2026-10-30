import { describe, expect, it } from "vitest";
import { checkInContextKey, matchesCheckInContext } from "./checkInContext";

const checkIn = {
  checkin_date: "2026-10-29",
  readiness_score: 78,
  recovery_score: 72,
  fatigue: 3,
  sleep_hours: 7.5,
  training_intensity: 6,
  soreness: 3,
  stress: 4,
  injury_risk: 20,
  hydration: 7,
  nutrition: 8,
  pain_level: 1,
};

describe("check-in plan context", () => {
  it("recognizes an unchanged check-in and an unchanged absence", () => {
    expect(matchesCheckInContext(checkInContextKey(checkIn), checkIn)).toBe(true);
    expect(matchesCheckInContext(checkInContextKey(null), null)).toBe(true);
  });

  it("detects an updated check-in or unknown saved context", () => {
    expect(
      matchesCheckInContext(checkInContextKey(checkIn), { ...checkIn, fatigue: 8 })
    ).toBe(false);
    expect(matchesCheckInContext(undefined, checkIn)).toBe(false);
    expect(matchesCheckInContext(checkInContextKey(checkIn), undefined)).toBe(false);
  });
});
