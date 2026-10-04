import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { CustomerRequestList } from "@/components/requests/customer-request-list";
import { brisbaneDateTime } from "@/features/requests/format";
import { listCustomerRequests } from "@/features/requests/repository";
import { auth } from "@/lib/auth/auth";
import { canAccessCustomerDashboard } from "@/lib/auth/access";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Customer dashboard", robots: { index: false, follow: false } };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ verified?: string; access?: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login?next=/dashboard");
  if (!canAccessCustomerDashboard(session)) redirect("/check-email");
  const requests = await listCustomerRequests(session.user.id);
  const params = await searchParams;
  const serialised = requests.map((request) => ({
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
    <section className="account-requests" aria-labelledby="customer-requests"><div className="admin-table__heading"><h2 id="customer-requests">Your requests</h2><p>{requests.length} request{requests.length === 1 ? "" : "s"}</p></div><CustomerRequestList requests={serialised} /></section>
  </div></section>;
}
