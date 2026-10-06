import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetDevelopmentRateLimiter } from "@/features/booking/rate-limiter";
import { recordBookingNotification, storeBookingRequest } from "@/features/booking/repository";
import { POST } from "./route";

vi.mock("@/features/booking/repository", () => ({
  storeBookingRequest: vi.fn(),
  recordBookingNotification: vi.fn(),
}));

const storeBooking = vi.mocked(storeBookingRequest);
const recordNotification = vi.mocked(recordBookingNotification);

const payload = { fullName: "Taylor Smith", email: "taylor@example.com", phone: "+61 400 000 000", servicePath: "/services/it-support", message: "We need help with several office computers.\nPlease contact us.", consent: true, website: "" };
let client = 1;
const request = (body: unknown, options: { origin?: string; userAgent?: string; raw?: string; contentType?: string } = {}) => new Request("http://localhost/api/booking", { method: "POST", headers: { "content-type": options.contentType ?? "application/json", origin: options.origin ?? "http://localhost", "user-agent": options.userAgent ?? `booking-test-${client++}` }, body: options.raw ?? JSON.stringify(body) });

describe("booking endpoint", () => {
  beforeEach(() => {
    resetDevelopmentRateLimiter();
    storeBooking.mockReset().mockResolvedValue({ id: "00000000-0000-4000-8000-000000000001", reference: "BT-TEST123456", outboxId: "00000000-0000-4000-8000-000000000002" });
    recordNotification.mockReset().mockResolvedValue(undefined);
    delete process.env.RESEND_API_KEY; delete process.env.BOOKING_NOTIFICATION_EMAIL; delete process.env.BOOKING_FROM_EMAIL;
    delete process.env.BOOKING_RATE_LIMIT_REST_URL; delete process.env.BOOKING_RATE_LIMIT_REST_TOKEN; delete process.env.BOOKING_TRUST_PROXY;
  });
  afterEach(() => vi.restoreAllMocks());

  it("rejects requests from an unapproved origin", async () => expect((await POST(request(payload, { origin: "https://attacker.example" }))).status).toBe(403));
  it("rejects unsupported request content types", async () => expect((await POST(request(payload, { contentType: "text/plain" }))).status).toBe(415));
  it("rejects invalid server-side input", async () => expect((await POST(request({ ...payload, consent: false }))).status).toBe(400));
  it("stops reading and rejects an oversized streamed body without content-length", async () => {
    const encoder = new TextEncoder(); let index = 0; let cancelled = false;
    const chunks = [encoder.encode("x".repeat(15_000)), encoder.encode("x".repeat(6_000)), encoder.encode("unread")];
    const stream = new ReadableStream<Uint8Array>({ pull(controller) { controller.enqueue(chunks[index++]); if (index === chunks.length) controller.close(); }, cancel() { cancelled = true; } });
    const streamed = new Request("http://localhost/api/booking", { method: "POST", headers: { "content-type": "application/json", origin: "http://localhost", "user-agent": "stream-test" }, body: stream, duplex: "half" } as RequestInit & { duplex: "half" });
    expect((await POST(streamed)).status).toBe(413); expect(cancelled).toBe(true); expect(index).toBe(2);
  });
  it("accepts honeypot submissions without contacting a provider", async () => { const fetch = vi.spyOn(globalThis, "fetch"); expect((await POST(request({ ...payload, website: "spam" }))).status).toBe(200); expect(fetch).not.toHaveBeenCalled(); });
  it("rate limits repeated attempts from the same development client", async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) expect((await POST(request(payload, { userAgent: "same-client" }))).status).toBe(201);
    expect((await POST(request(payload, { userAgent: "same-client" }))).status).toBe(429);
  });
  it("stores a request even when notifications are not configured", async () => {
    const response = await POST(request(payload));
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ ok: true, reference: "BT-TEST123456" });
    expect(storeBooking).toHaveBeenCalledOnce();
    expect(recordNotification).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", "00000000-0000-4000-8000-000000000002", "failed", "configuration");
  });
  it("reports a database failure without claiming the request was saved", async () => {
    storeBooking.mockRejectedValueOnce(new Error("database unavailable"));
    expect((await POST(request(payload))).status).toBe(503);
  });
  it("reports success only after provider acceptance and escapes HTML", async () => {
    process.env.RESEND_API_KEY = "test"; process.env.BOOKING_NOTIFICATION_EMAIL = "owner@example.com"; process.env.BOOKING_FROM_EMAIL = "web@example.com";
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    expect((await POST(request({ ...payload, message: "Line one\n<script>alert(1)</script>" }))).status).toBe(201);
    const body = JSON.parse(String(fetch.mock.calls[0][1]?.body)) as { text: string; html: string };
    expect(body.text).toContain("Line one\n<script>"); expect(body.html).toContain("Line one<br>&lt;script&gt;"); expect(body.html).not.toContain("<script>");
  });
  it.each([["provider rejection", new Response("rejected", { status: 429 })], ["provider timeout", new Error("AbortError")]])("keeps the saved booking after %s", async (_label, result) => {
    process.env.RESEND_API_KEY = "test"; process.env.BOOKING_NOTIFICATION_EMAIL = "owner@example.com"; process.env.BOOKING_FROM_EMAIL = "web@example.com";
    const fetch = vi.spyOn(globalThis, "fetch");
    if (result instanceof Response) fetch.mockResolvedValue(result); else fetch.mockRejectedValue(result);
    expect((await POST(request(payload))).status).toBe(201);
    expect(recordNotification).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", "00000000-0000-4000-8000-000000000002", "failed", "delivery");
  });
});
