import { describe, expect, it } from "vitest";
import { getBetterAuthUrl, requireBetterAuthSecret } from "./auth-env";
import { getDatabaseUrl, validateProductionEnvironment } from "@/lib/config/environment";

describe("authentication environment validation", () => {
  it("rejects an absent or short secret with one actionable error", () => {
    expect(() => requireBetterAuthSecret({ BETTER_AUTH_SECRET: undefined })).toThrow(/set BETTER_AUTH_SECRET/);
    expect(() => requireBetterAuthSecret({ BETTER_AUTH_SECRET: "too-short" })).toThrow(/at least 32/);
  });

  it("accepts an explicitly configured secret", () => {
    expect(requireBetterAuthSecret({ BETTER_AUTH_SECRET: "a-private-test-value-with-32-characters" })).toBe("a-private-test-value-with-32-characters");
  });

  it("requires explicit production database and authentication origins", () => {
    expect(() => getBetterAuthUrl({ NODE_ENV: "production" })).toThrow(/BETTER_AUTH_URL/);
    expect(() => getDatabaseUrl({ NODE_ENV: "production" })).toThrow(/DATABASE_URL/);
    expect(getBetterAuthUrl({ NODE_ENV: "production", BETTER_AUTH_URL: "https://boomotech.com.au" }).origin).toBe("https://boomotech.com.au");
    expect(() => getBetterAuthUrl({ NODE_ENV: "production", SITE_URL: "https://boomotech.com.au", BETTER_AUTH_URL: "http://localhost:3000" })).toThrow(/must match/);
  });

  it("validates the approved production origin and server email configuration", () => {
    const environment = {
      NODE_ENV: "production", SITE_URL: "https://boomotech.com.au", BETTER_AUTH_URL: "https://boomotech.com.au",
      BETTER_AUTH_SECRET: "a-private-test-value-with-32-characters", DATABASE_URL: "postgresql://app:private@db.internal/boomotech",
      RESEND_API_KEY: "test-key", AUTH_FROM_EMAIL: "BoomoTech <noreply@example.test>",
      BOOKING_NOTIFICATION_EMAIL: "requests@example.test", BOOKING_FROM_EMAIL: "BoomoTech <noreply@example.test>",
    };
    expect(validateProductionEnvironment(environment)).toEqual({ authUrl: "https://boomotech.com.au", siteUrl: "https://boomotech.com.au" });
    expect(() => validateProductionEnvironment({ ...environment, BETTER_AUTH_URL: "http://localhost:3000" })).toThrow(/must (?:match the production SITE_URL origin|be https:\/\/boomotech\.com\.au)/);
    expect(() => validateProductionEnvironment({ ...environment, ADMIN_TEMP_PASSWORD: "must-be-removed" })).toThrow(/remove ADMIN_TEMP_PASSWORD/);
  });
});
