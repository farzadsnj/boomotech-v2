import { expect, test } from "@playwright/test";

const output = "artifacts/screenshots";
const desktop = { width: 1440, height: 900 };
const mobile = { width: 390, height: 844 };

async function prepareFullPage(page: import("@playwright/test").Page) {
  await page.waitForTimeout(900);
  await page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = "auto";
    for (let top = 0; top < document.documentElement.scrollHeight; top += Math.max(400, window.innerHeight * .75)) {
      window.scrollTo(0, top);
      await new Promise((resolve) => window.setTimeout(resolve, 45));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(650);
}

test("capture final public-interface review evidence", async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => localStorage.setItem("boomotech-cookie-notice-seen", "yes"));
  await page.setViewportSize(desktop); await page.goto("/"); await prepareFullPage(page); await page.screenshot({ path: `${output}/home-desktop.png`, fullPage: true });
  await page.getByRole("button", { name: "Show services menu" }).click(); await page.screenshot({ path: `${output}/services-mega-menu-desktop.png` }); await page.keyboard.press("Escape");
  const visual = page.getByTestId("hero-visual"); const box = await visual.boundingBox(); await page.mouse.move(box!.x + box!.width * .8, box!.y + box!.height * .25); await page.waitForTimeout(350); await page.screenshot({ path: `${output}/home-hero-pointer.png` });
  await page.evaluate(() => window.scrollTo(0, 950)); await expect(page.locator(".site-header")).toHaveClass(/is-scrolled/); await page.screenshot({ path: `${output}/home-sticky-header-scroll-top.png` });
  await page.setViewportSize(mobile); await page.goto("/"); await prepareFullPage(page); await page.screenshot({ path: `${output}/home-mobile.png`, fullPage: true }); await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await page.waitForTimeout(250); await page.screenshot({ path: `${output}/mobile-footer.png` }); await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(() => sessionStorage.removeItem("boomotech-welcome-seen")); await page.reload(); await expect(page.getByText(/Need help choosing a service/)).toBeVisible({ timeout: 4_000 }); await page.screenshot({ path: `${output}/chat-welcome-mobile.png` });
  await page.getByRole("button", { name: "Chat with BoomoTech" }).click(); await page.screenshot({ path: `${output}/chat-open-mobile.png` }); await page.keyboard.press("Escape");

  for (const route of ["services", "solutions"] as const) {
    await page.setViewportSize(desktop); await page.goto(`/${route}`); await prepareFullPage(page); await page.screenshot({ path: `${output}/${route}-desktop.png`, fullPage: true });
    await page.setViewportSize(mobile); await page.goto(`/${route}`); await prepareFullPage(page); await page.screenshot({ path: `${output}/${route}-mobile.png`, fullPage: true });
  }

  await page.setViewportSize(desktop); await page.goto("/services/cybersecurity"); await prepareFullPage(page); await page.screenshot({ path: `${output}/service-cybersecurity-desktop.png`, fullPage: true });
  await page.goto("/solutions/small-business"); await prepareFullPage(page); await page.screenshot({ path: `${output}/solution-small-business-desktop.png`, fullPage: true });
  await page.goto("/tools/it-health-check"); await prepareFullPage(page); await page.screenshot({ path: `${output}/it-health-check-desktop.png`, fullPage: true });
  await page.setViewportSize(mobile); await page.goto("/tools/it-health-check"); await page.screenshot({ path: `${output}/it-health-check-mobile.png`, fullPage: true });

  await page.setViewportSize(desktop); await page.goto("/support"); await prepareFullPage(page); await page.getByText("What should I never share?").click(); await page.screenshot({ path: `${output}/support-faq.png`, fullPage: true });
  await page.goto("/contact"); await prepareFullPage(page); await page.screenshot({ path: `${output}/contact-desktop.png`, fullPage: true });
  await page.goto("/booking"); await prepareFullPage(page); await page.screenshot({ path: `${output}/booking-desktop.png`, fullPage: true });
  await page.goto("/login"); await prepareFullPage(page); await page.screenshot({ path: `${output}/login-desktop.png`, fullPage: true });
  await page.goto("/register"); await prepareFullPage(page); await page.screenshot({ path: `${output}/register-desktop.png`, fullPage: true });
  await page.goto("/resources"); await prepareFullPage(page); await page.screenshot({ path: `${output}/resources.png`, fullPage: true });
  await page.goto("/blog"); await prepareFullPage(page); await page.screenshot({ path: `${output}/blog-index.png`, fullPage: true });
  for (const slug of ["essential-it-support-checklist-small-business", "improve-small-business-wifi-network", "practical-cybersecurity-steps-australian-small-businesses"]) {
    await page.goto(`/blog/${slug}`); await page.screenshot({ path: `${output}/blog-${slug}-header.png` });
  }
  await page.goto("/about"); await prepareFullPage(page); await page.screenshot({ path: `${output}/about-desktop.png`, fullPage: true });
  await page.setViewportSize(mobile); await page.goto("/about"); await prepareFullPage(page); await page.screenshot({ path: `${output}/about-mobile.png`, fullPage: true });
});
