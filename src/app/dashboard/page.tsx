import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutAllDevicesButton } from "@/components/auth/sign-out-button";
import { CustomerRequestList } from "@/components/requests/customer-request-list";
import { serviceLabel } from "@/features/booking/booking-schema";
import { DashboardCard, DashboardMetricCard } from "@/features/dashboard/components/dashboard-card";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { DASHBOARD_THEME_COOKIE, parseDashboardTheme } from "@/features/dashboard/theme";
import { brisbaneDateTime } from "@/features/requests/format";
import { customerRequestHref } from "@/features/requests/links";
import { findCustomerRequestPage, getCustomerRequestOverview, listCustomerRequests } from "@/features/requests/repository";
import { canAccessCustomerDashboard } from "@/lib/auth/access";
import { auth } from "@/lib/auth/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Customer dashboard", robots: { index: false, follow: false } };

function pageNumber(value?: string) {
  const parsed = Number(value ?? "1");
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ verified?: string; access?: string; page?: string; request?: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login?next=/dashboard");
  if (!canAccessCustomerDashboard(session)) redirect("/check-email");

  const initialTheme = parseDashboardTheme((await cookies()).get(DASHBOARD_THEME_COOKIE)?.value);
  const params = await searchParams;
  const linkedPage = params.request && /^BT-[A-F0-9]{10}$/.test(params.request)
    ? await findCustomerRequestPage(session.user.id, params.request)
    : null;
  const requestedPage = linkedPage ?? pageNumber(params.page);
  const [initialResult, overview] = await Promise.all([
    listCustomerRequests(session.user.id, requestedPage),
    getCustomerRequestOverview(session.user.id),
  ]);
  let result = initialResult;
  const page = Math.min(requestedPage, result.totalPages);
  if (page !== requestedPage) result = await listCustomerRequests(session.user.id, page);

  const serialised = result.records.map((request) => ({
    ...request,
    createdAt: request.createdAt.toISOString(),
    createdAtLabel: brisbaneDateTime.format(request.createdAt),
    updatedAt: request.updatedAt.toISOString(),
    updatedAtLabel: brisbaneDateTime.format(request.updatedAt),
    readAt: request.readAt?.toISOString() ?? null,
    withdrawnAt: request.withdrawnAt?.toISOString() ?? null,
    messages: request.messages.map((message) => ({
      ...message,
      createdAt: message.createdAt.toISOString(),
      createdAtLabel: brisbaneDateTime.format(message.createdAt),
    })),
  }));

  return <DashboardShell breadcrumbs={[{ label: "Overview" }]} initialTheme={initialTheme} role="customer" user={{ email: session.user.email, name: session.user.name }}>
    <section className="account-dashboard">
      <div className="container customer-portal">
        <header className="customer-portal__welcome">
          <div>
            <p className="eyebrow"><span className="eyebrow-line" />Customer portal</p>
            <h1>Welcome, {session.user.name}</h1>
            <p>Track your technology requests, respond to updates and manage your account from one protected workspace.</p>
          </div>
          <div className="customer-portal__welcome-actions">
            <Link className="button button--primary" href="/booking">New request</Link>
            <Link className="button button--secondary" href="/support">Get help</Link>
          </div>
        </header>

        {params.verified === "true" ? <p className="request-success" role="status">Your email address is verified and your account is active.</p> : null}
        {params.access === "denied" ? <p className="request-notice" role="alert">Administrator access is restricted to authorised administrator accounts.</p> : null}

        <section aria-labelledby="request-summary-title" className="customer-portal__summary">
          <h2 className="sr-only" id="request-summary-title">Request summary</h2>
          <ul className="operations-metrics">
            <DashboardMetricCard href="#customer-requests" label="Total requests" linkLabel="View all of your requests" value={overview.total} />
            <DashboardMetricCard description="New or being worked on" href="#customer-requests" label="Active requests" linkLabel="View your active requests" value={overview.active} />
            <DashboardMetricCard description="Your reply is needed" href="#customer-requests" label="Waiting for you" linkLabel="View requests waiting for your reply" tone={overview.awaitingUser ? "attention" : "default"} value={overview.awaitingUser} />
            <DashboardMetricCard href="#customer-requests" label="Resolved" linkLabel="View your resolved requests" tone="positive" value={overview.resolved} />
          </ul>
        </section>

        <div className="customer-portal__grid">
          <DashboardCard className="customer-portal__updates" description="Updates are derived from your saved request status." title="Action needed" titleId="customer-action-needed">
            {overview.awaitingRequests.length ? <ul>
              {overview.awaitingRequests.map((request) => <li key={request.reference}>
                <div><strong>{serviceLabel(request.servicePath)}</strong><span>{request.reference} · Updated {brisbaneDateTime.format(request.updatedAt)}</span></div>
                <Link href={customerRequestHref(request.reference)}>Review and reply<span aria-hidden="true"> →</span></Link>
              </li>)}
            </ul> : <div className="customer-portal__all-clear"><span aria-hidden="true">✓</span><div><strong>You are up to date</strong><p>No request currently needs a reply from you.</p></div></div>}
          </DashboardCard>

          <DashboardCard className="customer-portal__account" description="Your verified account details." title="Account overview" titleId="account-details">
            <dl><div><dt>Name</dt><dd>{session.user.name}</dd></div><div><dt>Email</dt><dd>{session.user.email}</dd></div><div><dt>Email status</dt><dd><span className="customer-account-verified"><span aria-hidden="true">✓</span> Verified</span></dd></div></dl>
            <Link className="customer-portal__settings-link" href="/dashboard/settings">Manage account settings <span aria-hidden="true">→</span></Link>
            <SignOutAllDevicesButton />
          </DashboardCard>
        </div>

        <nav aria-label="Customer portal shortcuts" className="customer-portal__shortcuts">
          <Link href="#customer-requests"><strong>My requests</strong><span>Review status and conversations</span></Link>
          <Link href="/dashboard/settings"><strong>Account</strong><span>Manage profile and sign-in security</span></Link>
          <Link href="/dashboard/help"><strong>Help</strong><span>Understand requests and replies</span></Link>
          <Link href="/booking"><strong>New request</strong><span>Ask for support or a consultation</span></Link>
        </nav>

        <section className="account-requests" id="customer-requests" aria-labelledby="customer-requests-title">
          <div className="admin-table__heading">
            <div><p className="eyebrow">Request history</p><h2 id="customer-requests-title">My requests</h2></div>
            <p>{result.total} request{result.total === 1 ? "" : "s"}</p>
          </div>
          <CustomerRequestList requests={serialised} />
          <nav aria-label="Your request pages" className="admin-pagination">
            {page > 1 ? <Link href={`/dashboard?page=${page - 1}`}>← Previous</Link> : <span />}
            <span>Page {page} of {result.totalPages}</span>
            {page < result.totalPages ? <Link href={`/dashboard?page=${page + 1}`}>Next →</Link> : <span />}
          </nav>
        </section>
      </div>
    </section>
  </DashboardShell>;
}
