import { expect, test } from "@playwright/test";
import { services } from "../../src/content/services";

test("every Services menu destination has complete content and a service-aware consultation path", async ({ page, request }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Show services menu" }).click();
  const menuPaths = await page.locator('.mega-menu--services a[href^="/services/"]').evaluateAll((nodes) => [...new Set(nodes.map((node) => (node as HTMLAnchorElement).pathname))]);
  expect(menuPaths.sort()).toEqual(services.map(({ path }) => path).sort());
  await expect(page.getByRole("link", { name: "View all services →" })).toHaveAttribute("href", "/services");

  for (const service of services) {
    expect((await request.get(service.path)).status()).toBe(200);
    await page.goto(service.path);
    await expect(page.getByRole("heading", { level: 1, name: service.title })).toBeVisible();
    await expect(page.locator(".service-diagram figcaption")).toContainText(service.diagram.caption);
    await expect(page.getByText("ILLUSTRATIVE EXAMPLE", { exact: true })).toBeVisible();
    await expect(page.locator('.service-detail a[href^="/booking?service="]').first()).toHaveAttribute("href", new RegExp(`service=${encodeURIComponent(service.path)}`));
    for (const related of service.related) expect((await request.get(related.href)).status()).toBe(200);
  }
});

test("a service consultation remains selected and can be changed", async ({ page }) => {
  await page.goto("/services/microsoft-365");
  await page.getByRole("link", { name: "Discuss your Microsoft 365 setup" }).first().click();
  const service = page.getByLabel(/Service required/);
  await expect(service).toHaveValue("/services/microsoft-365");
  await service.selectOption("/services/network-wifi");
  await expect(service).toHaveValue("/services/network-wifi");
  await page.getByLabel(/Problem or requested work/).fill("Our business Wi-Fi drops out during routine work.");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel(/Full name/).fill("Taylor Smith");
  await page.getByLabel(/Email address/).fill("taylor@example.com");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText(/not a confirmed appointment/i)).toBeVisible();
});

for (const width of [320, 390]) test(`service diagrams and pages avoid horizontal overflow at ${width}px`, async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width, height: width === 320 ? 800 : 844 });
  for (const { path } of services) {
    await page.goto(path);
    await expect(page.locator(".service-diagram")).toBeVisible();
    const dimensions = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    expect(dimensions.scroll, path).toBeLessThanOrEqual(dimensions.client);
  }
});
