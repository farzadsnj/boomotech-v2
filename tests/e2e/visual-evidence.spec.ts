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
  test.setTimeout(240_000);
  await page.addInitScript(() => localStorage.setItem("boomotech-cookie-notice-seen", "yes"));
  await page.setViewportSize(desktop); await page.goto("/"); await prepareFullPage(page); await page.screenshot({ path: `${output}/home-desktop.png`, fullPage: true });
  const desktopFinder = page.getByTestId("service-pathfinder"); await desktopFinder.getByRole("button", { name: /For businesses/ }).click(); await desktopFinder.getByRole("button", { name: /Build or improve a website/ }).click(); await page.locator(".chatbot-shell, .scroll-top").evaluateAll((nodes) => nodes.forEach((node) => ((node as HTMLElement).style.display = "none"))); await desktopFinder.screenshot({ path: `${output}/customer-discovery-desktop.png` });
  await desktopFinder.getByRole("link", { name: "Send a request" }).click(); const contextForm = page.locator(".booking-form"); await expect(contextForm).toBeVisible(); await page.waitForTimeout(700); await contextForm.screenshot({ path: `${output}/request-context-desktop.png` });
  await page.goto("/"); await prepareFullPage(page);
  await page.screenshot({ path: `${output}/header-desktop-1440.png` });
  await page.setViewportSize({ width: 1024, height: 768 }); await page.goto("/"); await page.screenshot({ path: `${output}/header-desktop-1024.png` });
  await page.setViewportSize(desktop); await page.goto("/");
  await page.getByRole("button", { name: "Search BoomoTech" }).click(); await page.screenshot({ path: `${output}/search-open.png` }); const search = page.getByRole("searchbox", { name: "Search BoomoTech" }); await search.fill("network"); await page.screenshot({ path: `${output}/search-results.png` }); await search.fill("zyxwvutsrq"); await page.screenshot({ path: `${output}/search-no-results.png` }); await page.keyboard.press("Escape"); await expect(page.getByRole("dialog", { name: "What can we help you find?" })).not.toBeVisible(); await page.screenshot({ path: `${output}/search-closed.png` });
  await page.getByRole("button", { name: "Show services menu" }).click(); await page.screenshot({ path: `${output}/services-mega-menu-desktop.png` }); await page.keyboard.press("Escape");
  await expect(page.getByTestId("hero-visual")).toBeVisible(); await page.screenshot({ path: `${output}/home-hero-pointer.png` });
  await page.evaluate(() => window.scrollTo(0, 950)); await expect(page.getByRole("button", { name: "Back to top" })).toBeVisible(); await page.screenshot({ path: `${output}/home-sticky-header-scroll-top.png` });
  await page.setViewportSize(mobile); await page.goto("/"); await prepareFullPage(page); await page.screenshot({ path: `${output}/home-mobile.png`, fullPage: true }); const mobileFinder = page.getByTestId("service-pathfinder"); await mobileFinder.getByRole("button", { name: /For home & individuals/ }).click(); await mobileFinder.getByRole("button", { name: /Improve Wi-Fi or connectivity/ }).click(); await page.locator(".site-header, .chatbot-shell, .scroll-top").evaluateAll((nodes) => nodes.forEach((node) => ((node as HTMLElement).style.display = "none"))); await mobileFinder.screenshot({ path: `${output}/customer-discovery-mobile.png` }); await page.locator(".site-footer").screenshot({ path: `${output}/mobile-footer.png` }); await page.goto("/"); await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator("summary[aria-label='Menu: toggle navigation']").click(); await page.getByRole("button", { name: "Search" }).click(); await page.screenshot({ path: `${output}/search-mobile.png` }); await page.keyboard.press("Escape");
  await page.reload(); await page.waitForTimeout(3_000); await expect(page.getByRole("dialog")).toHaveCount(0); await page.screenshot({ path: `${output}/chat-launcher-mobile.png` });
  await page.getByRole("button", { name: "Chat with BoomoTech" }).click(); await page.screenshot({ path: `${output}/chat-open-mobile.png` }); await page.keyboard.press("Escape");

  for (const route of ["services", "solutions"] as const) {
    await page.setViewportSize(desktop); await page.goto(`/${route}`); await prepareFullPage(page); await page.screenshot({ path: `${output}/${route}-desktop.png`, fullPage: true });
    await page.setViewportSize(mobile); await page.goto(`/${route}`); await prepareFullPage(page); await page.screenshot({ path: `${output}/${route}-mobile.png`, fullPage: true });
  }

  for (const slug of ["it-support", "network-wifi", "cybersecurity"]) { await page.setViewportSize(desktop); await page.goto(`/services/${slug}`); await prepareFullPage(page); await page.screenshot({ path: `${output}/service-${slug}-desktop.png`, fullPage: true }); }
  await page.setViewportSize(mobile); await page.goto("/services/it-support"); await prepareFullPage(page); await page.screenshot({ path: `${output}/service-it-support-mobile.png`, fullPage: true });
  await page.goto("/services/network-wifi"); const mini = page.locator(".service-questions"); for (const fieldset of await mini.locator("fieldset").all()) await fieldset.getByRole("radio").first().check(); await mini.screenshot({ path: `${output}/service-mini-result.png` });
  for (const solution of ["small-business", "home-office-individuals"]) {
    await page.setViewportSize(desktop); await page.goto(`/solutions/${solution}`); await prepareFullPage(page); await page.screenshot({ path: `${output}/solution-${solution}-desktop.png`, fullPage: true });
    await page.setViewportSize(mobile); await page.goto(`/solutions/${solution}`); await prepareFullPage(page); await page.screenshot({ path: `${output}/solution-${solution}-mobile.png`, fullPage: true });
  }
  await page.goto("/tools/it-health-check"); await prepareFullPage(page); await page.screenshot({ path: `${output}/it-health-check-desktop.png`, fullPage: true });
  await page.setViewportSize(mobile); await page.goto("/tools/it-health-check"); await page.screenshot({ path: `${output}/it-health-check-mobile.png`, fullPage: true });
  for (let index = 0; index < 6; index += 1) await page.getByRole("button", { name: "Partly or not consistently" }).click(); await page.screenshot({ path: `${output}/it-health-check-result-mobile.png`, fullPage: true });

  await page.setViewportSize(desktop); await page.goto("/support"); await prepareFullPage(page); await page.getByText("What should I never share?").click(); await page.screenshot({ path: `${output}/support-faq.png`, fullPage: true }); await page.locator("#request-support").screenshot({ path: `${output}/support-form.png` });
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
