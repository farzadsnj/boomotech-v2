import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type * as AnalyticsRepository from "./repository";

const databasePath = path.resolve(process.cwd(), ".test-db", `analytics-${randomUUID()}`);
const adminActor = { id: "analytics-admin", role: "admin", twoFactorEnabled: true } as const;
const now = new Date("2026-10-18T02:30:00Z");
let repository: typeof AnalyticsRepository;
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
});

afterAll(async () => {
  await closeDatabase?.();
  delete process.env.AUTH_E2E_DATABASE_PATH;
  await rm(databasePath, { recursive: true, force: true });
});

describe("administrator analytics", () => {
  it("checks administrator and MFA access before returning analytics", async () => {
    await expect(repository.getAdminAnalytics({ id: "customer", role: "user", twoFactorEnabled: true }, "7d", now)).rejects.toMatchObject({ code: "forbidden" });
    await expect(repository.getAdminAnalytics({ id: "admin", role: "admin", twoFactorEnabled: false }, "7d", now)).rejects.toMatchObject({ code: "forbidden" });
  });

  it("returns complete zero-filled date buckets for an empty dataset", async () => {
    const result = await repository.getAdminAnalytics(adminActor, "7d", now);
    expect(result.daily).toHaveLength(7);
    expect(result.daily.map(({ date }) => date)).toEqual(["2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18"]);
    expect(result.summary).toEqual({ requestsReceived: 0, requestsResolved: 0, outstanding: 0, highPriorityOutstanding: 0, registeredCustomers: 0 });
    expect(result.services).toEqual([]);
    expect(result.statuses.every(({ count }) => count === 0)).toBe(true);
  });

  it("aggregates request, workload, service, status and customer data accurately", async () => {
    const created12 = new Date("2026-10-12T01:00:00Z");
    const created17 = new Date("2026-10-17T01:00:00Z");
    const created18 = new Date("2026-10-18T01:00:00Z");
    const old = new Date("2026-10-01T01:00:00Z");
    await db.insert(tables.user).values([
      { id: randomUUID(), name: "New Customer", email: "analytics-new@example.test", emailVerified: true, role: "user", createdAt: new Date("2026-10-13T01:00:00Z"), updatedAt: now },
      { id: randomUUID(), name: "Old Customer", email: "analytics-old@example.test", emailVerified: true, role: "user", createdAt: old, updatedAt: now },
      { id: randomUUID(), name: "Admin Account", email: "analytics-admin@example.test", emailVerified: true, role: "admin", createdAt: created17, updatedAt: now },
    ]);
    const base = { fullName: "Aggregate only", email: "aggregate@example.test", phone: "+61400000000", message: "An aggregate reporting fixture.", source: "booking-page", consentVersion: "test" };
    await db.insert(tables.bookingRequest).values([
      { ...base, id: randomUUID(), reference: "BT-AN00000001", servicePath: "/services/it-support", status: "NEW", priority: "HIGH", createdAt: created12, updatedAt: created12 },
      { ...base, id: randomUUID(), reference: "BT-AN00000002", servicePath: "/services/network-wifi", status: "RESOLVED", priority: "LOW", createdAt: created17, updatedAt: created18, resolvedAt: created18 },
      { ...base, id: randomUUID(), reference: "BT-AN00000003", servicePath: "/services/network-wifi", status: "AWAITING_USER", priority: "HIGH", createdAt: created18, updatedAt: created18 },
      { ...base, id: randomUUID(), reference: "BT-AN00000004", servicePath: "/services/cybersecurity", status: "RESOLVED", priority: "HIGH", createdAt: old, updatedAt: created12, resolvedAt: created12 },
    ]);

    const result = await repository.getAdminAnalytics(adminActor, "7d", now);
    expect(result.summary).toEqual({ requestsReceived: 3, requestsResolved: 2, outstanding: 2, highPriorityOutstanding: 2, registeredCustomers: 1 });
    expect(result.services).toEqual([
      { servicePath: "/services/network-wifi", label: "Network and Wi-Fi", count: 2 },
      { servicePath: "/services/it-support", label: "IT support", count: 1 },
    ]);
    expect(Object.fromEntries(result.statuses.map(({ status, count }) => [status, count]))).toMatchObject({ NEW: 1, AWAITING_USER: 1, RESOLVED: 1, IN_PROGRESS: 0, WITHDRAWN: 0 });
    expect(result.daily.find(({ date }) => date === "2026-10-12")).toMatchObject({ received: 1, resolved: 1 });
    expect(result.daily.find(({ date }) => date === "2026-10-18")).toMatchObject({ received: 1, resolved: 1 });
    expect(result.daily.find(({ date }) => date === "2026-10-13")).toMatchObject({ customers: 1 });
  });
});
