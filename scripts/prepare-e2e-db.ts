import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { hashPassword } from "../src/lib/auth/password";

const workspace = process.cwd();
const databasePath = path.resolve(workspace, ".test-db", "boomotech");
if (!databasePath.startsWith(`${path.resolve(workspace)}${path.sep}`)) throw new Error("Refusing to reset a database outside the workspace.");
await rm(databasePath, { recursive: true, force: true });
await mkdir(path.dirname(databasePath), { recursive: true });

const client = new PGlite(databasePath);
const migration = await readFile(path.resolve(workspace, "drizzle", "0000_auth_foundation.sql"), "utf8");
for (const statement of migration.split("--> statement-breakpoint").map((value) => value.trim()).filter(Boolean)) await client.exec(statement);

const adminId = crypto.randomUUID();
const passwordHash = await hashPassword(process.env.E2E_ADMIN_PASSWORD ?? "SyntheticAdminPassword9");
await client.query(`insert into "user" (id, name, email, email_verified, username, display_username, role, banned, created_at, updated_at)
  values ($1, $2, $3, true, $4, $4, 'admin', false, now(), now())`, [adminId, "Test Administrator", "admin@example.test", "farzadsnj"]);
await client.query(`insert into account (id, account_id, provider_id, user_id, password, created_at, updated_at)
  values ($1, $2, 'credential', $2, $3, now(), now())`, [crypto.randomUUID(), adminId, passwordHash]);
await client.close();
console.log("Prepared isolated E2E account database.");
