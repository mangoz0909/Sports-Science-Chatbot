import { localDateString } from "../../services/checkinService";

export const RANGE_OPTIONS = [7, 30, 90] as const;
export type RangeDays = (typeof RANGE_OPTIONS)[number];
export const DEFAULT_RANGE: RangeDays = 7;

export type TrendPoint = {
  key: string;
  /** Short x-axis label: weekday for 7 days, "Oct 3" for longer ranges. */
  day: string;
  /** Long label for tooltips. */
  full: string;
  readiness: number;
  recovery: number;
  load: number;
  sleep: number;
  fatigue: number;
};

type CheckInRow = {
  checkin_date: string;
  readiness_score?: number | null;
  recovery_score?: number | null;
  training_intensity?: number | null;
  sleep_hours?: number | null;
  fatigue?: number | null;
};

function labels(dateStr: string, days: number) {
  const d = new Date(dateStr + "T00:00:00");
  return {
    day:
      days <= 7
        ? d.toLocaleDateString("en-US", { weekday: "short" })
        : d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    full: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
  };
}

export function buildTrendData(rows: CheckInRow[], days: number): TrendPoint[] {
  return rows.map((item) => ({
    key: item.checkin_date,
    ...labels(item.checkin_date, days),
    readiness: item.readiness_score ?? 0,
    recovery: item.recovery_score ?? 0,
    load: item.training_intensity ? item.training_intensity * 10 : 0,
    sleep: item.sleep_hours ?? 0,
    fatigue: item.fatigue ? item.fatigue * 10 : 0,
  }));
}

const DEMO_PATTERN = [
  { readiness: 72, recovery: 68, load: 60, sleep: 7, fatigue: 35 },
  { readiness: 78, recovery: 74, load: 75, sleep: 7.5, fatigue: 28 },
  { readiness: 65, recovery: 60, load: 85, sleep: 6.5, fatigue: 45 },
  { readiness: 80, recovery: 76, load: 55, sleep: 8, fatigue: 22 },
  { readiness: 84, recovery: 78, load: 69, sleep: 7.5, fatigue: 30 },
  { readiness: 70, recovery: 65, load: 90, sleep: 7, fatigue: 40 },
  { readiness: 75, recovery: 72, load: 40, sleep: 8.5, fatigue: 20 },
];

/** Placeholder series for logged-out visitors, one point per day, ending today. */
export function buildDemoTrend(days: number, now: Date = new Date()): TrendPoint[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (days - 1 - i));
    const date = localDateString(d);
    return {
      key: date,
      ...labels(date, days),
      ...DEMO_PATTERN[i % DEMO_PATTERN.length]!,
    };
  });
}

export function rangeLabel(days: number) {
  return `last ${days} days`;
}
