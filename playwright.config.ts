import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const e2eDatabasePath = path.resolve(process.cwd(), ".test-db", "boomotech");
const e2eEnvironment = {
  AUTH_E2E_DATABASE_PATH: e2eDatabasePath,
  BETTER_AUTH_SECRET: "e2e-only-secret-with-more-than-thirty-two-characters",
  BETTER_AUTH_URL: "http://localhost:3100",
  SITE_URL: "http://localhost:3100",
  SITE_INDEXING_ENABLED: "false",
  E2E_ADMIN_PASSWORD: "SyntheticAdminPassword9",
};

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: "http://localhost:3100", trace: "on-first-retry" },
  webServer: {
    command: "pnpm test:e2e:prepare && pnpm start --hostname localhost --port 3100",
    env: e2eEnvironment,
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
