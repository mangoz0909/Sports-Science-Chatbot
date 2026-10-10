import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, it, expect, vi } from "vitest";
import RangeFilter from "./RangeFilter";
import { buildDemoTrend, buildTrendData } from "./trendRange";

describe("trendRange", () => {
  it("builds one demo point per day, ending today with unique keys", () => {
    const now = new Date(2026, 9, 10);
    const data = buildDemoTrend(30, now);
    expect(data).toHaveLength(30);
    expect(new Set(data.map((d) => d.key)).size).toBe(30);
    expect(data[29]!.key).toBe("2026-10-10");
  });

  it("maps check-ins and uses date labels beyond a week", () => {
    const rows = [{ checkin_date: "2026-10-03", readiness_score: 80, fatigue: 3, training_intensity: 6, sleep_hours: 7 }];
    expect(buildTrendData(rows, 30)[0]).toMatchObject({ day: "Oct 3", readiness: 80, fatigue: 30, load: 60, sleep: 7 });
    expect(buildTrendData(rows, 7)[0]!.day).toBe("Sat");
    expect(buildTrendData([], 7)).toEqual([]);
  });
});

describe("RangeFilter", () => {
  it("selects a range and ignores deselecting the current one", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    const onChange = vi.fn();
    await act(async () => root.render(<RangeFilter value={7} onChange={onChange} />));
    const btn = (name: string) =>
      Array.from(host.querySelectorAll("button")).find((b) => b.getAttribute("aria-label") === name)!;
    await act(async () => btn("30 days").click());
    expect(onChange).toHaveBeenCalledWith(30);
    await act(async () => btn("7 days").click());
    expect(onChange).toHaveBeenCalledTimes(1);
    act(() => root.unmount());
    host.remove();
  });
});
