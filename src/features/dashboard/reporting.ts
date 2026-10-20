import { z } from "zod";

export const reportingPeriods = ["7d", "30d", "90d", "all"] as const;
export const reportingPeriodSchema = z.enum(reportingPeriods);
export type ReportingPeriod = z.infer<typeof reportingPeriodSchema>;

export const reportingPeriodLabels: Record<ReportingPeriod, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  all: "All time",
};

export function parseReportingPeriod(value: string | undefined): ReportingPeriod {
  return reportingPeriodSchema.catch("all").parse(value);
}

export function reportingPeriodStart(period: ReportingPeriod, now = new Date()) {
  if (period === "all") return undefined;
  const days = Number.parseInt(period, 10);
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}
