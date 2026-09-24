import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const payload = { fullName: "Taylor Smith", email: "taylor@example.com", phone: "+61 400 000 000", servicePath: "/services/it-support", message: "We need help with several office computers.", consent: true, website: "" };
let ip = 1;
const request = (body: unknown) => new Request("http://localhost/api/booking", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": `test-${ip++}` }, body: JSON.stringify(body) });

describe("booking endpoint", () => {
  beforeEach(() => { delete process.env.RESEND_API_KEY; delete process.env.BOOKING_NOTIFICATION_EMAIL; delete process.env.BOOKING_FROM_EMAIL; });
  afterEach(() => vi.restoreAllMocks());
  it("rejects invalid server-side input", async () => expect((await POST(request({ ...payload, consent: false }))).status).toBe(400));
  it("accepts honeypot submissions without contacting a provider", async () => { const fetch = vi.spyOn(globalThis, "fetch"); expect((await POST(request({ ...payload, website: "spam" }))).status).toBe(200); expect(fetch).not.toHaveBeenCalled(); });
  it("reports missing notification configuration as unavailable", async () => expect((await POST(request(payload))).status).toBe(503));
  it("reports success only after the notification provider accepts delivery", async () => {
    process.env.RESEND_API_KEY = "test"; process.env.BOOKING_NOTIFICATION_EMAIL = "owner@example.com"; process.env.BOOKING_FROM_EMAIL = "web@example.com";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    expect((await POST(request(payload))).status).toBe(200);
  });
});
