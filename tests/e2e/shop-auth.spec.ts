import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const screenshots = "artifacts/screenshots";

test.describe("shop catalogue", () => {
  test("keeps catalogue and account routes out of search indexing", async ({ page }) => {
    for (const route of ["/shop", "/register", "/login", "/admin/login"]) {
      await page.goto(route);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    }
  });

  test("searches and filters products with URL state", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByRole("heading", { level: 1, name: "Technology selected around how you work." })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Shop" })).toHaveAttribute("aria-current", "page");
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${screenshots}/shop-desktop.png`, fullPage: true });

    await page.getByLabel("Category").selectOption("networking-wifi");
    await page.getByLabel("Search products").fill("Wi-Fi");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page).toHaveURL(/\/shop\?q=Wi-Fi&category=networking-wifi/);
    await expect(page.getByRole("heading", { name: /products? found/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Business Wi-Fi Access Point/ })).toBeVisible();
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${screenshots}/shop-search-results.png`, fullPage: true });

    await page.getByLabel("Search products").fill("not-a-real-product");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page.getByRole("heading", { name: "No matching products" })).toBeVisible();
    await page.getByRole("link", { name: "Clear active search" }).click();
    await expect(page).toHaveURL(/\/shop$/);
  });

  test("opens every product route and product detail remains advisory", async ({ page, request }) => {
    await page.goto("/shop");
    const productLinks = await page.locator('a[href^="/shop/"]').evaluateAll((nodes) => [...new Set(nodes.map((node) => (node as HTMLAnchorElement).getAttribute("href")!))]);
    expect(productLinks.length).toBeGreaterThanOrEqual(6);
    for (const href of productLinks) expect((await request.get(href)).status()).toBe(200);
    await page.goto(productLinks[0]);
    await expect(page.getByText("This item cannot be ordered online.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Ask about equipment and setup" })).toHaveAttribute("href", "/booking");
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${screenshots}/product-detail.png`, fullPage: true });
  });

  test("shop works at mobile widths without serious accessibility issues or overflow", async ({ page }) => {
    for (const viewport of [{ width: 320, height: 800 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1280, height: 800 }]) {
      await page.setViewportSize(viewport);
      await page.goto("/shop");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      if (viewport.width === 320) { await page.waitForTimeout(900); await page.screenshot({ path: `${screenshots}/shop-mobile.png`, fullPage: true }); }
    }
    await page.waitForTimeout(900);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
  });

  test("shop search is keyboard accessible", async ({ page }) => {
    await page.goto("/shop");
    await page.getByLabel("Category").focus();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Search products")).toBeFocused();
    await page.keyboard.type("scanner");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Search", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("link", { name: /Duplex Document Scanner/ })).toBeVisible();
  });
});

test.describe("database-backed accounts", () => {
  test.describe.configure({ mode: "serial" });
  const customer = { name: "Casey Test", email: "casey@example.test", password: "CustomerPassword9" };

  test("registers a customer, protects the dashboard and invalidates the session", async ({ page }) => {
    await page.goto("/register");
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${screenshots}/registration.png`, fullPage: true });
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByLabel("Full name")).toBeFocused();
    await expect(page.getByText("Enter your full name.")).toBeVisible();
    await page.getByLabel("Full name").fill(customer.name);
    await page.getByLabel("Email address").fill(customer.email);
    await page.getByLabel(/^Password/).fill(customer.password);
    await page.getByLabel("Confirm password").fill(customer.password);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: `Welcome, ${customer.name}` })).toBeVisible();
    await expect(page.getByText(customer.email)).toBeVisible();
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${screenshots}/customer-dashboard.png`, fullPage: true });
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard|\/login\?next=\/dashboard/);
  });

  test("uses generic login errors and allows the correct customer login", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email address").fill(customer.email);
    await page.getByLabel("Password").fill("IncorrectPassword9");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.locator(".auth-form__error[role='alert']")).toHaveText("The sign-in details could not be verified.");
    await page.getByLabel("Password").fill(customer.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("blocks a customer from admin and shows a safe administrator customer list", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email address").fill(customer.email);
    await page.getByLabel("Password").fill(customer.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/dashboard\?access=denied/);
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.goto("/admin/login");
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${screenshots}/admin-login.png`, fullPage: true });
    await page.getByLabel("Administrator username").fill("farzadsnj");
    await page.getByLabel("Password").fill("SyntheticAdminPassword9");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: "Customer accounts" })).toBeVisible();
    await expect(page.getByRole("cell", { name: customer.email })).toBeVisible();
    await expect(page.locator("table")).not.toContainText("Password");
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${screenshots}/admin-user-list.png`, fullPage: true });
  });

  test("account screens have no serious accessibility violations", async ({ page }) => {
    for (const route of ["/register", "/login", "/admin/login"]) {
      await page.goto(route);
      await page.waitForTimeout(900);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
    }
  });
});
