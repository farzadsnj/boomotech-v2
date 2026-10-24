import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { signInAdministrator } from "./auth-helpers";

test("protected dashboard shell is responsive, accessible and keyboard operable", async ({ page }) => {
  await signInAdministrator(page);

  await test.step("route state, account navigation, collapse and scoped theme", async () => {
    const shell = page.locator(".dashboard-shell");
    const sidebar = page.locator(".dashboard-sidebar");
    await expect(page.getByRole("heading", { name: "Operations at a glance" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Outstanding work" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recent activity", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /New: \d+\. View matching requests/ })).toHaveAttribute("href", /status=NEW/);
    await expect(page.getByRole("link", { name: /high-priority work/i })).toHaveAttribute("href", /priority=HIGH.*scope=outstanding|scope=outstanding.*priority=HIGH/);
    await page.getByLabel("Reporting period").selectOption("7d");
    await page.getByRole("button", { name: "Update" }).click();
    await expect(page).toHaveURL(/period=7d/);
    await expect(page.getByText(/activity for last 7 days/i)).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
    await expect(sidebar.getByRole("link", { name: "Request queue" })).not.toHaveAttribute("aria-current", "page");

    await sidebar.getByRole("button", { name: "Collapse dashboard navigation" }).click();
    await expect(shell).toHaveClass(/is-collapsed/);
    await expect(sidebar.getByRole("button", { name: "Expand dashboard navigation" })).toBeVisible();

    await page.getByRole("button", { name: "Use dark dashboard theme" }).click();
    await expect(shell).toHaveAttribute("data-dashboard-theme", "dark");
    await expect.poll(() => page.evaluate(() => document.cookie)).toContain("boomotech-dashboard-theme=dark");

    await page.locator(".dashboard-account-menu > summary").click();
    await expect(page.getByRole("link", { name: "Account settings" }).last()).toHaveAttribute("href", "/admin/settings");
    await expect(page.getByRole("link", { name: "MFA recovery codes" }).last()).toHaveAttribute("href", "/admin/mfa/recovery");
    await expect(page.getByRole("button", { name: "Sign out", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
  });

  await test.step("administrator account settings preserve privileged security controls", async () => {
    await page.goto("/admin/settings");
    await expect(page.getByRole("heading", { level: 1, name: "Account settings" })).toBeVisible();
    await expect(page.locator(".dashboard-sidebar").getByRole("link", { name: "Account settings" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByText("Administrator with mandatory MFA")).toBeVisible();
    await expect(page.getByText("Multi-factor authentication is required")).toBeVisible();
    await expect(page.getByRole("link", { name: "Replace MFA recovery codes" })).toHaveAttribute("href", "/admin/mfa/recovery");
    await expect(page.locator('input[name="role"], input[name="username"]')).toHaveCount(0);
    await expect(page.getByRole("button", { name: /disable mfa/i })).toHaveCount(0);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
    await page.goto("/admin");
  });

  await test.step("administrator notification centre persists read state", async () => {
    const trigger = page.getByRole("button", { name: /Notifications, \d+ unread/ });
    await expect(trigger).toBeVisible();
    await trigger.click();
    const panel = page.getByRole("region", { name: "Recent notifications" });
    await expect(panel.getByText(/New request BT-E2E0000001/)).toBeVisible();
    await expect(panel.getByRole("link", { name: /New request BT-E2E0000001/ })).toHaveAttribute("href", "/admin/requests/BT-E2E0000001");
    await panel.getByRole("button", { name: "Mark all read" }).click();
    await expect(page.getByRole("button", { name: "Notifications", exact: true })).toBeVisible();
    await panel.getByRole("link", { name: "View all notifications" }).click();
    await expect(page).toHaveURL(/\/notifications$/);
    await expect(page.getByRole("heading", { name: "Notifications", level: 1 })).toBeVisible();
    await expect(page.getByText("New request BT-E2E0000001")).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
    await page.goto("/admin");
  });

  await test.step("request queue filters, mobile cards and stale-write protection", async () => {
    await page.goto("/admin");
    const table = page.getByRole("table", { name: /administrator request results/i });
    await expect(table).toBeVisible();
    for (const heading of ["Reference", "Customer", "Service", "Description", "Submitted", "Updated", "Priority", "Status"]) await expect(table.getByRole("columnheader", { name: heading })).toBeVisible();
    await page.getByLabel("Search requests").fill("wireless coverage");
    await page.getByLabel("Priority", { exact: true }).selectOption("HIGH");
    await page.getByLabel("Sort", { exact: true }).selectOption("updated-desc");
    await page.getByRole("button", { name: "Apply filters" }).click();
    await expect(page).not.toHaveURL(/search=/);
    await expect(page).toHaveURL(/priority=HIGH/);
    await expect(page).toHaveURL(/sort=updated-desc/);
    await expect(page.getByText("BT-E2E0000001").first()).toBeVisible();
    await expect(table.getByText("BT-E2E0000002")).toHaveCount(0);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await expect(page.locator(".admin-request-table")).toBeHidden();
    await expect(page.locator(".admin-request-cards")).toBeVisible();
    const width = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    expect(width.scroll).toBeLessThanOrEqual(width.client);

    await page.getByRole("link", { name: "Respond to request" }).click();
    await expect(page).toHaveURL(/\/admin\/requests\/BT-E2E0000001/);
    await expect(page.getByRole("heading", { name: "Conversation" })).toBeVisible();
    await expect(page.getByText("Customer · original request")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Status history" })).toBeVisible();
    const first = await page.request.post("/api/admin/requests/BT-E2E0000001", { data: { action: "priority", priority: "LOW", version: 0 }, headers: { origin: "http://localhost:3100" } });
    expect(first.status()).toBe(200);
    const stale = await page.request.post("/api/admin/requests/BT-E2E0000001", { data: { action: "notes", notes: "This stale write must be rejected.", version: 0 }, headers: { origin: "http://localhost:3100" } });
    expect(stale.status()).toBe(409);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
    await page.goto("/admin");
  });

  await test.step("customer directory searches, adapts to mobile and links only account-owned requests", async () => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/admin/customers");
    await expect(page.getByRole("heading", { name: "Customer directory" })).toBeVisible();
    await expect(page.getByText("Guest booking requests remain in the request queue")).toBeVisible();
    const table = page.getByRole("table", { name: "Registered customer directory" });
    await expect(table).toBeVisible();
    await expect(table.getByRole("link", { name: /View customer/ }).first()).toHaveCSS("color", "rgb(255, 255, 255)");
    await page.getByLabel("Search customers").fill("casey-network@example.test");
    await page.getByLabel("Verification", { exact: true }).selectOption("verified");
    await page.getByLabel("Sort", { exact: true }).selectOption("requests-desc");
    await page.getByRole("button", { name: "Apply filters" }).click();
    await expect(page).not.toHaveURL(/search=/);
    await expect(table.getByText("Casey Network")).toBeVisible();
    await expect(table.getByText("Jordan Support")).toHaveCount(0);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await expect(page.locator(".customer-directory__table")).toBeHidden();
    const cards = page.locator(".customer-directory__cards");
    await expect(cards).toBeVisible();
    await cards.getByRole("link", { name: /View customer/ }).click();
    await expect(page.getByRole("heading", { name: "Account information" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Linked request history" })).toBeVisible();
    await expect(page.locator(".customer-request-history__cards").getByText("BT-E2E0000001")).toBeVisible();
    await expect(page.getByText("BT-E2E0000003")).toHaveCount(0);
    await expect(page.getByText(/credentials, sessions, MFA data and authentication tokens/i)).toBeVisible();
    const width = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    expect(width.scroll).toBeLessThanOrEqual(width.client);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
    await page.goto("/admin");
  });

  await test.step("request activity calendar is authorised, responsive and explicit about scheduling", async () => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/admin/calendar");
    await expect(page.getByRole("heading", { name: "Request activity calendar", level: 1 })).toBeVisible();
    await expect(page.locator(".dashboard-sidebar").getByRole("link", { name: "Activity calendar" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { name: "Activity records, not appointments" })).toBeVisible();
    await expect(page.getByText(/do not represent confirmed appointments/i)).toBeVisible();
    const calendar = page.getByRole("table", { name: /request activity.*not appointments/i });
    await expect(calendar).toBeVisible();
    await expect(calendar.getByRole("link", { name: /Request received, BT-E2E0000001/ })).toHaveAttribute("href", "/admin/requests/BT-E2E0000001");
    await page.getByLabel("Event type").selectOption("created");
    await page.getByRole("combobox", { name: "Service", exact: true }).selectOption("/services/network-wifi");
    await page.getByRole("button", { name: "Apply filters" }).click();
    await expect(page).toHaveURL(/event=created/);
    await expect(page).toHaveURL(/service=%2Fservices%2Fnetwork-wifi/);
    await page.getByRole("navigation", { name: "Calendar view" }).getByRole("link", { name: "List" }).click();
    await expect(page).toHaveURL(/view=list/);
    await expect(page.getByRole("heading", { name: "Chronological activity" })).toBeVisible();
    await expect(page.getByText(/oldest first/i)).toBeVisible();

    await page.setViewportSize({ width: 320, height: 800 });
    await page.getByRole("navigation", { name: "Calendar view" }).getByRole("link", { name: "Month" }).click();
    await expect(page.locator(".activity-calendar-grid")).toBeHidden();
    await expect(page.locator(".activity-calendar-mobile")).toBeVisible();
    const width = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    expect(width.scroll).toBeLessThanOrEqual(width.client);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
    await page.goto("/admin");
  });

  await test.step("analytics reports use bounded filters and export aggregate data", async () => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/admin/reports?period=7d");
    await expect(page.getByRole("heading", { name: "Analytics and reporting" })).toBeVisible();
    await expect(page.locator(".dashboard-sidebar").getByRole("link", { name: "Reports" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("navigation", { name: "Reporting period" }).getByRole("link", { name: "Last 7 days" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByText(/Australia\/Brisbane time/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Requests received over time" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Requests by service" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Status distribution" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "New versus resolved" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Registered customer growth" })).toBeVisible();
    await expect(page.locator("#analytics-tables").getByText("Daily activity")).toBeVisible();
    await expect(page.getByRole("link", { name: /^Requests resolved:/ })).toHaveAttribute("href", "/admin?period=7d&dateField=resolved&status=RESOLVED#request-list");

    const response = await page.request.get("/api/admin/reports/export?period=7d");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/csv");
    expect(response.headers()["cache-control"]).toContain("no-store");
    const csv = await response.text();
    expect(csv).toContain("BoomoTech operational summary");
    expect(csv).not.toMatch(/@example\.test|phone|internal note/i);

    await page.setViewportSize({ width: 320, height: 800 });
    await page.reload();
    const width = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    expect(width.scroll).toBeLessThanOrEqual(width.client);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
    await page.goto("/admin");
  });

  await test.step("mobile drawer closes with Escape and restores focus", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    const opener = page.getByRole("button", { name: "Open dashboard navigation" });
    await opener.click();
    const drawer = page.locator("#dashboard-mobile-drawer");
    await expect(drawer).toHaveAttribute("role", "dialog");
    await expect(drawer).toHaveAttribute("aria-label", "Dashboard menu");
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Overview" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(drawer).toHaveAttribute("aria-hidden", "true");
    await expect(opener).toBeFocused();
  });

  await test.step("common widths have no overflow or serious accessibility issues", async () => {
    for (const viewport of [{ width: 320, height: 800 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1280, height: 800 }]) {
      await page.setViewportSize(viewport);
      await page.reload();
      const measurement = await page.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, offenders: [...document.querySelectorAll<HTMLElement>("body *")].map((element) => ({ element: `${element.tagName.toLowerCase()}.${element.className}`, right: element.getBoundingClientRect().right })).filter(({ right }) => right > document.documentElement.clientWidth + 1).slice(0, 8) }));
      expect(measurement.scrollWidth, `${viewport.width}px: ${JSON.stringify(measurement.offenders)}`).toBeLessThanOrEqual(measurement.clientWidth);
    }
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
  });
});
