import { describe, expect, it } from "vitest";
import { passwordChangeSchema, profileUpdateSchema } from "./schemas";

describe("account settings validation", () => {
  it("normalises a valid profile name and rejects unsupported fields", () => {
    expect(profileUpdateSchema.parse({ name: "  Taylor Morgan  " })).toEqual({ name: "Taylor Morgan" });
    expect(profileUpdateSchema.safeParse({ name: "T" }).success).toBe(false);
    expect(profileUpdateSchema.safeParse({ name: "Taylor", role: "admin" }).success).toBe(false);
  });

  it("validates current, new and confirmation password fields", () => {
    expect(passwordChangeSchema.safeParse({ currentPassword: "", newPassword: "SecurePassword99", confirmPassword: "SecurePassword99" }).success).toBe(false);
    expect(passwordChangeSchema.safeParse({ currentPassword: "OldSecurePassword99", newPassword: "short", confirmPassword: "short" }).success).toBe(false);
    expect(passwordChangeSchema.safeParse({ currentPassword: "OldSecurePassword99", newPassword: "NewSecurePassword99", confirmPassword: "different-password" }).success).toBe(false);
    expect(passwordChangeSchema.safeParse({ currentPassword: "SameSecurePassword99", newPassword: "SameSecurePassword99", confirmPassword: "SameSecurePassword99" }).success).toBe(false);
    expect(passwordChangeSchema.safeParse({ currentPassword: "OldSecurePassword99", newPassword: "NewSecurePassword99", confirmPassword: "NewSecurePassword99" }).success).toBe(true);
  });
});
