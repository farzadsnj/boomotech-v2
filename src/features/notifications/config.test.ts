import { describe, expect, it } from "vitest";
import {
  NotificationWorkerConfigurationError,
  validateNotificationWorkerDatabaseEnvironment,
  validateNotificationWorkerEnvironment,
} from "./config";

const validEnvironment = {
  RESEND_API_KEY: "server-only-test-key",
  BOOKING_NOTIFICATION_EMAIL: "requests@example.test",
  BOOKING_FROM_EMAIL: "BoomoTech <noreply@example.test>",
  SITE_URL: "https://boomotech.com.au",
};

describe("notification worker configuration", () => {
  it("normalizes the public site origin without returning secret values in errors", () => {
    expect(validateNotificationWorkerEnvironment({ ...validEnvironment, SITE_URL: "https://boomotech.com.au/path" })).toMatchObject({
      adminEmail: "requests@example.test",
      fromEmail: "BoomoTech <noreply@example.test>",
      siteUrl: "https://boomotech.com.au",
    });
  });

  it.each(["RESEND_API_KEY", "BOOKING_NOTIFICATION_EMAIL", "BOOKING_FROM_EMAIL", "SITE_URL"])("rejects missing %s", (name) => {
    const environment = { ...validEnvironment, [name]: "" };
    expect(() => validateNotificationWorkerEnvironment(environment)).toThrow(NotificationWorkerConfigurationError);
    expect(() => validateNotificationWorkerEnvironment(environment)).toThrow(name);
  });

  it("allows HTTP only for local preflight environments", () => {
    expect(() => validateNotificationWorkerEnvironment({ ...validEnvironment, SITE_URL: "http://boomotech.example" })).toThrow(/SITE_URL/);
    expect(validateNotificationWorkerEnvironment({ ...validEnvironment, SITE_URL: "http://127.0.0.1:3100" }).siteUrl).toBe("http://127.0.0.1:3100");
  });

  it("accepts PostgreSQL connection URLs and rejects malformed values", () => {
    expect(validateNotificationWorkerDatabaseEnvironment({ DATABASE_URL: "postgresql://user:password@127.0.0.1:5432/boomotech" })).toContain("boomotech");
    expect(() => validateNotificationWorkerDatabaseEnvironment({ DATABASE_URL: "not-a-database-url" })).toThrow(/DATABASE_URL/);
    expect(() => validateNotificationWorkerDatabaseEnvironment({ DATABASE_URL: "https://example.com/database" })).toThrow(/DATABASE_URL/);
  });
});
