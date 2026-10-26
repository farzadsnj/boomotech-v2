import { randomUUID } from "node:crypto";
import { and, count, desc, eq, lte } from "drizzle-orm";
import { db } from "@/db";
import { bookingRequest, inAppNotification, notificationOutbox } from "@/db/schema";
import type { BookingRequestInput } from "./booking-schema";
import { bookingRequestSchema, formatBookingMessage } from "./booking-schema";

export const ADMIN_BOOKING_PAGE_SIZE = 20;
export const BOOKING_CONSENT_VERSION = "2026-10-03";

function createReference() {
  return `BT-${randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
}

export class BookingSubmissionConflictError extends Error {}

type SubmissionIdentity = {
  key: string;
  scopeHash: string;
  payloadHash: string;
  expiresAt: Date;
};

export async function storeBookingRequest(input: BookingRequestInput, userId: string | null, submission?: SubmissionIdentity) {
  const request = bookingRequestSchema.parse(input);
  const id = randomUUID();
  const reference = createReference();
  const outboxId = randomUUID();

  return db.transaction(async (transaction) => {
    if (submission) {
      await transaction.update(bookingRequest).set({
        submissionKey: null,
        submissionScopeHash: null,
        submissionPayloadHash: null,
        submissionExpiresAt: null,
      }).where(and(
        eq(bookingRequest.submissionScopeHash, submission.scopeHash),
        eq(bookingRequest.submissionKey, submission.key),
        lte(bookingRequest.submissionExpiresAt, new Date()),
      ));
    }

    const [inserted] = await transaction.insert(bookingRequest).values({
      id,
      reference,
      userId,
      fullName: request.fullName,
      email: request.email,
      phone: request.phone,
      servicePath: request.servicePath,
      message: formatBookingMessage(request),
      source: request.source,
      status: "NEW",
      priority: "MEDIUM",
      consentVersion: BOOKING_CONSENT_VERSION,
      notificationStatus: "pending",
      submissionKey: submission?.key,
      submissionScopeHash: submission?.scopeHash,
      submissionPayloadHash: submission?.payloadHash,
      submissionExpiresAt: submission?.expiresAt,
    }).onConflictDoNothing().returning({ id: bookingRequest.id });

    if (!inserted && submission) {
      const [existing] = await transaction.select({
        id: bookingRequest.id,
        reference: bookingRequest.reference,
        payloadHash: bookingRequest.submissionPayloadHash,
      }).from(bookingRequest).where(and(
        eq(bookingRequest.submissionScopeHash, submission.scopeHash),
        eq(bookingRequest.submissionKey, submission.key),
      )).limit(1);
      if (existing?.payloadHash === submission.payloadHash) {
        return { id: existing.id, reference: existing.reference, outboxId: null, replayed: true };
      }
      throw new BookingSubmissionConflictError("The submission key was already used for different information.");
    }

    await transaction.insert(notificationOutbox).values([
      { id: outboxId, bookingId: id, kind: "BOOKING_CREATED", dedupeKey: `${id}:BOOKING_CREATED` },
      { id: randomUUID(), bookingId: id, kind: "BOOKING_CUSTOMER_ACK", dedupeKey: `${id}:BOOKING_CUSTOMER_ACK` },
    ]);
    await transaction.insert(inAppNotification).values({
      id: randomUUID(), recipientRole: "admin", bookingRequestId: id,
      kind: "ADMIN_NEW_REQUEST", dedupeKey: `${id}:ADMIN_NEW_REQUEST`,
    });
    return { id, reference, outboxId, replayed: false };
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
    priority: bookingRequest.priority,
    notificationStatus: bookingRequest.notificationStatus,
    createdAt: bookingRequest.createdAt,
  }).from(bookingRequest)
    .orderBy(desc(bookingRequest.createdAt))
    .limit(ADMIN_BOOKING_PAGE_SIZE)
    .offset((page - 1) * ADMIN_BOOKING_PAGE_SIZE);

  return { records, total, totalPages: Math.max(1, Math.ceil(total / ADMIN_BOOKING_PAGE_SIZE)) };
}
