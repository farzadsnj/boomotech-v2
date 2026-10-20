import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type * as Repository from "./repository";

const databasePath = path.resolve(process.cwd(), ".test-db", `operations-${randomUUID()}`);
let repository: typeof Repository;
let countCustomersForReportingPeriod: (typeof import("@/features/customers/repository"))["countCustomersForReportingPeriod"];
let closeDatabase: () => Promise<void>;
let db: (typeof import("@/db"))["db"];
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
  ({ countCustomersForReportingPeriod } = await import("@/features/customers/repository"));
});

afterAll(async () => {
  await closeDatabase?.();
  delete process.env.AUTH_E2E_DATABASE_PATH;
  await rm(databasePath, { recursive: true, force: true });
});

describe("administrator operations reporting", () => {
  it("returns meaningful zero-data aggregates and panels", async () => {
    const result = await repository.getAdminOperationsDashboard("all");
    expect(result.summary).toEqual({ NEW: 0, IN_PROGRESS: 0, AWAITING_USER: 0, RESOLVED: 0, WITHDRAWN: 0, total: 0, outstanding: 0, highPriorityOutstanding: 0 });
    expect(result.recentRequests).toEqual([]);
    expect(result.highPriorityRequests).toEqual([]);
    expect(result.recentActivity).toEqual([]);
    expect(await countCustomersForReportingPeriod({ id: "admin-test", role: "admin", twoFactorEnabled: true }, "all")).toBe(0);
  });

  it("counts every status and filters period, priority and outstanding work", async () => {
    const recent = new Date();
    const old = new Date(recent.getTime() - 120 * 24 * 60 * 60 * 1000);
    const customerRecent = randomUUID();
    const customerOld = randomUUID();
    await db.insert(tables.user).values([
      { id: customerRecent, name: "Recent Customer", email: "recent@example.test", emailVerified: true, role: "user", createdAt: recent, updatedAt: recent },
      { id: customerOld, name: "Earlier Customer", email: "earlier@example.test", emailVerified: true, role: "user", createdAt: old, updatedAt: old },
      { id: randomUUID(), name: "Administrator", email: "operations-admin@example.test", emailVerified: true, role: "admin", createdAt: recent, updatedAt: recent },
    ]);
    const requestRows = [
      { id: randomUUID(), reference: "BT-OPS0000001", status: "NEW", priority: "HIGH", createdAt: recent },
      { id: randomUUID(), reference: "BT-OPS0000002", status: "IN_PROGRESS", priority: "HIGH", createdAt: recent },
      { id: randomUUID(), reference: "BT-OPS0000003", status: "AWAITING_USER", priority: "LOW", createdAt: recent },
      { id: randomUUID(), reference: "BT-OPS0000004", status: "RESOLVED", priority: "HIGH", createdAt: recent },
      { id: randomUUID(), reference: "BT-OPS0000005", status: "WITHDRAWN", priority: "MEDIUM", createdAt: recent },
      { id: randomUUID(), reference: "BT-OPS0000006", status: "NEW", priority: "HIGH", createdAt: old },
    ] as const;
    await db.insert(tables.bookingRequest).values(requestRows.map((request) => ({
      ...request, userId: customerRecent, fullName: "Recent Customer", email: "recent@example.test", phone: "+61400000000",
      servicePath: "/services/it-support", message: "A persisted request used to verify the administrator operations dashboard.",
      source: "booking-page", consentVersion: "test", updatedAt: request.createdAt,
    })));
    await db.insert(tables.bookingRequestEvent).values([
      { id: randomUUID(), bookingRequestId: requestRows[1].id, actorRole: "admin", eventType: "ADMIN_STARTED_PROCESSING", fromStatus: "NEW", toStatus: "IN_PROGRESS", createdAt: recent },
      { id: randomUUID(), bookingRequestId: requestRows[3].id, actorRole: "admin", eventType: "ADMIN_RESOLVED_REQUEST", fromStatus: "IN_PROGRESS", toStatus: "RESOLVED", createdAt: recent },
    ]);

    const allTime = await repository.getAdminOperationsDashboard("all");
    expect(allTime.summary).toMatchObject({ total: 6, NEW: 2, IN_PROGRESS: 1, AWAITING_USER: 1, RESOLVED: 1, WITHDRAWN: 1, outstanding: 4, highPriorityOutstanding: 3 });
    expect(allTime.highPriorityRequests.map(({ reference }) => reference)).toEqual(expect.arrayContaining(["BT-OPS0000001", "BT-OPS0000002", "BT-OPS0000006"]));
    expect(allTime.highPriorityRequests.map(({ reference }) => reference)).not.toContain("BT-OPS0000004");
    expect(allTime.recentActivity).toHaveLength(2);

    const lastThirtyDays = await repository.getAdminOperationsDashboard("30d");
    expect(lastThirtyDays.summary).toMatchObject({ total: 5, NEW: 1, outstanding: 3, highPriorityOutstanding: 2 });
    expect(await countCustomersForReportingPeriod({ id: "admin-test", role: "admin", twoFactorEnabled: true }, "30d")).toBe(1);
    expect((await repository.listAdminRequests({ page: 1, period: "30d", scope: "outstanding", priority: "HIGH" })).records.map(({ reference }) => reference)).toEqual(expect.arrayContaining(["BT-OPS0000001", "BT-OPS0000002"]));
  });
});
