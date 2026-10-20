import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { AnalyticsChartsLoader } from "@/features/analytics/components/analytics-charts-loader";
import { getAdminAnalytics } from "@/features/analytics/repository";
import { analyticsPeriodLabels, analyticsPeriods, analyticsPeriodSchema } from "@/features/analytics/range";
import { DashboardMetricCard } from "@/features/dashboard/components/dashboard-card";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { DASHBOARD_THEME_COOKIE, parseDashboardTheme } from "@/features/dashboard/theme";
import { adminStatusLabels, type RequestStatus } from "@/features/requests/workflow";
import { auth } from "@/lib/auth/auth";
import { canAccessAdminDashboard } from "@/lib/auth/access";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Analytics and reporting", robots: { index: false, follow: false } };

function queueHref(period: string, filters: Record<string, string> = {}) {
  return `/admin?${new URLSearchParams({ period, ...filters }).toString()}#request-list`;
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/admin/login");
  if (session.user.role === "admin" && !session.user.twoFactorEnabled) redirect("/admin/mfa/setup");
  if (!canAccessAdminDashboard(session)) redirect("/dashboard?access=denied");

  const params = await searchParams;
  const parsedPeriod = analyticsPeriodSchema.safeParse(params.period ?? "30d");
  const period = parsedPeriod.success ? parsedPeriod.data : "30d";
  const actor = { id: session.user.id, role: session.user.role, twoFactorEnabled: session.user.twoFactorEnabled };
  const [data, cookieStore] = await Promise.all([getAdminAnalytics(actor, period), cookies()]);
  const initialTheme = parseDashboardTheme(cookieStore.get(DASHBOARD_THEME_COOKIE)?.value);
  const outstandingPercentage = data.summary.requestsReceived ? Math.round((data.summary.outstanding / data.summary.requestsReceived) * 100) : 0;

  return <DashboardShell breadcrumbs={[{ href: "/admin", label: "Overview" }, { label: "Reports" }]} initialTheme={initialTheme} role="admin" user={{ email: session.user.email, name: session.user.name }}>
    <main className="analytics-page">
      <header className="analytics-page__header">
        <div><p className="eyebrow"><span className="eyebrow-line" />Operations reporting</p><h1>Analytics and reporting</h1><p>Aggregated request and customer activity. Dates use Australia/Brisbane time.</p></div>
        <Link className="analytics-export" href={`/api/admin/reports/export?period=${period}`}>Export summary CSV <span aria-hidden="true">↓</span></Link>
      </header>

      <div className="analytics-toolbar">
        <div><h2>Reporting period</h2><p>{data.range.label}</p></div>
        <nav aria-label="Reporting period"><ul>{analyticsPeriods.map((value) => <li key={value}><Link aria-current={period === value ? "page" : undefined} href={`/admin/reports?period=${value}`}>{analyticsPeriodLabels[value]}</Link></li>)}</ul></nav>
      </div>
      {!parsedPeriod.success ? <p className="analytics-notice" role="status">The requested period was not recognised. Showing the last 30 days.</p> : null}

      <ul aria-label={`Operational summary for ${data.range.label}`} className="operations-metrics analytics-metrics">
        <DashboardMetricCard description={analyticsPeriodLabels[period]} href={queueHref(period)} label="Requests received" value={data.summary.requestsReceived} />
        <DashboardMetricCard description="Resolved in this period" href={queueHref(period, { dateField: "resolved", status: "RESOLVED" })} label="Requests resolved" tone="positive" value={data.summary.requestsResolved} />
        <DashboardMetricCard description={`${outstandingPercentage}% of requests received`} href={queueHref(period, { scope: "outstanding" })} label="Outstanding work" tone={data.summary.outstanding ? "attention" : "default"} value={data.summary.outstanding} />
        <DashboardMetricCard description="Outstanding and high priority" href={queueHref(period, { priority: "HIGH", scope: "outstanding" })} label="High priority" tone={data.summary.highPriorityOutstanding ? "attention" : "default"} value={data.summary.highPriorityOutstanding} />
        <DashboardMetricCard description="New accounts in this period" href="/admin/customers" label="Registered customers" value={data.summary.registeredCustomers} />
      </ul>

      <section aria-labelledby="analytics-workload-title" className="analytics-workload">
        <div aria-label={`${data.summary.outstanding} outstanding requests; ${data.summary.highPriorityOutstanding} are high priority`} className="analytics-workload__progress" style={{ "--analytics-workload-progress": `${data.summary.outstanding ? Math.round((data.summary.highPriorityOutstanding / data.summary.outstanding) * 360) : 0}deg` } as CSSProperties}><span><strong>{data.summary.outstanding}</strong><small>outstanding</small></span></div>
        <div><p className="eyebrow">Workload</p><h2 id="analytics-workload-title">High-priority and outstanding work</h2><p><strong>{data.summary.highPriorityOutstanding}</strong> of {data.summary.outstanding} outstanding request{data.summary.outstanding === 1 ? "" : "s"} received in this period {data.summary.highPriorityOutstanding === 1 ? "is" : "are"} high priority.</p><div><Link href={queueHref(period, { priority: "HIGH", scope: "outstanding" })}>Review high-priority work</Link><Link href={queueHref(period, { scope: "outstanding" })}>View all outstanding work</Link></div></div>
      </section>

      <section aria-labelledby="charts-title" className="analytics-visuals">
        <div className="analytics-section-heading"><div><h2 id="charts-title">Operational trends</h2><p>Charts use aggregate counts and contain no customer contact information.</p></div><a href="#analytics-tables">Skip to data tables</a></div>
        <AnalyticsChartsLoader data={data} />
      </section>

      <section aria-labelledby="analytics-tables-title" className="analytics-tables" id="analytics-tables">
        <div className="analytics-section-heading"><div><h2 id="analytics-tables-title">Tabular report</h2><p>The same reporting data is available without charts.</p></div></div>
        <details open><summary>Daily activity</summary><div className="analytics-table-wrap" tabIndex={0}><table><caption>Daily request and customer activity for {data.range.label}</caption><thead><tr><th scope="col">Date</th><th scope="col">Received</th><th scope="col">Resolved</th><th scope="col">Registered customers</th></tr></thead><tbody>{data.daily.map((item) => <tr key={item.date}><th scope="row">{item.label}</th><td>{item.received}</td><td>{item.resolved}</td><td>{item.customers}</td></tr>)}</tbody></table></div></details>
        <details><summary>Requests by service</summary><div className="analytics-table-wrap" tabIndex={0}><table><caption>Requests received by service</caption><thead><tr><th scope="col">Service</th><th scope="col">Requests</th></tr></thead><tbody>{data.services.length ? data.services.map((item) => <tr key={item.servicePath}><th scope="row">{item.label}</th><td>{item.count}</td></tr>) : <tr><td colSpan={2}>No requests were received in this period.</td></tr>}</tbody></table></div></details>
        <details><summary>Status distribution</summary><div className="analytics-table-wrap" tabIndex={0}><table><caption>Current status of requests received during this period</caption><thead><tr><th scope="col">Status</th><th scope="col">Requests</th></tr></thead><tbody>{data.statuses.map((item) => <tr key={item.status}><th scope="row">{adminStatusLabels[item.status as RequestStatus] ?? item.status}</th><td>{item.count}</td></tr>)}</tbody></table></div></details>
      </section>

      <aside className="analytics-definition" aria-labelledby="report-definition-title"><h2 id="report-definition-title">How these figures are calculated</h2><p>Received and service figures use each request&apos;s creation date. Resolved figures use its resolution date. Status and outstanding workload describe requests created within the selected period. Registered customers count customer accounts created during the period. All ranges include complete Brisbane calendar days.</p></aside>
    </main>
  </DashboardShell>;
}
