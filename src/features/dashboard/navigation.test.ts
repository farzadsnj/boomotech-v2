import { describe, expect, it } from "vitest";
import { dashboardNavigation, isDashboardNavigationItemActive } from "./navigation";

describe("dashboard navigation", () => {
  it("keeps administrator and customer destinations separate", () => {
    const adminLinks = dashboardNavigation.admin.flatMap(({ items }) => items.map(({ href }) => href));
    const customerLinks = dashboardNavigation.customer.flatMap(({ items }) => items.map(({ href }) => href));
    expect(adminLinks).toContain("/admin/mfa/recovery");
    expect(adminLinks).toContain("/admin/settings");
    expect(adminLinks).toContain("/admin/reports");
    expect(adminLinks).toContain("/admin/calendar");
    expect(adminLinks).not.toContain("/dashboard/settings");
    expect(customerLinks).toContain("/dashboard/settings");
    expect(customerLinks).toEqual(expect.arrayContaining(["/dashboard#customer-requests", "/dashboard/help", "/booking"]));
    expect(customerLinks.some((href) => href.startsWith("/admin"))).toBe(false);
  });

  it("marks one overview or fragment destination active", () => {
    const items = dashboardNavigation.admin[0].items;
    expect(items.filter((item) => isDashboardNavigationItemActive("/admin", "", item)).map(({ label }) => label)).toEqual(["Overview"]);
    expect(items.filter((item) => isDashboardNavigationItemActive("/admin/customers", "", item)).map(({ label }) => label)).toEqual(["Customers"]);
    expect(items.filter((item) => isDashboardNavigationItemActive("/admin/customers/customer-id", "", item)).map(({ label }) => label)).toEqual(["Customers"]);
    expect(items.filter((item) => isDashboardNavigationItemActive("/admin/reports", "", item)).map(({ label }) => label)).toEqual(["Reports"]);
    expect(items.filter((item) => isDashboardNavigationItemActive("/admin/calendar", "", item)).map(({ label }) => label)).toEqual(["Activity calendar"]);
  });

  it("maps administrator request details back to the request queue", () => {
    const items = dashboardNavigation.admin[0].items;
    expect(items.filter((item) => isDashboardNavigationItemActive("/admin/requests/BT-123", "", item)).map(({ label }) => label)).toEqual(["Request queue"]);
  });

  it("marks role-specific settings and customer help routes active", () => {
    const adminItems = dashboardNavigation.admin.flatMap(({ items }) => items);
    const customerItems = dashboardNavigation.customer.flatMap(({ items }) => items);
    expect(adminItems.filter((item) => isDashboardNavigationItemActive("/admin/settings", "", item)).map(({ label }) => label)).toEqual(["Account settings"]);
    expect(customerItems.filter((item) => isDashboardNavigationItemActive("/dashboard/settings", "", item)).map(({ label }) => label)).toEqual(["Account settings"]);
    expect(customerItems.filter((item) => isDashboardNavigationItemActive("/dashboard/help", "", item)).map(({ label }) => label)).toEqual(["Help"]);
  });
});
