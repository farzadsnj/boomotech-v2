import { randomUUID } from "node:crypto";
import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookingRequest, notificationOutbox } from "@/db/schema";
import type { BookingRequest } from "./booking-schema";

export const ADMIN_BOOKING_PAGE_SIZE = 20;
export const CUSTOMER_BOOKING_PAGE_SIZE = 10;
export const BOOKING_CONSENT_VERSION = "2026-10-03";

function createReference() {
  return `BT-${randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
}

export async function storeBookingRequest(request: BookingRequest, userId: string | null) {
  const id = randomUUID();
  const reference = createReference();
  const outboxId = randomUUID();

  await db.transaction(async (transaction) => {
    await transaction.insert(bookingRequest).values({
      id,
      reference,
      userId,
      fullName: request.fullName,
      email: request.email,
      phone: request.phone,
      servicePath: request.servicePath,
      message: request.message,
      source: request.source,
      status: "new",
      consentVersion: BOOKING_CONSENT_VERSION,
      notificationStatus: "pending",
    });
    await transaction.insert(notificationOutbox).values({ id: outboxId, bookingId: id });
  });

  return { id, reference, outboxId };
}

export async function recordBookingNotification(
  bookingId: string,
  outboxId: string,
  status: "sent" | "failed",
  errorCode?: "configuration" | "delivery",
) {
  const now = new Date();
  await db.transaction(async (transaction) => {
    await transaction.update(bookingRequest)
      .set({ notificationStatus: status, updatedAt: now })
      .where(eq(bookingRequest.id, bookingId));
    await transaction.update(notificationOutbox).set({
      status,
      attempts: sql`${notificationOutbox.attempts} + 1`,
      lastError: errorCode ?? null,
      sentAt: status === "sent" ? now : null,
      updatedAt: now,
    }).where(eq(notificationOutbox.id, outboxId));
  });
}

export async function listAdminBookings(page: number) {
  const [{ total }] = await db.select({ total: count() }).from(bookingRequest);
  const records = await db.select({
    id: bookingRequest.id,
    reference: bookingRequest.reference,
    fullName: bookingRequest.fullName,
    email: bookingRequest.email,
    phone: bookingRequest.phone,
    servicePath: bookingRequest.servicePath,
    message: bookingRequest.message,
    source: bookingRequest.source,
    status: bookingRequest.status,
    notificationStatus: bookingRequest.notificationStatus,
    createdAt: bookingRequest.createdAt,
  }).from(bookingRequest)
    .orderBy(desc(bookingRequest.createdAt))
    .limit(ADMIN_BOOKING_PAGE_SIZE)
    .offset((page - 1) * ADMIN_BOOKING_PAGE_SIZE);

  return { records, total, totalPages: Math.max(1, Math.ceil(total / ADMIN_BOOKING_PAGE_SIZE)) };
}

export async function listCustomerBookings(userId: string) {
  return db.select({
    id: bookingRequest.id,
    reference: bookingRequest.reference,
    servicePath: bookingRequest.servicePath,
    status: bookingRequest.status,
    createdAt: bookingRequest.createdAt,
  }).from(bookingRequest)
    .where(eq(bookingRequest.userId, userId))
    .orderBy(desc(bookingRequest.createdAt))
    .limit(CUSTOMER_BOOKING_PAGE_SIZE);
}
