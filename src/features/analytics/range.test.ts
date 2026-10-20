import { describe, expect, it } from "vitest";
import { analyticsDateRange, analyticsRangeLabel, parseAnalyticsPeriod } from "./range";

describe("analytics reporting ranges", () => {
  it("accepts only bounded reporting periods and defaults safely", () => {
    expect(parseAnalyticsPeriod("7d")).toBe("7d");
    expect(parseAnalyticsPeriod("90d")).toBe("90d");
    expect(parseAnalyticsPeriod("all")).toBe("30d");
    expect(parseAnalyticsPeriod(undefined)).toBe("30d");
  });

  it("uses complete Australia/Brisbane calendar days", () => {
    const range = analyticsDateRange("7d", new Date("2026-10-18T02:30:00.000Z"));
    expect(range.start.toISOString()).toBe("2026-10-11T14:00:00.000Z");
    expect(range.endExclusive.toISOString()).toBe("2026-10-18T14:00:00.000Z");
    expect(range.buckets.map(({ date }) => date)).toEqual(["2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18"]);
    expect(analyticsRangeLabel("7d", new Date("2026-10-18T02:30:00.000Z"))).toBe("12 Oct 2026 – 18 Oct 2026");
  });
});
