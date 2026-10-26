import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminRequestControls } from "@/components/requests/admin-request-controls";
import { RequestPriorityBadge, RequestStatusBadge } from "@/components/requests/status-badge";
import { serviceLabel } from "@/features/booking/booking-schema";
import { brisbaneDateTime, formatRequestEvent } from "@/features/requests/format";
import { getAdminRequest, RequestWorkflowError } from "@/features/requests/repository";
import { auth } from "@/lib/auth/auth";
import { canAccessAdminDashboard } from "@/lib/auth/access";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { DASHBOARD_THEME_COOKIE, parseDashboardTheme } from "@/features/dashboard/theme";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Request details", robots: { index: false, follow: false } };

export default async function AdminRequestPage({ params }: { params: Promise<{ reference: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/admin/login");
  if (session.user.role === "admin" && !session.user.twoFactorEnabled) redirect("/admin/mfa/setup");
  if (!canAccessAdminDashboard(session)) redirect("/dashboard?access=denied");
  const initialTheme = parseDashboardTheme((await cookies()).get(DASHBOARD_THEME_COOKIE)?.value);
  const { reference } = await params;
  let request: Awaited<ReturnType<typeof getAdminRequest>>;
  try { request = await getAdminRequest(reference); } catch (error) { if (error instanceof RequestWorkflowError && error.code === "not-found") notFound(); throw error; }

  return <DashboardShell breadcrumbs={[{ href: "/admin", label: "Overview" }, { label: `Request ${request.reference}` }]} initialTheme={initialTheme} role="admin" user={{ email: session.user.email, name: session.user.name }}><section className="admin-page"><div className="container admin-request-detail">
    <Link className="text-link" href="/admin">← Back to requests</Link>
    <header className="admin-page__header"><div><p className="eyebrow"><span className="eyebrow-line" />Request {request.reference}</p><h1>{serviceLabel(request.servicePath)}</h1><div className="request-badges"><RequestStatusBadge audience="admin" status={request.status} /><RequestPriorityBadge priority={request.priority} /></div></div></header>
    <div className="admin-request-layout"><div>
      <section className="request-detail-panel"><h2>Customer and request</h2><dl><div><dt>Customer</dt><dd>{request.fullName}</dd></div><div><dt>Customer access</dt><dd>{request.userId ? "Verified account" : "Guest request — responses are sent by email"}</dd></div><div><dt>Email</dt><dd><a href={`mailto:${request.email}`}>{request.email}</a></dd></div><div><dt>Phone</dt><dd>{request.phone ? <a href={`tel:${request.phone}`}>{request.phone}</a> : "Not provided"}</dd></div><div><dt>Source</dt><dd>{request.source === "chatbot" ? "Chatbot" : "Booking page"}</dd></div><div><dt>Submitted</dt><dd>{brisbaneDateTime.format(request.createdAt)}</dd></div><div><dt>Updated</dt><dd>{brisbaneDateTime.format(request.updatedAt)}</dd></div></dl><h3>Original description</h3><p className="request-copy">{request.message}</p></section>
      <section className="request-detail-panel request-conversation"><div className="request-panel-heading"><div><h2>Conversation</h2><p>Messages are shown from oldest to newest.</p></div><span>{request.messages.length}</span></div><ol><li className="request-conversation__original"><div><strong>Customer · original request</strong><time dateTime={request.createdAt.toISOString()}>{brisbaneDateTime.format(request.createdAt)}</time></div><p>{request.message}</p></li>{request.messages.map((message) => <li className={`request-conversation__message request-conversation__message--${message.authorRole}`} key={message.id}><div><strong>{message.authorRole === "admin" ? "BoomoTech administrator" : "Customer"}</strong><time dateTime={message.createdAt.toISOString()}>{brisbaneDateTime.format(message.createdAt)}</time></div><p>{message.body}</p></li>)}</ol></section>
      <section className="request-detail-panel"><div className="request-panel-heading"><div><h2>Status history</h2><p>Persisted workflow activity for this request.</p></div><span>{request.events.length}</span></div>{request.events.length ? <ol className="request-history">{request.events.map((event) => { const formatted = formatRequestEvent(event); return <li key={event.id}><span className="request-history__marker" aria-hidden="true" /><div><strong>{formatted.label}</strong>{formatted.transition ? <span>{formatted.transition}</span> : null}<time dateTime={event.createdAt.toISOString()}>{brisbaneDateTime.format(event.createdAt)}</time></div></li>; })}</ol> : <p>No workflow events yet.</p>}</section>
    </div><aside aria-label="Request administration"><AdminRequestControls internalNotes={request.internalNotes ?? ""} priority={request.priority} reference={request.reference} status={request.status} unread={!request.readAt && request.status === "NEW"} version={request.version} /></aside></div>
  </div></section></DashboardShell>;
}
