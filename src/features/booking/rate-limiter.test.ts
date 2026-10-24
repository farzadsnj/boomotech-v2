import { afterEach, describe, expect, it, vi } from "vitest";
import { getBookingClientKey, getBookingRateLimiter, RateLimitConfigurationError } from "./rate-limiter";

describe("booking client identity and shared limiter", () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

  it("fails closed in production when the trusted proxy address is missing or malformed", () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("BOOKING_TRUST_PROXY", "true");
    expect(() => getBookingClientKey(new Request("https://boomotech.com.au/api/booking"))).toThrow(RateLimitConfigurationError);
    expect(() => getBookingClientKey(new Request("https://boomotech.com.au/api/booking", { headers: { "x-forwarded-for": "spoofed-value" } }))).toThrow(RateLimitConfigurationError);
  });

  it("normalises a valid IPv6 address supplied by the trusted proxy", () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("BOOKING_TRUST_PROXY", "true");
    const lower = getBookingClientKey(new Request("https://boomotech.com.au/api/booking", { headers: { "x-forwarded-for": "2001:db8::1" } }));
    const upper = getBookingClientKey(new Request("https://boomotech.com.au/api/booking", { headers: { "x-forwarded-for": "2001:DB8::1" } }));
    expect(lower).toBe(upper);
  });

  it("sets the Redis counter expiry in the same atomic command", async () => {
    vi.stubEnv("BOOKING_RATE_LIMIT_REST_URL", "https://redis.example.test");
    vi.stubEnv("BOOKING_RATE_LIMIT_REST_TOKEN", "test-token");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ result: 1 }), { status: 200 }));
    await getBookingRateLimiter().check("client-key");
    expect(fetchMock).toHaveBeenCalledOnce();
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as unknown[];
    expect(body[0]).toBe("EVAL");
    expect(String(body[1])).toContain("EXPIRE");
  });
});
