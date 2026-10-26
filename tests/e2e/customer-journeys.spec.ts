import { expect, test } from "@playwright/test";

const journeys = [
  { name: "individual with a slow laptop", audience: /For home & individuals/, problem: /Fix an everyday IT problem/, service: "IT support", value: "/services/it-support", category: "it-problem" },
  { name: "individual with Wi-Fi dropouts", audience: /For home & individuals/, problem: /Improve Wi-Fi or connectivity/, service: "Network and Wi-Fi", value: "/services/network-wifi", category: "network" },
  { name: "individual considering equipment replacement", audience: /For home & individuals/, problem: /Choose or replace equipment/, service: "IT support", value: "/services/it-support", category: "equipment-advice" },
  { name: "business with email or account problems", audience: /For businesses/, problem: /Email, accounts or shared files/, service: "Microsoft 365", value: "/services/microsoft-365", category: "email-accounts" },
  { name: "business onboarding an employee", audience: /For businesses/, problem: /Email, accounts or shared files/, service: "Microsoft 365", value: "/services/microsoft-365", category: "email-accounts" },
  { name: "business seeking ongoing support", audience: /For businesses/, problem: /Arrange ongoing IT support/, service: "Managed IT", value: "/services/managed-it", category: "ongoing-support" },
  { name: "business planning a website", audience: /For businesses/, problem: /Build or improve a website/, service: "Web and software", value: "/services/web-software", category: "website-software" },
  { name: "business exploring automation", audience: /For businesses/, problem: /Reduce repetitive administration/, service: "AI and automation", value: "/services/ai-automation", category: "automation" },
  { name: "visitor unsure of the service", audience: /Not sure\? Describe your problem/, problem: /Not sure—help me choose/, service: "Send the problem without choosing a service", value: "other", category: "other" },
] as const;

for (const journey of journeys) test(`${journey.name} reaches an editable request in three deliberate actions`, async ({ page }) => {
  await page.goto("/");
  const finder = page.getByTestId("service-pathfinder");
  await finder.getByRole("button", { name: journey.audience }).click();
  await finder.getByRole("button", { name: journey.problem }).click();
  await expect(finder.getByRole("heading", { name: journey.service })).toBeVisible();
  await finder.getByRole("link", { name: "Send a request" }).click();
  await expect(page.locator('select[name="audience"]')).toHaveValue(journey.audience.source.includes("business") ? "business" : journey.audience.source.includes("home") ? "personal" : "unsure");
  await expect(page.locator('select[name="category"]')).toHaveValue(journey.category);
  await expect(page.locator('select[name="servicePath"]')).toHaveValue(journey.value);
  await expect(page.getByText(/suggestion from your answers/i)).toBeVisible();
});

test("problem-first request keeps context, makes phone optional and confirms only after persistence", async ({ page }) => {
  await page.route("**/api/booking", (route) => route.fulfill({ status: 201, contentType: "application/json", body: '{"ok":true,"reference":"BT-ABCDEF1234"}' }));
  await page.goto("/"); const finder = page.getByTestId("service-pathfinder");
  await finder.getByRole("button", { name: /For home & individuals/ }).click(); await finder.getByRole("button", { name: /Fix an everyday IT problem/ }).click(); await finder.getByRole("link", { name: "Send a request" }).click();
  await page.getByLabel(/Problem or requested work/).fill("My laptop is very slow when opening email and documents."); await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel(/Full name/).fill("Taylor Smith"); await page.getByLabel(/Email address/).fill("taylor@example.com"); await expect(page.getByLabel(/Phone number/)).not.toHaveAttribute("required"); await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("For personal use or a home office")).toBeVisible(); await expect(page.getByText("My laptop is very slow when opening email and documents.")).toBeVisible();
  await page.getByLabel(/I agree/).check(); await page.getByRole("button", { name: "Send support request" }).click();
  await expect(page.getByText("BT-ABCDEF1234")).toBeVisible(); await expect(page.getByText(/not a confirmed appointment/i)).toBeVisible();
});

for (const audiencePage of [
  { path: "/solutions/home-office-individuals", audience: "personal", heading: "Technology help for home, study and everyday work", diagram: "From a symptom to a safe next step", cta: "Describe your technology problem" },
  { path: "/solutions/small-business", audience: "business", heading: "Practical technology support for small businesses", diagram: "Four practical layers of business technology", cta: "Send a business request" },
] as const) test(`${audiencePage.audience} solution explains scope and carries audience into the request`, async ({ page }) => {
  await page.goto(audiencePage.path);
  await expect(page.getByRole("heading", { level: 1, name: audiencePage.heading })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: audiencePage.diagram })).toBeVisible();
  await expect(page.locator(".service-diagram figcaption")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Possible areas of help" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Needs separate agreement or another specialist" })).toBeVisible();
  await expect(page.getByText("ILLUSTRATIVE EXAMPLE", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: audiencePage.cta }).first().click();
  await expect(page).toHaveURL(new RegExp(`audience=${audiencePage.audience}`));
  await expect(page.locator('select[name="audience"]')).toHaveValue(audiencePage.audience);
});
