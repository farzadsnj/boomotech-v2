import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { auth } from "@/lib/auth/auth";
import { canAccessAdminDashboard } from "@/lib/auth/access";
import { CUSTOMER_PAGE_SIZE, listCustomers } from "@/lib/auth/customers";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administrator dashboard", robots: { index: false, follow: false } };
export default async function AdminPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/admin/login");
  if (!canAccessAdminDashboard(session)) redirect("/dashboard?access=denied");
  const requestedPage = Number((await searchParams).page ?? "1");
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const { records: customers, total, totalPages } = await listCustomers(page);
  return <section className="admin-page"><div className="container"><header className="admin-page__header"><div><p className="eyebrow"><span className="eyebrow-line" />Administrator</p><h1>Customer accounts</h1><p>Showing only names, email addresses and account creation dates.</p></div><SignOutButton admin /></header><section className="admin-table-wrap" aria-labelledby="customer-list"><div className="admin-table__heading"><h2 id="customer-list">Registered customers</h2><p>{total} customer{total === 1 ? "" : "s"} · maximum {CUSTOMER_PAGE_SIZE} per page</p></div>{customers.length ? <div className="admin-table-scroll"><table><thead><tr><th scope="col">Full name</th><th scope="col">Email</th><th scope="col">Created</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer.id}><td>{customer.name}</td><td>{customer.email}</td><td>{new Intl.DateTimeFormat("en-AU", { dateStyle: "medium" }).format(customer.createdAt)}</td></tr>)}</tbody></table></div> : <div className="admin-empty"><h3>No customer accounts yet</h3><p>Registered customers will appear here when account creation is enabled and used.</p></div>}<nav aria-label="Customer pages" className="admin-pagination">{page > 1 ? <Link href={`/admin?page=${page - 1}`}>← Previous</Link> : <span />}{page < totalPages ? <Link href={`/admin?page=${page + 1}`}>Next →</Link> : null}</nav></section></div></section>;
}
