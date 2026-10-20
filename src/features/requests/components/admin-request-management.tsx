import Link from "next/link";
import { bookingOptions, serviceLabel } from "@/features/booking/booking-schema";
import { DashboardEmptyState } from "@/features/dashboard/components/dashboard-card";
import { brisbaneDateTime } from "@/features/requests/format";
import { ADMIN_REQUEST_PAGE_SIZE, type AdminRequestSort, listAdminRequests } from "@/features/requests/repository";
import { RequestPriorityBadge, RequestStatusBadge } from "@/components/requests/status-badge";
import { adminStatusLabels, priorityLabels, requestPriorities, requestStatuses, type RequestPriority, type RequestStatus } from "@/features/requests/workflow";
import type { ReportingPeriod } from "@/features/dashboard/reporting";

type RequestList = Awaited<ReturnType<typeof listAdminRequests>>;
type Filters = {
  page: number;
  period: ReportingPeriod;
  dateField?: "resolved";
  scope?: "outstanding";
  status?: RequestStatus;
  priority?: RequestPriority;
  service?: string;
  search?: string;
  sort: AdminRequestSort;
};

const sortOptions: { label: string; value: AdminRequestSort }[] = [
  { label: "Newest submitted", value: "created-desc" },
  { label: "Oldest submitted", value: "created-asc" },
  { label: "Recently updated", value: "updated-desc" },
  { label: "Least recently updated", value: "updated-asc" },
];

function queryHref(filters: Filters, page: number) {
  const query = new URLSearchParams({ bookingPage: String(page), period: filters.period, sort: filters.sort });
  if (filters.dateField) query.set("dateField", filters.dateField);
  if (filters.scope) query.set("scope", filters.scope);
  if (filters.status) query.set("status", filters.status);
  if (filters.priority) query.set("priority", filters.priority);
  if (filters.service) query.set("service", filters.service);
  if (filters.search) query.set("search", filters.search);
  return `/admin?${query}#request-list`;
}

function attentionLabel(request: RequestList["records"][number]) {
  if (request.status === "NEW") return "New request";
  if (request.status === "AWAITING_USER") return "Awaiting customer";
  if (request.priority === "HIGH" && request.status !== "RESOLVED" && request.status !== "WITHDRAWN") return "High priority";
  return null;
}

function rowClass(request: RequestList["records"][number]) {
  return [request.status === "NEW" ? "is-new" : "", request.status === "AWAITING_USER" ? "is-awaiting-user" : "", request.priority === "HIGH" ? "is-high-priority" : ""].filter(Boolean).join(" ");
}

