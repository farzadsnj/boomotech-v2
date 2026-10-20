import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type * as AccountRepository from "./repository";

const databasePath = path.resolve(process.cwd(), ".test-db", `account-settings-${randomUUID()}`);
const customerId = randomUUID();
const adminId = randomUUID();
let repository: typeof AccountRepository;
let db: (typeof import("@/db"))["db"];
let closeDatabase: (typeof import("@/db"))["closeDatabase"];
let tables: typeof import("@/db/schema");

beforeAll(async () => {
  await rm(databasePath, { recursive: true, force: true });
  await mkdir(path.dirname(databasePath), { recursive: true });
  const client = new PGlite(databasePath);
  const migrationDirectory = path.resolve(process.cwd(), "drizzle");
  for (const name of (await readdir(migrationDirectory)).filter((value) => value.endsWith(".sql")).sort()) {
    const migration = await readFile(path.join(migrationDirectory, name), "utf8");
    for (const statement of migration.split("--> statement-breakpoint").map((value) => value.trim()).filter(Boolean)) await client.exec(statement);
  }
  await client.close();
  process.env.AUTH_E2E_DATABASE_PATH = databasePath;
  ({ db, closeDatabase } = await import("@/db"));
  tables = await import("@/db/schema");
  repository = await import("./repository");
  await db.insert(tables.user).values([
    { id: customerId, name: "Original Customer", email: "settings-customer@example.test", emailVerified: true, role: "user" },
    { id: adminId, name: "Original Administrator", email: "settings-admin@example.test", emailVerified: true, username: "settingsadmin", role: "admin", twoFactorEnabled: true },
  ]);
});

afterAll(async () => {
  await closeDatabase?.();
  delete process.env.AUTH_E2E_DATABASE_PATH;
  await rm(databasePath, { recursive: true, force: true });
});

describe("account profile repository", () => {
  it("updates only the authenticated verified customer's name", async () => {
    await expect(repository.updateOwnProfile({ id: customerId, role: "user", emailVerified: false }, "Blocked Name")).rejects.toMatchObject({ code: "forbidden" });
    expect(await repository.updateOwnProfile({ id: customerId, role: "user", emailVerified: true }, "Updated Customer")).toMatchObject({ id: customerId, name: "Updated Customer" });
    const [record] = await db.select().from(tables.user).where((await import("drizzle-orm")).eq(tables.user.id, customerId));
    expect(record).toMatchObject({ name: "Updated Customer", email: "settings-customer@example.test", role: "user", emailVerified: true });
  });

  it("requires completed MFA for administrator profile changes and preserves role security fields", async () => {
    await expect(repository.updateOwnProfile({ id: adminId, role: "admin", twoFactorEnabled: false }, "Blocked Administrator")).rejects.toMatchObject({ code: "forbidden" });
    expect(await repository.updateOwnProfile({ id: adminId, role: "admin", twoFactorEnabled: true }, "Updated Administrator")).toMatchObject({ id: adminId, name: "Updated Administrator" });
    const [record] = await db.select().from(tables.user).where((await import("drizzle-orm")).eq(tables.user.id, adminId));
    expect(record).toMatchObject({ name: "Updated Administrator", username: "settingsadmin", role: "admin", twoFactorEnabled: true });
  });

  it("cannot update a different or missing account", async () => {
    await expect(repository.updateOwnProfile({ id: randomUUID(), role: "user", emailVerified: true }, "Missing Customer")).rejects.toMatchObject({ code: "not-found" });
  });
});
