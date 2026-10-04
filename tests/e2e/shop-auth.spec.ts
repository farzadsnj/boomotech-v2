import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";

const screenshots = "artifacts/screenshots";

test.describe("shop catalogue", () => {
  test("keeps catalogue and account routes out of search indexing", async ({ page }) => {
    for (const route of ["/shop", "/register", "/login", "/forgot-password", "/reset-password", "/check-email", "/email-verification-result", "/admin/login"]) {
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

  test("product rows do not overlap, controls move the row and all-products view is real", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 }); await page.goto("/shop");
    const row = page.getByTestId("product-row").nth(1); const cards = row.locator(".product-card");
    const boxes = await cards.evaluateAll((nodes) => nodes.map((node) => { const box = node.getBoundingClientRect(); return { left: box.left, right: box.right, top: box.top, bottom: box.bottom }; }));
    for (let index = 1; index < boxes.length; index += 1) expect(boxes[index].left).toBeGreaterThanOrEqual(boxes[index - 1].right - 1);
    const before = await row.evaluate((node) => node.scrollLeft); await page.getByRole("button", { name: /Next Latest product concepts/ }).click(); await expect.poll(() => row.evaluate((node) => node.scrollLeft)).toBeGreaterThan(before);
    await page.screenshot({ path: `${screenshots}/shop-product-row-scrolled.png`, fullPage: true });
    await page.getByRole("link", { name: "View all products" }).first().click(); await expect(page).toHaveURL(/view=all/); await expect(page.locator(".product-grid .product-card")).toHaveCount(12);
  });

  test("mobile product rows keep touch-sized snap tracks", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 }); await page.goto("/shop");
    const row = page.getByTestId("product-row").first();
    expect(await row.evaluate((node) => getComputedStyle(node).scrollSnapType)).toMatch(/(x|inline) mandatory/);
    const rowBox = await row.boundingBox(); const cardBox = await row.locator(".product-card").first().boundingBox();
    expect(cardBox!.width).toBeGreaterThan(250); expect(cardBox!.width).toBeLessThan(rowBox!.width);
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
  // Each Playwright worker (including retries) needs a fresh address because the
  // database intentionally persists accounts across the serial test group.
  const customer = {
    name: "Casey Test",
    email: `casey-${process.pid}-${Date.now()}@example.test`,
    password: "CustomerPassword9",
  };
  let requestReference = "";

  test("registers a customer, protects the dashboard and invalidates the session", async ({ page }) => {
    await page.goto("/verify-email?token=invalid-token");
    await expect(page).toHaveURL(/\/email-verification-result\?error=expired_or_used/);
    await expect(page.getByRole("heading", { name: "This verification link cannot be used" })).toBeVisible();
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
    await expect(page).toHaveURL(/\/check-email$/);
    const capturePath = path.resolve(process.cwd(), ".test-db", "verification-emails.jsonl");
    await expect.poll(async () => { try { return (await readFile(capturePath, "utf8")).trim().split("\n").filter(Boolean).length; } catch { return 0; } }).toBeGreaterThan(0);
    const captures = (await readFile(capturePath, "utf8")).trim().split("\n").map((line) => JSON.parse(line) as { to: string; verificationUrl: string });
    const verification = captures.findLast(({ to }) => to === customer.email);
    expect(verification).toBeTruthy();
    await page.goto(verification!.verificationUrl);
    await expect(page).toHaveURL(/\/dashboard\?verified=true$/);
    await expect(page.getByText("Your email address is verified")).toBeVisible();
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
    const submitted = await page.evaluate(async (email) => {
      const response = await fetch("/api/booking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName: "Casey Test", email, phone: "+61 400 000 000", servicePath: "/services/it-support", message: "Several office computers need support and a careful review of the shared network.", consent: true, source: "booking-page", website: "" }) });
      return { status: response.status, body: await response.json() as { reference?: string } };
    }, customer.email);
    expect(submitted.status).toBe(201);
    requestReference = submitted.body.reference!;
    await page.reload();
    await expect(page.getByText(requestReference)).toBeVisible();
    await expect(page.getByText(/Several office computers need support/)).toBeVisible();
    await page.getByRole("button", { name: "Edit request" }).click();
    const description = page.getByLabel("Request description");
    await description.fill("Several office computers and the shared network need a documented support review.");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText(/documented support review/)).toBeVisible();
    await page.getByRole("button", { name: "Sign out" }).click();
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
    await expect(page.getByRole("heading", { level: 1, name: "Operations dashboard" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Registered customers" })).toBeVisible();
    await expect(page.getByRole("cell", { name: customer.email, exact: true })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /password/i })).toHaveCount(0);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${screenshots}/admin-user-list.png`, fullPage: true });
    await page.getByRole("link", { name: "Respond" }).first().click();
    await expect(page).toHaveURL(new RegExp(`/admin/requests/${requestReference}$`));
    await page.getByRole("button", { name: "Start processing" }).click();
    await expect(page.getByLabel("Status: In progress")).toBeVisible();
    await page.getByLabel("Priority", { exact: true }).selectOption("HIGH");
    await expect(page.getByLabel("Priority: High")).toBeVisible();
    await page.getByLabel("Internal notes").fill("Customer confirmed that the affected devices share the office network.");
    await page.getByRole("button", { name: "Save internal notes" }).click();
    await expect(page.getByText("Request updated.")).toBeVisible();
    await page.getByLabel("Response to customer").fill("Please confirm whether all affected computers use the same office network.");
    await page.getByRole("button", { name: "Send response", exact: true }).click();
    await expect(page.getByLabel("Status: Waiting for you")).toBeVisible();
    await page.screenshot({ path: `${screenshots}/admin-request-detail.png`, fullPage: true });
    await page.getByRole("button", { name: "Sign out" }).click();
  });

  test("customer replies to an administrator update and cannot edit the locked description", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email address").fill(customer.email);
    await page.getByLabel("Password").fill(customer.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText(requestReference)).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit request" })).toHaveCount(0);
    await page.getByRole("button", { name: "Reply to BoomoTech" }).click();
    await page.getByLabel("Your reply").fill("Yes, the affected computers all use the same office network. <script>window.__storedXss = true</script>");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByLabel("Status: In progress")).toBeVisible();
    await expect(page.getByText(/affected computers all use/)).toBeVisible();
    await expect(page.getByText(/Customer confirmed that the affected devices/)).toHaveCount(0);
    expect(await page.evaluate(() => (window as typeof window & { __storedXss?: boolean }).__storedXss)).toBeUndefined();
    await page.screenshot({ path: `${screenshots}/customer-request-conversation.png`, fullPage: true });
  });

  test("customer and administrator request screens remain responsive and accessible", async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto("/login");
    await page.getByLabel("Email address").fill(customer.email);
    await page.getByLabel("Password").fill(customer.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    for (const viewport of [{ width: 320, height: 800 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1280, height: 800 }]) {
      await page.setViewportSize(viewport);
      await page.goto("/dashboard");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      if (viewport.width === 320) await page.screenshot({ path: `${screenshots}/customer-requests-mobile.png`, fullPage: true });
    }
    await page.waitForTimeout(900);
    const customerAxe = await new AxeBuilder({ page }).analyze();
    expect(customerAxe.violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.goto("/admin/login");
    await page.getByLabel("Administrator username").fill("farzadsnj");
    await page.getByLabel("Password").fill("SyntheticAdminPassword9");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.goto(`/admin/requests/${requestReference}`);
    for (const viewport of [{ width: 320, height: 800 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1280, height: 800 }]) {
      await page.setViewportSize(viewport);
      await page.reload();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      if (viewport.width === 390) await page.screenshot({ path: `${screenshots}/admin-request-mobile.png`, fullPage: true });
    }
    await page.waitForTimeout(900);
    const adminAxe = await new AxeBuilder({ page }).analyze();
    expect(adminAxe.violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
  });

  test("resets a customer password through the captured single-use email link", async ({ page }) => {
    const replacementPassword = "ReplacementPassword8";
    await page.goto("/forgot-password");
    await page.getByLabel("Email address").fill(customer.email);
    await page.getByRole("button", { name: "Send reset instructions" }).click();
    await expect(page.getByText(/If an account matches that address/)).toBeVisible();
    const capturePath = path.resolve(process.cwd(), ".test-db", "verification-emails.jsonl");
    await expect.poll(async () => {
      const captures = (await readFile(capturePath, "utf8")).trim().split("\n").map((line) => JSON.parse(line) as { kind?: string; to?: string });
      return captures.filter(({ kind, to }) => kind === "password-reset" && to === customer.email).length;
    }).toBeGreaterThan(0);
    const captures = (await readFile(capturePath, "utf8")).trim().split("\n").map((line) => JSON.parse(line) as { kind?: string; to?: string; resetUrl?: string });
    const reset = captures.findLast(({ kind, to }) => kind === "password-reset" && to === customer.email);
    await page.goto(reset!.resetUrl!);
    await expect(page).toHaveURL(/\/reset-password\?token=/);
    await page.getByRole("textbox", { name: /^New password/ }).fill(replacementPassword);
    await page.getByRole("textbox", { name: /^Confirm new password/ }).fill(replacementPassword);
    await page.getByRole("button", { name: "Set new password" }).click();
    await expect(page.getByText(/password has been changed/)).toBeVisible();
    await page.getByRole("link", { name: "Sign in with the new password" }).click();
    await page.getByLabel("Email address").fill(customer.email);
    await page.getByLabel("Password").fill(customer.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.locator(".auth-form__error[role='alert']")).toBeVisible();
    await page.getByLabel("Password").fill(replacementPassword);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    customer.password = replacementPassword;
  });

  test("account screens have no serious accessibility violations", async ({ page }) => {
    for (const route of ["/register", "/login", "/forgot-password", "/reset-password", "/admin/login"]) {
      await page.goto(route);
      await page.waitForTimeout(900);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
    }
  });
});
