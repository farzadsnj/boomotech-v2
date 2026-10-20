import { randomUUID } from "node:crypto";
import { and, asc, count, desc, eq, gt, gte, ilike, inArray, isNull, lt, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookingRequest, bookingRequestEvent, bookingRequestMessage, inAppNotification, notificationOutbox } from "@/db/schema";
import { reportingPeriodStart, type ReportingPeriod } from "@/features/dashboard/reporting";
import { analyticsDateRange, type AnalyticsPeriod } from "@/features/analytics/range";
import type { RequestPriority, RequestStatus } from "./workflow";
import { canTransitionRequest } from "./workflow";

export const ADMIN_REQUEST_PAGE_SIZE = 20;
export const CUSTOMER_REQUEST_PAGE_SIZE = 20;

export class RequestWorkflowError extends Error {
  constructor(public readonly code: "not-found" | "forbidden" | "locked" | "invalid-transition" | "conflict") {
    super(code);
  }
}

export type AdminRequestSort = "created-desc" | "created-asc" | "updated-desc" | "updated-asc";
type AdminFilters = { page: number; period?: ReportingPeriod; dateField?: "resolved"; scope?: "outstanding"; status?: RequestStatus; priority?: RequestPriority; service?: string; search?: string; sort?: AdminRequestSort };

const activeRequestStatuses: RequestStatus[] = ["NEW", "IN_PROGRESS", "AWAITING_USER"];

const requestProjection = {
  id: bookingRequest.id,
  reference: bookingRequest.reference,
  userId: bookingRequest.userId,
  fullName: bookingRequest.fullName,
  email: bookingRequest.email,
  phone: bookingRequest.phone,
  servicePath: bookingRequest.servicePath,
  message: bookingRequest.message,
  source: bookingRequest.source,
  status: bookingRequest.status,
  priority: bookingRequest.priority,
  readAt: bookingRequest.readAt,
  resolvedAt: bookingRequest.resolvedAt,
  withdrawnAt: bookingRequest.withdrawnAt,
  createdAt: bookingRequest.createdAt,
  updatedAt: bookingRequest.updatedAt,
  version: bookingRequest.version,
};

const adminRequestProjection = {
  ...requestProjection,
  internalNotes: bookingRequest.internalNotes,
};

const customerRequestProjection = {
  id: bookingRequest.id,
  reference: bookingRequest.reference,
  userId: bookingRequest.userId,
  servicePath: bookingRequest.servicePath,
  message: bookingRequest.message,
  status: bookingRequest.status,
  readAt: bookingRequest.readAt,
  resolvedAt: bookingRequest.resolvedAt,
  withdrawnAt: bookingRequest.withdrawnAt,
  createdAt: bookingRequest.createdAt,
  updatedAt: bookingRequest.updatedAt,
  version: bookingRequest.version,
};

function statusOf(value: string) { return value as RequestStatus; }
function priorityOf(value: string) { return value as RequestPriority; }

async function messagesFor(requestIds: string[]) {
  if (!requestIds.length) return new Map<string, Awaited<ReturnType<typeof selectMessages>>>();
  const rows = await selectMessages(requestIds);
  const grouped = new Map<string, typeof rows>();
  for (const row of rows) grouped.set(row.bookingRequestId, [...(grouped.get(row.bookingRequestId) ?? []), row]);
  return grouped;
}

function selectMessages(requestIds: string[]) {
  return db.select({
    id: bookingRequestMessage.id,
    bookingRequestId: bookingRequestMessage.bookingRequestId,
    authorRole: bookingRequestMessage.authorRole,
    body: bookingRequestMessage.body,
    createdAt: bookingRequestMessage.createdAt,
  }).from(bookingRequestMessage)
    .where(inArray(bookingRequestMessage.bookingRequestId, requestIds))
    .orderBy(asc(bookingRequestMessage.createdAt), asc(bookingRequestMessage.id));
}

