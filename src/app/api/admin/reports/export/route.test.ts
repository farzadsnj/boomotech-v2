import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAdminAnalytics: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock("@/lib/auth/auth", () => ({ auth: { api: { getSession: mocks.getSession } } }));
vi.mock("@/features/analytics/repository", () => ({
  AdminAnalyticsError: class AdminAnalyticsError extends Error {},
  getAdminAnalytics: mocks.getAdminAnalytics,
}));

import { GET } from "./route";

const report = {
  period: "7d" as const,
  range: { start: new Date("2026-10-11T14:00:00Z"), endExclusive: new Date("2026-10-18T14:00:00Z"), label: "12 Oct 2026 – 18 Oct 2026" },
  summary: { requestsReceived: 2, requestsResolved: 1, outstanding: 1, highPriorityOutstanding: 1, registeredCustomers: 1 },
  daily: [{ date: "2026-10-18", label: "18 Oct", received: 2, resolved: 1, customers: 1 }],
  services: [{ servicePath: "/services/it-support", label: "IT support", count: 2 }],
  statuses: [{ status: "NEW", count: 1 }, { status: "IN_PROGRESS", count: 0 }, { status: "AWAITING_USER", count: 0 }, { status: "RESOLVED", count: 1 }, { status: "WITHDRAWN", count: 0 }],
};

function request(period = "7d") {
  return new Request(`http://localhost:3000/api/admin/reports/export?period=${period}`);
}

describe("administrator report export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAdminAnalytics.mockResolvedValue(report);
  });

  it("rejects anonymous users before querying report data", async () => {
    mocks.getSession.mockResolvedValue(null);
    expect((await GET(request())).status).toBe(401);
    expect(mocks.getAdminAnalytics).not.toHaveBeenCalled();
  });

  it("rejects customers and administrators without MFA", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "customer", role: "user", twoFactorEnabled: true } });
    expect((await GET(request())).status).toBe(403);
    mocks.getSession.mockResolvedValue({ user: { id: "admin", role: "admin", twoFactorEnabled: false } });
    expect((await GET(request())).status).toBe(403);
    expect(mocks.getAdminAnalytics).not.toHaveBeenCalled();
  });

  it("rejects an unbounded or unsupported reporting period", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "admin", role: "admin", twoFactorEnabled: true } });
    expect((await GET(request("all"))).status).toBe(400);
    expect((await GET(request("365d"))).status).toBe(400);
    expect(mocks.getAdminAnalytics).not.toHaveBeenCalled();
  });

  it("exports an aggregate, non-cacheable CSV for an authorised administrator", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "admin", role: "admin", twoFactorEnabled: true } });
    const response = await GET(request());
    const body = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("content-disposition")).toMatch(/boomotech-operational-summary-7d-\d{4}-\d{2}-\d{2}\.csv/);
    expect(body).toContain("BoomoTech operational summary");
    expect(body).not.toMatch(/customer@example|phone|internal note/i);
    expect(mocks.getAdminAnalytics).toHaveBeenCalledWith({ id: "admin", role: "admin", twoFactorEnabled: true }, "7d");
  });
});
