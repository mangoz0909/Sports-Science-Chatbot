import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, it, expect, vi } from "vitest";
import RangeFilter from "./RangeFilter";
import { buildDemoSeries, buildDemoTrend, buildSeries, buildTrendData, rangePhrase } from "./trendRange";

describe("trendRange", () => {
  it("builds day and year ranges across a year boundary", () => {
    const now = new Date(2026, 0, 2);
    expect(buildDemoTrend(1, now).map((p) => p.key)).toEqual(["2026-01-02"]);
    const year = buildDemoTrend(365, now);
    expect(year).toHaveLength(365);
    expect(year[0]!.key).toBe("2025-01-03");
    expect(year[364]!.key).toBe("2026-01-02");
  });
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

describe("Year range", () => {
  const now = new Date(2026, 9, 17);

  it("averages check-ins into the last 12 calendar months, labelled with the year", () => {
    const rows = [
      // Thirteen months back: inside 365 days, outside the last 12 months.
      { checkin_date: "2025-10-20", readiness_score: 10 },
      { checkin_date: "2025-11-03", readiness_score: 60, sleep_hours: 7, training_intensity: 5, fatigue: 3 },
      { checkin_date: "2025-11-20", readiness_score: 81, sleep_hours: 8.25, training_intensity: 6, fatigue: 4 },
      { checkin_date: "2026-10-17", readiness_score: 90, sleep_hours: 8, training_intensity: 7, fatigue: 2 },
    ];
    const series = buildSeries(rows, 365, now);
    expect(series.map((p) => p.key)).toEqual(["2025-11", "2026-10"]);
    expect(series[0]).toEqual({
      key: "2025-11",
      day: "Nov '25",
      full: "November 2025 · monthly average",
      readiness: 71,
      recovery: 0,
      load: 55,
      sleep: 7.6,
      fatigue: 35,
    });
    expect(series[1]).toMatchObject({ day: "Oct '26", readiness: 90 });
  });

  it("gives logged-out visitors twelve demo months ending this month", () => {
    const demo = buildDemoSeries(365, new Date(2026, 0, 2));
    expect(demo).toHaveLength(12);
    expect(demo[0]).toMatchObject({ key: "2025-02", day: "Feb '25" });
    expect(demo[11]).toMatchObject({ key: "2026-01", day: "Jan '26" });
  });

  it("keeps one point per day for the shorter ranges", () => {
    expect(buildDemoSeries(7, now)).toHaveLength(7);
    const rows = [{ checkin_date: "2026-10-16", readiness_score: 70 }, { checkin_date: "2026-10-17", readiness_score: 80 }];
    expect(buildSeries(rows, 30, now).map((p) => p.key)).toEqual(["2026-10-16", "2026-10-17"]);
  });

  it("phrases each range for the chart captions", () => {
    expect(rangePhrase(1)).toBe("today");
    expect(rangePhrase(30)).toBe("over the last 30 days");
    expect(rangePhrase(365)).toBe("over the last 12 months");
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
    await act(async () => btn("Month").click());
    expect(onChange).toHaveBeenCalledWith(30);
    await act(async () => btn("Week").click());
    expect(onChange).toHaveBeenCalledTimes(1);
    await act(async () => btn("Day").click());
    expect(onChange).toHaveBeenLastCalledWith(1);
    await act(async () => btn("Year").click());
    expect(onChange).toHaveBeenLastCalledWith(365);
    act(() => root.unmount());
    host.remove();
  });

  it("says what the selected range shows", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    await act(async () => root.render(<RangeFilter value={365} onChange={vi.fn()} />));
    expect(host.textContent).toContain("Trend range · Last 12 months, by month");
    await act(async () => root.render(<RangeFilter value={1} onChange={vi.fn()} />));
    expect(host.textContent).toContain("Trend range · Today");
    act(() => root.unmount());
    host.remove();
  });
});
