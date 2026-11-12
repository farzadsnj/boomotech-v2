import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // PGlite-backed integration suites create isolated databases. Bounding the
    // worker count avoids starving their setup hooks on high-core workstations.
    maxWorkers: 8,
    hookTimeout: 60_000,
    testTimeout: 20_000,
  },
});
