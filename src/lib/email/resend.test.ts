import { afterEach, describe, expect, it, vi } from "vitest";
import { EmailTransportConfigurationError, EmailTransportDeliveryError, preserveEmailLineBreaks, sendEmailWithResend } from "./resend";

const message = {
  from: "BoomoTech <verified@example.test>",
  to: "customer@example.test",
  subject: "Test message",
  text: "Plain text",
  html: "<p>Plain text</p>",
};

describe("server email transport", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.RESEND_API_KEY;
  });

  it("requires a server-only Resend key", async () => {
    await expect(sendEmailWithResend(message)).rejects.toBeInstanceOf(EmailTransportConfigurationError);
  });

  it("normalizes recipients and keeps reply-to optional", async () => {
    process.env.RESEND_API_KEY = "test-only";
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    await sendEmailWithResend({ ...message, replyTo: "reply@example.test" });
    const body = JSON.parse(String(fetch.mock.calls[0][1]?.body)) as { to: string[]; reply_to?: string };
    expect(body.to).toEqual(["customer@example.test"]);
    expect(body.reply_to).toBe("reply@example.test");
  });

  it("returns a generic delivery error and safely preserves formatted text", async () => {
    process.env.RESEND_API_KEY = "test-only";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("private provider response", { status: 500 }));
    await expect(sendEmailWithResend(message)).rejects.toBeInstanceOf(EmailTransportDeliveryError);
    expect(preserveEmailLineBreaks("first <line>\nsecond")).toBe("first &lt;line&gt;<br>second");
  });
});
