import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  list: vi.fn(),
  markAll: vi.fn(),
  markOne: vi.fn(),
}));

vi.mock("@/lib/auth/auth", () => ({ auth: { api: { getSession: mocks.getSession } } }));
vi.mock("@/features/notifications/in-app", () => ({
  InAppNotificationError: class InAppNotificationError extends Error { constructor(public code: string) { super(code); } },
  listInAppNotifications: mocks.list,
  markAllInAppNotificationsRead: mocks.markAll,
  markInAppNotificationRead: mocks.markOne,
}));

import { GET, POST } from "./route";

const notificationId = "93f43097-0595-4d48-8a26-92267d477adb";
const adminSession = { user: { id: "admin-id", role: "admin", emailVerified: true, twoFactorEnabled: true } };
const customerSession = { user: { id: "customer-id", role: "user", emailVerified: true, twoFactorEnabled: false } };

function getRequest() { return new Request("http://localhost:3000/api/notifications?page=1&limit=6"); }
function postRequest(body: unknown, origin = "http://localhost:3000") { return new Request("http://localhost:3000/api/notifications", { method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify(body) }); }

describe("notification API authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.list.mockResolvedValue({ records: [], total: 0, unreadCount: 0, page: 1, totalPages: 1 });
    mocks.markOne.mockResolvedValue({ id: notificationId });
    mocks.markAll.mockResolvedValue({ marked: 1 });
  });

  it("requires an authorised verified session for reads", async () => {
    mocks.getSession.mockResolvedValue(null);
    expect((await GET(getRequest())).status).toBe(401);
    mocks.getSession.mockResolvedValue({ user: { id: "unverified", role: "user", emailVerified: false } });
    expect((await GET(getRequest())).status).toBe(403);
    mocks.getSession.mockResolvedValue({ user: { id: "admin", role: "admin", twoFactorEnabled: false } });
    expect((await GET(getRequest())).status).toBe(403);
    expect(mocks.list).not.toHaveBeenCalled();
  });

  it("derives customer and administrator actors from their sessions", async () => {
    mocks.getSession.mockResolvedValue(customerSession);
    expect((await GET(getRequest())).status).toBe(200);
    expect(mocks.list).toHaveBeenCalledWith({ id: "customer-id", role: "user", emailVerified: true, twoFactorEnabled: false }, 1, 6);
    mocks.getSession.mockResolvedValue(adminSession);
    expect((await GET(getRequest())).status).toBe(200);
    expect(mocks.list).toHaveBeenCalledWith({ id: "admin-id", role: "admin", emailVerified: true, twoFactorEnabled: true }, 1, 6);
  });

  it("rejects cross-origin read-state mutations", async () => {
    mocks.getSession.mockResolvedValue(adminSession);
    expect((await POST(postRequest({ action: "read", id: notificationId }, "https://attacker.example"))).status).toBe(403);
    expect(mocks.markOne).not.toHaveBeenCalled();
  });

  it("validates and applies individual and mark-all actions", async () => {
    mocks.getSession.mockResolvedValue(customerSession);
    expect((await POST(postRequest({ action: "read", id: "not-a-uuid" }))).status).toBe(400);
    expect((await POST(postRequest({ action: "read", id: notificationId }))).status).toBe(200);
    expect(mocks.markOne).toHaveBeenCalledWith(expect.objectContaining({ id: "customer-id" }), notificationId);
    expect((await POST(postRequest({ action: "read-all" }))).status).toBe(200);
    expect(mocks.markAll).toHaveBeenCalledWith(expect.objectContaining({ id: "customer-id" }));
  });
});
