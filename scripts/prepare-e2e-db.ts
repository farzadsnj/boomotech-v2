import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { generate } from "otplib";
import { hashPassword } from "../src/lib/auth/password";

const workspace = process.cwd();
const databasePath = path.resolve(workspace, ".test-db", "boomotech");
if (!databasePath.startsWith(`${path.resolve(workspace)}${path.sep}`)) throw new Error("Refusing to reset a database outside the workspace.");
await rm(databasePath, { recursive: true, force: true });
await mkdir(path.dirname(databasePath), { recursive: true });

const client = new PGlite(databasePath);
const migrationDirectory = path.resolve(workspace, "drizzle");
const migrations = (await readdir(migrationDirectory)).filter((name) => name.endsWith(".sql")).sort();
for (const name of migrations) {
  const migration = await readFile(path.join(migrationDirectory, name), "utf8");
  for (const statement of migration.split("--> statement-breakpoint").map((value) => value.trim()).filter(Boolean)) await client.exec(statement);
}

const adminId = crypto.randomUUID();
const passwordHash = await hashPassword(process.env.E2E_ADMIN_PASSWORD ?? "SyntheticAdminPassword9");
await client.query(`insert into "user" (id, name, email, email_verified, username, display_username, role, banned, created_at, updated_at)
  values ($1, $2, $3, true, $4, $4, 'admin', false, now(), now())`, [adminId, "Test Administrator", "admin@example.test", "farzadsnj"]);
await client.query(`insert into account (id, account_id, provider_id, user_id, password, created_at, updated_at)
  values ($1, $2, 'credential', $2, $3, now(), now())`, [crypto.randomUUID(), adminId, passwordHash]);
await client.close();

const { auth } = await import("../src/lib/auth/auth");
const { closeDatabase } = await import("../src/db/index");
async function authCall(pathname: string, body: unknown, cookie?: string) {
  return auth.handler(new Request(`http://localhost:3100/api/auth${pathname}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost:3100", "x-forwarded-for": "127.0.0.1", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  }));
}
function cookieFrom(response: Response, fragment: string) {
  const value = response.headers.getSetCookie().find((cookie) => cookie.includes(fragment));
  if (!value) throw new Error("The isolated administrator MFA setup did not create the expected cookie.");
  return value.split(";", 1)[0];
}
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "SyntheticAdminPassword9";
const login = await authCall("/sign-in/username", { username: "farzadsnj", password: adminPassword });
const sessionCookie = cookieFrom(login, "session_token");
const enabled = await authCall("/two-factor/enable", { password: adminPassword, method: "totp", issuer: "BoomoTech" }, sessionCookie);
if (!enabled.ok) throw new Error("The isolated administrator MFA setup could not be enabled.");
const enrolment = await enabled.json() as { totpURI: string };
const totpSecret = new URL(enrolment.totpURI).searchParams.get("secret");
if (!totpSecret) throw new Error("The isolated administrator MFA setup returned no secret.");
const verified = await authCall("/two-factor/verify-totp", { code: await generate({ secret: totpSecret }), trustDevice: false }, sessionCookie);
if (!verified.ok) throw new Error("The isolated administrator MFA setup could not be verified.");
await writeFile(path.resolve(workspace, ".test-db", "admin-mfa.json"), JSON.stringify({ secret: totpSecret }), { encoding: "utf8", mode: 0o600 });
await closeDatabase();
console.log("Prepared isolated E2E account database.");
