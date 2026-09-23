import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const baseUrl = process.env.SITE_PREVIEW_URL ?? "http://127.0.0.1:3100";
const outputDirectory = "docs/screenshots";
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch();
const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });

for (const capture of [
  { path: "/", name: "homepage-desktop.png" },
  { path: "/services", name: "services-desktop.png" },
  { path: "/services/it-support", name: "service-page-desktop.png" },
]) {
  await desktop.goto(`${baseUrl}${capture.path}`, { waitUntil: "networkidle" });
  await desktop.screenshot({ path: `${outputDirectory}/${capture.name}`, fullPage: true });
}

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await mobile.goto(baseUrl, { waitUntil: "networkidle" });
await mobile.locator('summary[aria-label="Toggle navigation"]').click();
await mobile.waitForTimeout(300);
await mobile.screenshot({ path: `${outputDirectory}/homepage-mobile-menu.png` });

await browser.close();
