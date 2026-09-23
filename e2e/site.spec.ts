import { expect, test, type Page } from "@playwright/test";

function failOnConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return () => expect(errors, "unexpected browser console errors").toEqual([]);
}

test.describe("production routes", () => {
  for (const route of [
    { path: "/", heading: "Practical technology support and smarter systems for your business." },
    { path: "/services", heading: "Start with the outcome you need" },
    { path: "/services/it-support", heading: "IT support that starts with the problem" },
    { path: "/about", heading: "Practical help now. Better systems next." },
  ]) {
    test(`${route.path} renders without browser errors`, async ({ page }) => {
      const assertNoConsoleErrors = failOnConsoleErrors(page);
      const response = await page.goto(route.path);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();
      assertNoConsoleErrors();
    });
  }

  for (const path of ["/does-not-exist", "/services/not-real"]) {
    test(`${path} returns a real HTTP 404`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
      await expect(page.getByRole("heading", { level: 1, name: "That page is not here." })).toBeVisible();
    });
  }
});

test.describe("navigation and keyboard access", () => {
  test("desktop navigation exposes the current section and changes route", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/services/it-support");
    const primary = page.getByRole("navigation", { name: "Primary" });
    await expect(primary.getByRole("link", { name: "Services" })).toHaveAttribute("aria-current", "page");
    await primary.getByRole("link", { name: "Solutions" }).click();
    await expect(page).toHaveURL(/\/solutions$/);
    await expect(primary.getByRole("link", { name: "Solutions" })).toHaveAttribute("aria-current", "page");
  });

  test("mobile menu closes with Escape, outside interaction and navigation", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/services");
    const toggle = page.locator('summary[aria-label="Toggle navigation"]');
    const menu = page.locator("details.mobile-nav");

    await toggle.click();
    await expect(menu).toHaveAttribute("open", "");
    await page.keyboard.press("Escape");
    await expect(menu).not.toHaveAttribute("open", "");
    await expect(toggle).toBeFocused();

    await toggle.click();
    await page.locator("main").dispatchEvent("pointerdown");
    await expect(menu).not.toHaveAttribute("open", "");

    await toggle.click();
    const mobileNav = page.getByRole("navigation", { name: "Mobile primary" });
    await expect(mobileNav.getByRole("link", { name: "Services" })).toHaveAttribute("aria-current", "page");
    await mobileNav.getByRole("link", { name: "About" }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(menu).not.toHaveAttribute("open", "");
  });

  test("skip link is keyboard visible and moves focus to main content", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("Enter");
    await expect(page.locator("main#main-content")).toBeFocused();
  });
});

test.describe("metadata and production controls", () => {
  test("default deployment blocks indexing and omits a sitemap reference", async ({ page, request }) => {
    await page.goto("/");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /nofollow/);

    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toContain("Disallow: /");
    expect(await robots.text()).not.toContain("Sitemap:");

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).not.toContain("<url>");
  });

  test("draft pages remain noindex", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.getByText("Owner and legal review required")).toBeVisible();
  });

  test("security headers are conservative and framework branding is disabled", async ({ request }) => {
    const response = await request.get("/");
    const headers = response.headers();
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("payment=()");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-powered-by"]).toBeUndefined();
    expect(headers["strict-transport-security"]).toBeUndefined();
  });
});

test.describe("motion and responsive resilience", () => {
  test("reduced motion keeps revealed content visible", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const reveal = page.locator("[data-reveal]").first();
    await expect(reveal).toBeVisible();
    const styles = await reveal.evaluate((element) => {
      const computed = getComputedStyle(element);
      return { opacity: computed.opacity, transform: computed.transform, transitionDuration: computed.transitionDuration };
    });
    expect(styles.opacity).toBe("1");
    expect(styles.transform).toBe("none");
    expect(styles.transitionDuration).toMatch(/^(0s|0\.00001s)$/);
  });

  test("content remains visible when JavaScript is unavailable", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");
    const reveal = page.locator("[data-reveal]").first();
    await expect(reveal).toBeVisible();
    await expect(reveal).toHaveCSS("opacity", "1");
    await context.close();
  });

  for (const width of [320, 390, 768, 1280]) {
    test(`has no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/services/it-support");
      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        page: document.documentElement.scrollWidth,
      }));
      expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport);
    });
  }
});
