import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const e2eDatabasePath = path.resolve(process.cwd(), ".test-db", "boomotech");
const verificationEmailCapturePath = path.resolve(process.cwd(), ".test-db", "verification-emails.jsonl");
const e2eEnvironment = {
  AUTH_E2E_DATABASE_PATH: e2eDatabasePath,
  BETTER_AUTH_SECRET: "e2e-only-secret-with-more-than-thirty-two-characters",
  BETTER_AUTH_URL: "http://localhost:3100",
  SITE_URL: "http://localhost:3100",
  SITE_INDEXING_ENABLED: "false",
  E2E_ADMIN_PASSWORD: "SyntheticAdminPassword9",
  AUTH_EMAIL_CAPTURE_PATH: verificationEmailCapturePath,
  AUTH_EMAIL_CAPTURE_MODE: "test",
  EMAIL_VERIFICATION_TTL_MINUTES: "60",
  BOOKING_TRUST_PROXY: "true",
};

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: "http://localhost:3100", trace: "on-first-retry" },
  webServer: {
    command: "pnpm test:e2e:prepare && pnpm exec next start --hostname localhost --port 3100",
    env: e2eEnvironment,
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
