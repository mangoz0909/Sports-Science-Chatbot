/**
 * getLatestCheckIn returns the most recent row at ANY date, so every caller
 * that says "today" has to check the date first. The workout and nutrition
 * prompts labelled a weeks-old entry "Today's data", and the Sports AI status
 * chip claimed to be using "today's check-in" on the same basis.
 */
import { describe, expect, it } from "vitest";
import { isCheckInFromToday, localDateString } from "./checkinService";

describe("isCheckInFromToday", () => {
  const today = "2026-09-12";

  it("accepts a check-in filed today", () => {
    expect(isCheckInFromToday({ checkin_date: today }, today)).toBe(true);
  });

  it("rejects yesterday's check-in", () => {
    expect(isCheckInFromToday({ checkin_date: "2026-09-11" }, today)).toBe(false);
  });

  it("rejects a check-in from weeks ago", () => {
    expect(isCheckInFromToday({ checkin_date: "2026-08-20" }, today)).toBe(false);
  });

  it("rejects a missing check-in rather than throwing", () => {
    expect(isCheckInFromToday(null, today)).toBe(false);
    expect(isCheckInFromToday(undefined, today)).toBe(false);
  });

  it("rejects a row with no date on it", () => {
    expect(isCheckInFromToday({}, today)).toBe(false);
    expect(isCheckInFromToday({ checkin_date: null }, today)).toBe(false);
  });

  it("defaults to the athlete's own local date, not UTC", () => {
    // localDateString is the same function createDailyCheckIn stamps rows with,
    // so a check-in saved right now is always recognised as today's — including
    // east of UTC in the early morning, where toISOString() would say yesterday.
    expect(isCheckInFromToday({ checkin_date: localDateString() })).toBe(true);
  });
});
