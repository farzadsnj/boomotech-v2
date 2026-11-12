import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  record: vi.fn(),
}));

vi.mock("better-auth/next-js", () => ({ toNextJsHandler: () => ({ GET: mocks.get, POST: mocks.post }) }));
vi.mock("@/lib/auth/auth", () => ({ auth: {} }));
vi.mock("@/lib/security/events", () => ({ recordSecurityEvent: mocks.record }));

import { GET, POST } from "./route";

const request = (path: string) => new Request(`http://localhost:3000/api/auth/${path}`, {
  method: "POST",
  headers: { "content-type": "application/json", origin: "http://localhost:3000" },
  body: JSON.stringify({ email: "private@example.test", password: "never-log-this" }),
});

describe("authentication route diagnostics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("records a safe verification category without request credentials", async () => {
    mocks.post.mockResolvedValue(Response.json({ code: "EMAIL_NOT_VERIFIED" }, { status: 403 }));
    expect((await POST(request("sign-in/email"))).status).toBe(403);
    expect(mocks.record).toHaveBeenCalledWith("authentication_failed", {
      route: "/api/auth/sign-in/email",
      reason: "EMAIL_NOT_VERIFIED",
      status: 403,
    });
    expect(JSON.stringify(mocks.record.mock.calls)).not.toContain("private@example.test");
    expect(JSON.stringify(mocks.record.mock.calls)).not.toContain("never-log-this");
  });

  it("records rate limits and dependency failures as redacted operational categories", async () => {
    mocks.post.mockResolvedValueOnce(Response.json({ code: "RATE_LIMITED" }, { status: 429 }));
    expect((await POST(request("sign-in/username"))).status).toBe(429);
    expect(mocks.record).toHaveBeenLastCalledWith("rate_limit_hit", { route: "/api/auth/sign-in/username", control: "authentication" });

    mocks.post.mockResolvedValueOnce(Response.json({ error: "safe" }, { status: 503 }));
    expect((await POST(request("sign-in/email"))).status).toBe(503);
    expect(mocks.record).toHaveBeenLastCalledWith("security_dependency_unavailable", { route: "/api/auth/sign-in/email", dependency: "authentication", status: 503 });
  });

  it("does not expose a verification-token endpoint through the provider GET handler", async () => {
    const response = await GET(new Request("http://localhost:3000/api/auth/verify-email?token=private"));
    expect(response.status).toBe(404);
    expect(mocks.get).not.toHaveBeenCalled();
  });
});
