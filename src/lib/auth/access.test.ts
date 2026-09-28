import { describe, expect, it } from "vitest";
import { canAccessAdminDashboard, canAccessCustomerDashboard } from "./access";

describe("account route authorization", () => {
  it("requires a session for the customer dashboard", () => {
    expect(canAccessCustomerDashboard(null)).toBe(false);
    expect(canAccessCustomerDashboard({ user: { id: "customer" } })).toBe(true);
  });

  it("allows only administrators into the admin dashboard", () => {
    expect(canAccessAdminDashboard(null)).toBe(false);
    expect(canAccessAdminDashboard({ user: { role: "user" } })).toBe(false);
    expect(canAccessAdminDashboard({ user: { role: "admin" } })).toBe(true);
  });
});
