import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type * as CustomerRepository from "./repository";

const databasePath = path.resolve(process.cwd(), ".test-db", `customers-${randomUUID()}`);
const adminActor = { id: "admin-test", role: "admin", twoFactorEnabled: true } as const;
let repository: typeof CustomerRepository;
let db: (typeof import("@/db"))["db"];
let closeDatabase: (typeof import("@/db"))["closeDatabase"];
let tables: typeof import("@/db/schema");
let targetCustomerId = "";

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
  targetCustomerId = randomUUID();
  const now = new Date();
  await db.insert(tables.user).values([
    { id: randomUUID(), name: "Administrator", email: "directory-admin@example.test", emailVerified: true, role: "admin", createdAt: now, updatedAt: now },
    { id: targetCustomerId, name: "Directory Target", email: "directory-target@example.test", emailVerified: true, role: "user", createdAt: new Date("2026-01-02T00:00:00Z"), updatedAt: now },
    ...Array.from({ length: 26 }, (_, index) => ({ id: randomUUID(), name: `Customer ${String(index).padStart(2, "0")}`, email: `directory-${index}@example.test`, emailVerified: index % 2 === 0, role: "user", createdAt: new Date(2026, 0, index + 3), updatedAt: now })),
  ]);
  await db.insert(tables.bookingRequest).values([
    { id: randomUUID(), reference: "BT-C057000001", userId: targetCustomerId, fullName: "Directory Target", email: "directory-target@example.test", phone: "+61400000000", servicePath: "/services/it-support", message: "A linked request that belongs to the registered account.", source: "booking-page", status: "NEW", priority: "MEDIUM", consentVersion: "test" },
    { id: randomUUID(), reference: "BT-C057000002", userId: targetCustomerId, fullName: "Directory Target", email: "directory-target@example.test", phone: "+61400000000", servicePath: "/services/network-wifi", message: "A second linked request that belongs to the registered account.", source: "booking-page", status: "RESOLVED", priority: "LOW", consentVersion: "test" },
    { id: randomUUID(), reference: "BT-6E57000001", userId: null, fullName: "Directory Target", email: "directory-target@example.test", phone: "+61400000000", servicePath: "/services/it-support", message: "A guest request with the same email must remain unlinked.", source: "booking-page", status: "NEW", priority: "HIGH", consentVersion: "test", internalNotes: "Private guest note" },
  ]);
});

afterAll(async () => {
  await closeDatabase?.();
  delete process.env.AUTH_E2E_DATABASE_PATH;
  await rm(databasePath, { recursive: true, force: true });
});

describe("administrator customer directory", () => {
  it("rejects every customer read for non-administrators or administrators without MFA", async () => {
    const filters = { page: 1, sort: "registered-desc" as const };
    await expect(repository.listCustomersForAdmin({ id: "customer", role: "user", twoFactorEnabled: true }, filters)).rejects.toMatchObject({ code: "forbidden" });
    await expect(repository.listCustomersForAdmin({ id: "admin", role: "admin", twoFactorEnabled: false }, filters)).rejects.toMatchObject({ code: "forbidden" });
    await expect(repository.getCustomerForAdmin({ id: "customer", role: "user", twoFactorEnabled: true }, targetCustomerId)).rejects.toMatchObject({ code: "forbidden" });
    await expect(repository.countCustomersForReportingPeriod({ id: "customer", role: "user", twoFactorEnabled: true }, "all")).rejects.toMatchObject({ code: "forbidden" });
  });

  it("paginates, searches and sorts registered customers with linked request counts", async () => {
    const first = await repository.listCustomersForAdmin(adminActor, { page: 1, sort: "name-asc" });
    const second = await repository.listCustomersForAdmin(adminActor, { page: 2, sort: "name-asc" });
    expect(first.total).toBe(27);
    expect(first.records).toHaveLength(repository.CUSTOMER_PAGE_SIZE);
    expect(second.records).toHaveLength(2);
    const searched = await repository.listCustomersForAdmin(adminActor, { page: 1, search: "DIRECTORY TARGET", verification: "verified", sort: "requests-desc" });
    expect(searched.records).toHaveLength(1);
    expect(searched.records[0]).toMatchObject({ id: targetCustomerId, emailVerified: true, requestCount: 2 });
  });

  it("returns a minimal account projection and excludes same-email guest requests", async () => {
    const result = await repository.getCustomerForAdmin(adminActor, targetCustomerId);
    expect(result.customer).toMatchObject({ id: targetCustomerId, name: "Directory Target", email: "directory-target@example.test" });
    expect(result.customer).not.toHaveProperty("password");
    expect(result.customer).not.toHaveProperty("twoFactorEnabled");
    expect(result.requests.map(({ reference }) => reference)).toEqual(expect.arrayContaining(["BT-C057000001", "BT-C057000002"]));
    expect(result.requests.map(({ reference }) => reference)).not.toContain("BT-6E57000001");
    expect(result.requests[0]).not.toHaveProperty("message");
    expect(result.requests[0]).not.toHaveProperty("internalNotes");
  });
});

