import { and, asc, eq, gte, lt, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { bookingRequest, bookingRequestEvent } from "@/db/schema";
import { bookingOptions, serviceLabel } from "@/features/booking/booking-schema";
import { canAccessAdminDashboard } from "@/lib/auth/access";
import { brisbaneDateKey, calendarMonthRange, type RequestActivityType } from "./range";

export type RequestActivityActor = { id: string; role?: string | null; twoFactorEnabled?: boolean | null };
export type RequestActivityFilters = { month: string; eventType?: RequestActivityType; servicePath?: string };

export class RequestActivityCalendarError extends Error {
  constructor(public readonly code: "forbidden") {
    super(code);
  }
}

function assertAdministrator(actor: RequestActivityActor) {
  if (!canAccessAdminDashboard({ user: actor })) throw new RequestActivityCalendarError("forbidden");
}

export const requestActivityServicePaths = bookingOptions.map(({ value }) => value);

export async function getAdminRequestActivity(actor: RequestActivityActor, filters: RequestActivityFilters) {
  assertAdministrator(actor);
  const range = calendarMonthRange(filters.month);
  const serviceCondition = filters.servicePath && requestActivityServicePaths.includes(filters.servicePath)
    ? eq(bookingRequest.servicePath, filters.servicePath)
    : undefined;

  const readCreatedEvents = () => db.select({
      id: bookingRequest.id,
      reference: bookingRequest.reference,
      servicePath: bookingRequest.servicePath,
      status: bookingRequest.status,
      at: bookingRequest.createdAt,
    }).from(bookingRequest)
      .where(and(gte(bookingRequest.createdAt, range.start), lt(bookingRequest.createdAt, range.endExclusive), serviceCondition))
      .orderBy(asc(bookingRequest.createdAt), asc(bookingRequest.reference));

  const readResolvedEvents = () => {
    const conditions: (SQL | undefined)[] = [
      eq(bookingRequestEvent.eventType, "ADMIN_RESOLVED_REQUEST"),
      gte(bookingRequestEvent.createdAt, range.start),
      lt(bookingRequestEvent.createdAt, range.endExclusive),
      serviceCondition,
    ];
    return db.select({
      id: bookingRequestEvent.id,
      reference: bookingRequest.reference,
      servicePath: bookingRequest.servicePath,
      status: bookingRequest.status,
      at: bookingRequestEvent.createdAt,
    }).from(bookingRequestEvent)
      .innerJoin(bookingRequest, eq(bookingRequestEvent.bookingRequestId, bookingRequest.id))
      .where(and(...conditions)).orderBy(asc(bookingRequestEvent.createdAt), asc(bookingRequest.reference));
  };

  const [createdRows, resolvedRows] = await Promise.all([
    filters.eventType === "resolved" ? Promise.resolve([]) : readCreatedEvents(),
    filters.eventType === "created" ? Promise.resolve([]) : readResolvedEvents(),
  ]);

  const events = [
    ...createdRows.map((row) => ({ ...row, type: "created" as const })),
    ...resolvedRows.map((row) => ({ ...row, type: "resolved" as const })),
  ].filter((event): event is typeof event & { at: Date } => event.at instanceof Date)
    .map((event) => ({
      ...event,
      date: brisbaneDateKey(event.at),
      href: `/admin/requests/${event.reference}`,
      serviceLabel: serviceLabel(event.servicePath),
      title: event.type === "created" ? "Request received" : "Request resolved",
    }))
    .sort((left, right) => left.at.getTime() - right.at.getTime() || left.reference.localeCompare(right.reference) || left.type.localeCompare(right.type));

  return {
    counts: {
      created: events.filter(({ type }) => type === "created").length,
      resolved: events.filter(({ type }) => type === "resolved").length,
      total: events.length,
    },
    events,
    range,
  };
}

export type AdminRequestActivity = Awaited<ReturnType<typeof getAdminRequestActivity>>;
