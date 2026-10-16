import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd(), false);

const secretNames = [
  "BETTER_AUTH_SECRET",
  "DATABASE_URL",
  "RESEND_API_KEY",
  "BOOKING_RATE_LIMIT_REST_TOKEN",
  "OPENAI_API_KEY",
  "ADMIN_TEMP_PASSWORD",
] as const;
const staticRoot = path.resolve(process.cwd(), ".next", "static");

async function filesUnder(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const candidate = path.join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(candidate) : [candidate];
  }));
  return files.flat();
}

const configured = secretNames.flatMap((name) => {
  const value = process.env[name];
  return value && value.length >= 8 ? [{ name, value }] : [];
});
const findings: { name: string; file: string }[] = [];

for (const file of await filesUnder(staticRoot)) {
  const content = await readFile(file, "utf8").catch(() => "");
  for (const secret of configured) {
    if (content.includes(secret.value)) findings.push({ name: secret.name, file: path.relative(process.cwd(), file) });
  }
}

if (findings.length) {
  for (const finding of findings) console.error(`Server-only value ${finding.name} appeared in ${finding.file}.`);
  process.exit(1);
}

console.log(`Client bundle check passed for ${configured.length} configured server-only values.`);
