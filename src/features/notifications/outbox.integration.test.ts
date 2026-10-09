import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { ServerEmail } from "@/lib/email/resend";

const databasePath = path.resolve(process.cwd(), ".test-db", `outbox-${randomUUID()}`);
let closeDatabase: () => Promise<void>;
let db: (typeof import("@/db"))["db"];
let tables: typeof import("@/db/schema");
let booking: typeof import("@/features/booking/repository");
let requests: typeof import("@/features/requests/repository");
let outbox: typeof import("./outbox");
const adminId = randomUUID();
const customerId = randomUUID();

const requestData = (email: string, message = "A safe request description with enough detail for review.") => ({ fullName: "Taylor <Smith>", email, phone: "+61400000000", servicePath: "/services/it-support", message, source: "booking-page" as const, consent: true as const, website: "" });

beforeAll(async () => {
  await rm(databasePath, { recursive: true, force: true }); await mkdir(path.dirname(databasePath), { recursive: true });
  const client = new PGlite(databasePath);
  for (const name of (await readdir(path.resolve(process.cwd(), "drizzle"))).filter((value) => value.endsWith(".sql")).sort()) {
    const migration = await readFile(path.resolve(process.cwd(), "drizzle", name), "utf8");
    for (const statement of migration.split("--> statement-breakpoint").map((value) => value.trim()).filter(Boolean)) await client.exec(statement);
  }
  await client.close(); process.env.AUTH_E2E_DATABASE_PATH = databasePath;
  process.env.SITE_URL = "https://boomotech.com.au"; process.env.RESEND_API_KEY = "test-only-resend-key"; process.env.BOOKING_NOTIFICATION_EMAIL = "inbox@example.com"; process.env.BOOKING_FROM_EMAIL = "BoomoTech <noreply@example.com>";
  ({ db, closeDatabase } = await import("@/db")); tables = await import("@/db/schema"); booking = await import("@/features/booking/repository"); requests = await import("@/features/requests/repository"); outbox = await import("./outbox");
  await db.insert(tables.user).values([{ id: adminId, name: "Admin", email: "admin@example.com", emailVerified: true, role: "admin" }, { id: customerId, name: "Customer", email: "customer@example.com", emailVerified: true, role: "user" }]);
});

afterAll(async () => { await closeDatabase?.(); delete process.env.AUTH_E2E_DATABASE_PATH; delete process.env.SITE_URL; delete process.env.RESEND_API_KEY; delete process.env.BOOKING_NOTIFICATION_EMAIL; delete process.env.BOOKING_FROM_EMAIL; await rm(databasePath, { recursive: true, force: true }); });

