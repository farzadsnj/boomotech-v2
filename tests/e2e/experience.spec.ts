import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { signInAdministrator } from "./auth-helpers";

async function fillContact(page: Page) {
  await page.getByLabel(/Full name/).fill("Taylor Smith");
  await page.getByLabel(/Email address/).fill("taylor@example.com");
  await page.getByRole("button", { name: "Continue" }).click();
}

async function fillProblem(page: Page, service = "/services/network-wifi", message = "Our office Wi-Fi is unreliable in two work areas.") {
  await page.getByLabel(/Service required/).selectOption(service);
  await page.getByLabel(/Problem or requested work/).fill(message);
  await page.getByRole("button", { name: "Continue" }).click();
}

async function reachReview(page: Page) {
  await fillProblem(page); await fillContact(page); await page.getByLabel(/I agree/).check();
}

test("chatbot stays quiet until opened, then supports keyboard close and focus restoration", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(3_000); await expect(page.getByRole("dialog")).toHaveCount(0);
  const launcher = page.getByRole("button", { name: "Chat with BoomoTech" });
  await launcher.focus(); await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Service assistant" })).toBeFocused();
  await page.keyboard.press("Escape"); await expect(page.getByRole("dialog")).toHaveCount(0); await expect(launcher).toBeFocused();
});

test("header consultation action opens the full enquiry page", async ({ page }) => {
  await page.goto("/"); const booking = page.getByRole("link", { name: "Request a consultation" }).first();
  await expect(booking).toHaveAttribute("href", "/booking"); await booking.click();
  await expect(page).toHaveURL(/\/booking$/); await expect(page.getByText("What do you need help with?", { exact: true })).toBeVisible();
});

test("service and pricing actions preserve enquiry context on the full page", async ({ page }) => {
  await page.goto("/services/network-wifi");
  await page.getByRole("link", { name: "Request a network assessment" }).first().click();
  await expect(page).toHaveURL(/\/booking\?service=%2Fservices%2Fnetwork-wifi&intent=consultation/);
  await expect(page.getByLabel(/Service required/)).toHaveValue("/services/network-wifi");
  await fillProblem(page); await fillContact(page);
  await page.goto("/pricing");
  await page.locator(".pricing-card").first().getByRole("link", { name: /quote/i }).click();
  await expect(page).toHaveURL(/intent=quote/); await expect(page.getByRole("heading", { name: "Request a tailored quote." })).toBeVisible();
});

test("global fonts, server-rendered sticky header, scroll-to-top and reduced motion behave progressively", async ({ page, browser }) => {
  await page.goto("/");
  const fonts = await page.locator("body").evaluate((node) => ({ body: getComputedStyle(node).fontFamily, heading: getComputedStyle(document.querySelector("h1")!).fontFamily }));
  expect(fonts.body).toContain("Inter"); expect(fonts.heading).toContain("Manrope");
  await expect(page.locator(".site-header")).toHaveCSS("position", "sticky");
  const visual = page.getByTestId("hero-visual"); expect(await visual.boundingBox()).not.toBeNull();
  await expect(visual).toHaveCSS("pointer-events", "none");
  await page.evaluate(() => window.scrollTo(0, 900)); await expect(page.locator(".site-header")).toHaveClass("site-header"); await expect(page.getByRole("button", { name: "Back to top" })).toBeVisible();
  await page.getByRole("button", { name: "Back to top" }).click(); await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(10);
  const reduced = await browser.newContext({ reducedMotion: "reduce" }); const reducedPage = await reduced.newPage(); await reducedPage.goto("/");
  const reducedVisual = reducedPage.getByTestId("hero-visual");
  expect(await reducedVisual.evaluate((node) => getComputedStyle(node).animationName)).toBe("none"); await reduced.close();
});

test("chat sound preference is explicit and optional audio failure cannot close the assistant", async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, "AudioContext", { configurable: true, value: class { constructor() { throw new Error("blocked"); } } }); });
  await page.goto("/"); await page.getByRole("button", { name: "Chat with BoomoTech" }).click();
  await page.getByRole("button", { name: "Turn notification sound on" }).click();
  await expect(page.getByRole("button", { name: "Turn notification sound off" })).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => localStorage.getItem("boomotech-chat-sound"))).toBe("on"); await expect(page.getByRole("dialog")).toBeVisible();
});

