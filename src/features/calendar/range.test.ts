import { describe, expect, it } from "vitest";
import { brisbaneDateKey, calendarMonthDays, calendarMonthRange, currentBrisbaneMonth, parseCalendarMonth, shiftCalendarMonth } from "./range";

describe("request activity calendar dates", () => {
  it("uses Brisbane calendar boundaries rather than the server timezone", () => {
    const range = calendarMonthRange("2026-10");
    expect(range.start.toISOString()).toBe("2026-09-30T14:00:00.000Z");
    expect(range.endExclusive.toISOString()).toBe("2026-10-31T14:00:00.000Z");
    expect(range.label).toBe("October 2026");
    expect(brisbaneDateKey(new Date("2026-09-30T13:59:59Z"))).toBe("2026-09-30");
    expect(brisbaneDateKey(new Date("2026-09-30T14:00:00Z"))).toBe("2026-10-01");
  });

  it("derives the current Brisbane month near a UTC date boundary", () => {
    expect(currentBrisbaneMonth(new Date("2026-09-30T15:00:00Z"))).toBe("2026-10");
    expect(parseCalendarMonth("not-a-month", new Date("2026-09-30T15:00:00Z"))).toEqual({ month: "2026-10", valid: false });
    expect(parseCalendarMonth(undefined, new Date("2026-09-30T15:00:00Z"))).toEqual({ month: "2026-10", valid: true });
  });

  it("builds a stable Monday-first six-week month grid", () => {
    const days = calendarMonthDays("2026-10");
    expect(days).toHaveLength(42);
    expect(days[0]).toEqual({ date: "2026-09-28", day: 28, inMonth: false });
    expect(days[3]).toEqual({ date: "2026-10-01", day: 1, inMonth: true });
    expect(days.at(-1)).toEqual({ date: "2026-11-08", day: 8, inMonth: false });
  });

  it("moves safely across year boundaries", () => {
    expect(shiftCalendarMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftCalendarMonth("2026-01", -1)).toBe("2025-12");
  });
});
