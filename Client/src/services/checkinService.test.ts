import {
  getCheckInDateBounds,
  localDateString,
  validateCheckInDate,
} from "./checkinService";

describe("localDateString", () => {
  it("uses the athlete's local calendar date, not the UTC one", () => {
    // 01:30 local on the 15th. Anywhere east of UTC this instant is still the
    // 14th in UTC — the case that filed early-morning check-ins under the
    // previous day and let the upsert overwrite that day's row.
    expect(localDateString(new Date(2026, 7, 15, 1, 30, 0))).toBe("2026-08-15");
  });

  describe("retrospective check-in dates", () => {
    const now = new Date(2026, 9, 29, 12);

    it("allows the current day and previous six calendar days", () => {
      expect(getCheckInDateBounds(now)).toEqual({
        earliest: "2026-10-23",
        latest: "2026-10-29",
      });
      expect(() => validateCheckInDate("2026-10-23", now)).not.toThrow();
      expect(() => validateCheckInDate("2026-10-29", now)).not.toThrow();
    });

    it("rejects older, future, and invalid calendar dates", () => {
      expect(() => validateCheckInDate("2026-10-22", now)).toThrow(
        "Check-ins can only be entered for the last 7 days."
      );
      expect(() => validateCheckInDate("2026-10-30", now)).toThrow(
        "Check-ins can only be entered for the last 7 days."
      );
      expect(() => validateCheckInDate("2026-02-30", now)).toThrow(
        "Choose a valid check-in date."
      );
      expect(() => validateCheckInDate("not-a-date", now)).toThrow(
        "Choose a valid check-in date."
      );
    });
  });

  it("stays on the same local date late at night", () => {
    // The mirror case: 23:30 local is already tomorrow in UTC west of the line.
    expect(localDateString(new Date(2026, 7, 15, 23, 30, 0))).toBe("2026-08-15");
  });

  it("zero-pads single-digit months and days", () => {
    expect(localDateString(new Date(2026, 0, 5, 12, 0, 0))).toBe("2026-01-05");
  });

  it("defaults to now and returns a YYYY-MM-DD string", () => {
    expect(localDateString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
