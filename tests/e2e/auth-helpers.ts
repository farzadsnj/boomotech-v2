import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { generate } from "otplib";

export async function signInAdministrator(page: Page) {
  const state = JSON.parse(await readFile(path.resolve(process.cwd(), ".test-db", "admin-mfa.json"), "utf8")) as { secret: string };
  await page.goto("/admin/login");
  await page.getByLabel("Administrator username").fill("farzadsnj");
  await page.locator('input[name="password"]').fill("SyntheticAdminPassword9");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin\/mfa$/);
  await page.getByLabel("Authenticator code").fill(await generate({ secret: state.secret }));
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}