test("visual catalogues, support resources and founder content are complete", async ({ page, request }) => {
  await page.goto("/services"); await expect(page.locator(".service-directory__card img")).toHaveCount(11); await expect(page.locator(".service-directory__group")).toHaveCount(4);
  await page.goto("/solutions"); await expect(page.locator(".catalogue-card__visual img")).toHaveCount(5);
  await page.goto("/support"); await expect(page.getByText("What should I never share?")).toBeVisible(); await expect(page.getByText("The exact safe error message")).toBeVisible();
  await page.goto("/resources"); const resourceLinks = page.locator(".resource-feature, .resource-card"); await expect(resourceLinks).toHaveCount(10);
  for (const href of await resourceLinks.evaluateAll((nodes) => nodes.map((node) => (node as HTMLAnchorElement).getAttribute("href")!))) expect((await request.get(href)).status()).toBe(200);
  await page.goto("/about"); await expect(page.getByRole("heading", { name: "Farzad Sanjarani" })).toBeVisible(); await expect(page.getByText(/Master of Information Technology in Software Development from QUT/)).toBeVisible();
});

test("header booking remains a functional fallback without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false }); const page = await context.newPage();
  await page.goto("/"); const booking = page.getByRole("link", { name: "Request a consultation" }).first();
  await expect(booking).toHaveAttribute("href", "/booking"); await booking.click(); await expect(page).toHaveURL(/\/booking$/);
  await context.close();
});

test("mobile navigation supports active Blog state, route changes and Escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto("/blog");
  const menu = page.locator("summary[aria-label='Menu: toggle navigation']"); await menu.click();
  const navigation = page.getByRole("navigation", { name: "Mobile primary" });
  await expect(navigation.getByRole("link", { name: "Blog" })).toHaveAttribute("aria-current", "page");
  await expect(navigation.getByRole("link", { name: "Client portal" })).toHaveAttribute("href", "/login");
  const headerBottom = await page.locator(".site-header").evaluate((node) => node.getBoundingClientRect().bottom); const menuTop = await navigation.evaluate((node) => node.getBoundingClientRect().top); expect(menuTop).toBeGreaterThanOrEqual(headerBottom - 1);
  await page.keyboard.press("Escape"); await expect(navigation).not.toBeVisible(); await expect(menu).toBeFocused();
  await menu.click(); await navigation.getByRole("link", { name: "Services" }).click(); await expect(page).toHaveURL(/\/services$/);
});

test("desktop services menu and primary audience destinations are clear", async ({ page }) => {
  await page.goto("/");
  const servicesMenu = page.getByRole("button", { name: "Show services menu" }); await servicesMenu.focus(); await page.keyboard.press("Enter");
  await expect(page.getByText("What can we help with?")).toBeVisible(); await expect(page.getByRole("link", { name: "Cybersecurity" }).first()).toBeVisible();
  await expect(page.locator(".service-discovery__prompt")).toContainText("A slow computer or printer problem?", { timeout: 4_000 });
  const suggested = page.getByRole("link", { name: "Explore IT support" }); await suggested.focus(); const pausedText = await page.locator(".service-discovery__prompt").textContent(); await page.waitForTimeout(350); expect(await page.locator(".service-discovery__prompt").textContent()).toBe(pausedText);
  await page.keyboard.press("Escape"); await expect(page.getByText("What can we help with?")).toHaveCount(0); await expect(servicesMenu).toBeFocused();
  const navigation = page.getByRole("navigation", { name: "Primary" }); await expect(navigation.getByRole("link", { name: "Individuals" })).toHaveAttribute("href", "/solutions/home-office-individuals"); await expect(navigation.getByRole("link", { name: "Businesses" })).toHaveAttribute("href", "/solutions/small-business"); await expect(navigation.getByRole("link", { name: "Get help" })).toHaveAttribute("href", "/support");
});

