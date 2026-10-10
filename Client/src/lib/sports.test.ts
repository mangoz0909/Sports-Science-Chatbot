import { describe, expect, it } from "vitest";
import { SPORT_OPTIONS, normalizeSport } from "./sports";

describe("sports list", () => {
  it("is sorted and unique", () => {
    const sorted = [...SPORT_OPTIONS].sort((a, b) => a.localeCompare(b));
    expect(SPORT_OPTIONS).toEqual(sorted);
    expect(new Set(SPORT_OPTIONS).size).toBe(SPORT_OPTIONS.length);
  });

  it("matches saved values case-insensitively", () => {
    expect(normalizeSport("  TENNIS ")).toBe("Tennis");
  });

  it("keeps unknown legacy values", () => {
    expect(normalizeSport("Kabaddi")).toBe("Kabaddi");
    expect(normalizeSport("")).toBe("");
  });
});
