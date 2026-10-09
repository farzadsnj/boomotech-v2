import { and, asc, eq, inArray, lt, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookingRequest, bookingRequestMessage, notificationOutbox, user } from "@/db/schema";
import { serviceLabel } from "@/features/booking/booking-schema";
import { escapeEmailHtml, preserveEmailLineBreaks, sendEmailWithResend, type ServerEmail } from "@/lib/email/resend";
import { getSiteUrl } from "@/lib/site-url";

export const OUTBOX_MAX_ATTEMPTS = 5;
export const OUTBOX_BATCH_SIZE = 20;
const CLAIM_TIMEOUT_MINUTES = 15;

export type NotificationKind = "BOOKING_CREATED" | "BOOKING_CUSTOMER_ACK" | "REQUEST_ADMIN_REPLY" | "REQUEST_CUSTOMER_REPLY" | "REQUEST_RESOLVED";
type ClaimedNotification = { id: string; bookingId: string; kind: NotificationKind; dedupeKey: string; requestMessageId: string | null; attempts: number };

export type NotificationContext = {
  reference: string;
  fullName: string;
  email: string;
  phone: string;
  servicePath: string;
  requestBody: string;
  messageBody: string | null;
  verifiedAccount: boolean;
};

function customerReplyTo() { return process.env.CUSTOMER_REPLY_TO_EMAIL?.trim() || undefined; }
function adminAddress() { return process.env.BOOKING_NOTIFICATION_EMAIL?.trim(); }
function fromAddress() { return process.env.BOOKING_FROM_EMAIL?.trim(); }
function dashboardLink(context: NotificationContext) { return context.verifiedAccount ? new URL("/dashboard", getSiteUrl()).toString() : null; }

function frame(title: string, paragraphs: string[]) {
  return `<h1>${escapeEmailHtml(title)}</h1>${paragraphs.map((value) => `<p>${preserveEmailLineBreaks(value)}</p>`).join("")}`;
}

export function buildNotificationEmail(kind: NotificationKind, context: NotificationContext): Omit<ServerEmail, "from" | "idempotencyKey"> {
  const service = serviceLabel(context.servicePath);
  const dashboard = dashboardLink(context);
  const safety = "Do not send passwords, MFA codes, recovery keys or payment-card information by email.";
  if (kind === "BOOKING_CREATED") {
    const fields = [`Reference: ${context.reference}`, `Name: ${context.fullName}`, `Email: ${context.email}`, `Phone: ${context.phone}`, `Service: ${service}`, `Message: ${context.requestBody}`];
    return { to: adminAddress() ?? "", subject: `New request ${context.reference}: ${service}`, text: ["New booking request", "", ...fields].join("\n"), html: frame("New booking request", fields) };
  }
  if (kind === "REQUEST_CUSTOMER_REPLY") {
    const fields = [`Reference: ${context.reference}`, `Customer: ${context.fullName}`, `Service: ${service}`, `Customer reply: ${context.messageBody ?? ""}`];
    return { to: adminAddress() ?? "", subject: `Customer reply ${context.reference}`, text: fields.join("\n\n"), html: frame("Customer replied", fields) };
  }
  if (kind === "BOOKING_CUSTOMER_ACK") {
    const lines = [`Thank you for contacting BoomoTech.`, `Reference: ${context.reference}`, `Requested service: ${service}`, "This is a request, not a confirmed appointment. BoomoTech will review it before scope and availability are agreed.", safety, ...(dashboard ? [`View your verified account requests: ${dashboard}`] : [])];
    return { to: context.email, subject: `BoomoTech request received: ${context.reference}`, replyTo: customerReplyTo(), text: lines.join("\n\n"), html: frame("Your request has been received", lines) };
  }
  if (kind === "REQUEST_ADMIN_REPLY") {
    const lines = [`BoomoTech has responded to request ${context.reference}.`, context.messageBody ?? "", ...(dashboard ? [`View the conversation securely in your dashboard: ${dashboard}`] : ["This request was submitted as a guest. This email contains the response; no account is required."]), safety];
    return { to: context.email, subject: `BoomoTech response: ${context.reference}`, replyTo: customerReplyTo(), text: lines.join("\n\n"), html: frame("BoomoTech response", lines) };
  }
  const lines = [`Request ${context.reference} has been marked resolved.`, ...(context.messageBody ? [context.messageBody] : []), "If more work is required, submit a new request or contact BoomoTech through the secure booking form.", ...(dashboard ? [`Review your request history: ${dashboard}`] : []), safety];
  return { to: context.email, subject: `Request resolved: ${context.reference}`, replyTo: customerReplyTo(), text: lines.join("\n\n"), html: frame("Request resolved", lines) };
}

