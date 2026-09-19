/**
 * The "Your sport" box on /sports-list has to reach the prompt.
 *
 * It is pre-filled from the saved survey, and the prompt read the survey column
 * first — so anyone with a profile could retype the field and get matches for
 * their old sport regardless. The input looked editable and did nothing.
 */
import { describe, expect, it } from "vitest";
import { resolveSport } from "./SportsListPage";

describe("resolveSport", () => {
  it("prefers what the athlete typed over the saved survey", () => {
    // The bug: this returned "Tennis".
    expect(resolveSport("Rowing", "Tennis")).toBe("Rowing");
  });

  it("falls back to the saved sport when the box is emptied", () => {
    expect(resolveSport("", "Tennis")).toBe("Tennis");
    expect(resolveSport("   ", "Tennis")).toBe("Tennis");
  });

  it("trims what the athlete typed", () => {
    expect(resolveSport("  Rowing  ", "Tennis")).toBe("Rowing");
  });

  it("says so plainly when there is nothing to go on", () => {
    expect(resolveSport("", null)).toBe("Not provided");
    expect(resolveSport("", undefined)).toBe("Not provided");
    expect(resolveSport("", "  ")).toBe("Not provided");
  });

  it("works for a signed-out visitor typing a sport with no profile", () => {
    expect(resolveSport("Climbing", null)).toBe("Climbing");
  });
});
