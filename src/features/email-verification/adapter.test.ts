import { afterEach, describe, expect, it, vi } from "vitest";
import { deliverVerificationEmail, VerificationEmailConfigurationError, VerificationEmailDeliveryError } from "./adapter";

const message = { to: "customer@example.test", name: "Taylor <script>", verificationUrl: "https://example.test/verify-email?token=secret", expiresInMinutes: 60 };

describe("verification email adapter", () => {
  afterEach(() => { vi.restoreAllMocks(); delete process.env.RESEND_API_KEY; delete process.env.AUTH_FROM_EMAIL; delete process.env.AUTH_EMAIL_CAPTURE_PATH; });

  it("requires server-side provider configuration", async () => {
    await expect(deliverVerificationEmail(message)).rejects.toBeInstanceOf(VerificationEmailConfigurationError);
  });

  it("builds plain-text and escaped branded HTML", async () => {
    process.env.RESEND_API_KEY = "test-only"; process.env.AUTH_FROM_EMAIL = "BoomoTech <verified@example.test>";
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    await deliverVerificationEmail(message);
    const body = JSON.parse(String(fetch.mock.calls[0][1]?.body)) as { text: string; html: string };
    expect(body.text).toContain(message.verificationUrl);
    expect(body.html).toContain("Taylor &lt;script&gt;");
    expect(body.html).not.toContain("Taylor <script>");
  });

  it("reports provider rejection without exposing provider content", async () => {
    process.env.RESEND_API_KEY = "test-only"; process.env.AUTH_FROM_EMAIL = "verified@example.test";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("private provider error", { status: 500 }));
    await expect(deliverVerificationEmail(message)).rejects.toBeInstanceOf(VerificationEmailDeliveryError);
  });
});
