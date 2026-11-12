import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { bookingOptions } from "@/features/booking/booking-schema";
import { RequestActivityCalendar } from "@/features/calendar/components/request-activity-calendar";
import { getAdminRequestActivity, requestActivityServicePaths } from "@/features/calendar/repository";
import { calendarViewSchema, parseCalendarMonth, requestActivityTypeSchema, shiftCalendarMonth } from "@/features/calendar/range";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { DASHBOARD_THEME_COOKIE, parseDashboardTheme } from "@/features/dashboard/theme";
import { canAccessAdminDashboard } from "@/lib/auth/access";
import { auth } from "@/lib/auth/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Request activity calendar", robots: { index: false, follow: false } };

type CalendarSearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function calendarHref(values: { month: string; view: "month" | "list"; eventType?: string; servicePath?: string }) {
  const params = new URLSearchParams({ month: values.month, view: values.view });
  if (values.eventType) params.set("event", values.eventType);
  if (values.servicePath) params.set("service", values.servicePath);
  return `/admin/calendar?${params.toString()}`;
}

export default async function AdminCalendarPage({ searchParams }: { searchParams: Promise<CalendarSearchParams> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/admin/login");
  if (session.user.role === "admin" && !session.user.twoFactorEnabled) redirect("/admin/mfa/setup");
  if (!canAccessAdminDashboard(session)) redirect("/dashboard?access=denied");

  const params = await searchParams;
  const monthResult = parseCalendarMonth(firstParam(params.month));
  const viewResult = calendarViewSchema.safeParse(firstParam(params.view) ?? "month");
  const eventResult = requestActivityTypeSchema.safeParse(firstParam(params.event));
  const requestedService = firstParam(params.service);
  const servicePath = requestedService && requestActivityServicePaths.includes(requestedService) ? requestedService : undefined;
  const view = viewResult.success ? viewResult.data : "month";
  const eventType = eventResult.success ? eventResult.data : undefined;
  const actor = { id: session.user.id, role: session.user.role, twoFactorEnabled: session.user.twoFactorEnabled };
  const [data, cookieStore] = await Promise.all([
    getAdminRequestActivity(actor, { eventType, month: monthResult.month, servicePath }),
    cookies(),
  ]);
  const initialTheme = parseDashboardTheme(cookieStore.get(DASHBOARD_THEME_COOKIE)?.value);
  const shared = { eventType, servicePath };
  const listHref = calendarHref({ ...shared, month: monthResult.month, view: "list" });

  return <DashboardShell breadcrumbs={[{ href: "/admin", label: "Overview" }, { label: "Activity calendar" }]} initialTheme={initialTheme} role="admin" user={{ email: session.user.email, name: session.user.name }}>
    <main className="activity-calendar-page">
      <header className="activity-calendar-page__header">
        <div><p className="eyebrow"><span className="eyebrow-line" />Operations timeline</p><h1>Request activity calendar</h1><p>Review when requests were received and resolved, using persisted operational timestamps.</p></div>
        <Link className="activity-calendar-page__queue-link" href="/admin#request-list">Open request queue <span aria-hidden="true">→</span></Link>
      </header>

      <aside className="activity-calendar-notice" aria-labelledby="activity-calendar-notice-title">
        <span aria-hidden="true">i</span><div><h2 id="activity-calendar-notice-title">Activity records, not appointments</h2><p>Calendar entries show recorded request activity. They do not represent confirmed appointments, staff availability or scheduled work.</p></div>
      </aside>

      <section aria-labelledby="activity-filter-title" className="activity-calendar-toolbar">
        <div><h2 id="activity-filter-title">Filter activity</h2><p>All dates and times use Australia/Brisbane.</p></div>
        <form action="/admin/calendar" method="get">
          <input name="view" type="hidden" value={view} />
          <label>Month<input max="2100-12" min="2000-01" name="month" required type="month" defaultValue={monthResult.month} /></label>
          <label>Event type<select name="event" defaultValue={eventType ?? ""}><option value="">All activity</option><option value="created">Requests received</option><option value="resolved">Requests resolved</option></select></label>
          <label>Service<select name="service" defaultValue={servicePath ?? ""}><option value="">All services</option>{bookingOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <div><button type="submit">Apply filters</button><Link href={`/admin/calendar?month=${monthResult.month}&view=${view}`}>Clear</Link></div>
        </form>
      </section>

      {(!monthResult.valid || !viewResult.success || (requestedService && !servicePath) || (firstParam(params.event) && !eventResult.success)) ? <p className="activity-calendar-warning" role="status">One or more filters were not recognised and were reset to a safe default.</p> : null}

      <div className="activity-calendar-summary">
        <div><p>Selected month</p><strong>{data.range.label}</strong></div>
        <dl><div><dt>Received</dt><dd>{data.counts.created}</dd></div><div><dt>Resolved</dt><dd>{data.counts.resolved}</dd></div><div><dt>Total events</dt><dd>{data.counts.total}</dd></div></dl>
      </div>

      <div className="activity-calendar-controls">
        <nav aria-label="Month navigation"><Link href={calendarHref({ ...shared, month: shiftCalendarMonth(monthResult.month, -1), view })}>← Previous</Link><Link href={calendarHref({ ...shared, month: parseCalendarMonth(undefined).month, view })}>Today</Link><Link href={calendarHref({ ...shared, month: shiftCalendarMonth(monthResult.month, 1), view })}>Next →</Link></nav>
        <nav aria-label="Calendar view"><Link aria-current={view === "month" ? "page" : undefined} href={calendarHref({ ...shared, month: monthResult.month, view: "month" })}>Month</Link><Link aria-current={view === "list" ? "page" : undefined} href={listHref}>List</Link></nav>
      </div>

      <RequestActivityCalendar data={data} listHref={listHref} view={view} />
    </main>
  </DashboardShell>;
}
