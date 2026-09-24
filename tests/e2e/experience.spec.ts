import { expect, test } from "@playwright/test";

test("chatbot opens, closes with Escape, and welcomes once per session", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Hi! How can we help with your technology today?")).toBeVisible({ timeout: 4_000 });
  await page.getByRole("button", { name: "Dismiss welcome message" }).click();
  await page.reload();
  await page.waitForTimeout(2_600);
  await expect(page.getByText("Hi! How can we help with your technology today?")).toHaveCount(0);
  await page.getByRole("button", { name: "Chat with BoomoTech" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Chat with BoomoTech" })).toBeFocused();
});

test("header booking opens the shared booking flow", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Book a Consultation" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("Your contact details")).toBeVisible();
});

test("mobile navigation supports Blog, booking and Escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator("summary[aria-label='Toggle navigation']").click();
  await expect(page.getByRole("navigation", { name: "Mobile primary" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("navigation", { name: "Mobile primary" })).not.toBeVisible();
  await page.locator("summary[aria-label='Toggle navigation']").click();
  await page.getByRole("navigation", { name: "Mobile primary" }).getByRole("link", { name: "Blog" }).click();
  await expect(page).toHaveURL(/\/blog$/);
});

test("selected service carries into the booking request", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Chat with BoomoTech" }).click();
  await page.getByRole("button", { name: "Explore our services" }).click();
  await page.getByRole("article").filter({ hasText: "Network and Wi-Fi" }).getByRole("button", { name: "Request consultation" }).click();
  await page.getByLabel("Full name").fill("Taylor Smith");
  await page.getByLabel("Email address").fill("taylor@example.com");
  await page.getByLabel("Phone number").fill("0400000000");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByLabel("Service required")).toHaveValue("/services/network-wifi");
});

test("skip link becomes visible and moves focus to main content", async ({ page }) => {
  await page.goto("/"); await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("direct booking validates progressively", async ({ page }) => {
  await page.goto("/booking");
  await expect(page.getByRole("heading", { name: "Tell us what you need help with" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue" })).toBeDisabled();
});

test("blog index and all articles expose metadata and structured data", async ({ page }) => {
  await page.goto("/blog");
  await expect(page.getByRole("heading", { name: "Practical technology guidance" })).toBeVisible();
  const slugs = ["essential-it-support-checklist-small-business", "improve-small-business-wifi-network", "practical-cybersecurity-steps-australian-small-businesses"];
  for (const slug of slugs) {
    await page.goto(`/blog/${slug}`);
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`/blog/${slug}$`));
  }
});

test("Blog navigation has current-page state", async ({ page }) => {
  await page.goto("/blog/essential-it-support-checklist-small-business");
  await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Blog" })).toHaveAttribute("aria-current", "page");
});

test("unknown routes return HTTP 404", async ({ request }) => {
  expect((await request.get("/does-not-exist")).status()).toBe(404);
  expect((await request.get("/services/not-real")).status()).toBe(404);
});

for (const width of [320, 390, 768, 1280]) test(`has no horizontal overflow at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 800 }); await page.goto("/blog");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("supports reduced motion and reports no console errors", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" }); const page = await context.newPage(); const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/"); await page.getByRole("button", { name: "Chat with BoomoTech" }).click();
  expect(await page.locator(".chat-panel").evaluate((node) => getComputedStyle(node).animationName)).toBe("none");
  expect(errors).toEqual([]); await context.close();
});
