import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { canAccessAdminDashboard } from "@/lib/auth/access";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { DashboardEmptyState } from "@/features/dashboard/components/dashboard-card";
import { DASHBOARD_THEME_COOKIE, parseDashboardTheme } from "@/features/dashboard/theme";
import { CustomerDirectoryError, CUSTOMER_REQUEST_HISTORY_PAGE_SIZE, getCustomerForAdmin } from "@/features/customers/repository";
import { brisbaneDateTime } from "@/features/requests/format";
import { serviceLabel } from "@/features/booking/booking-schema";
import { RequestStatusBadge } from "@/components/requests/status-badge";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Customer details", robots: { index: false, follow: false } };

function pageNumber(value?: string) { const parsed = Number(value ?? "1"); return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1; }

export default async function AdminCustomerDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/admin/login");
  if (session.user.role === "admin" && !session.user.twoFactorEnabled) redirect("/admin/mfa/setup");
  if (!canAccessAdminDashboard(session)) redirect("/dashboard?access=denied");
  const initialTheme = parseDashboardTheme((await cookies()).get(DASHBOARD_THEME_COOKIE)?.value);
  const { id } = await params;
  const requestPage = pageNumber((await searchParams).requestPage);
  const actor = { id: session.user.id, role: session.user.role, twoFactorEnabled: session.user.twoFactorEnabled };
  let result: Awaited<ReturnType<typeof getCustomerForAdmin>>;
  try { result = await getCustomerForAdmin(actor, id, requestPage); }
  catch (error) { if (error instanceof CustomerDirectoryError && error.code === "not-found") notFound(); throw error; }
  const { customer } = result;

  return <DashboardShell breadcrumbs={[{ href: "/admin", label: "Overview" }, { href: "/admin/customers", label: "Customers" }, { label: customer.name }]} initialTheme={initialTheme} role="admin" user={{ email: session.user.email, name: session.user.name }}>
    <section className="admin-page"><div className="container admin-customer-detail">
      <Link className="text-link" href="/admin/customers">← Back to customer directory</Link>
      <header className="admin-page__header"><div><p className="eyebrow"><span className="eyebrow-line" />Registered customer</p><h1>{customer.name}</h1><p>Account information and requests linked through the customer’s verified account identity.</p></div></header>
      <section aria-labelledby="account-information" className="request-detail-panel customer-account-summary"><div className="request-panel-heading"><div><h2 id="account-information">Account information</h2><p>This projection excludes credentials, sessions, MFA data and authentication tokens.</p></div><span aria-label={customer.emailVerified ? "Email verified" : "Email verification pending"}>{customer.emailVerified ? "✓" : "!"}</span></div><dl><div><dt>Name</dt><dd>{customer.name}</dd></div><div><dt>Email</dt><dd>{customer.email}</dd></div><div><dt>Verification</dt><dd>{customer.emailVerified ? "Verified email" : "Pending email verification"}</dd></div><div><dt>Registered</dt><dd>{brisbaneDateTime.format(customer.createdAt)}</dd></div><div><dt>Account updated</dt><dd>{brisbaneDateTime.format(customer.updatedAt)}</dd></div><div><dt>Account type</dt><dd>Registered customer</dd></div></dl></section>
      <section aria-labelledby="customer-request-history" className="admin-table-wrap customer-request-history"><div className="admin-table__heading"><div><h2 id="customer-request-history">Linked request history</h2><p>{result.totalRequests} request{result.totalRequests === 1 ? "" : "s"} · {CUSTOMER_REQUEST_HISTORY_PAGE_SIZE} per page</p></div><span className="admin-table__page-count">Page {requestPage} of {result.totalRequestPages}</span></div>
        {result.requests.length ? <><div className="admin-table-scroll customer-request-history__table"><table><caption className="sr-only">Requests linked to {customer.name}</caption><thead><tr><th scope="col">Reference</th><th scope="col">Service</th><th scope="col">Status</th><th scope="col">Created</th><th scope="col">Updated</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead><tbody>{result.requests.map((request) => <tr key={request.reference}><td><strong>{request.reference}</strong></td><td>{serviceLabel(request.servicePath)}</td><td><RequestStatusBadge audience="admin" status={request.status} /></td><td><time dateTime={request.createdAt.toISOString()}>{brisbaneDateTime.format(request.createdAt)}</time></td><td><time dateTime={request.updatedAt.toISOString()}>{brisbaneDateTime.format(request.updatedAt)}</time></td><td><Link aria-label={`View request ${request.reference}`} className="admin-request-link" href={`/admin/requests/${request.reference}`}>View</Link></td></tr>)}</tbody></table></div><ol aria-label={`Requests linked to ${customer.name}`} className="customer-directory__cards customer-request-history__cards">{result.requests.map((request) => <li key={request.reference}><div><h3>{request.reference}</h3><RequestStatusBadge audience="admin" status={request.status} /></div><p>{serviceLabel(request.servicePath)}</p><dl><div><dt>Created</dt><dd>{brisbaneDateTime.format(request.createdAt)}</dd></div><div><dt>Updated</dt><dd>{brisbaneDateTime.format(request.updatedAt)}</dd></div></dl><Link className="admin-request-link" href={`/admin/requests/${request.reference}`}>View request <span aria-hidden="true">→</span></Link></li>)}</ol></> : <DashboardEmptyState description="Guest bookings and requests submitted before account ownership was established are intentionally excluded." title="No linked requests" />}
        <nav aria-label="Customer request history pages" className="admin-pagination"><span>{requestPage > 1 ? <Link href={`?requestPage=${requestPage - 1}`}>← Previous</Link> : null}</span><span>Page {requestPage} of {result.totalRequestPages}</span><span>{requestPage < result.totalRequestPages ? <Link href={`?requestPage=${requestPage + 1}`}>Next →</Link> : null}</span></nav>
      </section>
    </div></section>
  </DashboardShell>;
}

