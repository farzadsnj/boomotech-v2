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
const customerFixtures = [
  { id: crypto.randomUUID(), name: "Casey Network", email: "casey-network@example.test", verified: true },
  { id: crypto.randomUUID(), name: "Jordan Support", email: "jordan-support@example.test", verified: false },
] as const;
for (const customer of customerFixtures) await client.query(`insert into "user" (id, name, email, email_verified, role, banned, created_at, updated_at)
  values ($1, $2, $3, $4, 'user', false, now(), now())`, [customer.id, customer.name, customer.email, customer.verified]);
const requestFixtures = [
  { id: crypto.randomUUID(), reference: "BT-E2E0000001", userId: customerFixtures[0].id, name: "Casey Network", email: "casey-network@example.test", service: "/services/network-wifi", message: "The office has unreliable wireless coverage in two meeting rooms and needs a network assessment.", status: "NEW", priority: "HIGH" },
  { id: crypto.randomUUID(), reference: "BT-E2E0000002", userId: customerFixtures[1].id, name: "Jordan Support", email: "jordan-support@example.test", service: "/services/it-support", message: "Several team computers need ongoing support and a documented update process.", status: "AWAITING_USER", priority: "MEDIUM" },
  { id: crypto.randomUUID(), reference: "BT-E2E0000003", userId: null, name: "Alex Security", email: "alex-security@example.test", service: "/services/cybersecurity", message: "The business needs help reviewing account security and phishing preparation.", status: "IN_PROGRESS", priority: "HIGH" },
] as const;
for (const fixture of requestFixtures) {
  await client.query(`insert into booking_request (id, reference, user_id, full_name, email, phone, service_path, message, source, status, priority, consent_version, created_at, updated_at)
    values ($1, $2, $3, $4, $5, '+61400000000', $6, $7, 'booking-page', $8, $9, 'e2e-test', now(), now())`, [fixture.id, fixture.reference, fixture.userId, fixture.name, fixture.email, fixture.service, fixture.message, fixture.status, fixture.priority]);
  await client.query(`insert into booking_request_event (id, booking_request_id, actor_role, event_type, to_status, created_at)
    values ($1, $2, 'system', 'REQUEST_CREATED', $3, now())`, [crypto.randomUUID(), fixture.id, fixture.status]);
  await client.query(`insert into in_app_notification (id, recipient_role, booking_request_id, kind, dedupe_key, created_at)
    values ($1, 'admin', $2, 'ADMIN_NEW_REQUEST', $3, now())`, [crypto.randomUUID(), fixture.id, `${fixture.id}:ADMIN_NEW_REQUEST`]);
}
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
