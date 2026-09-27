import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetDevelopmentRateLimiter } from "@/features/booking/rate-limiter";
import { POST } from "./route";

const payload = { fullName: "Taylor Smith", email: "taylor@example.com", phone: "+61 400 000 000", servicePath: "/services/it-support", message: "We need help with several office computers.\nPlease contact us.", consent: true, website: "" };
let client = 1;
const request = (body: unknown, options: { origin?: string; userAgent?: string; raw?: string } = {}) => new Request("http://localhost/api/booking", { method: "POST", headers: { "content-type": "application/json", origin: options.origin ?? "http://localhost", "user-agent": options.userAgent ?? `booking-test-${client++}` }, body: options.raw ?? JSON.stringify(body) });

describe("booking endpoint", () => {
  beforeEach(() => {
    resetDevelopmentRateLimiter();
    delete process.env.RESEND_API_KEY; delete process.env.BOOKING_NOTIFICATION_EMAIL; delete process.env.BOOKING_FROM_EMAIL;
    delete process.env.BOOKING_RATE_LIMIT_REST_URL; delete process.env.BOOKING_RATE_LIMIT_REST_TOKEN; delete process.env.BOOKING_TRUST_PROXY;
  });
  afterEach(() => vi.restoreAllMocks());

  it("rejects requests from an unapproved origin", async () => expect((await POST(request(payload, { origin: "https://attacker.example" }))).status).toBe(403));
  it("rejects invalid server-side input", async () => expect((await POST(request({ ...payload, consent: false }))).status).toBe(400));
  it("rejects an oversized body without relying on content-length", async () => expect((await POST(request(payload, { raw: JSON.stringify({ ...payload, message: "x".repeat(21_000) }) }))).status).toBe(413));
  it("accepts honeypot submissions without contacting a provider", async () => { const fetch = vi.spyOn(globalThis, "fetch"); expect((await POST(request({ ...payload, website: "spam" }))).status).toBe(200); expect(fetch).not.toHaveBeenCalled(); });
  it("rate limits repeated attempts from the same development client", async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) expect((await POST(request(payload, { userAgent: "same-client" }))).status).toBe(503);
    expect((await POST(request(payload, { userAgent: "same-client" }))).status).toBe(429);
  });
  it("reports missing notification configuration as unavailable", async () => expect((await POST(request(payload))).status).toBe(503));
  it("reports success only after provider acceptance and escapes HTML", async () => {
    process.env.RESEND_API_KEY = "test"; process.env.BOOKING_NOTIFICATION_EMAIL = "owner@example.com"; process.env.BOOKING_FROM_EMAIL = "web@example.com";
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    expect((await POST(request({ ...payload, message: "Line one\n<script>alert(1)</script>" }))).status).toBe(200);
    const body = JSON.parse(String(fetch.mock.calls[0][1]?.body)) as { text: string; html: string };
    expect(body.text).toContain("Line one\n<script>"); expect(body.html).toContain("Line one<br>&lt;script&gt;"); expect(body.html).not.toContain("<script>");
  });
  it.each([["provider rejection", new Response("rejected", { status: 429 })], ["provider timeout", new Error("AbortError")]])("returns a delivery failure for %s", async (_label, result) => {
    process.env.RESEND_API_KEY = "test"; process.env.BOOKING_NOTIFICATION_EMAIL = "owner@example.com"; process.env.BOOKING_FROM_EMAIL = "web@example.com";
    const fetch = vi.spyOn(globalThis, "fetch");
    if (result instanceof Response) fetch.mockResolvedValue(result); else fetch.mockRejectedValue(result);
    expect((await POST(request(payload))).status).toBe(502);
  });
});
