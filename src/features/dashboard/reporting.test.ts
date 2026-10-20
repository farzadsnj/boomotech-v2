import { describe, expect, it } from "vitest";
import { parseReportingPeriod, reportingPeriodStart } from "./reporting";

describe("dashboard reporting periods", () => {
  it("accepts approved periods and safely falls back to all time", () => {
    expect(parseReportingPeriod("7d")).toBe("7d");
    expect(parseReportingPeriod("90d")).toBe("90d");
    expect(parseReportingPeriod("unexpected")).toBe("all");
    expect(parseReportingPeriod(undefined)).toBe("all");
  });

  it("creates a stable inclusive reporting cutoff", () => {
    const now = new Date("2026-10-16T12:00:00.000Z");
    expect(reportingPeriodStart("30d", now)?.toISOString()).toBe("2026-09-16T12:00:00.000Z");
    expect(reportingPeriodStart("all", now)).toBeUndefined();
  });
});
