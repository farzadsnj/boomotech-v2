import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminOperationsOverview } from "@/features/dashboard/components/admin-operations-overview";
import { getAdminOperationsDashboard, listAdminRequests } from "@/features/requests/repository";
import { adminRequestFiltersSchema } from "@/features/requests/schemas";
import { AdminRequestManagement } from "@/features/requests/components/admin-request-management";
import { auth } from "@/lib/auth/auth";
import { canAccessAdminDashboard } from "@/lib/auth/access";
import { countCustomersForReportingPeriod } from "@/features/customers/repository";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { DASHBOARD_THEME_COOKIE, parseDashboardTheme } from "@/features/dashboard/theme";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administrator dashboard", robots: { index: false, follow: false } };

export default async function AdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/admin/login");
  if (session.user.role === "admin" && !session.user.twoFactorEnabled) redirect("/admin/mfa/setup");
  if (!canAccessAdminDashboard(session)) redirect("/dashboard?access=denied");
  const initialTheme = parseDashboardTheme((await cookies()).get(DASHBOARD_THEME_COOKIE)?.value);
  const params = await searchParams;
  const parsedFilters = adminRequestFiltersSchema.safeParse({ page: params.bookingPage ?? "1", period: params.period || undefined, scope: params.scope || undefined, status: params.status || undefined, priority: params.priority || undefined, service: params.service || undefined, search: params.search || undefined, sort: params.sort || undefined });
  const filters = parsedFilters.success ? parsedFilters.data : { page: 1, period: "all" as const, sort: "created-desc" as const };
  const actor = { id: session.user.id, role: session.user.role, twoFactorEnabled: session.user.twoFactorEnabled };
  const [requestsResult, operations, reportingCustomerCount] = await Promise.all([
    listAdminRequests(filters), getAdminOperationsDashboard(filters.period), countCustomersForReportingPeriod(actor, filters.period),
  ]);

  return <DashboardShell breadcrumbs={[{ label: "Overview" }]} initialTheme={initialTheme} role="admin" user={{ email: session.user.email, name: session.user.name }}><section className="admin-page"><div className="container">
    <header className="admin-page__header"><div><p className="eyebrow"><span className="eyebrow-line" />Administrator</p><h1>Operations dashboard</h1><p>Review registered customers and manage consultation and support requests.</p><Link className="text-link" href="/admin/mfa/recovery">Review account security</Link></div></header>
    <AdminOperationsOverview customerCount={reportingCustomerCount} data={operations} period={filters.period} />
    <AdminRequestManagement filterError={parsedFilters.success ? undefined : "Some request filters were not recognised and have been reset."} filters={filters} result={requestsResult} />
  </div></section></DashboardShell>;
}
