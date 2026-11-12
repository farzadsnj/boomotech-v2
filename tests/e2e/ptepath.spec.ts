import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";

const screenshots = "artifacts/screenshots";
const learner = {
  name: "Taylor Learner",
  email: `pte-learner-${process.pid}-${Date.now()}@example.test`,
  password: "LearningPassword9",
};

async function latestVerificationUrl(email: string) {
  const capturePath = path.resolve(process.cwd(), ".test-db", "verification-emails.jsonl");
  await expect.poll(async () => {
    try {
      return (await readFile(capturePath, "utf8")).includes(email);
    } catch {
      return false;
    }
  }).toBe(true);
  const captures = (await readFile(capturePath, "utf8")).trim().split("\n")
    .map((line) => JSON.parse(line) as { to: string; verificationUrl: string });
  return captures.findLast(({ to }) => to === email)?.verificationUrl;
}

test.describe("PTEpath learning workspace", () => {
  test.describe.configure({ mode: "serial" });

  test("uses the distinct PTEpath shell and safe guest account links", async ({ page }) => {
    await page.goto("/learning/pte-academic");
    await expect(page.getByRole("link", { name: "PTEpath home" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: /Let’s make progress, Learner/ })).toBeVisible();
    await expect(page.locator(".site-header, .site-footer, [aria-label='Chat with BoomoTech']")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login?returnTo=%2Flearning%2Fpte-academic");
    await page.getByRole("button", { name: "Create my study space" }).click();
    await expect(page).toHaveURL(/\/register\?returnTo=%2Flearning%2Fpte-academic$/);

    await page.goto("/learning");
    await expect(page.locator(".site-header")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Learn, practise and build confidence." })).toBeVisible();

    await page.goto("/learning/pte-academic");
    await page.screenshot({ path: `${screenshots}/ptepath-guest-desktop.png`, fullPage: true });
    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
  });

  test("preserves the PTE return through registration and saves onboarding", async ({ page }) => {
    await page.goto("/register?returnTo=%2Flearning%2Fpte-academic");
    await page.getByLabel("Full name").fill(learner.name);
    await page.getByLabel("Email address").fill(learner.email);
    await page.locator('input[name="password"]').fill(learner.password);
    await page.getByLabel("Confirm password").fill(learner.password);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/check-email\?returnTo=%2Flearning%2Fpte-academic$/);
    const verificationUrl = await latestVerificationUrl(learner.email);
    expect(verificationUrl).toBeTruthy();
    await page.goto(verificationUrl!);
    await expect(page).toHaveURL(/\/learning\/pte-academic$/);
    await expect(page.getByRole("heading", { name: "Build a study plan that fits your timeframe." })).toBeVisible();
    await page.getByLabel("Preparation study days").fill("35");
    await page.getByLabel("Minutes available per study day").fill("45");
    await page.getByRole("button", { name: "Save and build my plan" }).click();
    await expect(page.getByRole("heading", { level: 1, name: /Let’s make progress, Taylor/ })).toBeVisible();
    await expect(page.getByText("Your 35-study-day plan adapts future work without erasing past attempts.")).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: /Let’s make progress, Taylor/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Build a study plan that fits your timeframe." })).toHaveCount(0);
    await page.screenshot({ path: `${screenshots}/ptepath-authenticated-desktop.png`, fullPage: true });
  });

  test("supports practice keyboard controls, draft persistence and mobile layouts", async ({ page }) => {
    await page.goto("/login?returnTo=%2Flearning%2Fpte-academic");
    await page.getByLabel("Email address").fill(learner.email);
    await page.locator('input[name="password"]').fill(learner.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/learning\/pte-academic$/);

    await page.getByRole("link", { name: "Practice studio" }).click();
    await expect(page).toHaveURL(/\/learning\/pte-academic\/practice$/);
    const readingSection = page.locator("section").filter({ has: page.getByRole("heading", { name: "Reading: Fill in the Blanks" }) });
    await readingSection.getByRole("button").first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    const writingSection = page.locator("section").filter({ has: page.getByRole("heading", { name: "Summarise Written Text" }) });
    await writingSection.getByRole("button").first().click();
    const response = page.getByLabel("Your response");
    await response.fill("A saved draft remains associated with this verified BoomoTech learner account.");
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByRole("status")).toHaveText("Saved");
    await page.getByRole("button", { name: "Close practice" }).click();
    await page.reload();
    await page.locator("section").filter({ has: page.getByRole("heading", { name: "Summarise Written Text" }) }).getByRole("button").first().click();
    await expect(page.getByLabel("Your response")).toHaveValue("A saved draft remains associated with this verified BoomoTech learner account.");
    await page.getByRole("button", { name: "Close practice" }).click();

    for (const viewport of [{ width: 320, height: 800 }, { width: 390, height: 844 }, { width: 768, height: 1024 }]) {
      await page.setViewportSize(viewport);
      await page.goto("/learning/pte-academic");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      if (viewport.width === 390) await page.screenshot({ path: `${screenshots}/ptepath-mobile.png`, fullPage: true });
    }
  });

  test("disables automatic carousel movement for reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/learning/pte-academic");
    const feature = page.getByRole("region", { name: "PTEpath features" });
    await expect(feature).toHaveAttribute("aria-label", "PTEpath features");
    const position = feature.locator('[aria-label^="Slide "]');
    await expect(position).toHaveAttribute("aria-label", "Slide 1 of 5");
    await page.waitForTimeout(7_200);
    await expect(position).toHaveAttribute("aria-label", "Slide 1 of 5");
    await page.getByRole("button", { name: "Next feature" }).click();
    await expect(position).toHaveAttribute("aria-label", "Slide 2 of 5");
  });
});
