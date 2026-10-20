"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { adminStatusLabels, allowedStatusTransitions, priorityLabels, requestPriorities, type RequestPriority, type RequestStatus } from "@/features/requests/workflow";

async function send(reference: string, payload: object) {
  const response = await fetch(`/api/admin/requests/${encodeURIComponent(reference)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const result = await response.json() as { error?: string; result?: { version?: number } };
  if (!response.ok) throw new Error(result.error ?? "The request could not be updated.");
  return result.result;
}

export function AdminRequestControls({ reference, status, priority, unread, internalNotes, version }: { reference: string; status: RequestStatus; priority: RequestPriority; unread: boolean; internalNotes: string; version: number }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [notes, setNotes] = useState(internalNotes);
  const pendingRef = useRef(false);
  const versionRef = useRef(version);
  useEffect(() => { versionRef.current = version; }, [version]);

  async function act(payload: object) {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true); setNotice("");
    try {
      const result = await send(reference, { ...payload, version: versionRef.current });
      if (typeof result?.version === "number") versionRef.current = result.version;
      setNotice("Request updated."); setMessage(""); router.refresh();
    }
    catch (error) { setNotice(error instanceof Error ? error.message : "The request could not be updated."); }
    finally { pendingRef.current = false; setPending(false); }
  }

  async function reply(event: FormEvent<HTMLFormElement>) { event.preventDefault(); await act({ action: "reply", message, resolve: false }); }
  const transitions = allowedStatusTransitions[status];
  return <section className="admin-request-controls" aria-labelledby="request-actions-heading">
    <h2 id="request-actions-heading">Request actions</h2>
    <p aria-live="polite" className={notice ? "request-notice" : "sr-only"}>{notice}</p>
    {unread ? <button className="auth-submit" disabled={pending} onClick={() => act({ action: "start" })} type="button">Start processing</button> : null}
    <fieldset className="admin-controls-fieldset" disabled={pending}>
    <div className="admin-control-grid">
      <div className="auth-field"><label htmlFor="request-priority">Priority</label><select disabled={pending} id="request-priority" onChange={(event) => act({ action: "priority", priority: event.currentTarget.value })} value={priority}>{requestPriorities.map((item) => <option key={item} value={item}>{priorityLabels[item]}</option>)}</select><p className="auth-form__hint">Priority guides internal ordering and does not represent an SLA.</p></div>
      <div className="auth-field"><label htmlFor="request-status">Change status</label><select disabled={pending || !transitions.length} id="request-status" onChange={(event) => { const next = event.currentTarget.value as RequestStatus; if ((next === "RESOLVED" || status === "RESOLVED") && !window.confirm(`Confirm change to ${adminStatusLabels[next]}?`)) { event.currentTarget.value = status; return; } void act({ action: "status", status: next }); }} value={status}><option value={status}>{adminStatusLabels[status]}</option>{transitions.map((item) => <option key={item} value={item}>{adminStatusLabels[item]}</option>)}</select></div>
    </div>
    <form className="admin-response-form" onSubmit={(event) => { event.preventDefault(); void act({ action: "notes", notes }); }}>
      <div className="auth-field"><label htmlFor="admin-internal-notes">Internal notes</label><textarea id="admin-internal-notes" maxLength={5000} onChange={(event) => setNotes(event.currentTarget.value)} rows={6} value={notes} /><p className="auth-form__hint">Visible only to authorised administrators. Do not store passwords, access codes or unnecessary sensitive data.</p></div>
      <button disabled={pending} type="submit">{pending ? "Saving…" : "Save internal notes"}</button>
    </form>
    {status !== "WITHDRAWN" && status !== "RESOLVED" ? <form className="admin-response-form" onSubmit={reply}><div className="auth-field"><label htmlFor="admin-response">Response to customer</label><textarea id="admin-response" maxLength={4000} minLength={2} onChange={(event) => setMessage(event.currentTarget.value)} required rows={7} value={message} /></div><div className="request-actions"><button disabled={pending} type="submit">{pending ? "Sending…" : "Send response"}</button><button disabled={pending || message.trim().length < 2} onClick={() => { if (window.confirm("Send this response and resolve the request?")) void act({ action: "reply", message, resolve: true }); }} type="button">Send and resolve</button></div></form> : <p>This conversation is read-only. Use the status control to reopen a resolved request.</p>}
    </fieldset>
  </section>;
}