export async function listCustomerRequests(userId: string, page = 1) {
  const [{ total }] = await db.select({ total: count() }).from(bookingRequest).where(eq(bookingRequest.userId, userId));
  const records = await db.select(customerRequestProjection).from(bookingRequest)
    .where(eq(bookingRequest.userId, userId))
    .orderBy(desc(bookingRequest.updatedAt), desc(bookingRequest.id))
    .limit(CUSTOMER_REQUEST_PAGE_SIZE)
    .offset((page - 1) * CUSTOMER_REQUEST_PAGE_SIZE);
  const messages = await messagesFor(records.map(({ id }) => id));
  return { records: records.map((record) => ({
    ...record,
    status: statusOf(record.status),
    messages: messages.get(record.id) ?? [],
  })), total, totalPages: Math.max(1, Math.ceil(total / CUSTOMER_REQUEST_PAGE_SIZE)) };
}

export async function findCustomerRequestPage(userId: string, reference: string) {
  const [target] = await db.select({ id: bookingRequest.id, updatedAt: bookingRequest.updatedAt })
    .from(bookingRequest)
    .where(and(eq(bookingRequest.userId, userId), eq(bookingRequest.reference, reference)))
    .limit(1);
  if (!target) return null;
  const [{ preceding }] = await db.select({ preceding: count() }).from(bookingRequest).where(and(
    eq(bookingRequest.userId, userId),
    or(
      gt(bookingRequest.updatedAt, target.updatedAt),
      and(eq(bookingRequest.updatedAt, target.updatedAt), gt(bookingRequest.id, target.id)),
    ),
  ));
  return Math.floor(preceding / CUSTOMER_REQUEST_PAGE_SIZE) + 1;
}

export async function getCustomerRequestOverview(userId: string) {
  const [statusRows, awaitingRequests] = await Promise.all([
    db.select({ status: bookingRequest.status, total: count() }).from(bookingRequest)
      .where(eq(bookingRequest.userId, userId))
      .groupBy(bookingRequest.status),
    db.select({
      reference: bookingRequest.reference,
      servicePath: bookingRequest.servicePath,
      updatedAt: bookingRequest.updatedAt,
    }).from(bookingRequest)
      .where(and(eq(bookingRequest.userId, userId), eq(bookingRequest.status, "AWAITING_USER")))
      .orderBy(desc(bookingRequest.updatedAt), desc(bookingRequest.id))
      .limit(3),
  ]);
  const counts: Record<RequestStatus, number> = { NEW: 0, IN_PROGRESS: 0, AWAITING_USER: 0, RESOLVED: 0, WITHDRAWN: 0 };
  for (const row of statusRows) counts[statusOf(row.status)] = row.total;
  return {
    total: Object.values(counts).reduce((sum, value) => sum + value, 0),
    active: counts.NEW + counts.IN_PROGRESS,
    awaitingUser: counts.AWAITING_USER,
    resolved: counts.RESOLVED,
    awaitingRequests,
  };
}

export async function getCustomerRequest(reference: string, userId: string) {
  const [record] = await db.select(customerRequestProjection).from(bookingRequest)
    .where(and(eq(bookingRequest.reference, reference), eq(bookingRequest.userId, userId))).limit(1);
  if (!record) throw new RequestWorkflowError("not-found");
  const messages = await selectMessages([record.id]);
  return { ...record, status: statusOf(record.status), messages };
}

export async function editCustomerRequest(reference: string, userId: string, description: string) {
  return db.transaction(async (transaction) => {
    const now = new Date();
    const [updated] = await transaction.update(bookingRequest).set({
      message: description,
      updatedAt: now,
      version: sql`${bookingRequest.version} + 1`,
    }).where(and(
      eq(bookingRequest.reference, reference),
      eq(bookingRequest.userId, userId),
      eq(bookingRequest.status, "NEW"),
      isNull(bookingRequest.readAt),
      isNull(bookingRequest.withdrawnAt),
    )).returning({ id: bookingRequest.id, reference: bookingRequest.reference });
    if (!updated) throw new RequestWorkflowError("locked");
    await transaction.insert(bookingRequestEvent).values({
      id: randomUUID(), bookingRequestId: updated.id, actorUserId: userId,
      actorRole: "customer", eventType: "CUSTOMER_EDITED_DESCRIPTION",
    });
    return updated;
  });
}

