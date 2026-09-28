import { describe, expect, it } from "vitest";
import { adminLoginSchema, loginSchema, registrationSchema } from "./schemas";

describe("account validation", () => {
  it("normalizes valid registration emails", () => {
    const result = registrationSchema.parse({ name: "Taylor Morgan", email: " TAYLOR@Example.com ", password: "SecurePassword9", confirmPassword: "SecurePassword9" });
    expect(result.email).toBe("taylor@example.com");
  });

  it("rejects weak and mismatched passwords", () => {
    expect(registrationSchema.safeParse({ name: "Taylor Morgan", email: "t@example.com", password: "short", confirmPassword: "different" }).success).toBe(false);
  });

  it("validates customer and administrator credentials", () => {
    expect(loginSchema.safeParse({ email: "bad", password: "x" }).success).toBe(false);
    expect(adminLoginSchema.safeParse({ username: "fa", password: "" }).success).toBe(false);
  });
});
