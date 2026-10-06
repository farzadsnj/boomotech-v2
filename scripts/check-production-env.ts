import nextEnv from "@next/env";
import { validateProductionEnvironment } from "../src/lib/config/environment";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd(), false);

try {
  validateProductionEnvironment(process.env);
  console.log("Production environment configuration is complete and uses the approved BoomoTech origin.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Production environment configuration is invalid.");
  process.exit(1);
}