export async function withdrawCustomerRequest(reference: string, userId: string) {
  return db.transaction(async (transaction) => {
    const now = new Date();
    const [updated] = await transaction.update(bookingRequest).set({
      status: "WITHDRAWN", withdrawnAt: now, updatedAt: now,
      version: sql`${bookingRequest.version} + 1`,
    }).where(and(
      eq(bookingRequest.reference, reference),
      eq(bookingRequest.userId, userId),
      eq(bookingRequest.status, "NEW"),
      isNull(bookingRequest.readAt),
      isNull(bookingRequest.withdrawnAt),
    )).returning({ id: bookingRequest.id, reference: bookingRequest.reference });
    if (!updated) throw new RequestWorkflowError("locked");
    await transaction.insert(bookingRequestEvent).values({
      id: randomUUID(), bookingRequestId: updated.id, actorUserId: userId,
      actorRole: "customer", eventType: "CUSTOMER_WITHDREW_REQUEST", fromStatus: "NEW", toStatus: "WITHDRAWN",
    });
    return updated;
  });
}

export async function addCustomerMessage(reference: string, userId: string, body: string) {
  return db.transaction(async (transaction) => {
    const [record] = await transaction.select({ id: bookingRequest.id, status: bookingRequest.status, version: bookingRequest.version })
      .from(bookingRequest).where(and(eq(bookingRequest.reference, reference), eq(bookingRequest.userId, userId))).limit(1);
    if (!record) throw new RequestWorkflowError("not-found");
    if (record.status === "WITHDRAWN" || record.status === "RESOLVED" || record.status === "NEW") throw new RequestWorkflowError("locked");
    const now = new Date();
    const nextStatus = record.status === "AWAITING_USER" ? "IN_PROGRESS" : record.status;
    const [updated] = await transaction.update(bookingRequest).set({
      status: nextStatus, updatedAt: now, version: sql`${bookingRequest.version} + 1`,
    }).where(and(eq(bookingRequest.id, record.id), eq(bookingRequest.version, record.version), ne(bookingRequest.status, "RESOLVED"), ne(bookingRequest.status, "WITHDRAWN")))
      .returning({ id: bookingRequest.id });
    if (!updated) throw new RequestWorkflowError("conflict");
    const messageId = randomUUID();
    await transaction.insert(bookingRequestMessage).values({ id: messageId, bookingRequestId: record.id, authorUserId: userId, authorRole: "customer", body });
    await transaction.insert(bookingRequestEvent).values({
      id: randomUUID(), bookingRequestId: record.id, actorUserId: userId, actorRole: "customer",
      eventType: "CUSTOMER_REPLIED", fromStatus: record.status, toStatus: nextStatus,
    });
    await transaction.insert(notificationOutbox).values({
      id: randomUUID(), bookingId: record.id, requestMessageId: messageId,
      kind: "REQUEST_CUSTOMER_REPLY", dedupeKey: `${messageId}:REQUEST_CUSTOMER_REPLY`,
    });
    await transaction.insert(inAppNotification).values({
      id: randomUUID(), recipientRole: "admin", bookingRequestId: record.id, requestMessageId: messageId,
      kind: "ADMIN_CUSTOMER_REPLY", dedupeKey: `${messageId}:ADMIN_CUSTOMER_REPLY`,
    });
    return { reference, messageId, status: statusOf(nextStatus) };
  });
}

