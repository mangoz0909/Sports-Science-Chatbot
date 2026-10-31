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
const earlier = { ...checkIn, checkin_date: "2026-10-27", fatigue: 5 };
const history = [earlier, checkIn];

describe("check-in plan context", () => {
  it("recognizes an unchanged check-in and an unchanged absence", () => {
    expect(matchesCheckInContext(checkInContextKey(checkIn, history), checkIn, history)).toBe(true);
    expect(matchesCheckInContext(checkInContextKey(null), null, [])).toBe(true);
  });

  it("detects an updated check-in or unknown saved context", () => {
    expect(
      matchesCheckInContext(checkInContextKey(checkIn, history), { ...checkIn, fatigue: 8 }, history)
    ).toBe(false);
    expect(matchesCheckInContext(undefined, checkIn, history)).toBe(false);
    expect(matchesCheckInContext(checkInContextKey(checkIn, history), undefined, history)).toBe(false);
    expect(matchesCheckInContext(checkInContextKey(checkIn, history), checkIn, undefined)).toBe(false);
  });

  it("detects a back-filled or edited earlier day", () => {
    const key = checkInContextKey(checkIn, history);
    const backfilled = [earlier, { ...checkIn, checkin_date: "2026-10-28" }, checkIn];
    expect(matchesCheckInContext(key, checkIn, backfilled)).toBe(false);
    expect(matchesCheckInContext(key, checkIn, [{ ...earlier, sleep_hours: 5 }, checkIn])).toBe(false);
  });
});
