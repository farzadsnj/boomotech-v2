import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type * as Repository from "./repository";

const databasePath = path.resolve(process.cwd(), ".test-db", `requests-${randomUUID()}`);
let repository: typeof Repository;
let closeDatabase: () => Promise<void>;
let db: (typeof import("@/db"))["db"];
let tables: typeof import("@/db/schema");
const customerOne = randomUUID();
const customerTwo = randomUUID();
const adminId = randomUUID();
let firstReference = "";
let secondReference = "";
let otherReference = "";

const requestData = (message: string) => ({ fullName: "Taylor Smith", email: "taylor@example.com", phone: "+61400000000", servicePath: "/services/it-support", message, source: "booking-page" as const, consent: true as const, website: "" });

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
    { id: customerOne, name: "Taylor Smith", email: "taylor@example.com", emailVerified: true, role: "user" },
    { id: customerTwo, name: "Morgan Lee", email: "morgan@example.com", emailVerified: true, role: "user" },
    { id: adminId, name: "Administrator", email: "admin@example.com", emailVerified: true, role: "admin", username: "farzadsnj" },
  ]);
  const booking = await import("@/features/booking/repository");
  firstReference = (await booking.storeBookingRequest(requestData("The first customer needs detailed help with several office computers."), customerOne)).reference;
  secondReference = (await booking.storeBookingRequest(requestData("A second unread request can be safely withdrawn before processing."), customerOne)).reference;
  otherReference = (await booking.storeBookingRequest({ ...requestData("Another customer owns this separate and private request."), fullName: "Morgan Lee", email: "morgan@example.com" }, customerTwo)).reference;
  await booking.storeBookingRequest(requestData("A guest used the same email but must never be claimed by account matching."), null);
});

afterAll(async () => {
  await closeDatabase?.();
  delete process.env.AUTH_E2E_DATABASE_PATH;
  await rm(databasePath, { recursive: true, force: true });
});

describe("authorised request workflow", () => {
  it("lists only requests linked to the immutable customer id with full descriptions", async () => {
    const records = await repository.listCustomerRequests(customerOne);
    expect(records).toHaveLength(2);
    expect(records.every(({ userId }) => userId === customerOne)).toBe(true);
    expect(records.map(({ message }) => message).join(" ")).toContain("detailed help");
    expect(records.map(({ message }) => message).join(" ")).not.toContain("guest used");
  });

  it("edits an unread NEW request and blocks cross-customer edits", async () => {
    await repository.editCustomerRequest(firstReference, customerOne, "The customer added enough updated detail before processing started.");
    expect((await repository.getCustomerRequest(firstReference, customerOne)).message).toContain("updated detail");
    await expect(repository.editCustomerRequest(otherReference, customerOne, "This edit must not reach another customer's request.")).rejects.toMatchObject({ code: "locked" });
  });

  it("atomically locks editing and withdrawal when the administrator starts processing", async () => {
    await repository.markRequestRead(firstReference, adminId);
    await expect(repository.editCustomerRequest(firstReference, customerOne, "A late edit must fail after the administrator lock.")).rejects.toMatchObject({ code: "locked" });
    await expect(repository.withdrawCustomerRequest(firstReference, customerOne)).rejects.toMatchObject({ code: "locked" });
  });

  it("soft-withdraws an unread NEW request and records its terminal state", async () => {
    await repository.withdrawCustomerRequest(secondReference, customerOne);
    const record = await repository.getCustomerRequest(secondReference, customerOne);
    expect(record.status).toBe("WITHDRAWN");
    expect(record.withdrawnAt).toBeInstanceOf(Date);
  });

  it("stores chronological admin and customer messages and advances the status", async () => {
    await repository.addAdminMessage(firstReference, adminId, "Please confirm whether the affected computers share the same network.");
    expect((await repository.getCustomerRequest(firstReference, customerOne)).status).toBe("AWAITING_USER");
    await repository.addCustomerMessage(firstReference, customerOne, "Yes, all affected computers use the same office network.");
    const record = await repository.getCustomerRequest(firstReference, customerOne);
    expect(record.status).toBe("IN_PROGRESS");
    expect(record.messages.map(({ authorRole }) => authorRole)).toEqual(["admin", "customer"]);
    expect(record.messages[0].createdAt.getTime()).toBeLessThanOrEqual(record.messages[1].createdAt.getTime());
    const queued = await db.select({ kind: tables.notificationOutbox.kind }).from(tables.notificationOutbox).where(eq(tables.notificationOutbox.bookingId, record.id));
    expect(queued.map(({ kind }) => kind)).toContain("REQUEST_ADMIN_REPLY");
  });

  it("resolves and explicitly reopens a request without permitting silent customer reopening", async () => {
    await repository.changeRequestStatus(firstReference, adminId, "RESOLVED");
    expect((await repository.getAdminRequest(firstReference)).resolvedAt).toBeInstanceOf(Date);
    await expect(repository.addCustomerMessage(firstReference, customerOne, "A resolved request must remain read-only.")).rejects.toMatchObject({ code: "locked" });
    await repository.changeRequestStatus(firstReference, adminId, "IN_PROGRESS");
    expect((await repository.getAdminRequest(firstReference)).resolvedAt).toBeNull();
  });

  it("rejects invalid transitions, permits priority changes and keeps row numbers stable across pages", async () => {
    await expect(repository.changeRequestStatus(firstReference, adminId, "NEW")).rejects.toMatchObject({ code: "invalid-transition" });
    await repository.changeRequestPriority(firstReference, adminId, "HIGH");
    const detail = await repository.getAdminRequest(firstReference);
    expect(detail.priority).toBe("HIGH");
    expect(detail.events.some(({ eventType }) => eventType === "ADMIN_CHANGED_PRIORITY")).toBe(true);
    await db.insert(tables.bookingRequest).values(Array.from({ length: 21 }, (_, index) => ({
      id: randomUUID(), reference: `BT-${(index + 100).toString(16).padStart(10, "0").toUpperCase()}`,
      fullName: `Pagination Customer ${index}`, email: `page-${index}@example.test`, phone: "+61400000000",
      servicePath: "/services/it-support", message: "A sufficiently detailed request used to verify administrator pagination.",
      source: "booking-page", status: "NEW", priority: "MEDIUM", consentVersion: "test",
    })));
    const firstPage = await repository.listAdminRequests({ page: 1 });
    const secondPage = await repository.listAdminRequests({ page: 2 });
    expect(firstPage.total).toBe(25);
    expect(firstPage.records[0].rowNumber).toBe(1);
    expect(secondPage.records[0].rowNumber).toBe(21);
  });
});