function adminWhere(filters: AdminFilters, now: Date) {
  const conditions = [];
  if (filters.dateField && filters.period && filters.period !== "all") {
    const { start, endExclusive } = analyticsDateRange(filters.period as AnalyticsPeriod, now);
    conditions.push(gte(bookingRequest.resolvedAt, start), lt(bookingRequest.resolvedAt, endExclusive));
  } else {
    const periodStart = reportingPeriodStart(filters.period ?? "all");
    if (periodStart) conditions.push(gte(bookingRequest.createdAt, periodStart));
  }
  if (filters.scope === "outstanding") conditions.push(inArray(bookingRequest.status, activeRequestStatuses));
  if (filters.status) conditions.push(eq(bookingRequest.status, filters.status));
  if (filters.priority) conditions.push(eq(bookingRequest.priority, filters.priority));
  if (filters.service) conditions.push(eq(bookingRequest.servicePath, filters.service));
  if (filters.search) {
    const pattern = `%${filters.search.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
    conditions.push(or(ilike(bookingRequest.reference, pattern), ilike(bookingRequest.fullName, pattern), ilike(bookingRequest.email, pattern), ilike(bookingRequest.message, pattern))!);
  }
  return conditions.length ? and(...conditions) : undefined;
}

export async function listAdminRequests(filters: AdminFilters, now = new Date()) {
  const where = adminWhere(filters, now);
  const [{ total }] = await db.select({ total: count() }).from(bookingRequest).where(where);
  const sort = filters.sort ?? "created-desc";
  const ordering = sort === "created-asc" ? [asc(bookingRequest.createdAt), asc(bookingRequest.id)]
    : sort === "updated-desc" ? [desc(bookingRequest.updatedAt), desc(bookingRequest.id)]
      : sort === "updated-asc" ? [asc(bookingRequest.updatedAt), asc(bookingRequest.id)]
        : [desc(bookingRequest.createdAt), desc(bookingRequest.id)];
  const records = await db.select(requestProjection).from(bookingRequest).where(where)
    .orderBy(...ordering).limit(ADMIN_REQUEST_PAGE_SIZE).offset((filters.page - 1) * ADMIN_REQUEST_PAGE_SIZE);
  return {
    records: records.map((record, index) => ({
      ...record,
      status: statusOf(record.status), priority: priorityOf(record.priority),
      rowNumber: (filters.page - 1) * ADMIN_REQUEST_PAGE_SIZE + index + 1,
    })),
    total,
    totalPages: Math.max(1, Math.ceil(total / ADMIN_REQUEST_PAGE_SIZE)),
  };
}

export async function getAdminOperationsDashboard(period: ReportingPeriod) {
  const periodStart = reportingPeriodStart(period);
  const requestPeriodWhere = periodStart ? gte(bookingRequest.createdAt, periodStart) : undefined;
  const eventPeriodWhere = periodStart ? gte(bookingRequestEvent.createdAt, periodStart) : undefined;
  const outstandingWhere = and(requestPeriodWhere, inArray(bookingRequest.status, activeRequestStatuses));
  const highPriorityWhere = and(outstandingWhere, eq(bookingRequest.priority, "HIGH"));
  const [aggregateRows, recentRequests, highPriorityRequests, recentActivity] = await Promise.all([
    db.select({ status: bookingRequest.status, priority: bookingRequest.priority, total: count() })
      .from(bookingRequest).where(requestPeriodWhere).groupBy(bookingRequest.status, bookingRequest.priority),
    db.select({
      id: bookingRequest.id, reference: bookingRequest.reference, fullName: bookingRequest.fullName,
      servicePath: bookingRequest.servicePath, status: bookingRequest.status, priority: bookingRequest.priority,
      createdAt: bookingRequest.createdAt,
    }).from(bookingRequest).where(requestPeriodWhere)
      .orderBy(desc(bookingRequest.createdAt), desc(bookingRequest.id)).limit(6),
    db.select({
      id: bookingRequest.id, reference: bookingRequest.reference, fullName: bookingRequest.fullName,
      servicePath: bookingRequest.servicePath, status: bookingRequest.status, priority: bookingRequest.priority,
      createdAt: bookingRequest.createdAt,
    }).from(bookingRequest).where(highPriorityWhere)
      .orderBy(desc(bookingRequest.createdAt), desc(bookingRequest.id)).limit(5),
    db.select({
      id: bookingRequestEvent.id, eventType: bookingRequestEvent.eventType,
      fromStatus: bookingRequestEvent.fromStatus, toStatus: bookingRequestEvent.toStatus,
      fromPriority: bookingRequestEvent.fromPriority, toPriority: bookingRequestEvent.toPriority,
      createdAt: bookingRequestEvent.createdAt, reference: bookingRequest.reference,
      servicePath: bookingRequest.servicePath,
    }).from(bookingRequestEvent)
      .innerJoin(bookingRequest, eq(bookingRequestEvent.bookingRequestId, bookingRequest.id))
      .where(eventPeriodWhere).orderBy(desc(bookingRequestEvent.createdAt), desc(bookingRequestEvent.id)).limit(8),
  ]);
  const summary: Record<RequestStatus, number> & { total: number; outstanding: number; highPriorityOutstanding: number } = {
    NEW: 0, IN_PROGRESS: 0, AWAITING_USER: 0, RESOLVED: 0, WITHDRAWN: 0,
    total: 0, outstanding: 0, highPriorityOutstanding: 0,
  };
  for (const row of aggregateRows) {
    const status = statusOf(row.status);
    summary[status] += row.total;
    summary.total += row.total;
    if (activeRequestStatuses.includes(status)) {
      summary.outstanding += row.total;
      if (row.priority === "HIGH") summary.highPriorityOutstanding += row.total;
    }
  }
  return {
    summary,
    recentRequests: recentRequests.map((request) => ({ ...request, status: statusOf(request.status), priority: priorityOf(request.priority) })),
    highPriorityRequests: highPriorityRequests.map((request) => ({ ...request, status: statusOf(request.status), priority: priorityOf(request.priority) })),
    recentActivity,
  };
}

export async function getAdminRequest(reference: string) {
  const [record] = await db.select(adminRequestProjection).from(bookingRequest).where(eq(bookingRequest.reference, reference)).limit(1);
  if (!record) throw new RequestWorkflowError("not-found");
  const [messages, events] = await Promise.all([
    selectMessages([record.id]),
    db.select({ id: bookingRequestEvent.id, eventType: bookingRequestEvent.eventType, actorRole: bookingRequestEvent.actorRole, fromStatus: bookingRequestEvent.fromStatus, toStatus: bookingRequestEvent.toStatus, fromPriority: bookingRequestEvent.fromPriority, toPriority: bookingRequestEvent.toPriority, createdAt: bookingRequestEvent.createdAt })
      .from(bookingRequestEvent).where(eq(bookingRequestEvent.bookingRequestId, record.id)).orderBy(asc(bookingRequestEvent.createdAt), asc(bookingRequestEvent.id)),
  ]);
  return { ...record, status: statusOf(record.status), priority: priorityOf(record.priority), messages, events };
}

export async function updateRequestInternalNotes(reference: string, adminUserId: string, notes: string, expectedVersion?: number) {
  return db.transaction(async (transaction) => {
    const [record] = await transaction.select({ id: bookingRequest.id, version: bookingRequest.version }).from(bookingRequest)
      .where(eq(bookingRequest.reference, reference)).limit(1);
    if (!record) throw new RequestWorkflowError("not-found");
    if (expectedVersion !== undefined && record.version !== expectedVersion) throw new RequestWorkflowError("conflict");
    const version = expectedVersion ?? record.version;
    const [updated] = await transaction.update(bookingRequest).set({
      internalNotes: notes || null,
      updatedAt: new Date(),
      version: sql`${bookingRequest.version} + 1`,
    }).where(and(eq(bookingRequest.id, record.id), eq(bookingRequest.version, version))).returning({ id: bookingRequest.id, version: bookingRequest.version });
    if (!updated) throw new RequestWorkflowError("conflict");
    await transaction.insert(bookingRequestEvent).values({
      id: randomUUID(), bookingRequestId: record.id, actorUserId: adminUserId,
      actorRole: "admin", eventType: "ADMIN_UPDATED_INTERNAL_NOTES",
    });
    return { reference, version: updated.version };
  });
}

export async function markRequestRead(reference: string, adminUserId: string, expectedVersion?: number) {
  return db.transaction(async (transaction) => {
    const [record] = await transaction.select({ id: bookingRequest.id, userId: bookingRequest.userId, version: bookingRequest.version }).from(bookingRequest).where(eq(bookingRequest.reference, reference)).limit(1);
    if (!record) throw new RequestWorkflowError("not-found");
    if (expectedVersion !== undefined && record.version !== expectedVersion) throw new RequestWorkflowError("conflict");
    const now = new Date();
    const [updated] = await transaction.update(bookingRequest).set({ status: "IN_PROGRESS", readAt: now, readByAdminId: adminUserId, updatedAt: now, version: sql`${bookingRequest.version} + 1` })
      .where(and(eq(bookingRequest.id, record.id), eq(bookingRequest.version, expectedVersion ?? record.version), eq(bookingRequest.status, "NEW"), isNull(bookingRequest.readAt)))
      .returning({ id: bookingRequest.id, version: bookingRequest.version });
    if (!updated) throw new RequestWorkflowError("locked");
    await transaction.insert(bookingRequestEvent).values({ id: randomUUID(), bookingRequestId: updated.id, actorUserId: adminUserId, actorRole: "admin", eventType: "ADMIN_STARTED_PROCESSING", fromStatus: "NEW", toStatus: "IN_PROGRESS" });
    if (record.userId) await transaction.insert(inAppNotification).values({
      id: randomUUID(), recipientRole: "customer", recipientUserId: record.userId, bookingRequestId: record.id,
      kind: "CUSTOMER_STATUS_CHANGED", dedupeKey: `${record.id}:${updated.version}:CUSTOMER_STATUS_CHANGED`,
    });
    return { reference, status: "IN_PROGRESS" as const, version: updated.version };
  });
}

export async function changeRequestPriority(reference: string, adminUserId: string, priority: RequestPriority, expectedVersion?: number) {
  return db.transaction(async (transaction) => {
    const [record] = await transaction.select({ id: bookingRequest.id, priority: bookingRequest.priority, version: bookingRequest.version }).from(bookingRequest).where(eq(bookingRequest.reference, reference)).limit(1);
    if (!record) throw new RequestWorkflowError("not-found");
    if (expectedVersion !== undefined && record.version !== expectedVersion) throw new RequestWorkflowError("conflict");
    if (record.priority === priority) return { reference, priority, version: record.version };
    const [updated] = await transaction.update(bookingRequest).set({ priority, updatedAt: new Date(), version: sql`${bookingRequest.version} + 1` })
      .where(and(eq(bookingRequest.id, record.id), eq(bookingRequest.version, expectedVersion ?? record.version))).returning({ id: bookingRequest.id, version: bookingRequest.version });
    if (!updated) throw new RequestWorkflowError("conflict");
    await transaction.insert(bookingRequestEvent).values({ id: randomUUID(), bookingRequestId: record.id, actorUserId: adminUserId, actorRole: "admin", eventType: "ADMIN_CHANGED_PRIORITY", fromPriority: record.priority, toPriority: priority });
    return { reference, priority, version: updated.version };
  });
}

export async function changeRequestStatus(reference: string, adminUserId: string, nextStatus: RequestStatus, expectedVersion?: number) {
  return db.transaction(async (transaction) => {
    const [record] = await transaction.select({ id: bookingRequest.id, userId: bookingRequest.userId, status: bookingRequest.status, readAt: bookingRequest.readAt, version: bookingRequest.version }).from(bookingRequest).where(eq(bookingRequest.reference, reference)).limit(1);
    if (!record) throw new RequestWorkflowError("not-found");
    if (expectedVersion !== undefined && record.version !== expectedVersion) throw new RequestWorkflowError("conflict");
    const current = statusOf(record.status);
    if (!canTransitionRequest(current, nextStatus)) throw new RequestWorkflowError("invalid-transition");
    const now = new Date();
    const [updated] = await transaction.update(bookingRequest).set({
      status: nextStatus,
      readAt: nextStatus === "IN_PROGRESS" && !record.readAt ? now : record.readAt,
      readByAdminId: nextStatus === "IN_PROGRESS" && !record.readAt ? adminUserId : undefined,
      resolvedAt: nextStatus === "RESOLVED" ? now : current === "RESOLVED" ? null : undefined,
      updatedAt: now,
      version: sql`${bookingRequest.version} + 1`,
    }).where(and(eq(bookingRequest.id, record.id), eq(bookingRequest.version, expectedVersion ?? record.version), eq(bookingRequest.status, current))).returning({ id: bookingRequest.id, version: bookingRequest.version });
    if (!updated) throw new RequestWorkflowError("conflict");
    await transaction.insert(bookingRequestEvent).values({ id: randomUUID(), bookingRequestId: record.id, actorUserId: adminUserId, actorRole: "admin", eventType: nextStatus === "RESOLVED" ? "ADMIN_RESOLVED_REQUEST" : current === "RESOLVED" ? "ADMIN_REOPENED_REQUEST" : "ADMIN_CHANGED_STATUS", fromStatus: current, toStatus: nextStatus });
    if (nextStatus === "RESOLVED") await transaction.insert(notificationOutbox).values({ id: randomUUID(), bookingId: record.id, kind: "REQUEST_RESOLVED", dedupeKey: `${record.id}:${record.version + 1}:REQUEST_RESOLVED` });
    if (record.userId) await transaction.insert(inAppNotification).values({
      id: randomUUID(), recipientRole: "customer", recipientUserId: record.userId, bookingRequestId: record.id,
      kind: nextStatus === "RESOLVED" ? "CUSTOMER_REQUEST_RESOLVED" : "CUSTOMER_STATUS_CHANGED",
      dedupeKey: `${record.id}:${updated.version}:${nextStatus === "RESOLVED" ? "CUSTOMER_REQUEST_RESOLVED" : "CUSTOMER_STATUS_CHANGED"}`,
    });
    return { reference, status: nextStatus, version: updated.version };
  });
}

export async function addAdminMessage(reference: string, adminUserId: string, body: string, resolve = false, expectedVersion?: number) {
  return db.transaction(async (transaction) => {
    const [record] = await transaction.select({ id: bookingRequest.id, status: bookingRequest.status, readAt: bookingRequest.readAt, version: bookingRequest.version, userId: bookingRequest.userId }).from(bookingRequest).where(eq(bookingRequest.reference, reference)).limit(1);
    if (!record) throw new RequestWorkflowError("not-found");
    if (expectedVersion !== undefined && record.version !== expectedVersion) throw new RequestWorkflowError("conflict");
    const current = statusOf(record.status);
    if (current === "WITHDRAWN" || current === "RESOLVED") throw new RequestWorkflowError("locked");
    const now = new Date();
    const nextStatus: RequestStatus = resolve ? "RESOLVED" : "AWAITING_USER";
    const [updated] = await transaction.update(bookingRequest).set({
      status: nextStatus, readAt: record.readAt ?? now, readByAdminId: record.readAt ? undefined : adminUserId,
      resolvedAt: resolve ? now : null, updatedAt: now, version: sql`${bookingRequest.version} + 1`,
    }).where(and(eq(bookingRequest.id, record.id), eq(bookingRequest.version, expectedVersion ?? record.version), eq(bookingRequest.status, current))).returning({ id: bookingRequest.id, version: bookingRequest.version });
    if (!updated) throw new RequestWorkflowError("conflict");
    const messageId = randomUUID();
    await transaction.insert(bookingRequestMessage).values({ id: messageId, bookingRequestId: record.id, authorUserId: adminUserId, authorRole: "admin", body });
    await transaction.insert(bookingRequestEvent).values({ id: randomUUID(), bookingRequestId: record.id, actorUserId: adminUserId, actorRole: "admin", eventType: "ADMIN_REPLIED", fromStatus: current, toStatus: nextStatus });
    await transaction.insert(notificationOutbox).values({ id: randomUUID(), bookingId: record.id, requestMessageId: messageId, kind: resolve ? "REQUEST_RESOLVED" : "REQUEST_ADMIN_REPLY", dedupeKey: `${messageId}:${resolve ? "REQUEST_RESOLVED" : "REQUEST_ADMIN_REPLY"}` });
    if (record.userId) await transaction.insert(inAppNotification).values({
      id: randomUUID(), recipientRole: "customer", recipientUserId: record.userId, bookingRequestId: record.id, requestMessageId: messageId,
      kind: resolve ? "CUSTOMER_REQUEST_RESOLVED" : "CUSTOMER_ADMIN_REPLY",
      dedupeKey: `${messageId}:${resolve ? "CUSTOMER_REQUEST_RESOLVED" : "CUSTOMER_ADMIN_REPLY"}`,
    });
    return { reference, messageId, status: nextStatus, version: updated.version };
  });
}
