import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AdminRequestControls } from "@/components/requests/admin-request-controls";
import { RequestPriorityBadge, RequestStatusBadge } from "@/components/requests/status-badge";
import { serviceLabel } from "@/features/booking/booking-schema";
import { brisbaneDateTime, formatRequestEvent } from "@/features/requests/format";
import { getAdminRequest, RequestWorkflowError } from "@/features/requests/repository";
import { auth } from "@/lib/auth/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Request details", robots: { index: false, follow: false } };

export default async function AdminRequestPage({ params }: { params: Promise<{ reference: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/admin/login");
  if (session.user.role !== "admin") redirect("/dashboard?access=denied");
  const { reference } = await params;
  let request: Awaited<ReturnType<typeof getAdminRequest>>;
  try { request = await getAdminRequest(reference); } catch (error) { if (error instanceof RequestWorkflowError && error.code === "not-found") notFound(); throw error; }

  return <section className="admin-page"><div className="container admin-request-detail">
    <Link className="text-link" href="/admin">← Back to requests</Link>
    <header className="admin-page__header"><div><p className="eyebrow"><span className="eyebrow-line" />Request {request.reference}</p><h1>{serviceLabel(request.servicePath)}</h1><div className="request-badges"><RequestStatusBadge status={request.status} /><RequestPriorityBadge priority={request.priority} /></div></div><SignOutButton admin /></header>
    <div className="admin-request-layout"><main>
      <section className="request-detail-panel"><h2>Customer and request</h2><dl><div><dt>Customer</dt><dd>{request.fullName}</dd></div><div><dt>Customer access</dt><dd>{request.userId ? "Verified account" : "Guest request — responses are sent by email"}</dd></div><div><dt>Email</dt><dd><a href={`mailto:${request.email}`}>{request.email}</a></dd></div><div><dt>Phone</dt><dd><a href={`tel:${request.phone}`}>{request.phone}</a></dd></div><div><dt>Source</dt><dd>{request.source === "chatbot" ? "Chatbot" : "Booking page"}</dd></div><div><dt>Submitted</dt><dd>{brisbaneDateTime.format(request.createdAt)}</dd></div><div><dt>Updated</dt><dd>{brisbaneDateTime.format(request.updatedAt)}</dd></div></dl><h3>Original description</h3><p className="request-copy">{request.message}</p></section>
      <section className="request-detail-panel request-conversation"><h2>Conversation</h2>{request.messages.length ? <ol>{request.messages.map((message) => <li key={message.id}><div><strong>{message.authorRole === "admin" ? "BoomoTech administrator" : "Customer"}</strong><time>{brisbaneDateTime.format(message.createdAt)}</time></div><p>{message.body}</p></li>)}</ol> : <p>No conversation messages yet.</p>}</section>
      <section className="request-detail-panel"><h2>Status history</h2>{request.events.length ? <ol className="request-history">{request.events.map((event) => { const formatted = formatRequestEvent(event); return <li key={event.id}><strong>{formatted.label}</strong>{formatted.transition ? <span>{formatted.transition}</span> : null}<span>{brisbaneDateTime.format(event.createdAt)}</span></li>; })}</ol> : <p>No workflow events yet.</p>}</section>
    </main><aside><AdminRequestControls internalNotes={request.internalNotes ?? ""} priority={request.priority} reference={request.reference} status={request.status} unread={!request.readAt && request.status === "NEW"} /></aside></div>
  </div></section>;
}
