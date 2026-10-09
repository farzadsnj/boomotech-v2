import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { CustomerRequestList } from "@/components/requests/customer-request-list";
import { brisbaneDateTime } from "@/features/requests/format";
import { listCustomerRequests } from "@/features/requests/repository";
import { auth } from "@/lib/auth/auth";
import { canAccessCustomerDashboard } from "@/lib/auth/access";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Customer dashboard", robots: { index: false, follow: false } };

function pageNumber(value?: string) { const parsed = Number(value ?? "1"); return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1; }

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ verified?: string; access?: string; page?: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login?next=/dashboard");
  if (!canAccessCustomerDashboard(session)) redirect("/check-email");
  const params = await searchParams;
  const requestedPage = pageNumber(params.page);
  let result = await listCustomerRequests(session.user.id, requestedPage);
  const page = Math.min(requestedPage, result.totalPages);
  if (page !== requestedPage) result = await listCustomerRequests(session.user.id, page);
  const serialised = result.records.map((request) => ({
    ...request,
    createdAt: brisbaneDateTime.format(request.createdAt),
    updatedAt: brisbaneDateTime.format(request.updatedAt),
    readAt: request.readAt?.toISOString() ?? null,
    withdrawnAt: request.withdrawnAt?.toISOString() ?? null,
    messages: request.messages.map((message) => ({ ...message, createdAt: brisbaneDateTime.format(message.createdAt) })),
  }));

  return <section className="account-dashboard"><div className="container">
    <div className="account-dashboard__header"><p className="eyebrow"><span className="eyebrow-line" />Customer dashboard</p><h1>Welcome, {session.user.name}</h1><p>Review your account, complete requests and conversation history from one protected place.</p></div>
    {params.verified === "true" ? <p className="request-success" role="status">Your email address is verified and your account is active.</p> : null}
    {params.access === "denied" ? <p className="request-notice" role="alert">Administrator access is restricted to authorised administrator accounts.</p> : null}
    <section className="account-panel" aria-labelledby="account-details"><h2 id="account-details">Account details</h2><dl><div><dt>Full name</dt><dd>{session.user.name}</dd></div><div><dt>Email</dt><dd>{session.user.email}</dd></div><div><dt>Email status</dt><dd>Verified</dd></div></dl><SignOutButton /></section>
    <section className="account-requests" aria-labelledby="customer-requests"><div className="admin-table__heading"><h2 id="customer-requests">Your requests</h2><p>{result.total} request{result.total === 1 ? "" : "s"} · Page {page} of {result.totalPages}</p></div><CustomerRequestList requests={serialised} /><nav aria-label="Your request pages" className="admin-pagination">{page > 1 ? <Link href={`/dashboard?page=${page - 1}`}>← Previous</Link> : <span />}{page < result.totalPages ? <Link href={`/dashboard?page=${page + 1}`}>Next →</Link> : null}</nav></section>
  </div></section>;
}
