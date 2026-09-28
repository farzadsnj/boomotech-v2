import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function fillContact(page: Page) {
  await page.getByLabel(/Full name/).fill("Taylor Smith");
  await page.getByLabel(/Email address/).fill("taylor@example.com");
  await page.getByLabel(/Phone number/).fill("0400 000 000");
  await page.getByRole("button", { name: "Continue" }).click();
}

async function reachReview(page: Page) {
  await fillContact(page);
  await page.getByLabel(/Service required/).selectOption("/services/network-wifi");
  await page.getByLabel(/Problem or requested work/).fill("Our office Wi-Fi is unreliable in two work areas.");
  await page.getByLabel(/I agree/).check();
  await page.getByRole("button", { name: "Continue" }).click();
}

test("chatbot welcome, keyboard close and focus restoration work", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Hi! How can we help with your technology today?")).toBeVisible({ timeout: 4_000 });
  await page.getByRole("button", { name: "Dismiss welcome message" }).click();
  await page.reload(); await page.waitForTimeout(2_600);
  await expect(page.getByText("Hi! How can we help with your technology today?")).toHaveCount(0);
  const launcher = page.getByRole("button", { name: "Chat with BoomoTech" });
  await launcher.focus(); await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Service assistant" })).toBeFocused();
  await page.keyboard.press("Escape"); await expect(page.getByRole("dialog")).toHaveCount(0); await expect(launcher).toBeFocused();
});

test("header booking progressively opens shared form and restores its opener", async ({ page }) => {
  await page.goto("/"); const booking = page.getByRole("link", { name: "Book a Consultation" }).first();
  await booking.click(); await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("Your contact details")).toBeVisible();
  await page.getByRole("button", { name: "Close service assistant" }).click(); await expect(booking).toBeFocused();
});

test("header booking remains a functional fallback without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false }); const page = await context.newPage();
  await page.goto("/"); const booking = page.getByRole("link", { name: "Book a Consultation" }).first();
  await expect(booking).toHaveAttribute("href", "/booking"); await booking.click(); await expect(page).toHaveURL(/\/booking$/);
  await context.close();
});

test("mobile navigation supports active Blog state, route changes and Escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto("/blog");
  const menu = page.locator("summary[aria-label='Toggle navigation']"); await menu.click();
  const navigation = page.getByRole("navigation", { name: "Mobile primary" });
  await expect(navigation.getByRole("link", { name: "Blog" })).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("Escape"); await expect(navigation).not.toBeVisible(); await expect(menu).toBeFocused();
  await menu.click(); await navigation.getByRole("link", { name: "Services" }).click(); await expect(page).toHaveURL(/\/services$/);
});

test("service categories preselect an approved service", async ({ page }) => {
  await page.goto("/"); await page.getByRole("button", { name: "Chat with BoomoTech" }).click();
  await page.getByRole("button", { name: "Explore our services" }).click(); await page.getByRole("button", { name: "Improve Wi-Fi or business systems" }).click();
  await page.getByRole("article").filter({ hasText: "Network and Wi-Fi" }).getByRole("button", { name: "Request consultation" }).click();
  await fillContact(page); await expect(page.getByLabel(/Service required/)).toHaveValue("/services/network-wifi");
});

test("booking field errors are specific and focus the first invalid field", async ({ page }) => {
  await page.goto("/booking"); await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByLabel(/Full name/)).toBeFocused(); await expect(page.getByText("Enter your full name.")).toBeVisible();
  await page.getByLabel(/Full name/).fill("Taylor Smith"); await page.getByLabel(/Email address/).fill("not-email"); await page.getByLabel(/Phone number/).fill("12abc");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible(); await expect(page.getByText("Enter a valid phone number.")).toBeVisible();
  await page.getByLabel(/Email address/).fill("taylor@example.com"); await expect(page.getByText("Enter a valid email address.")).toHaveCount(0);
  await page.getByLabel(/Phone number/).fill("0400 000 000"); await expect(page.locator(".form-error[role='alert']")).toHaveCount(0); await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByLabel(/Service required/)).toBeFocused(); await expect(page.getByText("Choose a service.")).toBeVisible(); await expect(page.getByText("Please add a little more detail.")).toBeVisible(); await expect(page.getByText("Consent is required before sending.")).toBeVisible();
});

