import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { openPrivateSearch, sealPrivateSearch } from "./private-search";

describe("private administrator search state", () => {
  beforeEach(() => vi.stubEnv("BETTER_AUTH_SECRET", "private-search-test-secret-at-least-32-characters"));
  afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });

  it("round-trips a valid encrypted query", () => {
    const token = sealPrivateSearch("admin-one", "customer@example.test");
    expect(token).not.toContain("customer");
    expect(openPrivateSearch(token, "admin-one")).toBe("customer@example.test");
  });

  it("rejects the token for a different administrator", () => {
    const token = sealPrivateSearch("admin-one", "customer@example.test");
    expect(openPrivateSearch(token, "admin-two")).toBeUndefined();
  });

  it("rejects a modified authentication tag", () => {
    const token = sealPrivateSearch("admin-one", "private search");
    const packed = Buffer.from(token, "base64url");
    packed[12] ^= 0x01;
    expect(openPrivateSearch(packed.toString("base64url"), "admin-one")).toBeUndefined();
  });

  it("rejects modified ciphertext", () => {
    const token = sealPrivateSearch("admin-one", "private search");
    const packed = Buffer.from(token, "base64url");
    packed[28] ^= 0x01;
    expect(openPrivateSearch(packed.toString("base64url"), "admin-one")).toBeUndefined();
  });

  it("rejects malformed and noncanonical base64url before decryption", () => {
    const token = sealPrivateSearch("admin-one", "private search");
    expect(openPrivateSearch(`${token}=`, "admin-one")).toBeUndefined();
    expect(openPrivateSearch(` ${token}`, "admin-one")).toBeUndefined();
    expect(openPrivateSearch(noncanonicalToken("admin-one"), "admin-one")).toBeUndefined();
  });

  it("rejects an expired token and restores fake timers", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-11-07T00:00:00.000Z"));
      const token = sealPrivateSearch("admin-one", "private search");
      vi.advanceTimersByTime(15 * 60 * 1000 + 1);
      expect(openPrivateSearch(token, "admin-one")).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });
});

const base64urlAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function noncanonicalToken(userId: string) {
  for (let suffix = 0; suffix < 3; suffix += 1) {
    const token = sealPrivateSearch(userId, `private search${"x".repeat(suffix)}`);
    const packed = Buffer.from(token, "base64url");
    if (packed.length % 3 === 0) continue;
    const lastIndex = base64urlAlphabet.indexOf(token.at(-1)!);
    const replacement = base64urlAlphabet[lastIndex | 1];
    if (replacement !== token.at(-1)) return `${token.slice(0, -1)}${replacement}`;
  }
  throw new Error("Could not construct a noncanonical base64url token.");
}
