import { and, asc, eq, gte, inArray, lt, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookingRequest, bookingRequestMessage, notificationOutbox, user } from "@/db/schema";
import { serviceLabel } from "@/features/booking/booking-schema";
import { validateNotificationWorkerEnvironment, type NotificationWorkerConfiguration } from "@/features/notifications/config";
import { sendEmailWithResend, type ServerEmail } from "@/lib/email/resend";
import { renderBrandedEmail } from "@/lib/email/template";
import { customerRequestHref } from "@/features/requests/links";

export const OUTBOX_MAX_ATTEMPTS = 5;
export const OUTBOX_BATCH_SIZE = 20;
export const OUTBOX_CLAIM_TIMEOUT_MINUTES = 15;

export type NotificationKind = "BOOKING_CREATED" | "BOOKING_CUSTOMER_ACK" | "REQUEST_ADMIN_REPLY" | "REQUEST_CUSTOMER_REPLY" | "REQUEST_RESOLVED";
type ClaimedNotification = { id: string; bookingId: string; kind: NotificationKind; dedupeKey: string; requestMessageId: string | null; attempts: number; processingStartedAt: Date };

export type NotificationContext = {
  reference: string;
  fullName: string;
  email: string;
  phone: string;
  servicePath: string;
  requestBody: string;
  messageBody: string | null;
  verifiedAccount: boolean;
  createdAt: Date;
};

function dashboardLink(context: NotificationContext, configuration: NotificationWorkerConfiguration) {
  return context.verifiedAccount ? new URL(customerRequestHref(context.reference), configuration.siteUrl).toString() : null;
}

function adminLink(context: NotificationContext, configuration: NotificationWorkerConfiguration) {
  return new URL(`/admin/requests/${encodeURIComponent(context.reference)}`, configuration.siteUrl).toString();
}

function submittedAt(value: Date) {
  return new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Brisbane" }).format(value);
}

export function buildNotificationEmail(kind: NotificationKind, context: NotificationContext, configuration: NotificationWorkerConfiguration): Omit<ServerEmail, "from" | "idempotencyKey"> {
  const service = serviceLabel(context.servicePath);
  const dashboard = dashboardLink(context, configuration);
  const safety = "Do not send passwords, MFA codes, recovery keys or payment-card information by email.";
  if (kind === "BOOKING_CREATED") {
    const body = renderBrandedEmail({ approvedOrigin: configuration.siteUrl, preheader: `New request ${context.reference}`, heading: "New customer request", greeting: "Hello BoomoTech team,", introduction: "A new request has been saved and is ready for protected review.", fields: [
      { label: "Reference", value: context.reference }, { label: "Service", value: service }, { label: "Submitted", value: submittedAt(context.createdAt) },
      { label: "Name", value: context.fullName }, { label: "Email", value: context.email }, ...(context.phone ? [{ label: "Phone", value: context.phone }] : []),
    ], message: { label: "Customer message", value: context.requestBody }, action: { label: "View request", url: adminLink(context, configuration) }, safety });
    return { to: configuration.adminEmail, subject: `New request ${context.reference}: ${service}`, ...body };
  }
  if (kind === "REQUEST_CUSTOMER_REPLY") {
    const body = renderBrandedEmail({ approvedOrigin: configuration.siteUrl, preheader: `Customer reply for ${context.reference}`, heading: "A customer has replied", greeting: "Hello BoomoTech team,", introduction: "A customer added a message to an existing request.", fields: [{ label: "Reference", value: context.reference }, { label: "Customer", value: context.fullName }, { label: "Service", value: service }], message: { label: "Customer reply", value: context.messageBody ?? "" }, action: { label: "View request", url: adminLink(context, configuration) }, safety });
    return { to: configuration.adminEmail, subject: `Customer reply ${context.reference}`, ...body };
  }
  if (kind === "BOOKING_CUSTOMER_ACK") {
    const body = renderBrandedEmail({ approvedOrigin: configuration.siteUrl, preheader: `We received request ${context.reference}`, heading: "We’ve received your request", greeting: `Hi ${context.fullName || "there"},`, introduction: "Thank you for contacting BoomoTech. Your request has been saved for review.", fields: [{ label: "Reference", value: context.reference }, { label: "Service", value: service }], paragraphs: ["BoomoTech will review the information and contact you using the details supplied if clarification or next steps are needed.", "This request is not a confirmed appointment. Scope, availability and any work must be agreed separately."], ...(dashboard ? { action: { label: "View your request", url: dashboard } } : {}), safety });
    return { to: context.email, subject: `BoomoTech request received: ${context.reference}`, replyTo: configuration.customerReplyTo, ...body };
  }
  if (kind === "REQUEST_ADMIN_REPLY") {
    const body = renderBrandedEmail({ approvedOrigin: configuration.siteUrl, preheader: `An update for request ${context.reference}`, heading: "BoomoTech has replied", greeting: `Hi ${context.fullName || "there"},`, introduction: `There is a new response for request ${context.reference}.`, fields: [{ label: "Reference", value: context.reference }, { label: "Service", value: service }], message: { label: "BoomoTech response", value: context.messageBody ?? "" }, paragraphs: dashboard ? ["Use your verified account to review the conversation securely."] : ["This request was submitted as a guest. The response is included here; you do not need to create an account to receive it."], ...(dashboard ? { action: { label: "View conversation", url: dashboard } } : {}), safety });
    return { to: context.email, subject: `BoomoTech response: ${context.reference}`, replyTo: configuration.customerReplyTo, ...body };
  }
  const body = renderBrandedEmail({ approvedOrigin: configuration.siteUrl, preheader: `Request ${context.reference} was marked resolved`, heading: "Your request has been marked resolved", greeting: `Hi ${context.fullName || "there"},`, introduction: `BoomoTech has marked request ${context.reference} as resolved.`, fields: [{ label: "Reference", value: context.reference }, { label: "Service", value: service }], ...(context.messageBody ? { message: { label: "Resolution note", value: context.messageBody } } : {}), paragraphs: ["If you need help with a separate issue or more work is required, send a new request through the secure request form."], ...(dashboard ? { action: { label: "Review request", url: dashboard } } : { action: { label: "Send another request", url: new URL("/booking", configuration.siteUrl).toString() } }), safety });
  return { to: context.email, subject: `Request resolved: ${context.reference}`, replyTo: configuration.customerReplyTo, ...body };
}

