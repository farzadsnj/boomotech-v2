import { describe, expect, it } from "vitest";
import { adminLoginSchema, forgotPasswordSchema, loginSchema, registrationSchema, resetPasswordSchema } from "./schemas";

describe("account validation", () => {
  it("normalizes valid registration emails", () => {
    const result = registrationSchema.parse({ name: "Taylor Morgan", email: " TAYLOR@Example.com ", password: "SecurePassword9", confirmPassword: "SecurePassword9" });
    expect(result.email).toBe("taylor@example.com");
  });

  it("rejects weak and mismatched passwords", () => {
    expect(registrationSchema.safeParse({ name: "Taylor Morgan", email: "t@example.com", password: "short", confirmPassword: "different" }).success).toBe(false);
  });

  it("allows Unicode, spaces and password-manager generated values without composition rules", () => {
    expect(registrationSchema.safeParse({ name: "Taylor Morgan", email: "t@example.com", password: "a long phrase with spaces", confirmPassword: "a long phrase with spaces" }).success).toBe(true);
    expect(registrationSchema.safeParse({ name: "Taylor Morgan", email: "t@example.com", password: "🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️", confirmPassword: "🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️" }).success).toBe(true);
    expect(registrationSchema.safeParse({ name: "Taylor Morgan", email: "t@example.com", password: "lowercase-only-but-long", confirmPassword: "lowercase-only-but-long" }).success).toBe(true);
  });

  it("validates customer and administrator credentials", () => {
    expect(loginSchema.safeParse({ email: "bad", password: "x" }).success).toBe(false);
    expect(adminLoginSchema.safeParse({ username: "fa", password: "" }).success).toBe(false);
  });

  it("validates password recovery fields and matching strong passwords", () => {
    expect(forgotPasswordSchema.parse({ email: " RESET@Example.com " }).email).toBe("reset@example.com");
    expect(resetPasswordSchema.safeParse({ password: "SecurePassword9", confirmPassword: "different" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ password: "SecurePassword9", confirmPassword: "SecurePassword9" }).success).toBe(true);
  });
});
