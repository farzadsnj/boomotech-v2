import Link from "next/link";
import { brisbaneDateTime } from "@/features/requests/format";
import { DashboardEmptyState } from "@/features/dashboard/components/dashboard-card";
import { CUSTOMER_PAGE_SIZE, listCustomersForAdmin } from "../repository";
import type { CustomerDirectoryFilters } from "../schemas";

type DirectoryResult = Awaited<ReturnType<typeof listCustomersForAdmin>>;

const sortOptions = [
  ["registered-desc", "Newest registered"], ["registered-asc", "Oldest registered"],
  ["name-asc", "Name A–Z"], ["name-desc", "Name Z–A"],
  ["requests-desc", "Most requests"], ["requests-asc", "Fewest requests"],
] as const;

function pageHref(filters: CustomerDirectoryFilters, page: number) {
  const query = new URLSearchParams({ page: String(page), sort: filters.sort });
  if (filters.search) query.set("search", filters.search);
  if (filters.verification) query.set("verification", filters.verification);
  return `/admin/customers?${query}`;
}

function VerificationBadge({ verified }: { verified: boolean }) {
  return <span aria-label={`Email verification: ${verified ? "Verified" : "Pending"}`} className={`customer-verification customer-verification--${verified ? "verified" : "pending"}`}><span aria-hidden="true">{verified ? "✓" : "!"}</span>{verified ? "Verified" : "Pending"}</span>;
}

export function CustomerDirectory({ filterError, filters, result }: { filterError?: string; filters: CustomerDirectoryFilters; result: DirectoryResult }) {
  const hasFilters = Boolean(filters.search || filters.verification);
  return <section aria-labelledby="customer-directory-heading" className="admin-table-wrap customer-directory">
    <div className="admin-table__heading"><div><h2 id="customer-directory-heading">Registered customers</h2><p>{result.total} account{result.total === 1 ? "" : "s"} · {CUSTOMER_PAGE_SIZE} per page</p></div><span className="admin-table__page-count">Page {filters.page} of {result.totalPages}</span></div>
    {filterError ? <p className="admin-filter-error" role="alert">{filterError}</p> : null}
    <form className="customer-directory__filters" method="get">
      <input name="page" type="hidden" value="1" />
      <div><label htmlFor="customer-search">Search customers</label><input defaultValue={filters.search ?? ""} id="customer-search" name="search" placeholder="Name or email" type="search" /></div>
      <div><label htmlFor="customer-verification">Verification</label><select defaultValue={filters.verification ?? ""} id="customer-verification" name="verification"><option value="">All accounts</option><option value="verified">Verified</option><option value="unverified">Pending verification</option></select></div>
      <div><label htmlFor="customer-sort">Sort</label><select defaultValue={filters.sort} id="customer-sort" name="sort">{sortOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      <button type="submit">Apply filters</button><Link href="/admin/customers">Clear</Link>
    </form>
    {result.records.length ? <>
      <div className="admin-table-scroll customer-directory__table"><table><caption className="sr-only">Registered customer directory</caption><thead><tr><th scope="col">Customer</th><th scope="col">Email</th><th scope="col">Verification</th><th scope="col">Registered</th><th scope="col">Requests</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead><tbody>{result.records.map((customer) => <tr key={customer.id}><td><strong>{customer.name}</strong></td><td>{customer.email}</td><td><VerificationBadge verified={customer.emailVerified} /></td><td><time dateTime={customer.createdAt.toISOString()}>{brisbaneDateTime.format(customer.createdAt)}</time></td><td><strong>{customer.requestCount}</strong></td><td><Link aria-label={`View customer ${customer.name}`} className="admin-request-link" href={`/admin/customers/${customer.id}`}>View</Link></td></tr>)}</tbody></table></div>
      <ol aria-label="Registered customer directory" className="customer-directory__cards">{result.records.map((customer) => <li key={customer.id}><div><h3>{customer.name}</h3><VerificationBadge verified={customer.emailVerified} /></div><p>{customer.email}</p><dl><div><dt>Registered</dt><dd><time dateTime={customer.createdAt.toISOString()}>{brisbaneDateTime.format(customer.createdAt)}</time></dd></div><div><dt>Linked requests</dt><dd>{customer.requestCount}</dd></div></dl><Link className="admin-request-link" href={`/admin/customers/${customer.id}`}>View customer <span aria-hidden="true">→</span></Link></li>)}</ol>
    </> : <DashboardEmptyState description={hasFilters ? "Change or clear the filters to review other registered accounts." : "Verified and pending customer accounts will appear here after registration."} title={hasFilters ? "No matching customers" : "No customer accounts yet"} />}
    <nav aria-label="Customer directory pages" className="admin-pagination"><span>{filters.page > 1 ? <Link href={pageHref(filters, filters.page - 1)}>← Previous</Link> : null}</span><span>Page {filters.page} of {result.totalPages}</span><span>{filters.page < result.totalPages ? <Link href={pageHref(filters, filters.page + 1)}>Next →</Link> : null}</span></nav>
  </section>;
}

