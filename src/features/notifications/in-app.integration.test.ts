import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type * as InApp from "./in-app";

const databasePath = path.resolve(process.cwd(), ".test-db", `in-app-notifications-${randomUUID()}`);
const adminOne = { id: randomUUID(), role: "admin", twoFactorEnabled: true } as const;
const adminTwo = { id: randomUUID(), role: "admin", twoFactorEnabled: true } as const;
const customerOne = { id: randomUUID(), role: "user", emailVerified: true } as const;
const customerTwo = { id: randomUUID(), role: "user", emailVerified: true } as const;
let notifications: typeof InApp;
let booking: typeof import("@/features/booking/repository");
let requests: typeof import("@/features/requests/repository");
let db: (typeof import("@/db"))["db"];
let closeDatabase: (typeof import("@/db"))["closeDatabase"];
let tables: typeof import("@/db/schema");
let reference = "";

const requestData = { fullName: "Notification Customer", email: "notification-one@example.test", phone: "+61400000000", servicePath: "/services/it-support", message: "A persisted request used to verify secure notification delivery state.", source: "booking-page" as const, consent: true as const, website: "" };

beforeAll(async () => {
  await rm(databasePath, { recursive: true, force: true });
  await mkdir(path.dirname(databasePath), { recursive: true });
  const client = new PGlite(databasePath);
  for (const name of (await readdir(path.resolve(process.cwd(), "drizzle"))).filter((value) => value.endsWith(".sql")).sort()) {
    const migration = await readFile(path.resolve(process.cwd(), "drizzle", name), "utf8");
    for (const statement of migration.split("--> statement-breakpoint").map((value) => value.trim()).filter(Boolean)) await client.exec(statement);
  }
  await client.close();
  process.env.AUTH_E2E_DATABASE_PATH = databasePath;
  ({ db, closeDatabase } = await import("@/db"));
  tables = await import("@/db/schema");
  booking = await import("@/features/booking/repository");
  requests = await import("@/features/requests/repository");
  notifications = await import("./in-app");
  await db.insert(tables.user).values([
    { id: adminOne.id, name: "Admin One", email: "notification-admin-one@example.test", emailVerified: true, role: "admin", twoFactorEnabled: true },
    { id: adminTwo.id, name: "Admin Two", email: "notification-admin-two@example.test", emailVerified: true, role: "admin", twoFactorEnabled: true },
    { id: customerOne.id, name: "Customer One", email: requestData.email, emailVerified: true, role: "user" },
    { id: customerTwo.id, name: "Customer Two", email: "notification-two@example.test", emailVerified: true, role: "user" },
  ]);
});

afterAll(async () => {
  await closeDatabase?.();
  delete process.env.AUTH_E2E_DATABASE_PATH;
  await rm(databasePath, { recursive: true, force: true });
});

describe("in-app notification delivery", () => {
  it("rejects unverified customers and administrators without completed MFA", async () => {
    await expect(notifications.listInAppNotifications({ id: "customer", role: "user", emailVerified: false })).rejects.toMatchObject({ code: "forbidden" });
    await expect(notifications.listInAppNotifications({ id: "admin", role: "admin", twoFactorEnabled: false })).rejects.toMatchObject({ code: "forbidden" });
  });

  it("creates one role-scoped administrator notification for a new request", async () => {
    const stored = await booking.storeBookingRequest(requestData, customerOne.id);
    reference = stored.reference;
    const firstAdmin = await notifications.listInAppNotifications(adminOne);
    const secondAdmin = await notifications.listInAppNotifications(adminTwo);
    expect(firstAdmin.records).toHaveLength(1);
    expect(firstAdmin.records[0]).toMatchObject({ kind: "ADMIN_NEW_REQUEST", href: `/admin/requests/${stored.reference}`, readAt: null });
    expect(firstAdmin.records[0]).not.toHaveProperty("email");
    expect(secondAdmin.unreadCount).toBe(1);

    await notifications.markInAppNotificationRead(adminOne, firstAdmin.records[0].id);
    expect((await notifications.listInAppNotifications(adminOne)).unreadCount).toBe(0);
    expect((await notifications.listInAppNotifications(adminTwo)).unreadCount).toBe(1);

    const outboxRows = await db.select({ status: tables.notificationOutbox.status }).from(tables.notificationOutbox).where(eq(tables.notificationOutbox.bookingId, stored.id));
    expect(outboxRows).toHaveLength(2);
    expect(outboxRows.every(({ status }) => status === "pending")).toBe(true);
  });

  it("keeps customer notifications account-owned and links only to the authorised request", async () => {
    await requests.markRequestRead(reference, adminOne.id);
    await requests.addAdminMessage(reference, adminOne.id, "Please confirm whether the issue affects more than one device.");
    const owner = await notifications.listInAppNotifications(customerOne);
    expect(owner.records.map(({ kind }) => kind)).toEqual(["CUSTOMER_ADMIN_REPLY", "CUSTOMER_STATUS_CHANGED"]);
    expect(owner.records.every(({ href }) => href === `/dashboard?request=${reference}#request-${reference}`)).toBe(true);
    expect((await notifications.listInAppNotifications(customerTwo)).records).toEqual([]);
    await expect(notifications.markInAppNotificationRead(customerTwo, owner.records[0].id)).rejects.toMatchObject({ code: "not-found" });

    await requests.addCustomerMessage(reference, customerOne.id, "The problem affects the reception and accounts computers.");
    const administrator = await notifications.listInAppNotifications(adminOne);
    expect(administrator.records.some(({ kind }) => kind === "ADMIN_CUSTOMER_REPLY")).toBe(true);
    expect(JSON.stringify(administrator.records)).not.toContain("reception and accounts");
  });

  it("marks all accessible notifications without changing another recipient's read state", async () => {
    const before = await notifications.listInAppNotifications(customerOne);
    expect(before.unreadCount).toBeGreaterThan(0);
    await notifications.markAllInAppNotificationsRead(customerOne);
    expect((await notifications.listInAppNotifications(customerOne)).unreadCount).toBe(0);
    expect((await notifications.listInAppNotifications(adminTwo)).unreadCount).toBeGreaterThan(0);
  });

  it("enforces database deduplication independently from email delivery retries", async () => {
    const [existing] = await db.select().from(tables.inAppNotification).where(eq(tables.inAppNotification.kind, "ADMIN_NEW_REQUEST")).limit(1);
    await expect(db.insert(tables.inAppNotification).values({
      id: randomUUID(), recipientRole: "admin", bookingRequestId: existing.bookingRequestId,
      kind: "ADMIN_NEW_REQUEST", dedupeKey: existing.dedupeKey,
    })).rejects.toThrow();
    const duplicates = await db.select().from(tables.inAppNotification).where(and(eq(tables.inAppNotification.kind, "ADMIN_NEW_REQUEST"), eq(tables.inAppNotification.dedupeKey, existing.dedupeKey)));
    expect(duplicates).toHaveLength(1);
  });
});