test("orbital diagrams support focus, dismissal and reduced motion", async ({ page, browser }) => {
  await page.goto("/"); const understand = page.getByRole("button", { name: "Understand" }); await understand.focus();
  await expect(understand).toHaveAttribute("aria-expanded", "true"); await expect(page.getByRole("region", { name: "Stage details" })).toContainText("Identify the problem");
  await expect(page.locator(".orbit-diagram__track").first()).toHaveCSS("animation-play-state", "paused"); await page.keyboard.press("Escape"); await expect(understand).toHaveAttribute("aria-expanded", "false");
  await page.goto("/about");
  const aboutOrbit = page.locator(".orbit-diagram--about"); const clarify = page.getByRole("button", { name: "Clarify" });
  await aboutOrbit.hover(); await clarify.hover(); await expect(clarify).toHaveAttribute("aria-expanded", "false"); await expect(aboutOrbit.locator(".orbit-diagram__popover")).not.toHaveClass(/is-visible/); await expect(aboutOrbit.locator(".orbit-diagram__popover")).toHaveCSS("opacity", "0");
  const labelAngle = await clarify.locator("span").evaluate((label) => {
    const track = new DOMMatrix(getComputedStyle(label.closest(".orbit-diagram__track")!).transform);
    const node = new DOMMatrix(getComputedStyle(label.parentElement!).transform);
    const counter = new DOMMatrix(getComputedStyle(label).transform);
    const combined = track.multiply(node).multiply(counter);
    return Math.abs(Math.atan2(combined.b, combined.a) * 180 / Math.PI);
  });
  expect(labelAngle).toBeLessThan(2);
  await clarify.focus(); await expect(page.getByRole("region", { name: "Stage details" })).toContainText("dependencies and boundaries");
  const reduced = await browser.newContext({ reducedMotion: "reduce" }); const reducedPage = await reduced.newPage(); await reducedPage.goto("/"); await expect(reducedPage.locator(".orbit-diagram__track").first()).toHaveCSS("animation-name", "none"); await reduced.close();
});

test("pricing and learning routes are clear, linked and honest", async ({ page }) => {
  await page.goto("/pricing"); await expect(page.getByRole("heading", { name: "Pricing and quote preparation" })).toBeVisible(); await expect(page.locator(".pricing-card")).toHaveCount(7); await expect(page.getByText("Request a scoped quote")).toBeVisible(); await expect(page.locator("main")).not.toContainText(/\$\s*\d|AUD\s*\d/);
  await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Pricing & quotes" })).toHaveAttribute("aria-current", "page");
  await page.goto("/learning"); await expect(page.getByText("Courses are not open yet")).toBeVisible(); await expect(page.locator(".learning-grid article")).toHaveCount(7); await expect(page.getByRole("link", { name: "Read current articles" })).toHaveAttribute("href", "/blog");
});

test("service categories preselect an approved service", async ({ page }) => {
  await page.goto("/"); await page.getByRole("button", { name: "Chat with BoomoTech" }).click();
  await page.getByRole("button", { name: "Explore our services" }).click(); await page.getByRole("button", { name: "Improve Wi-Fi or business systems" }).click();
  await page.getByRole("article").filter({ hasText: "Network and Wi-Fi" }).getByRole("button", { name: "Request consultation" }).click();
  await expect(page.getByLabel(/Service required/)).toHaveValue("/services/network-wifi"); await fillProblem(page); await fillContact(page);
});

