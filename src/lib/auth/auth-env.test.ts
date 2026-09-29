import { describe, expect, it } from "vitest";
import { requireBetterAuthSecret } from "./auth-env";

describe("authentication environment validation", () => {
  it("rejects an absent or short secret with one actionable error", () => {
    expect(() => requireBetterAuthSecret({ BETTER_AUTH_SECRET: undefined })).toThrow(/set BETTER_AUTH_SECRET/);
    expect(() => requireBetterAuthSecret({ BETTER_AUTH_SECRET: "too-short" })).toThrow(/at least 32/);
  });

  it("accepts an explicitly configured secret", () => {
    expect(requireBetterAuthSecret({ BETTER_AUTH_SECRET: "a-private-test-value-with-32-characters" })).toBe("a-private-test-value-with-32-characters");
  });
});