async function recoverStaleClaims(transaction: Parameters<Parameters<typeof db.transaction>[0]>[0], now: Date, staleBefore: Date) {
  const exhausted = await transaction.update(notificationOutbox).set({
    status: "failed",
    lastError: "stale-claim-exhausted",
    processingStartedAt: null,
    updatedAt: now,
  }).where(and(
    eq(notificationOutbox.status, "processing"),
    lte(notificationOutbox.processingStartedAt, staleBefore),
    gte(notificationOutbox.attempts, OUTBOX_MAX_ATTEMPTS),
  )).returning({ bookingId: notificationOutbox.bookingId, kind: notificationOutbox.kind });

  const failedBookingIds = exhausted.filter(({ kind }) => kind === "BOOKING_CREATED").map(({ bookingId }) => bookingId);
  if (failedBookingIds.length > 0) {
    await transaction.update(bookingRequest).set({ notificationStatus: "failed", updatedAt: now }).where(inArray(bookingRequest.id, failedBookingIds));
  }

  await transaction.update(notificationOutbox).set({
    status: "retry",
    lastError: "stale-claim-recovered",
    nextAttemptAt: now,
    processingStartedAt: null,
    updatedAt: now,
  }).where(and(
    eq(notificationOutbox.status, "processing"),
    lte(notificationOutbox.processingStartedAt, staleBefore),
    lt(notificationOutbox.attempts, OUTBOX_MAX_ATTEMPTS),
  ));
}

async function claimNext(): Promise<ClaimedNotification | null> {
  return db.transaction(async (transaction) => {
    const now = new Date();
    const staleBefore = new Date(now.getTime() - OUTBOX_CLAIM_TIMEOUT_MINUTES * 60_000);
    await recoverStaleClaims(transaction, now, staleBefore);
    const [candidate] = await transaction.select({ id: notificationOutbox.id })
      .from(notificationOutbox)
      .where(and(
        lt(notificationOutbox.attempts, OUTBOX_MAX_ATTEMPTS),
        lte(notificationOutbox.nextAttemptAt, now),
        inArray(notificationOutbox.status, ["pending", "retry"]),
      ))
      .orderBy(asc(notificationOutbox.nextAttemptAt), asc(notificationOutbox.createdAt))
      .limit(1)
      .for("update", { skipLocked: true });
    if (!candidate) return null;
    const [claimed] = await transaction.update(notificationOutbox).set({
      status: "processing",
      processingStartedAt: now,
      attempts: sql`${notificationOutbox.attempts} + 1`,
      updatedAt: now,
    }).where(eq(notificationOutbox.id, candidate.id)).returning({
      id: notificationOutbox.id,
      bookingId: notificationOutbox.bookingId,
      kind: notificationOutbox.kind,
      dedupeKey: notificationOutbox.dedupeKey,
      requestMessageId: notificationOutbox.requestMessageId,
      attempts: notificationOutbox.attempts,
      processingStartedAt: notificationOutbox.processingStartedAt,
    });
    return claimed as ClaimedNotification;
  });
}

