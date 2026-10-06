import { defineConfig } from "drizzle-kit";
import { getDatabaseUrl } from "./src/lib/config/environment";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: getDatabaseUrl(),
  },
  strict: true,
  verbose: true,
});