export function AdminRequestManagement({ filterError, filters, result }: { filterError?: string; filters: Filters; result: RequestList }) {
  const hasActiveFilters = Boolean(filters.scope || filters.status || filters.priority || filters.service || filters.search);
  return <section className="admin-table-wrap admin-request-management" aria-labelledby="request-list">
    <div className="admin-table__heading">
      <div><h2 id="request-list">Customer requests</h2><p>{result.total} request{result.total === 1 ? "" : "s"} · {ADMIN_REQUEST_PAGE_SIZE} per page</p></div>
      <span className="admin-table__page-count">Page {Math.min(filters.page, result.totalPages)} of {result.totalPages}</span>
    </div>
    {filterError ? <p className="admin-filter-error" role="alert">{filterError}</p> : null}
    <form className="admin-filters" method="get">
      <input name="bookingPage" type="hidden" value="1" />
      <input name="period" type="hidden" value={filters.period} />
      {filters.dateField ? <input name="dateField" type="hidden" value={filters.dateField} /> : null}
      {filters.scope ? <input name="scope" type="hidden" value={filters.scope} /> : null}
      <div className="admin-filter-search"><label htmlFor="request-search">Search requests</label><input defaultValue={filters.search ?? ""} id="request-search" name="search" placeholder="Reference, customer or description" type="search" /></div>
      <div><label htmlFor="status-filter">Status</label><select defaultValue={filters.status ?? ""} id="status-filter" name="status"><option value="">All statuses</option>{requestStatuses.map((item) => <option key={item} value={item}>{adminStatusLabels[item]}</option>)}</select></div>
      <div><label htmlFor="priority-filter">Priority</label><select defaultValue={filters.priority ?? ""} id="priority-filter" name="priority"><option value="">All priorities</option>{requestPriorities.map((item) => <option key={item} value={item}>{priorityLabels[item]}</option>)}</select></div>
      <div><label htmlFor="service-filter">Service</label><select defaultValue={filters.service ?? ""} id="service-filter" name="service"><option value="">All services</option>{bookingOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
      <div><label htmlFor="sort-filter">Sort</label><select defaultValue={filters.sort} id="sort-filter" name="sort">{sortOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
      <button type="submit">Apply filters</button>
      <Link href={`/admin?period=${filters.period}${filters.dateField ? `&dateField=${filters.dateField}` : ""}#request-list`}>Clear</Link>
    </form>
    {result.records.length ? <>
      <div className="admin-request-table admin-table-scroll">
        <table>
          <caption className="sr-only">Administrator request results, page {filters.page} of {result.totalPages}</caption>
          <thead><tr><th scope="col">Reference</th><th scope="col">Customer</th><th scope="col">Service</th><th scope="col">Description</th><th scope="col">Submitted</th><th scope="col">Updated</th><th scope="col">Priority</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>{result.records.map((request) => { const attention = attentionLabel(request); return <tr className={rowClass(request)} key={request.reference}>
            <td><span className="request-row-number">#{request.rowNumber}</span><strong>{request.reference}</strong>{attention ? <span className="request-attention-label">{attention}</span> : null}</td>
            <td><strong>{request.fullName}</strong><span>{request.email}</span></td>
            <td>{serviceLabel(request.servicePath)}</td>
            <td><span className="admin-request-summary">{request.message}</span></td>
            <td><time dateTime={request.createdAt.toISOString()}>{brisbaneDateTime.format(request.createdAt)}</time></td>
            <td><time dateTime={request.updatedAt.toISOString()}>{brisbaneDateTime.format(request.updatedAt)}</time></td>
            <td><RequestPriorityBadge priority={request.priority} /></td>
            <td><RequestStatusBadge audience="admin" status={request.status} /></td>
            <td><Link aria-label={`${request.status === "NEW" ? "Respond to" : "View"} request ${request.reference} from ${request.fullName}`} className="admin-request-link" href={`/admin/requests/${request.reference}`}>{request.status === "NEW" ? "Respond" : "View"}</Link></td>
          </tr>; })}</tbody>
        </table>
      </div>
      <ol className="admin-request-cards" aria-label="Request results">{result.records.map((request) => { const attention = attentionLabel(request); return <li className={rowClass(request)} key={request.reference}>
        <div className="admin-request-card__top"><div><span className="request-row-number">#{request.rowNumber}</span><strong>{request.reference}</strong></div>{attention ? <span className="request-attention-label">{attention}</span> : null}</div>
        <h3>{serviceLabel(request.servicePath)}</h3><p className="admin-request-card__customer"><strong>{request.fullName}</strong><span>{request.email}</span></p>
        <p className="admin-request-summary">{request.message}</p>
        <div className="request-badges"><RequestPriorityBadge priority={request.priority} /><RequestStatusBadge audience="admin" status={request.status} /></div>
        <dl><div><dt>Submitted</dt><dd><time dateTime={request.createdAt.toISOString()}>{brisbaneDateTime.format(request.createdAt)}</time></dd></div><div><dt>Updated</dt><dd><time dateTime={request.updatedAt.toISOString()}>{brisbaneDateTime.format(request.updatedAt)}</time></dd></div></dl>
        <Link className="admin-request-link" href={`/admin/requests/${request.reference}`}>{request.status === "NEW" ? "Respond to request" : "View request"}<span aria-hidden="true"> →</span></Link>
      </li>; })}</ol>
    </> : <DashboardEmptyState description={hasActiveFilters ? "Change or clear the filters to review other requests." : "New customer requests will appear here when they are submitted."} title={hasActiveFilters ? "No matching requests" : "No requests yet"} />}
    <nav aria-label="Request result pages" className="admin-pagination"><span>{filters.page > 1 ? <Link href={queryHref(filters, filters.page - 1)}>← Previous</Link> : null}</span><span aria-live="polite">Page {Math.min(filters.page, result.totalPages)} of {result.totalPages}</span><span>{filters.page < result.totalPages ? <Link href={queryHref(filters, filters.page + 1)}>Next →</Link> : null}</span></nav>
  </section>;
}
