import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  changeStatus: vi.fn(async () => ({ reference: "BT-AAAAAAAAAA", status: "RESOLVED" })),
}));

vi.mock("@/lib/auth/auth", () => ({ auth: { api: { getSession: mocks.getSession } } }));
vi.mock("@/lib/security/origin", () => ({ hasApprovedMutationOrigin: () => true }));
vi.mock("@/features/requests/repository", () => ({
  addAdminMessage: vi.fn(),
  changeRequestPriority: vi.fn(),
  changeRequestStatus: mocks.changeStatus,
  markRequestRead: vi.fn(),
  updateRequestInternalNotes: vi.fn(),
  RequestWorkflowError: class RequestWorkflowError extends Error {},
}));

import { POST } from "./route";

function request(body: unknown) {
  return new Request("http://localhost:3000/api/admin/requests/BT-AAAAAAAAAA", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost:3000" },
    body: JSON.stringify(body),
  });
}

describe("administrator request API authorization", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects anonymous and ordinary customer sessions", async () => {
    mocks.getSession.mockResolvedValue(null);
    expect((await POST(request({ action: "status", status: "RESOLVED" }), { params: Promise.resolve({ reference: "BT-AAAAAAAAAA" }) })).status).toBe(401);
    mocks.getSession.mockResolvedValue({ user: { id: "user-a", role: "user" } });
    expect((await POST(request({ action: "status", status: "RESOLVED" }), { params: Promise.resolve({ reference: "BT-AAAAAAAAAA" }) })).status).toBe(403);
    expect(mocks.changeStatus).not.toHaveBeenCalled();
  });

  it("permits an administrator and derives the actor from the session", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "admin-a", role: "admin" } });
    const response = await POST(request({ action: "status", status: "RESOLVED", actorUserId: "attacker" }), { params: Promise.resolve({ reference: "BT-AAAAAAAAAA" }) });
    expect(response.status).toBe(200);
    expect(mocks.changeStatus).toHaveBeenCalledWith("BT-AAAAAAAAAA", "admin-a", "RESOLVED");
  });
});