async function claimNext(): Promise<ClaimedNotification | null> {
  return db.transaction(async (transaction) => {
    const now = new Date();
    const staleBefore = new Date(now.getTime() - CLAIM_TIMEOUT_MINUTES * 60_000);
    const [candidate] = await transaction.select({ id: notificationOutbox.id })
      .from(notificationOutbox)
      .where(and(
        lt(notificationOutbox.attempts, OUTBOX_MAX_ATTEMPTS),
        lte(notificationOutbox.nextAttemptAt, now),
        or(
          inArray(notificationOutbox.status, ["pending", "retry"]),
          and(eq(notificationOutbox.status, "processing"), lte(notificationOutbox.processingStartedAt, staleBefore)),
        ),
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
    });
    return claimed as ClaimedNotification;
  });
}

async function contextFor(item: ClaimedNotification): Promise<NotificationContext> {
  const [record] = await db.select({
    reference: bookingRequest.reference, fullName: bookingRequest.fullName, email: bookingRequest.email,
    phone: bookingRequest.phone, servicePath: bookingRequest.servicePath, requestBody: bookingRequest.message,
    userId: bookingRequest.userId, emailVerified: user.emailVerified,
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
    await transaction.update(notificationOutbox).set({ status: "sent", sentAt: now, lastError: null, processingStartedAt: null, updatedAt: now }).where(and(eq(notificationOutbox.id, item.id), eq(notificationOutbox.status, "processing")));
    if (item.kind === "BOOKING_CREATED") await transaction.update(bookingRequest).set({ notificationStatus: "sent", updatedAt: now }).where(eq(bookingRequest.id, item.bookingId));
  });
}

async function markFailed(item: ClaimedNotification, error: unknown) {
  const permanent = item.attempts >= OUTBOX_MAX_ATTEMPTS;
  const delayMinutes = Math.min(60, 2 ** Math.max(0, item.attempts - 1));
  const nextAttemptAt = new Date(Date.now() + delayMinutes * 60_000);
  const errorCode = error instanceof Error ? error.name.slice(0, 80) : "delivery-error";
  await db.transaction(async (transaction) => {
    await transaction.update(notificationOutbox).set({ status: permanent ? "failed" : "retry", lastError: errorCode, nextAttemptAt, processingStartedAt: null, updatedAt: new Date() }).where(and(eq(notificationOutbox.id, item.id), eq(notificationOutbox.status, "processing")));
    if (permanent && item.kind === "BOOKING_CREATED") await transaction.update(bookingRequest).set({ notificationStatus: "failed", updatedAt: new Date() }).where(eq(bookingRequest.id, item.bookingId));
  });
}

export async function processNotificationOutbox(send: (message: ServerEmail) => Promise<void> = sendEmailWithResend, limit = OUTBOX_BATCH_SIZE) {
  const from = fromAddress();
  if (!from || !adminAddress()) throw new Error("Notification delivery configuration is incomplete.");
  let sent = 0; let failed = 0;
  for (let index = 0; index < limit; index += 1) {
    const item = await claimNext();
    if (!item) break;
    try {
      const context = await contextFor(item);
      const email = buildNotificationEmail(item.kind, context);
      await send({ ...email, from, idempotencyKey: item.dedupeKey });
      await markSent(item); sent += 1;
    } catch (error) {
      await markFailed(item, error); failed += 1;
    }
  }
  return { sent, failed };
}