test("closing a partially completed assistant form requires an explicit discard", async ({ page }) => {
  await page.goto("/"); const launcher = page.getByRole("button", { name: "Chat with BoomoTech" }); await launcher.click();
  await page.getByRole("button", { name: "Book a consultation" }).click(); await page.getByLabel(/Problem or requested work/).fill("I need advice about a recurring technology problem.");
  await page.getByRole("button", { name: "Close service assistant" }).click();
  await expect(page.getByRole("heading", { name: "Discard this unfinished request?" })).toBeVisible();
  await page.getByRole("button", { name: "Keep editing" }).click(); await expect(page.getByLabel(/Problem or requested work/)).toHaveValue("I need advice about a recurring technology problem.");
  await page.getByRole("button", { name: "Close service assistant" }).click(); await page.getByRole("button", { name: "Discard request" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0); await expect(launcher).toBeFocused();
});

test("disabled AI and shop features stay out of the public journey", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Shop" })).toHaveCount(0);
  await expect(page.locator("footer").getByRole("link", { name: "Shop" })).toHaveCount(0);
  await expect(page.locator("footer")).not.toContainText(/owner approval|content pending|terms draft/i);
  await page.getByRole("button", { name: "Chat with BoomoTech" }).click();
  await expect(page.getByRole("button", { name: "Ask a service question" })).toHaveCount(0);
  await expect(page.getByRole("dialog").getByRole("button", { name: /Not sure/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Explore our services" }).click();
  await expect(page.getByRole("dialog").getByRole("button", { name: "Fix an IT problem", exact: true })).toBeVisible();
  const response = await request.post("/api/chat", { data: { message: "Help with Wi-Fi", history: [] } });
  expect(response.status()).toBe(503);
  expect(await response.json()).toMatchObject({ error: expect.stringMatching(/unavailable/i) });
});

test("contact presents the secure request as the official contact path", async ({ page }) => {
  await page.goto("/contact");
  const cta = page.getByRole("link", { name: /request|consultation|booking/i }).last();
  await expect(cta).toHaveAttribute("href", "/booking");
  await expect(page.getByText(/does not confirm an appointment/i).first()).toBeVisible();
  await expect(page.getByText(/passwords|MFA codes|recovery keys/i).first()).toBeVisible();
});

test("booking field errors are specific and focus the first invalid field", async ({ page }) => {
  await page.goto("/booking");
  await expect(page.getByRole("button", { name: "Chat with BoomoTech" })).toHaveCount(0);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByLabel(/Problem or requested work/)).toBeFocused(); await expect(page.getByText("Please add a little more detail.")).toBeVisible();
  await page.getByLabel(/Problem or requested work/).fill("I need help understanding a recurring computer problem."); await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel(/Full name/).fill("Taylor Smith"); await page.getByLabel(/Email address/).fill("not-email"); await page.getByLabel(/Preferred contact/).selectOption("phone"); await page.getByLabel(/Phone number/).fill("12abc");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible(); await expect(page.getByText("Enter a valid phone number.")).toBeVisible();
  await page.getByLabel(/Email address/).fill("taylor@example.com"); await expect(page.getByText("Enter a valid email address.")).toHaveCount(0);
  await page.getByLabel(/Phone number/).fill("0400 000 000"); await expect(page.locator(".form-error[role='alert']")).toHaveCount(0); await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Send consultation request" }).click(); await expect(page.getByLabel(/I agree/)).toBeFocused(); await expect(page.getByText("Consent is required before sending.")).toBeVisible();
});

test("back navigation retains booking values", async ({ page }) => {
  await page.goto("/booking"); await fillProblem(page, "/services/it-support", "Several laptops and a printer need troubleshooting."); await fillContact(page);
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByLabel(/Email address/)).toHaveValue("taylor@example.com"); await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByLabel(/Service required/)).toHaveValue("/services/it-support"); await expect(page.getByLabel(/Problem or requested work/)).toHaveValue("Several laptops and a printer need troubleshooting.");
});

test("booking delivery succeeds only after the API accepts it", async ({ page }) => {
  await page.route("**/api/booking", (route) => route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' }));
  await page.goto("/booking"); await reachReview(page); await page.getByRole("button", { name: "Send consultation request" }).click();
  await expect(page.getByRole("heading", { name: "Request received" })).toBeVisible(); await expect(page.getByRole("link", { name: "Return home" })).toBeVisible();
});

test("a guest request is stored and an administrator can respond without a guest account", async ({ page }) => {
  await page.goto("/booking");
  await reachReview(page);
  await page.getByRole("button", { name: "Send consultation request" }).click();
  await expect(page.getByRole("heading", { name: "Request received" })).toBeVisible();
  const referenceText = await page.getByText(/BT-[A-F0-9]{10}/).textContent();
  const reference = referenceText?.match(/BT-[A-F0-9]{10}/)?.[0];
  expect(reference).toBeTruthy();

  await signInAdministrator(page);
  await page.goto(`/admin/requests/${reference}`);
  await page.getByLabel("Response to customer").fill("Thank you. We have reviewed the request and will use the supplied details to discuss the next step.");
  await page.getByRole("button", { name: "Send response", exact: true }).click();
  await expect(page.getByText("Response sent")).toBeVisible();
  await expect(page.getByText(/guest|no account/i).first()).toBeVisible();
});

test("delivery failure preserves data and can be retried", async ({ page }) => {
  let calls = 0; await page.route("**/api/booking", (route) => { calls += 1; return route.fulfill({ status: calls === 1 ? 503 : 200, contentType: "application/json", body: calls === 1 ? '{"error":"We could not deliver your request."}' : '{"ok":true}' }); });
  await page.goto("/booking"); await reachReview(page); await page.getByRole("button", { name: "Send consultation request" }).click();
  await expect(page.locator(".form-error[role='alert']")).toContainText("kept so you can retry"); await page.getByRole("button", { name: "Retry sending request" }).click();
  await expect(page.getByRole("heading", { name: "Request received" })).toBeVisible(); expect(calls).toBe(2);
});

test("mobile chatbot fits short menus and completes booking at compact sizes", async ({ page }) => {
  await page.route("**/api/booking", (route) => route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' }));
  for (const viewport of [{ width: 320, height: 568 }, { width: 320, height: 800 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport); await page.goto("/"); await page.getByRole("button", { name: "Chat with BoomoTech" }).click();
    const panel = page.locator(".chat-panel"); const box = await panel.boundingBox();
    expect(box).not.toBeNull(); expect(box!.height).toBeLessThan(viewport.height - 16); await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
    await page.getByRole("button", { name: "Book a consultation" }).click(); await fillProblem(page, "/services/it-support", "Several office computers need practical troubleshooting support."); await fillContact(page); await page.getByLabel(/I agree/).check();
    await page.getByRole("button", { name: "Send consultation request" }).click(); await expect(page.getByRole("heading", { name: "Request received" })).toBeVisible();
    await page.getByRole("button", { name: "Close assistant" }).click(); await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  }
});

test("skip link and desktop current-page marker are accessible", async ({ page }) => {
  await page.goto("/services"); await page.keyboard.press("Tab"); await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused(); await page.keyboard.press("Enter"); await expect(page.locator("#main-content")).toBeFocused();
  const current = page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Services" }); await expect(current).toHaveAttribute("aria-current", "page");
  expect(await current.evaluate((node) => getComputedStyle(node, "::after").transform)).not.toBe("none");
  const individuals = page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Individuals" });
  await expect(individuals).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Businesses" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Client portal" })).toHaveAttribute("href", "/login");
});

