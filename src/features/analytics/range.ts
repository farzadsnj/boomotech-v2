import { z } from "zod";

export const analyticsPeriods = ["7d", "30d", "90d"] as const;
export const analyticsPeriodSchema = z.enum(analyticsPeriods);
export type AnalyticsPeriod = z.infer<typeof analyticsPeriodSchema>;

export const analyticsPeriodLabels: Record<AnalyticsPeriod, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};

const BRISBANE_OFFSET_MS = 10 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function dateKey(instant: Date) {
  const local = new Date(instant.getTime() + BRISBANE_OFFSET_MS);
  return `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, "0")}-${String(local.getUTCDate()).padStart(2, "0")}`;
}

export function parseAnalyticsPeriod(value: string | undefined): AnalyticsPeriod {
  return analyticsPeriodSchema.catch("30d").parse(value);
}

export function analyticsDateRange(period: AnalyticsPeriod, now = new Date()) {
  const days = Number.parseInt(period, 10);
  const localNow = new Date(now.getTime() + BRISBANE_OFFSET_MS);
  const todayStart = Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate()) - BRISBANE_OFFSET_MS;
  const start = new Date(todayStart - (days - 1) * DAY_MS);
  const endExclusive = new Date(todayStart + DAY_MS);
  const buckets = Array.from({ length: days }, (_, index) => {
    const instant = new Date(start.getTime() + index * DAY_MS);
    return { date: dateKey(instant), instant };
  });
  return { buckets, days, endExclusive, endInclusive: new Date(endExclusive.getTime() - 1), start };
}

const rangeDateFormatter = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "Australia/Brisbane" });

export function analyticsRangeLabel(period: AnalyticsPeriod, now = new Date()) {
  const range = analyticsDateRange(period, now);
  return `${rangeDateFormatter.format(range.start)} – ${rangeDateFormatter.format(range.endInclusive)}`;
}

