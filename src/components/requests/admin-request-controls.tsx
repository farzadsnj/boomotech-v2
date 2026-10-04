"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { allowedStatusTransitions, priorityLabels, requestPriorities, statusLabels, type RequestPriority, type RequestStatus } from "@/features/requests/workflow";

async function send(reference: string, payload: object) {
  const response = await fetch(`/api/admin/requests/${encodeURIComponent(reference)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const result = await response.json() as { error?: string };
  if (!response.ok) throw new Error(result.error ?? "The request could not be updated.");
}

export function AdminRequestControls({ reference, status, priority, unread }: { reference: string; status: RequestStatus; priority: RequestPriority; unread: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");

  async function act(payload: object) {
    setPending(true); setNotice("");
    try { await send(reference, payload); setNotice("Request updated."); setMessage(""); router.refresh(); }
    catch (error) { setNotice(error instanceof Error ? error.message : "The request could not be updated."); }
    finally { setPending(false); }
  }

  async function reply(event: FormEvent<HTMLFormElement>) { event.preventDefault(); await act({ action: "reply", message, resolve: false }); }
  const transitions = allowedStatusTransitions[status];
  return <section className="admin-request-controls" aria-labelledby="request-actions-heading">
    <h2 id="request-actions-heading">Request actions</h2>
    <p aria-live="polite" className={notice ? "request-notice" : "sr-only"}>{notice}</p>
    {unread ? <button className="auth-submit" disabled={pending} onClick={() => act({ action: "start" })} type="button">Start processing</button> : null}
    <div className="admin-control-grid">
      <div className="auth-field"><label htmlFor="request-priority">Priority</label><select disabled={pending} id="request-priority" onChange={(event) => act({ action: "priority", priority: event.currentTarget.value })} value={priority}>{requestPriorities.map((item) => <option key={item} value={item}>{priorityLabels[item]}</option>)}</select><p className="auth-form__hint">Priority guides internal ordering and does not represent an SLA.</p></div>
      <div className="auth-field"><label htmlFor="request-status">Change status</label><select disabled={pending || !transitions.length} id="request-status" onChange={(event) => { const next = event.currentTarget.value as RequestStatus; if ((next === "RESOLVED" || status === "RESOLVED") && !window.confirm(`Confirm change to ${statusLabels[next]}?`)) { event.currentTarget.value = status; return; } void act({ action: "status", status: next }); }} value={status}><option value={status}>{statusLabels[status]}</option>{transitions.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}</select></div>
    </div>
    {status !== "WITHDRAWN" && status !== "RESOLVED" ? <form className="admin-response-form" onSubmit={reply}><div className="auth-field"><label htmlFor="admin-response">Response to customer</label><textarea id="admin-response" maxLength={4000} minLength={2} onChange={(event) => setMessage(event.currentTarget.value)} required rows={7} value={message} /></div><div className="request-actions"><button disabled={pending} type="submit">{pending ? "Sending…" : "Send response"}</button><button disabled={pending || message.length < 2} onClick={() => { if (window.confirm("Send this response and resolve the request?")) void act({ action: "reply", message, resolve: true }); }} type="button">Send and resolve</button></div></form> : <p>This conversation is read-only. Use the status control to reopen a resolved request.</p>}
  </section>;
}
