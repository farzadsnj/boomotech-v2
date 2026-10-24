import { afterEach, describe, expect, it, vi } from "vitest";
import { getChatRateLimiter } from "./rate-limiter";

describe("chat shared limiter", () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

  it("increments and expires a shared counter atomically", async () => {
    vi.stubEnv("BOOKING_RATE_LIMIT_REST_URL", "https://redis.example.test");
    vi.stubEnv("BOOKING_RATE_LIMIT_REST_TOKEN", "test-token");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ result: 1 }), { status: 200 }));
    await getChatRateLimiter().check("client-key");
    expect(fetchMock).toHaveBeenCalledOnce();
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as unknown[];
    expect(body[0]).toBe("EVAL");
    expect(String(body[1])).toContain("EXPIRE");
  });
});
