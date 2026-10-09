import { randomUUID } from "node:crypto";
import { count, desc } from "drizzle-orm";
import { db } from "@/db";
import { bookingRequest, notificationOutbox } from "@/db/schema";
import type { BookingRequest } from "./booking-schema";

export const ADMIN_BOOKING_PAGE_SIZE = 20;
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
      status: "NEW",
      priority: "MEDIUM",
      consentVersion: BOOKING_CONSENT_VERSION,
      notificationStatus: "pending",
    });
    await transaction.insert(notificationOutbox).values([
      { id: outboxId, bookingId: id, kind: "BOOKING_CREATED", dedupeKey: `${id}:BOOKING_CREATED` },
      { id: randomUUID(), bookingId: id, kind: "BOOKING_CUSTOMER_ACK", dedupeKey: `${id}:BOOKING_CUSTOMER_ACK` },
    ]);
  });

  return { id, reference, outboxId };
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
    priority: bookingRequest.priority,
    notificationStatus: bookingRequest.notificationStatus,
    createdAt: bookingRequest.createdAt,
  }).from(bookingRequest)
    .orderBy(desc(bookingRequest.createdAt))
    .limit(ADMIN_BOOKING_PAGE_SIZE)
    .offset((page - 1) * ADMIN_BOOKING_PAGE_SIZE);

  return { records, total, totalPages: Math.max(1, Math.ceil(total / ADMIN_BOOKING_PAGE_SIZE)) };
}