describe("notification outbox", () => {
  it("sends business and safe customer acknowledgements with idempotency keys", async () => {
    await booking.storeBookingRequest(requestData("guest@example.com", "Line one\n<script>alert(1)</script>"), null);
    const sent: ServerEmail[] = []; const result = await outbox.processNotificationOutbox(async (message) => { sent.push(message); });
    expect(result.sent).toBe(2);
    expect(new Set(sent.map(({ idempotencyKey }) => idempotencyKey)).size).toBe(2);
    const acknowledgement = sent.find(({ to }) => to === "guest@example.com")!;
    expect(acknowledgement.text).toContain("not a confirmed appointment"); expect(acknowledgement.text).not.toContain("/dashboard");
    expect(sent.find(({ to }) => to === "inbox@example.com")?.html).toContain("&lt;script&gt;");
  });

  it("notifies guests of admin replies without dashboard links or internal notes", async () => {
    const stored = await booking.storeBookingRequest(requestData("guest-reply@example.com"), null);
    await requests.updateRequestInternalNotes(stored.reference, adminId, "PRIVATE INTERNAL NOTE");
    await requests.addAdminMessage(stored.reference, adminId, "Please restart the affected device and let us know the result.");
    const sent: ServerEmail[] = []; await outbox.processNotificationOutbox(async (message) => { sent.push(message); });
    const reply = sent.find(({ to, subject }) => to === "guest-reply@example.com" && subject.includes("response"))!;
    expect(reply.text).toContain("Please restart"); expect(reply.text).not.toContain("/dashboard"); expect(JSON.stringify(sent)).not.toContain("PRIVATE INTERNAL NOTE");
  });

  it("includes a dashboard link only for verified account customers", async () => {
    await booking.storeBookingRequest(requestData("customer@example.com"), customerId);
    const sent: ServerEmail[] = []; await outbox.processNotificationOutbox(async (message) => { sent.push(message); });
    expect(sent.find(({ to }) => to === "customer@example.com")?.text).toContain("https://boomotech.com.au/dashboard");
  });

  it("delivers customer replies to the inbox and resolution notices to the customer", async () => {
    const stored = await booking.storeBookingRequest(requestData("customer@example.com"), customerId);
    await outbox.processNotificationOutbox(async () => undefined);
    await requests.markRequestRead(stored.reference, adminId);
    await requests.addAdminMessage(stored.reference, adminId, "Could you confirm which device is affected?");
    await outbox.processNotificationOutbox(async () => undefined);
    await requests.addCustomerMessage(stored.reference, customerId, "The reception computer is affected.");
    const customerReply: ServerEmail[] = [];
    await outbox.processNotificationOutbox(async (message) => { customerReply.push(message); });
    expect(customerReply).toHaveLength(1);
    expect(customerReply[0]).toMatchObject({ to: "inbox@example.com", subject: expect.stringContaining("Customer reply") });
    expect(customerReply[0].text).toContain("The reception computer");

    await requests.changeRequestStatus(stored.reference, adminId, "RESOLVED");
    const resolution: ServerEmail[] = [];
    await outbox.processNotificationOutbox(async (message) => { resolution.push(message); });
    expect(resolution).toHaveLength(1);
    expect(resolution[0]).toMatchObject({ to: "customer@example.com", subject: expect.stringContaining("resolved") });
  });

  it("includes an administrator's final response in a send-and-resolve notice", async () => {
    const stored = await booking.storeBookingRequest(requestData("resolved-guest@example.com"), null);
    await outbox.processNotificationOutbox(async () => undefined);
    await requests.addAdminMessage(stored.reference, adminId, "The requested review is complete. Please keep this reference for your records.", true);
    const sent: ServerEmail[] = [];
    await outbox.processNotificationOutbox(async (message) => { sent.push(message); });
    expect(sent).toHaveLength(1);
    expect(sent[0].text).toContain("requested review is complete");
    expect(sent[0].text).not.toContain("/dashboard");
  });

  it("does not duplicate claimed deliveries when workers overlap", async () => {
    const stored = await booking.storeBookingRequest(requestData("concurrent@example.com"), null);
    const keys: string[] = [];
    const send = async (message: ServerEmail) => {
      keys.push(message.idempotencyKey ?? "");
      await new Promise((resolve) => setTimeout(resolve, 10));
    };
    await Promise.all([outbox.processNotificationOutbox(send, 2), outbox.processNotificationOutbox(send, 2)]);
    const expected = [`${stored.id}:BOOKING_CREATED`, `${stored.id}:BOOKING_CUSTOMER_ACK`];
    expect(keys.filter((key) => expected.includes(key)).sort()).toEqual(expected.sort());
  });

  it("recovers a stale fourth attempt for its final bounded delivery", async () => {
    const stored = await booking.storeBookingRequest(requestData("stale-fourth@example.com"), null);
    await db.update(tables.notificationOutbox).set({ status: "sent" }).where(and(eq(tables.notificationOutbox.bookingId, stored.id), eq(tables.notificationOutbox.kind, "BOOKING_CUSTOMER_ACK")));
    const [target] = await db.select().from(tables.notificationOutbox).where(and(eq(tables.notificationOutbox.bookingId, stored.id), eq(tables.notificationOutbox.kind, "BOOKING_CREATED")));
    await db.update(tables.notificationOutbox).set({ status: "processing", attempts: 4, processingStartedAt: new Date(Date.now() - 16 * 60_000), nextAttemptAt: new Date(0) }).where(eq(tables.notificationOutbox.id, target.id));
    const sent = vi.fn().mockResolvedValue(undefined);

    await expect(outbox.processNotificationOutbox(sent, 1)).resolves.toEqual({ sent: 1, failed: 0 });

    const [recovered] = await db.select().from(tables.notificationOutbox).where(eq(tables.notificationOutbox.id, target.id));
    expect(recovered).toMatchObject({ status: "sent", attempts: outbox.OUTBOX_MAX_ATTEMPTS, processingStartedAt: null, lastError: null });
    expect(sent).toHaveBeenCalledTimes(1);
    expect(sent.mock.calls[0][0].idempotencyKey).toBe(target.dedupeKey);
  });

  it("terminally fails an exhausted stale claim and updates booking delivery state", async () => {
    const stored = await booking.storeBookingRequest(requestData("stale-exhausted@example.com"), null);
    await db.update(tables.notificationOutbox).set({ status: "sent" }).where(and(eq(tables.notificationOutbox.bookingId, stored.id), eq(tables.notificationOutbox.kind, "BOOKING_CUSTOMER_ACK")));
    const [target] = await db.select().from(tables.notificationOutbox).where(and(eq(tables.notificationOutbox.bookingId, stored.id), eq(tables.notificationOutbox.kind, "BOOKING_CREATED")));
    await db.update(tables.notificationOutbox).set({ status: "processing", attempts: outbox.OUTBOX_MAX_ATTEMPTS, processingStartedAt: new Date(Date.now() - 16 * 60_000) }).where(eq(tables.notificationOutbox.id, target.id));
    const sent = vi.fn();

    await expect(outbox.processNotificationOutbox(sent, 1)).resolves.toEqual({ sent: 0, failed: 0 });

    const [recovered] = await db.select().from(tables.notificationOutbox).where(eq(tables.notificationOutbox.id, target.id));
    const [savedBooking] = await db.select().from(tables.bookingRequest).where(eq(tables.bookingRequest.id, stored.id));
    expect(recovered).toMatchObject({ status: "failed", attempts: outbox.OUTBOX_MAX_ATTEMPTS, processingStartedAt: null, lastError: "stale-claim-exhausted" });
    expect(savedBooking.notificationStatus).toBe("failed");
    expect(sent).not.toHaveBeenCalled();
  });

  it("allows only one concurrent worker to deliver a recovered stale claim", async () => {
    const stored = await booking.storeBookingRequest(requestData("stale-concurrent@example.com"), null);
    await db.update(tables.notificationOutbox).set({ status: "sent" }).where(and(eq(tables.notificationOutbox.bookingId, stored.id), eq(tables.notificationOutbox.kind, "BOOKING_CUSTOMER_ACK")));
    const [target] = await db.select().from(tables.notificationOutbox).where(and(eq(tables.notificationOutbox.bookingId, stored.id), eq(tables.notificationOutbox.kind, "BOOKING_CREATED")));
    await db.update(tables.notificationOutbox).set({ status: "processing", attempts: 4, processingStartedAt: new Date(Date.now() - 16 * 60_000), nextAttemptAt: new Date(0) }).where(eq(tables.notificationOutbox.id, target.id));
    const keys: string[] = [];
    const send = async (message: ServerEmail) => { keys.push(message.idempotencyKey ?? ""); await new Promise((resolve) => setTimeout(resolve, 10)); };

    await Promise.all([outbox.processNotificationOutbox(send, 1), outbox.processNotificationOutbox(send, 1)]);

    expect(keys).toEqual([target.dedupeKey]);
    const [recovered] = await db.select().from(tables.notificationOutbox).where(eq(tables.notificationOutbox.id, target.id));
    expect(recovered).toMatchObject({ status: "sent", attempts: outbox.OUTBOX_MAX_ATTEMPTS });
  });

  it.each([
    ["RESEND_API_KEY", "missing-resend@example.com"],
    ["BOOKING_FROM_EMAIL", "missing-sender@example.com"],
  ])("does not claim rows when %s is missing", async (name, email) => {
    const stored = await booking.storeBookingRequest(requestData(email), null);
    const before = await db.select().from(tables.notificationOutbox).where(eq(tables.notificationOutbox.bookingId, stored.id));
    const previous = process.env[name];
    delete process.env[name];
    const sent = vi.fn();
    try {
      await expect(outbox.processNotificationOutbox(sent, 2)).rejects.toThrow(name);
    } finally {
      if (previous === undefined) delete process.env[name]; else process.env[name] = previous;
    }
    const after = await db.select().from(tables.notificationOutbox).where(eq(tables.notificationOutbox.bookingId, stored.id));
    expect(after.map(({ id, status, attempts, processingStartedAt }) => ({ id, status, attempts, processingStartedAt })))
      .toEqual(before.map(({ id, status, attempts, processingStartedAt }) => ({ id, status, attempts, processingStartedAt })));
    expect(sent).not.toHaveBeenCalled();
    await db.update(tables.notificationOutbox).set({ status: "sent" }).where(eq(tables.notificationOutbox.bookingId, stored.id));
  });

  it("keeps the booking and schedules retry when the provider is unavailable", async () => {
    const stored = await booking.storeBookingRequest(requestData("provider-down@example.com"), null);
    const result = await outbox.processNotificationOutbox(async () => { throw new TypeError("network unavailable"); }, 2);
    expect(result).toEqual({ sent: 0, failed: 2 });
    const [saved] = await db.select().from(tables.bookingRequest).where(eq(tables.bookingRequest.id, stored.id));
    const rows = await db.select().from(tables.notificationOutbox).where(eq(tables.notificationOutbox.bookingId, stored.id));
    expect(saved.reference).toBe(stored.reference);
    expect(rows.every(({ status, lastError }) => status === "retry" && lastError === "TypeError")).toBe(true);
  });

  it("backs off and permanently fails after the bounded maximum", async () => {
    const stored = await booking.storeBookingRequest(requestData("failure@example.com"), null);
    await db.update(tables.notificationOutbox).set({ status: "sent" }).where(and(eq(tables.notificationOutbox.bookingId, stored.id), eq(tables.notificationOutbox.kind, "BOOKING_CUSTOMER_ACK")));
    const failure = vi.fn().mockRejectedValue(new Error("provider timeout with private detail"));
    for (let attempt = 0; attempt < outbox.OUTBOX_MAX_ATTEMPTS; attempt += 1) {
      await outbox.processNotificationOutbox(failure, 1);
      await db.update(tables.notificationOutbox).set({ nextAttemptAt: new Date(0) }).where(eq(tables.notificationOutbox.bookingId, stored.id));
    }
    const rows = await db.select().from(tables.notificationOutbox).where(eq(tables.notificationOutbox.bookingId, stored.id));
    expect(rows.some(({ status, attempts }) => status === "failed" && attempts === outbox.OUTBOX_MAX_ATTEMPTS)).toBe(true);
    expect(rows.every(({ lastError }) => !lastError?.includes("private detail"))).toBe(true);
  });
});
