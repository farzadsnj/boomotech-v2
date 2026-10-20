import { describe, expect, it } from "vitest";
import { createOperationalSummaryCsv, escapeCsvCell } from "./csv";
import type { AdminAnalyticsData } from "./repository";

describe("analytics CSV export", () => {
  it("escapes quotes and neutralises spreadsheet formulas", () => {
    expect(escapeCsvCell('A "quoted" value')).toBe('"A ""quoted"" value"');
    expect(escapeCsvCell("=HYPERLINK(\"https://example.test\")")).toBe('"\'=HYPERLINK(""https://example.test"")"');
    expect(escapeCsvCell(" -1+2")).toBe('"\' -1+2"');
  });

  it("exports aggregate operational data without personal fields", () => {
    const data = {
      period: "7d",
      range: { start: new Date("2026-10-11T14:00:00Z"), endExclusive: new Date("2026-10-18T14:00:00Z"), label: "12 Oct 2026 – 18 Oct 2026" },
      summary: { requestsReceived: 2, requestsResolved: 1, outstanding: 1, highPriorityOutstanding: 1, registeredCustomers: 1 },
      daily: [{ date: "2026-10-18", label: "18 Oct", received: 2, resolved: 1, customers: 1 }],
      services: [{ servicePath: "/services/it-support", label: "=Unsafe label", count: 2 }],
      statuses: [{ status: "NEW", count: 1 }, { status: "IN_PROGRESS", count: 0 }, { status: "AWAITING_USER", count: 0 }, { status: "RESOLVED", count: 1 }, { status: "WITHDRAWN", count: 0 }],
    } satisfies AdminAnalyticsData;
    const csv = createOperationalSummaryCsv(data);
    expect(csv).toContain("Requests grouped by service");
    expect(csv).toContain("'=Unsafe label");
    expect(csv).not.toMatch(/email|phone|full name|internal note/i);
  });
});
