import { localDateString } from "../../services/checkinService";

export const RANGE_OPTIONS = [1, 7, 30, 365] as const;
export type RangeDays = (typeof RANGE_OPTIONS)[number];
export const DEFAULT_RANGE: RangeDays = 7;
export const RANGE_NAMES: Record<RangeDays, string> = { 1: "Day", 7: "Week", 30: "Month", 365: "Year" };

/**
 * Year is plotted as calendar months, not days. A year of daily points made
 * every chart an unreadable zig-zag and the heatmap 365 tiles long, so each of
 * the last 12 months becomes one averaged point instead.
 */
export const YEAR: RangeDays = 365;
const YEAR_MONTHS = 12;

/** What the range filter says is on screen, and each option's tooltip. */
export const RANGE_SUMMARIES: Record<RangeDays, string> = {
  1: "Today",
  7: "Last 7 days",
  30: "Last 30 days",
  365: "Last 12 months, by month",
};

export type TrendPoint = {
  /** YYYY-MM-DD for a day, YYYY-MM for a month. */
  key: string;
  /** Short x-axis label: weekday up to a week, "Oct 3" for a month, "Nov '25" for a year. */
  day: string;
  /** Long label for tooltips. */
  full: string;
  readiness: number;
  recovery: number;
  load: number;
  sleep: number;
  fatigue: number;
};

type Metric = "readiness" | "recovery" | "load" | "sleep" | "fatigue";

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

// Monthly averages are flatter than single days. Averaging DEMO_PATTERN by
// month would give twelve near-identical points, so the year has its own.
const DEMO_MONTH_PATTERN = [
  { readiness: 68, recovery: 64, load: 52, sleep: 7.1, fatigue: 34 },
  { readiness: 71, recovery: 67, load: 58, sleep: 7.3, fatigue: 31 },
  { readiness: 66, recovery: 62, load: 66, sleep: 6.9, fatigue: 38 },
  { readiness: 74, recovery: 70, load: 61, sleep: 7.6, fatigue: 28 },
  { readiness: 77, recovery: 73, load: 64, sleep: 7.8, fatigue: 26 },
  { readiness: 72, recovery: 69, load: 72, sleep: 7.4, fatigue: 33 },
  { readiness: 69, recovery: 66, load: 78, sleep: 7.0, fatigue: 39 },
  { readiness: 75, recovery: 71, load: 70, sleep: 7.5, fatigue: 30 },
  { readiness: 79, recovery: 75, load: 63, sleep: 7.9, fatigue: 24 },
  { readiness: 81, recovery: 77, load: 67, sleep: 7.7, fatigue: 25 },
  { readiness: 76, recovery: 72, load: 74, sleep: 7.4, fatigue: 31 },
  { readiness: 84, recovery: 78, load: 69, sleep: 7.5, fatigue: 30 },
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

/** The last 12 calendar months, oldest first, ending with the current one. */
function lastMonths(now: Date) {
  return Array.from({ length: YEAR_MONTHS }, (_, i) => {
    const first = new Date(now.getFullYear(), now.getMonth() - (YEAR_MONTHS - 1 - i), 1);
    const key = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, "0")}`;
    return {
      key,
      // The year is on every label: twelve months ending in October start in
      // the previous November, and "Oct" alone could be either end.
      day: `${first.toLocaleDateString("en-US", { month: "short" })} '${String(first.getFullYear()).slice(-2)}`,
      full: `${first.toLocaleDateString("en-US", { month: "long", year: "numeric" })} · monthly average`,
    };
  });
}

function round(value: number, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/**
 * One point per calendar month for the last 12 months, each the average of
 * that month's check-ins. Months with no check-in are left out, the same way
 * the daily ranges only plot days that have one. Older points are dropped.
 */
export function bucketByMonth(points: TrendPoint[], now: Date = new Date()): TrendPoint[] {
  return lastMonths(now).flatMap((month) => {
    const inMonth = points.filter((point) => point.key.startsWith(`${month.key}-`));
    if (inMonth.length === 0) return [];

    const average = (metric: Metric, digits = 0) =>
      round(inMonth.reduce((sum, point) => sum + point[metric], 0) / inMonth.length, digits);

    return [{
      ...month,
      readiness: average("readiness"),
      recovery: average("recovery"),
      load: average("load"),
      sleep: average("sleep", 1),
      fatigue: average("fatigue"),
    }];
  });
}

/** What the dashboard plots for a range: a point per day, or per month for Year. */
export function buildSeries(rows: CheckInRow[], days: RangeDays, now: Date = new Date()): TrendPoint[] {
  const daily = buildTrendData(rows, days);
  return days === YEAR ? bucketByMonth(daily, now) : daily;
}

/** buildSeries for logged-out visitors. */
export function buildDemoSeries(days: RangeDays, now: Date = new Date()): TrendPoint[] {
  if (days !== YEAR) return buildDemoTrend(days, now);
  return lastMonths(now).map((month, i) => ({ ...month, ...DEMO_MONTH_PATTERN[i]! }));
}

/** How a caption names the range: "Sleep duration today", "… over the last 7 days". */
export function rangePhrase(days: number) {
  if (days === 1) return "today";
  if (days === YEAR) return "over the last 12 months";
  return `over the last ${days} days`;
}
