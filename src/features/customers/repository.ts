import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookingRequest, user } from "@/db/schema";
import { canAccessAdminDashboard } from "@/lib/auth/access";
import type { ReportingPeriod } from "@/features/dashboard/reporting";
import { reportingPeriodStart } from "@/features/dashboard/reporting";
import type { CustomerDirectoryFilters } from "./schemas";
import type { RequestStatus } from "@/features/requests/workflow";

export const CUSTOMER_PAGE_SIZE = 25;
export const CUSTOMER_REQUEST_HISTORY_PAGE_SIZE = 15;

export type AdminCustomerReadActor = { id: string; role?: string | null; twoFactorEnabled?: boolean | null };

export class CustomerDirectoryError extends Error {
  constructor(public readonly code: "forbidden" | "not-found") { super(code); }
}

function assertAdministrator(actor: AdminCustomerReadActor) {
  if (!actor.id || !canAccessAdminDashboard({ user: actor })) throw new CustomerDirectoryError("forbidden");
}

function directoryWhere(filters: CustomerDirectoryFilters) {
  const conditions = [eq(user.role, "user")];
  if (filters.verification) conditions.push(eq(user.emailVerified, filters.verification === "verified"));
  if (filters.search) {
    const pattern = `%${filters.search.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
    conditions.push(or(ilike(user.name, pattern), ilike(user.email, pattern))!);
  }
  return and(...conditions);
}

export async function listCustomersForAdmin(actor: AdminCustomerReadActor, filters: CustomerDirectoryFilters) {
  assertAdministrator(actor);
  const where = directoryWhere(filters);
  const requestCount = sql<number>`count(${bookingRequest.id})`;
  const ordering = filters.sort === "registered-asc" ? [asc(user.createdAt), asc(user.id)]
    : filters.sort === "name-asc" ? [asc(user.name), asc(user.id)]
      : filters.sort === "name-desc" ? [desc(user.name), desc(user.id)]
        : filters.sort === "requests-desc" ? [desc(requestCount), asc(user.name), asc(user.id)]
          : filters.sort === "requests-asc" ? [asc(requestCount), asc(user.name), asc(user.id)]
            : [desc(user.createdAt), desc(user.id)];
  const [{ total }] = await db.select({ total: count() }).from(user).where(where);
  const records = await db.select({
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    requestCount,
  }).from(user)
    .leftJoin(bookingRequest, eq(bookingRequest.userId, user.id))
    .where(where)
    .groupBy(user.id)
    .orderBy(...ordering)
    .limit(CUSTOMER_PAGE_SIZE)
    .offset((filters.page - 1) * CUSTOMER_PAGE_SIZE);
  return { records, total, totalPages: Math.max(1, Math.ceil(total / CUSTOMER_PAGE_SIZE)) };
}

export async function getCustomerForAdmin(actor: AdminCustomerReadActor, customerId: string, requestPage = 1) {
  assertAdministrator(actor);
  const [customer] = await db.select({
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }).from(user).where(and(eq(user.id, customerId), eq(user.role, "user"))).limit(1);
  if (!customer) throw new CustomerDirectoryError("not-found");
  const requestWhere = eq(bookingRequest.userId, customer.id);
  const [{ total }] = await db.select({ total: count() }).from(bookingRequest).where(requestWhere);
  const requests = await db.select({
    reference: bookingRequest.reference,
    servicePath: bookingRequest.servicePath,
    status: bookingRequest.status,
    createdAt: bookingRequest.createdAt,
    updatedAt: bookingRequest.updatedAt,
  }).from(bookingRequest).where(requestWhere)
    .orderBy(desc(bookingRequest.updatedAt), desc(bookingRequest.id))
    .limit(CUSTOMER_REQUEST_HISTORY_PAGE_SIZE)
    .offset((requestPage - 1) * CUSTOMER_REQUEST_HISTORY_PAGE_SIZE);
  return {
    customer,
    requests: requests.map((request) => ({ ...request, status: request.status as RequestStatus })),
    totalRequests: total,
    totalRequestPages: Math.max(1, Math.ceil(total / CUSTOMER_REQUEST_HISTORY_PAGE_SIZE)),
  };
}

export async function countCustomersForReportingPeriod(actor: AdminCustomerReadActor, period: ReportingPeriod) {
  assertAdministrator(actor);
  const periodStart = reportingPeriodStart(period);
  const [{ total }] = await db.select({ total: count() }).from(user)
    .where(and(eq(user.role, "user"), periodStart ? sql`${user.createdAt} >= ${periodStart}` : undefined));
  return total;
}