test("back navigation retains booking values", async ({ page }) => {
  await page.goto("/booking"); await fillContact(page);
  await page.getByLabel(/Service required/).selectOption("/services/it-support"); await page.getByLabel(/Problem or requested work/).fill("Several laptops and a printer need troubleshooting."); await page.getByLabel(/I agree/).check();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByLabel(/Email address/)).toHaveValue("taylor@example.com"); await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByLabel(/Service required/)).toHaveValue("/services/it-support"); await expect(page.getByLabel(/Problem or requested work/)).toHaveValue("Several laptops and a printer need troubleshooting.");
});

test("booking delivery succeeds only after the API accepts it", async ({ page }) => {
  await page.route("**/api/booking", (route) => route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' }));
  await page.goto("/booking"); await reachReview(page); await page.getByRole("button", { name: "Send booking request" }).click();
  await expect(page.getByRole("heading", { name: "Request received" })).toBeVisible(); await expect(page.getByRole("link", { name: "Return home" })).toBeVisible();
});

test("delivery failure preserves data and can be retried", async ({ page }) => {
  let calls = 0; await page.route("**/api/booking", (route) => { calls += 1; return route.fulfill({ status: calls === 1 ? 503 : 200, contentType: "application/json", body: calls === 1 ? '{"error":"We could not deliver your request."}' : '{"ok":true}' }); });
  await page.goto("/booking"); await reachReview(page); await page.getByRole("button", { name: "Send booking request" }).click();
  await expect(page.locator(".form-error[role='alert']")).toContainText("kept so you can retry"); await page.getByRole("button", { name: "Retry sending request" }).click();
  await expect(page.getByRole("heading", { name: "Request received" })).toBeVisible(); expect(calls).toBe(2);
});

test("mobile chatbot fits short menus and completes booking at compact sizes", async ({ page }) => {
  await page.route("**/api/booking", (route) => route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' }));
  for (const viewport of [{ width: 320, height: 568 }, { width: 320, height: 800 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport); await page.goto("/"); await page.getByRole("button", { name: "Chat with BoomoTech" }).click();
    const panel = page.locator(".chat-panel"); const box = await panel.boundingBox();
    expect(box).not.toBeNull(); expect(box!.height).toBeLessThan(viewport.height - 16); expect(await page.locator("body").evaluate((node) => getComputedStyle(node).overflow)).toBe("hidden");
    await page.getByRole("button", { name: "Book a consultation" }).click(); await fillContact(page);
    await page.getByLabel(/Service required/).selectOption("/services/it-support"); await page.getByLabel(/Problem or requested work/).fill("Several office computers need practical troubleshooting support."); await page.getByLabel(/I agree/).check(); await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Send booking request" }).click(); await expect(page.getByRole("heading", { name: "Request received" })).toBeVisible();
    await page.getByRole("button", { name: "Close assistant" }).click(); await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  }
});

test("skip link and desktop current-page marker are accessible", async ({ page }) => {
  await page.goto("/services"); await page.keyboard.press("Tab"); await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused(); await page.keyboard.press("Enter"); await expect(page.locator("#main-content")).toBeFocused();
  const current = page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Services" }); await expect(current).toHaveAttribute("aria-current", "page");
  expect(await current.evaluate((node) => getComputedStyle(node, "::after").transform)).not.toBe("none");
  const blog = page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Blog" });
  expect(await blog.evaluate((node) => ({ display: getComputedStyle(node).display, alignItems: getComputedStyle(node).alignItems }))).toEqual({ display: "flex", alignItems: "center" });
});

test("mobile navigation and footer branding remain aligned", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto("/blog"); await page.locator("summary[aria-label='Toggle navigation']").click();
  await expect(page.locator(".mobile-nav__link-label").filter({ hasText: "Blog" })).toHaveCSS("align-items", "center");
  const footerLogo = page.locator(".brand-logo--footer img"); expect((await footerLogo.boundingBox())!.width).toBeGreaterThan(90);
});

test("same-origin browser requests reach the booking endpoint", async ({ page }) => {
  await page.goto("/");
  const status = await page.evaluate(async () => (await fetch("/api/booking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ website: "automated-field" }) })).status);
  expect(status).toBe(200);
});

test("blog articles expose canonical, Open Graph, updated and structured metadata", async ({ page, request }) => {
  await page.goto("/blog"); const links = await page.locator('main a[href^="/blog/"]').evaluateAll((nodes) => [...new Set(nodes.map((node) => (node as HTMLAnchorElement).getAttribute("href")!))]);
  expect(links).toHaveLength(3);
  for (const href of links) {
    expect((await request.get(href)).status()).toBe(200); await page.goto(href);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${href}$`)); await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
    const data = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent() ?? "[]") as Record<string, unknown>[];
    expect(data[0]).toMatchObject({ "@type": "BlogPosting", publisher: { "@type": "Organization", name: "BoomoTech" } }); await expect(page.getByText(/Last updated/)).toBeVisible();
    for (const serviceHref of await page.locator('main a[href^="/services/"]').evaluateAll((nodes) => [...new Set(nodes.map((node) => (node as HTMLAnchorElement).getAttribute("href")!))])) expect((await request.get(serviceHref)).status()).toBe(200);
  }
});

test("representative pages and chatbot pass automated accessibility checks", async ({ page }) => {
  for (const path of ["/", "/booking", "/blog", "/blog/essential-it-support-checklist-small-business"]) { await page.goto(path); await page.waitForTimeout(900); expect((await new AxeBuilder({ page }).analyze()).violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]); }
  await page.goto("/"); await page.getByRole("button", { name: "Chat with BoomoTech" }).click(); await page.waitForTimeout(300); expect((await new AxeBuilder({ page }).include(".chat-panel").analyze()).violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
});

test("security headers are present and X-Powered-By is disabled", async ({ request }) => {
  const response = await request.get("/"); expect(response.headers()["x-powered-by"]).toBeUndefined(); expect(response.headers()["x-content-type-options"]).toBe("nosniff"); expect(response.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin"); expect(response.headers()["permissions-policy"]).toContain("camera=()"); expect(response.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
});

test("unknown routes return HTTP 404", async ({ request }) => { expect((await request.get("/does-not-exist")).status()).toBe(404); expect((await request.get("/services/not-real")).status()).toBe(404); });

test("reveals remain visible without JavaScript and reduced motion", async ({ browser }) => {
  const noJs = await browser.newContext({ javaScriptEnabled: false }); const noJsPage = await noJs.newPage(); await noJsPage.goto("/"); await expect(noJsPage.locator(".reveal").first()).toBeVisible(); await noJs.close();
  const reduced = await browser.newContext({ reducedMotion: "reduce" }); const reducedPage = await reduced.newPage(); await reducedPage.goto("/"); expect(await reducedPage.locator(".reveal").first().evaluate((node) => ({ opacity: getComputedStyle(node).opacity, transform: getComputedStyle(node).transform }))).toEqual({ opacity: "1", transform: "none" }); await reduced.close();
});

for (const viewport of [{ width: 320, height: 800 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1024, height: 768 }, { width: 1280, height: 800 }, { width: 1440, height: 900 }]) test(`has no horizontal overflow at ${viewport.width}x${viewport.height}`, async ({ page }) => {
  await page.setViewportSize(viewport);
  for (const path of ["/", "/services", "/booking", "/blog", "/blog/essential-it-support-checklist-small-business"]) { await page.goto(path); expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true); }
});

test("representative routes produce no unexpected console errors", async ({ page }) => {
  const errors: string[] = []; page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); }); page.on("pageerror", (error) => errors.push(error.message));
  for (const path of ["/", "/services/it-support", "/booking", "/blog", "/blog/practical-cybersecurity-steps-australian-small-businesses"]) await page.goto(path);
  expect(errors).toEqual([]);
});