test("mobile navigation and footer branding remain aligned", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto("/blog"); await page.locator("summary[aria-label='Menu: toggle navigation']").click();
  await expect(page.locator(".mobile-nav__link-label").filter({ hasText: "Blog" })).toHaveCSS("align-items", "center");
  const footerLogo = page.locator(".brand-logo--footer img"); expect((await footerLogo.boundingBox())!.width).toBeGreaterThan(90);
});

test("mobile privacy notice leaves the header and page heading unobstructed", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/booking");
  const notice = page.getByLabel("Privacy and browser storage notice");
  await expect(notice).toBeVisible();
  const noticeBox = await notice.boundingBox();
  const headingBox = await page.getByRole("heading", { level: 1 }).boundingBox();
  expect(noticeBox).not.toBeNull();
  expect(headingBox).not.toBeNull();
  expect(noticeBox!.y).toBeGreaterThan(headingBox!.y + headingBox!.height);
  expect(noticeBox!.y + noticeBox!.height).toBeLessThanOrEqual(844 - 64);
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
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${href}$`)); await expect(page.locator('meta[property="og:image"]')).toHaveCount(1); await expect(page.locator(".article-hero-image img")).toHaveAttribute("alt", /.+/);
    const data = JSON.parse(await page.locator('.article-page script[type="application/ld+json"]').textContent() ?? "[]") as Record<string, unknown>[];
    expect(data[0]).toMatchObject({ "@type": "BlogPosting", publisher: { "@type": "Organization", name: "BoomoTech" } }); await expect(page.getByText(/Last updated/)).toBeVisible();
    for (const serviceHref of await page.locator('main a[href^="/services/"]').evaluateAll((nodes) => [...new Set(nodes.map((node) => (node as HTMLAnchorElement).getAttribute("href")!))])) expect((await request.get(serviceHref)).status()).toBe(200);
  }
});

test("representative pages and chatbot pass automated accessibility checks", async ({ page }) => {
  for (const path of ["/", "/services", "/services/cybersecurity", "/solutions/home-office-individuals", "/solutions/small-business", "/tools/it-health-check", "/booking", "/pricing", "/learning", "/blog", "/blog/essential-it-support-checklist-small-business"]) { await page.goto(path); await page.waitForTimeout(900); expect((await new AxeBuilder({ page }).analyze()).violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]); }
  await page.goto("/"); await page.getByRole("button", { name: "Chat with BoomoTech" }).click(); await page.waitForTimeout(300); expect((await new AxeBuilder({ page }).include(".chat-panel").analyze()).violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
});

test("security headers are present and X-Powered-By is disabled", async ({ request }) => {
  const response = await request.get("/"); expect(response.headers()["x-powered-by"]).toBeUndefined(); expect(response.headers()["x-content-type-options"]).toBe("nosniff"); expect(response.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin"); expect(response.headers()["permissions-policy"]).toContain("camera=()"); expect(response.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  const reset = await request.get("/reset-password?token=synthetic-test-token"); expect(reset.headers()["referrer-policy"]).toBe("no-referrer"); expect(reset.headers()["cache-control"]).toContain("no-store");
});

test("unknown routes return HTTP 404 and approved legacy paths redirect", async ({ request }) => { expect((await request.get("/does-not-exist")).status()).toBe(404); expect((await request.get("/services/not-real")).status()).toBe(404); expect((await request.get("/projects/cms-software-solutions/" )).status()).toBe(404); const redirected = await request.get("/it-support-helpdesk/", { maxRedirects: 0 }); expect([301, 308]).toContain(redirected.status()); });

test("reveals remain visible without JavaScript and reduced motion", async ({ browser }) => {
  const noJs = await browser.newContext({ javaScriptEnabled: false }); const noJsPage = await noJs.newPage(); await noJsPage.goto("/"); await expect(noJsPage.locator(".reveal").first()).toBeVisible(); await noJs.close();
  const reduced = await browser.newContext({ reducedMotion: "reduce" }); const reducedPage = await reduced.newPage(); await reducedPage.goto("/"); expect(await reducedPage.locator(".reveal").first().evaluate((node) => ({ opacity: getComputedStyle(node).opacity, transform: getComputedStyle(node).transform }))).toEqual({ opacity: "1", transform: "none" }); await reduced.close();
});

for (const viewport of [{ width: 320, height: 568 }, { width: 375, height: 812 }, { width: 390, height: 844 }, { width: 430, height: 932 }, { width: 768, height: 1024 }, { width: 1024, height: 768 }, { width: 1280, height: 800 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) test(`has no horizontal overflow at ${viewport.width}x${viewport.height}`, async ({ page }) => {
  await page.setViewportSize(viewport);
  for (const path of ["/", "/services", "/solutions", "/solutions/home-office-individuals", "/solutions/small-business", "/support", "/resources", "/learning", "/pricing", "/tools/it-health-check", "/booking", "/blog", "/blog/essential-it-support-checklist-small-business", "/shop", "/about"]) {
    await page.goto(path);
    const measurement = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      offenders: [...document.querySelectorAll<HTMLElement>("body *")]
        .filter((node) => { const box = node.getBoundingClientRect(); return box.left < -0.5 || box.right > document.documentElement.clientWidth + 0.5; })
        .slice(0, 5)
        .map((node) => ({ element: `${node.tagName.toLowerCase()}.${node.className}`, box: node.getBoundingClientRect().toJSON() })),
    }));
    expect(measurement.scrollWidth, `${path}: ${JSON.stringify(measurement.offenders)}`).toBeLessThanOrEqual(measurement.clientWidth);
  }
});

test("service pathfinder and IT Health Check work without submitting personal data", async ({ page }) => {
  await page.goto("/"); const pathfinder = page.getByTestId("service-pathfinder"); await pathfinder.getByRole("button", { name: /For businesses/ }).click(); await pathfinder.getByRole("button", { name: /Improve Wi-Fi/ }).click(); await expect(pathfinder.getByRole("heading", { name: "Network and Wi-Fi" })).toBeVisible(); await expect(pathfinder.getByRole("link", { name: /Send a request/ })).toBeVisible();
  await pathfinder.getByRole("button", { name: /Not sure—help me choose/ }).click(); await expect(pathfinder.getByRole("heading", { name: /Send the problem without choosing/ })).toBeVisible();
  await page.goto("/tools/it-health-check"); for (let index = 0; index < 6; index += 1) await page.getByRole("button", { name: "Partly or not consistently" }).click();
  await expect(page.getByRole("heading", { name: "A focused review could reduce friction" })).toBeVisible(); await expect(page.getByRole("heading", { name: "Your answers" })).toBeVisible(); await expect(page.getByRole("link", { name: "Get more assistance" })).toHaveAttribute("href", "/support#request-support"); await expect(page.getByText(/not submitted, saved/i)).toBeVisible();
});

test("site search is local, ranked and fully keyboard operable", async ({ page }) => {
  await page.goto("/"); const trigger = page.getByRole("button", { name: "Search BoomoTech" }); await trigger.click();
  const dialog = page.getByRole("dialog", { name: "What can we help you find?" }); await expect(dialog).toBeVisible();
  const input = dialog.getByRole("searchbox", { name: "Search BoomoTech" }); await expect(input).toBeFocused(); await input.fill("network problems");
  await expect(dialog.getByRole("link", { name: /Network and Wi-Fi/ }).first()).toBeVisible(); await page.keyboard.press("ArrowDown"); await page.keyboard.press("ArrowUp");
  await input.fill("zyxwvutsrq"); await expect(dialog.getByRole("heading", { name: /still help you find/i })).toBeVisible(); await expect(dialog.getByRole("link", { name: "Send a request" })).toHaveAttribute("href", "/booking?service=other&intent=consultation");
  await page.keyboard.press("Escape"); await expect(dialog).not.toBeVisible(); await expect(trigger).toBeFocused();
});

test("service preparation continues to booking with an approved service context", async ({ page }) => {
  await page.goto("/services/network-wifi"); const questions = page.locator(".service-questions");
  for (const fieldset of await questions.locator("fieldset").all()) await fieldset.getByRole("radio").first().check();
  const bookingLink = questions.getByRole("link", { name: "Continue with this service" }); await expect(bookingLink).toHaveAttribute("href", /\/booking\?service=%2Fservices%2Fnetwork-wifi&intent=consultation/); await bookingLink.click();
  await expect(page).toHaveURL(/\/booking\?service=%2Fservices%2Fnetwork-wifi&intent=consultation/);
  await expect(page.getByLabel(/Service required/)).toHaveValue("/services/network-wifi"); await expect(page.getByRole("heading", { name: "Here is what you have told us" })).toBeVisible();
  await fillProblem(page); await fillContact(page);
  await page.goto("/booking?service=not-approved"); await expect(page.getByLabel(/Service required/)).toHaveValue("other");
});

test("public breadcrumbs use absolute structured-data URLs", async ({ page }) => {
  for (const path of ["/services/it-support", "/tools/it-health-check"]) {
    await page.goto(path); const raw = JSON.parse(await page.locator('main script[type="application/ld+json"]').first().textContent() ?? "{}") as { "@type"?: string; itemListElement?: { item: string }[] } | { "@type"?: string; itemListElement?: { item: string }[] }[];
    const entries = Array.isArray(raw) ? raw : [raw];
    const breadcrumbs = entries.find((entry) => entry["@type"] === "BreadcrumbList");
    expect(breadcrumbs?.itemListElement?.every(({ item }) => /^https?:\/\//.test(item))).toBe(true);
    if (path.startsWith("/services/")) expect(entries).toContainEqual(expect.objectContaining({ "@type": "Service", name: expect.any(String) }));
  }
});

test("header controls remain unified and unclipped at 1024 and 1440", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 }); await page.goto("/");
  const tabletHeader = page.locator(".site-header");
  await expect(tabletHeader.locator("summary[aria-label='Menu: toggle navigation']")).toBeVisible();
  expect(await tabletHeader.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);

  await page.setViewportSize({ width: 1440, height: 800 }); await page.goto("/");
  const desktopHeader = page.locator(".site-header");
  await expect(desktopHeader.getByRole("button", { name: "Search BoomoTech" })).toBeVisible();
  await expect(desktopHeader.getByRole("link", { name: "Client portal" })).toBeVisible();
  await expect(desktopHeader.getByRole("link", { name: "Request a consultation" })).toBeVisible();
  expect(await desktopHeader.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
});

test("homepage hero stacks without clipped copy or visual controls on mobile and tablet", async ({ page }) => {
  for (const viewport of [{ width: 320, height: 800 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1024, height: 768 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const copy = await page.locator(".hero__copy").boundingBox();
    const visual = await page.getByTestId("hero-visual").boundingBox();
    expect(copy).not.toBeNull();
    expect(visual).not.toBeNull();
    expect(copy!.width).toBeGreaterThan(Math.min(viewport.width * .72, 680));
    expect(visual!.y).toBeGreaterThanOrEqual(copy!.y + copy!.height - 1);
    for (const chip of await page.locator(".hero-visual__chip").all()) {
      const box = await chip.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
    }
  }
});

test("representative routes produce no unexpected console errors", async ({ page }) => {
  const errors: string[] = []; page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); }); page.on("pageerror", (error) => errors.push(error.message));
  for (const path of ["/", "/services/it-support", "/booking", "/blog", "/blog/practical-cybersecurity-steps-australian-small-businesses"]) await page.goto(path);
  expect(errors).toEqual([]);
});
