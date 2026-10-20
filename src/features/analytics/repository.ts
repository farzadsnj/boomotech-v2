import { and, asc, count, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookingRequest, user } from "@/db/schema";
import { serviceLabel } from "@/features/booking/booking-schema";
import { canAccessAdminDashboard } from "@/lib/auth/access";
import { analyticsDateRange, analyticsRangeLabel, type AnalyticsPeriod } from "./range";

export type AdminAnalyticsActor = { id: string; role?: string | null; twoFactorEnabled?: boolean | null };

export class AdminAnalyticsError extends Error {
  constructor(public readonly code: "forbidden") {
    super(code);
  }
}

function assertAdministrator(actor: AdminAnalyticsActor) {
  if (!canAccessAdminDashboard({ user: actor })) throw new AdminAnalyticsError("forbidden");
}

const brisbaneDay = (column: typeof bookingRequest.createdAt | typeof bookingRequest.resolvedAt | typeof user.createdAt) =>
  sql<string>`to_char(date_trunc('day', ${column} AT TIME ZONE 'Australia/Brisbane'), 'YYYY-MM-DD')`;

function valuesByDay(rows: { date: string; count: number }[]) {
  return new Map(rows.map((row) => [row.date, Number(row.count)]));
}

export async function getAdminAnalytics(actor: AdminAnalyticsActor, period: AnalyticsPeriod, now = new Date()) {
  assertAdministrator(actor);
  const range = analyticsDateRange(period, now);
  const requestDay = brisbaneDay(bookingRequest.createdAt);
  const resolvedDay = brisbaneDay(bookingRequest.resolvedAt);
  const customerDay = brisbaneDay(user.createdAt);
  const receivedInRange = and(gte(bookingRequest.createdAt, range.start), lt(bookingRequest.createdAt, range.endExclusive));
  const resolvedInRange = and(gte(bookingRequest.resolvedAt, range.start), lt(bookingRequest.resolvedAt, range.endExclusive));

  const [receivedRows, resolvedRows, serviceRows, statusRows, workloadRows, customerRows] = await Promise.all([
    db.select({ date: requestDay, count: count() }).from(bookingRequest)
      .where(receivedInRange).groupBy(requestDay).orderBy(asc(requestDay)),
    db.select({ date: resolvedDay, count: count() }).from(bookingRequest)
      .where(resolvedInRange).groupBy(resolvedDay).orderBy(asc(resolvedDay)),
    db.select({ servicePath: bookingRequest.servicePath, count: count() }).from(bookingRequest)
      .where(receivedInRange).groupBy(bookingRequest.servicePath).orderBy(desc(count()), asc(bookingRequest.servicePath)),
    db.select({ status: bookingRequest.status, count: count() }).from(bookingRequest)
      .where(receivedInRange).groupBy(bookingRequest.status),
    db.select({
      outstanding: count(),
      highPriorityOutstanding: sql<number>`count(*) filter (where ${bookingRequest.priority} = 'HIGH')::int`.mapWith(Number),
    }).from(bookingRequest).where(and(receivedInRange, inArray(bookingRequest.status, ["NEW", "IN_PROGRESS", "AWAITING_USER"]))),
    db.select({ date: customerDay, count: count() }).from(user)
      .where(and(eq(user.role, "user"), gte(user.createdAt, range.start), lt(user.createdAt, range.endExclusive)))
      .groupBy(customerDay).orderBy(asc(customerDay)),
  ]);

  const received = valuesByDay(receivedRows);
  const resolved = valuesByDay(resolvedRows);
  const customers = valuesByDay(customerRows);
  const daily = range.buckets.map(({ date, instant }) => ({
    date,
    label: new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", timeZone: "Australia/Brisbane" }).format(instant),
    received: received.get(date) ?? 0,
    resolved: resolved.get(date) ?? 0,
    customers: customers.get(date) ?? 0,
  }));
  const statuses = ["NEW", "IN_PROGRESS", "AWAITING_USER", "RESOLVED", "WITHDRAWN"].map((status) => ({
    status,
    count: Number(statusRows.find((row) => row.status === status)?.count ?? 0),
  }));
  const services = serviceRows.map((row) => ({ servicePath: row.servicePath, label: serviceLabel(row.servicePath), count: Number(row.count) }));
  const requestsReceived = daily.reduce((sum, row) => sum + row.received, 0);
  const requestsResolved = daily.reduce((sum, row) => sum + row.resolved, 0);
  const registeredCustomers = daily.reduce((sum, row) => sum + row.customers, 0);
  const workload = workloadRows[0] ?? { outstanding: 0, highPriorityOutstanding: 0 };

  return {
    period,
    range: { start: range.start, endExclusive: range.endExclusive, label: analyticsRangeLabel(period, now) },
    summary: {
      requestsReceived,
      requestsResolved,
      outstanding: Number(workload.outstanding),
      highPriorityOutstanding: Number(workload.highPriorityOutstanding),
      registeredCustomers,
    },
    daily,
    services,
    statuses,
  };
}

export type AdminAnalyticsData = Awaited<ReturnType<typeof getAdminAnalytics>>;

