import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type * as CalendarRepository from "./repository";

const databasePath = path.resolve(process.cwd(), ".test-db", `calendar-${randomUUID()}`);
const adminActor = { id: "calendar-admin", role: "admin", twoFactorEnabled: true } as const;
let repository: typeof CalendarRepository;
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

  const base = { fullName: "Calendar fixture", email: "private@example.test", phone: "+61400000000", message: "Private request detail must not be projected into calendar data.", source: "booking-page", consentVersion: "test" };
  const resolvedRequestId = randomUUID();
  await db.insert(tables.bookingRequest).values([
    { ...base, id: randomUUID(), reference: "BT-CAL0000001", servicePath: "/services/it-support", status: "NEW", priority: "MEDIUM", createdAt: new Date("2026-09-30T14:00:00Z"), updatedAt: new Date("2026-09-30T14:00:00Z") },
    { ...base, id: resolvedRequestId, reference: "BT-CAL0000002", servicePath: "/services/network-wifi", status: "IN_PROGRESS", priority: "HIGH", createdAt: new Date("2026-10-10T02:00:00Z"), updatedAt: new Date("2026-10-31T13:30:00Z") },
    { ...base, id: randomUUID(), reference: "BT-CAL0000003", servicePath: "/services/network-wifi", status: "NEW", priority: "LOW", createdAt: new Date("2026-10-31T14:30:00Z"), updatedAt: new Date("2026-10-31T14:30:00Z") },
  ]);
  await db.insert(tables.bookingRequestEvent).values({
    id: randomUUID(), bookingRequestId: resolvedRequestId, actorRole: "admin", eventType: "ADMIN_RESOLVED_REQUEST",
    fromStatus: "IN_PROGRESS", toStatus: "RESOLVED", createdAt: new Date("2026-10-31T13:30:00Z"),
  });
});

afterAll(async () => {
  await closeDatabase?.();
  delete process.env.AUTH_E2E_DATABASE_PATH;
  await rm(databasePath, { recursive: true, force: true });
});

describe("administrator request activity calendar", () => {
  it("rejects customers and administrators without completed MFA", async () => {
    await expect(repository.getAdminRequestActivity({ id: "customer", role: "user", twoFactorEnabled: true }, { month: "2026-10" })).rejects.toMatchObject({ code: "forbidden" });
    await expect(repository.getAdminRequestActivity({ id: "admin", role: "admin", twoFactorEnabled: false }, { month: "2026-10" })).rejects.toMatchObject({ code: "forbidden" });
  });

  it("returns creation and resolution events within exact Brisbane month boundaries", async () => {
    const result = await repository.getAdminRequestActivity(adminActor, { month: "2026-10" });
    expect(result.counts).toEqual({ created: 2, resolved: 1, total: 3 });
    expect(result.events.map(({ date, reference, type }) => ({ date, reference, type }))).toEqual([
      { date: "2026-10-01", reference: "BT-CAL0000001", type: "created" },
      { date: "2026-10-10", reference: "BT-CAL0000002", type: "created" },
      { date: "2026-10-31", reference: "BT-CAL0000002", type: "resolved" },
    ]);
    expect(result.events[0]).not.toHaveProperty("email");
    expect(result.events[0]).not.toHaveProperty("fullName");
    expect(result.events[0].href).toBe("/admin/requests/BT-CAL0000001");
    expect(result.events.find(({ type }) => type === "resolved")?.status).toBe("IN_PROGRESS");
  });

  it("filters by event type and service using the approved catalogue", async () => {
    const created = await repository.getAdminRequestActivity(adminActor, { eventType: "created", month: "2026-10", servicePath: "/services/network-wifi" });
    expect(created.events).toHaveLength(1);
    expect(created.events[0]).toMatchObject({ reference: "BT-CAL0000002", serviceLabel: "Network and Wi-Fi", type: "created" });
    const resolved = await repository.getAdminRequestActivity(adminActor, { eventType: "resolved", month: "2026-10" });
    expect(resolved.events).toHaveLength(1);
    expect(resolved.events[0].type).toBe("resolved");
  });

  it("returns an honest empty result for a month without activity", async () => {
    const result = await repository.getAdminRequestActivity(adminActor, { month: "2026-09" });
    expect(result.events).toEqual([]);
    expect(result.counts).toEqual({ created: 0, resolved: 0, total: 0 });
  });
});
