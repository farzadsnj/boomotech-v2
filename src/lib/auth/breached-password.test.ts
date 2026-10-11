import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { checkPasswordCompromise } from "./breached-password";
import { passwordCodePointLength } from "./password-policy";

describe("breached password protection", () => {
  it("sends only a five-character k-anonymous hash prefix", async () => {
    const candidate = "Synthetic passphrase for testing";
    const digest = createHash("sha1").update(candidate).digest("hex").toUpperCase();
    const fetcher = vi.fn<typeof fetch>(async () => new Response(`${digest.slice(5)}:42\nOTHER:0`, { status: 200 }));
    await expect(checkPasswordCompromise(candidate, fetcher)).resolves.toBe("compromised");
    const requestedUrl = String(fetcher.mock.calls[0]?.[0]);
    expect(requestedUrl).toBe(`https://api.pwnedpasswords.com/range/${digest.slice(0, 5)}`);
    expect(requestedUrl).not.toContain(candidate);
  });

  it("fails open with an explicit unavailable result and never sends the full password", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => { throw new Error("provider unavailable"); });
    await expect(checkPasswordCompromise("another synthetic phrase", fetcher)).resolves.toBe("unavailable");
  });

  it("counts Unicode code points rather than UTF-16 code units", () => {
    expect(passwordCodePointLength("😀")).toBe(1);
    expect(passwordCodePointLength("plain text")).toBe(10);
  });
});
