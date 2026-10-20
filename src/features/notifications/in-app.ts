import { and, count, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookingRequest, inAppNotification, inAppNotificationRead } from "@/db/schema";
import { serviceLabel } from "@/features/booking/booking-schema";
import { customerRequestHref } from "@/features/requests/links";
import { canAccessAdminDashboard, canAccessCustomerDashboard } from "@/lib/auth/access";

export const NOTIFICATION_PAGE_SIZE = 20;
export const RECENT_NOTIFICATION_LIMIT = 6;

export type InAppNotificationKind = "ADMIN_NEW_REQUEST" | "ADMIN_CUSTOMER_REPLY" | "CUSTOMER_ADMIN_REPLY" | "CUSTOMER_STATUS_CHANGED" | "CUSTOMER_REQUEST_RESOLVED";
export type NotificationActor = { id: string; role?: string | null; emailVerified?: boolean; twoFactorEnabled?: boolean | null };
type NotificationAudience = "admin" | "customer";

export class InAppNotificationError extends Error {
  constructor(public readonly code: "forbidden" | "not-found") { super(code); }
}

function audienceFor(actor: NotificationActor): NotificationAudience {
  if (canAccessAdminDashboard({ user: actor })) return "admin";
  if (actor.role !== "admin" && canAccessCustomerDashboard({ user: actor })) return "customer";
  throw new InAppNotificationError("forbidden");
}

function accessCondition(actor: NotificationActor, audience: NotificationAudience) {
  return audience === "admin"
    ? and(eq(inAppNotification.recipientRole, "admin"), isNull(inAppNotification.recipientUserId))
    : and(eq(inAppNotification.recipientRole, "customer"), eq(inAppNotification.recipientUserId, actor.id));
}

function notificationCopy(kind: string, reference: string, servicePath: string) {
  const service = serviceLabel(servicePath);
  if (kind === "ADMIN_NEW_REQUEST") return { title: `New request ${reference}`, description: `${service} request received.` };
  if (kind === "ADMIN_CUSTOMER_REPLY") return { title: `Customer replied to ${reference}`, description: `Review the latest ${service} conversation.` };
  if (kind === "CUSTOMER_ADMIN_REPLY") return { title: `BoomoTech replied to ${reference}`, description: `Review the secure ${service} conversation.` };
  if (kind === "CUSTOMER_REQUEST_RESOLVED") return { title: `Request ${reference} resolved`, description: `Review the completed ${service} request.` };
  return { title: `Request ${reference} updated`, description: `Review the latest status for your ${service} request.` };
}

export async function listInAppNotifications(actor: NotificationActor, page = 1, limit = NOTIFICATION_PAGE_SIZE) {
  const audience = audienceFor(actor);
  const safePage = Math.max(1, Math.trunc(page));
  const safeLimit = Math.min(NOTIFICATION_PAGE_SIZE, Math.max(1, Math.trunc(limit)));
  const access = accessCondition(actor, audience);
  const readJoin = and(eq(inAppNotificationRead.notificationId, inAppNotification.id), eq(inAppNotificationRead.userId, actor.id));
  const [records, [{ total }], [{ unreadCount }]] = await Promise.all([
    db.select({
      id: inAppNotification.id,
      kind: inAppNotification.kind,
      createdAt: inAppNotification.createdAt,
      readAt: inAppNotificationRead.readAt,
      reference: bookingRequest.reference,
      servicePath: bookingRequest.servicePath,
    }).from(inAppNotification)
      .innerJoin(bookingRequest, eq(inAppNotification.bookingRequestId, bookingRequest.id))
      .leftJoin(inAppNotificationRead, readJoin)
      .where(access)
      .orderBy(desc(inAppNotification.createdAt), desc(inAppNotification.id))
      .limit(safeLimit).offset((safePage - 1) * safeLimit),
    db.select({ total: count() }).from(inAppNotification).where(access),
    db.select({ unreadCount: count() }).from(inAppNotification).leftJoin(inAppNotificationRead, readJoin).where(and(access, isNull(inAppNotificationRead.notificationId))),
  ]);

  return {
    records: records.map((record) => ({
      id: record.id,
      kind: record.kind as InAppNotificationKind,
      createdAt: record.createdAt,
      readAt: record.readAt,
      ...notificationCopy(record.kind, record.reference, record.servicePath),
      href: audience === "admin" ? `/admin/requests/${record.reference}` : customerRequestHref(record.reference),
    })),
    total,
    unreadCount,
    page: safePage,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  };
}

export async function markInAppNotificationRead(actor: NotificationActor, notificationId: string) {
  const audience = audienceFor(actor);
  const [record] = await db.select({ id: inAppNotification.id }).from(inAppNotification)
    .where(and(eq(inAppNotification.id, notificationId), accessCondition(actor, audience))).limit(1);
  if (!record) throw new InAppNotificationError("not-found");
  await db.insert(inAppNotificationRead).values({ notificationId: record.id, userId: actor.id }).onConflictDoNothing();
  return { id: record.id };
}

export async function markAllInAppNotificationsRead(actor: NotificationActor) {
  const audience = audienceFor(actor);
  const access = accessCondition(actor, audience);
  const result = await db.insert(inAppNotificationRead).select(
    db.select({
      notificationId: inAppNotification.id,
      userId: sql<string>`${actor.id}`.as("user_id"),
      readAt: sql<Date>`now()`.as("read_at"),
    }).from(inAppNotification).where(access),
  ).onConflictDoNothing().returning({ notificationId: inAppNotificationRead.notificationId });
  return { marked: result.length };
}
