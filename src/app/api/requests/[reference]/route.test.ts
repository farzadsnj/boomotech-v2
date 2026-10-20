import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  limit: vi.fn(async () => ({ allowed: true, retryAfterSeconds: 1 })),
  edit: vi.fn(async () => ({ reference: "BT-AAAAAAAAAA" })),
  reply: vi.fn(async () => ({ reference: "BT-AAAAAAAAAA" })),
  withdraw: vi.fn(async () => ({ reference: "BT-AAAAAAAAAA" })),
}));

vi.mock("@/lib/auth/auth", () => ({ auth: { api: { getSession: mocks.getSession } } }));
vi.mock("@/lib/security/origin", () => ({ hasApprovedMutationOrigin: () => true }));
vi.mock("@/features/requests/rate-limiter", () => ({ checkRequestMutationRateLimit: mocks.limit }));
vi.mock("@/features/requests/repository", () => ({
  editCustomerRequest: mocks.edit,
  addCustomerMessage: mocks.reply,
  withdrawCustomerRequest: mocks.withdraw,
  RequestWorkflowError: class RequestWorkflowError extends Error {},
}));

import { POST } from "./route";

function request(body: unknown) {
  return new Request("http://localhost:3000/api/requests/BT-AAAAAAAAAA", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost:3000" },
    body: JSON.stringify(body),
  });
}

describe("customer request API authorization", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects anonymous callers before accessing request data", async () => {
    mocks.getSession.mockResolvedValue(null);
    const response = await POST(request({ action: "withdraw" }), { params: Promise.resolve({ reference: "BT-AAAAAAAAAA" }) });
    expect(response.status).toBe(401);
    expect(mocks.edit).not.toHaveBeenCalled();
  });

  it("rejects unverified customers before accessing request data", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-a", emailVerified: false, role: "user" } });
    const response = await POST(request({ action: "withdraw" }), { params: Promise.resolve({ reference: "BT-AAAAAAAAAA" }) });
    expect(response.status).toBe(401);
    expect(mocks.withdraw).not.toHaveBeenCalled();
  });

  it("derives ownership from the verified session and ignores privileged extra fields", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-a", emailVerified: true, role: "user" } });
    const response = await POST(request({
      action: "edit",
      description: "A sufficiently detailed update for this owned request.",
      userId: "user-b",
      role: "admin",
      status: "RESOLVED",
      priority: "HIGH",
      internalNotes: "must not be accepted",
    }), { params: Promise.resolve({ reference: "BT-AAAAAAAAAA" }) });
    expect(response.status).toBe(200);
    expect(mocks.edit).toHaveBeenCalledWith("BT-AAAAAAAAAA", "user-a", "A sufficiently detailed update for this owned request.");
  });

  it("uses the verified session owner for replies and withdrawals", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-a", emailVerified: true, role: "user" } });
    const reply = await POST(request({ action: "reply", message: "Here is the requested customer update." }), { params: Promise.resolve({ reference: "BT-AAAAAAAAAA" }) });
    expect(reply.status).toBe(200);
    expect(mocks.reply).toHaveBeenCalledWith("BT-AAAAAAAAAA", "user-a", "Here is the requested customer update.");

    const withdrawal = await POST(request({ action: "withdraw" }), { params: Promise.resolve({ reference: "BT-AAAAAAAAAA" }) });
    expect(withdrawal.status).toBe(200);
    expect(mocks.withdraw).toHaveBeenCalledWith("BT-AAAAAAAAAA", "user-a");
  });
});
