import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getSession: vi.fn(), update: vi.fn() }));

vi.mock("@/lib/auth/auth", () => ({ auth: { api: { getSession: mocks.getSession } } }));
vi.mock("@/features/account/repository", () => ({
  AccountSettingsError: class AccountSettingsError extends Error { constructor(public code: string) { super(code); } },
  updateOwnProfile: mocks.update,
}));

import { POST } from "./route";

const customerSession = { user: { id: "customer-id", role: "user", emailVerified: true, twoFactorEnabled: false } };
const adminSession = { user: { id: "admin-id", role: "admin", emailVerified: true, twoFactorEnabled: true } };

function request(body: unknown, origin = "http://localhost:3000", contentType = "application/json") {
  return new Request("http://localhost:3000/api/account/profile", { method: "POST", headers: { "content-type": contentType, origin }, body: JSON.stringify(body) });
}

describe("account profile API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue(customerSession);
    mocks.update.mockResolvedValue({ id: "customer-id", name: "Taylor Morgan" });
  });

  it("rejects foreign origins, missing sessions and unsupported content", async () => {
    expect((await POST(request({ name: "Taylor Morgan" }, "https://attacker.example"))).status).toBe(403);
    mocks.getSession.mockResolvedValue(null);
    expect((await POST(request({ name: "Taylor Morgan" }))).status).toBe(401);
    mocks.getSession.mockResolvedValue(customerSession);
    expect((await POST(request({ name: "Taylor Morgan" }, "http://localhost:3000", "text/plain"))).status).toBe(415);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("validates the allowed name field and rejects privilege fields", async () => {
    expect((await POST(request({ name: "T" }))).status).toBe(400);
    expect((await POST(request({ name: "Taylor Morgan", role: "admin" }))).status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("derives customer and administrator actors from the protected session", async () => {
    expect((await POST(request({ name: " Taylor Morgan " }))).status).toBe(200);
    expect(mocks.update).toHaveBeenLastCalledWith(customerSession.user, "Taylor Morgan");
    mocks.getSession.mockResolvedValue(adminSession);
    mocks.update.mockResolvedValue({ id: "admin-id", name: "BoomoTech Administrator" });
    expect((await POST(request({ name: "BoomoTech Administrator" }))).status).toBe(200);
    expect(mocks.update).toHaveBeenLastCalledWith(adminSession.user, "BoomoTech Administrator");
  });

  it("returns safe authorization and not-found errors", async () => {
    const repository = await import("@/features/account/repository");
    mocks.update.mockRejectedValueOnce(new repository.AccountSettingsError("forbidden"));
    expect((await POST(request({ name: "Taylor Morgan" }))).status).toBe(403);
    mocks.update.mockRejectedValueOnce(new repository.AccountSettingsError("not-found"));
    expect((await POST(request({ name: "Taylor Morgan" }))).status).toBe(404);
  });
});
