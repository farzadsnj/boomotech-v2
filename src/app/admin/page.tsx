import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { RequestPriorityBadge, RequestStatusBadge } from "@/components/requests/status-badge";
import { bookingOptions, serviceLabel } from "@/features/booking/booking-schema";
import { brisbaneDateTime } from "@/features/requests/format";
import { ADMIN_REQUEST_PAGE_SIZE, getAdminRequestSummary, listAdminRequests } from "@/features/requests/repository";
import { adminRequestFiltersSchema } from "@/features/requests/schemas";
import { priorityLabels, requestPriorities, requestStatuses, statusLabels } from "@/features/requests/workflow";
import { auth } from "@/lib/auth/auth";
import { canAccessAdminDashboard } from "@/lib/auth/access";
import { CUSTOMER_PAGE_SIZE, listCustomers } from "@/lib/auth/customers";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administrator dashboard", robots: { index: false, follow: false } };

function pageNumber(value?: string) { const parsed = Number(value ?? "1"); return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1; }

export default async function AdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/admin/login");
  if (!canAccessAdminDashboard(session)) redirect("/dashboard?access=denied");
  const params = await searchParams;
  const parsedFilters = adminRequestFiltersSchema.safeParse({ page: params.bookingPage ?? "1", status: params.status || undefined, priority: params.priority || undefined, service: params.service || undefined, search: params.search || undefined });
  const filters = parsedFilters.success ? parsedFilters.data : { page: 1 };
  const customerPage = pageNumber(params.customerPage);
  const [customersResult, requestsResult, summary] = await Promise.all([listCustomers(customerPage), listAdminRequests(filters), getAdminRequestSummary()]);

  function requestPageHref(page: number) {
    const query = new URLSearchParams();
    query.set("bookingPage", String(page)); query.set("customerPage", String(customerPage));
    if (filters.status) query.set("status", filters.status); if (filters.priority) query.set("priority", filters.priority);
    if (filters.service) query.set("service", filters.service); if (filters.search) query.set("search", filters.search);
    return `/admin?${query}`;
  }

  return <section className="admin-page"><div className="container">
    <header className="admin-page__header"><div><p className="eyebrow"><span className="eyebrow-line" />Administrator</p><h1>Operations dashboard</h1><p>Review registered customers and manage consultation and support requests.</p></div><SignOutButton admin /></header>
    <ul className="admin-summary" aria-label="Request summary"><li><strong>{summary.NEW}</strong><span>New</span></li><li><strong>{summary.IN_PROGRESS}</strong><span>In progress</span></li><li><strong>{summary.AWAITING_USER}</strong><span>Waiting</span></li><li><strong>{summary.RESOLVED}</strong><span>Resolved</span></li></ul>
    <section className="admin-table-wrap" aria-labelledby="request-list"><div className="admin-table__heading"><div><h2 id="request-list">Customer requests</h2><p>{requestsResult.total} request{requestsResult.total === 1 ? "" : "s"} · maximum {ADMIN_REQUEST_PAGE_SIZE} per page</p></div></div>
      <form className="admin-filters" method="get"><input name="customerPage" type="hidden" value={customerPage} /><div><label htmlFor="request-search">Customer or reference</label><input defaultValue={filters.search ?? ""} id="request-search" name="search" type="search" /></div><div><label htmlFor="status-filter">Status</label><select defaultValue={filters.status ?? ""} id="status-filter" name="status"><option value="">All statuses</option>{requestStatuses.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}</select></div><div><label htmlFor="priority-filter">Priority</label><select defaultValue={filters.priority ?? ""} id="priority-filter" name="priority"><option value="">All priorities</option>{requestPriorities.map((item) => <option key={item} value={item}>{priorityLabels[item]}</option>)}</select></div><div><label htmlFor="service-filter">Service</label><select defaultValue={filters.service ?? ""} id="service-filter" name="service"><option value="">All services</option>{bookingOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div><button type="submit">Apply filters</button><Link href="/admin">Clear</Link></form>
      {requestsResult.records.length ? <div className="admin-table-scroll"><table><thead><tr><th scope="col">#</th><th scope="col">Reference</th><th scope="col">Customer</th><th scope="col">Service</th><th scope="col">Request description</th><th scope="col">Date and time</th><th scope="col">Priority</th><th scope="col">Status</th><th scope="col">Action</th></tr></thead><tbody>{requestsResult.records.map((request) => <tr key={request.reference}><td>{request.rowNumber}</td><td>{request.reference}</td><td><strong>{request.fullName}</strong><br /><span>{request.email}</span></td><td>{serviceLabel(request.servicePath)}</td><td className="admin-request-summary">{request.message}</td><td>{brisbaneDateTime.format(request.createdAt)}</td><td><RequestPriorityBadge priority={request.priority} /></td><td><RequestStatusBadge status={request.status} /></td><td><Link className="admin-request-link" href={`/admin/requests/${request.reference}`}>{request.status === "NEW" ? "Respond" : "View"}</Link></td></tr>)}</tbody></table></div> : <div className="admin-empty"><h3>No matching requests</h3><p>Change or clear the filters to review other requests.</p></div>}
      <nav aria-label="Request pages" className="admin-pagination">{filters.page > 1 ? <Link href={requestPageHref(filters.page - 1)}>← Previous</Link> : <span />}{filters.page < requestsResult.totalPages ? <Link href={requestPageHref(filters.page + 1)}>Next →</Link> : null}</nav>
    </section>
    <section className="admin-table-wrap" aria-labelledby="customer-list"><div className="admin-table__heading"><h2 id="customer-list">Registered customers</h2><p>{customersResult.total} customer{customersResult.total === 1 ? "" : "s"} · maximum {CUSTOMER_PAGE_SIZE} per page</p></div>{customersResult.records.length ? <div className="admin-table-scroll"><table><thead><tr><th scope="col">Full name</th><th scope="col">Email</th><th scope="col">Created</th></tr></thead><tbody>{customersResult.records.map((customer) => <tr key={customer.id}><td>{customer.name}</td><td>{customer.email}</td><td>{brisbaneDateTime.format(customer.createdAt)}</td></tr>)}</tbody></table></div> : <div className="admin-empty"><h3>No customer accounts yet</h3><p>Registered customers will appear here when account creation is used.</p></div>}</section>
  </div></section>;
}