async function contextFor(item: ClaimedNotification): Promise<NotificationContext> {
  const [record] = await db.select({
    reference: bookingRequest.reference, fullName: bookingRequest.fullName, email: bookingRequest.email,
    phone: bookingRequest.phone, servicePath: bookingRequest.servicePath, requestBody: bookingRequest.message,
    userId: bookingRequest.userId, emailVerified: user.emailVerified, createdAt: bookingRequest.createdAt,
  }).from(bookingRequest).leftJoin(user, eq(bookingRequest.userId, user.id)).where(eq(bookingRequest.id, item.bookingId)).limit(1);
  if (!record) throw new Error("booking-not-found");
  let messageBody: string | null = null;
  if (item.requestMessageId) {
    const [message] = await db.select({ body: bookingRequestMessage.body }).from(bookingRequestMessage).where(eq(bookingRequestMessage.id, item.requestMessageId)).limit(1);
    messageBody = message?.body ?? null;
  }
  return { ...record, messageBody, verifiedAccount: Boolean(record.userId && record.emailVerified) };
}

async function markSent(item: ClaimedNotification) {
  const now = new Date();
  await db.transaction(async (transaction) => {
    const updated = await transaction.update(notificationOutbox).set({ status: "sent", sentAt: now, lastError: null, processingStartedAt: null, updatedAt: now }).where(and(eq(notificationOutbox.id, item.id), eq(notificationOutbox.status, "processing"), eq(notificationOutbox.attempts, item.attempts), eq(notificationOutbox.processingStartedAt, item.processingStartedAt))).returning({ id: notificationOutbox.id });
    if (updated.length > 0 && item.kind === "BOOKING_CREATED") await transaction.update(bookingRequest).set({ notificationStatus: "sent", updatedAt: now }).where(eq(bookingRequest.id, item.bookingId));
  });
}

async function markFailed(item: ClaimedNotification, error: unknown) {
  const permanent = item.attempts >= OUTBOX_MAX_ATTEMPTS;
  const delayMinutes = Math.min(60, 2 ** Math.max(0, item.attempts - 1));
  const nextAttemptAt = new Date(Date.now() + delayMinutes * 60_000);
  const errorCode = error instanceof Error ? error.name.slice(0, 80) : "delivery-error";
  await db.transaction(async (transaction) => {
    const updated = await transaction.update(notificationOutbox).set({ status: permanent ? "failed" : "retry", lastError: errorCode, nextAttemptAt, processingStartedAt: null, updatedAt: new Date() }).where(and(eq(notificationOutbox.id, item.id), eq(notificationOutbox.status, "processing"), eq(notificationOutbox.attempts, item.attempts), eq(notificationOutbox.processingStartedAt, item.processingStartedAt))).returning({ id: notificationOutbox.id });
    if (updated.length > 0 && permanent && item.kind === "BOOKING_CREATED") await transaction.update(bookingRequest).set({ notificationStatus: "failed", updatedAt: new Date() }).where(eq(bookingRequest.id, item.bookingId));
  });
}

export async function processNotificationOutbox(send: (message: ServerEmail) => Promise<void> = sendEmailWithResend, limit = OUTBOX_BATCH_SIZE) {
  const configuration = validateNotificationWorkerEnvironment();
  let sent = 0; let failed = 0;
  for (let index = 0; index < limit; index += 1) {
    const item = await claimNext();
    if (!item) break;
    try {
      const context = await contextFor(item);
      const email = buildNotificationEmail(item.kind, context, configuration);
      await send({ ...email, from: configuration.fromEmail, idempotencyKey: item.dedupeKey });
      await markSent(item); sent += 1;
    } catch (error) {
      await markFailed(item, error); failed += 1;
    }
  }
  return { sent, failed };
}
