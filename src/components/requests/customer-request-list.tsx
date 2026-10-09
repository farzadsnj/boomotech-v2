"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { serviceLabel } from "@/features/booking/booking-schema";
import { RequestStatusBadge } from "./status-badge";
import { statusHelp, type RequestStatus } from "@/features/requests/workflow";

type CustomerRequest = {
  reference: string; servicePath: string; message: string; status: RequestStatus;
  readAt: string | null; withdrawnAt: string | null; createdAt: string; updatedAt: string;
  messages: { id: string; authorRole: string; body: string; createdAt: string }[];
};

async function sendAction(reference: string, payload: object) {
  const response = await fetch(`/api/requests/${encodeURIComponent(reference)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const result = await response.json() as { error?: string };
  if (!response.ok) throw new Error(result.error ?? "The request could not be updated.");
}

export function CustomerRequestList({ requests }: { requests: CustomerRequest[] }) {
  const router = useRouter();
  const [active, setActive] = useState<string | null>(null);
  const [mode, setMode] = useState<"edit" | "withdraw" | "reply" | null>(null);
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");

  function open(reference: string, nextMode: typeof mode, initial = "") { setActive(reference); setMode(nextMode); setValue(initial); setNotice(""); }
  function cancel() { setActive(null); setMode(null); setValue(""); }

  async function submit(event: FormEvent, reference: string) {
    event.preventDefault(); setPending(true); setNotice("");
    try {
      await sendAction(reference, mode === "edit" ? { action: "edit", description: value } : mode === "reply" ? { action: "reply", message: value } : { action: "withdraw" });
      setNotice(mode === "withdraw" ? "Request withdrawn." : mode === "reply" ? "Reply added." : "Description updated.");
      cancel(); router.refresh();
    } catch (error) { setNotice(error instanceof Error ? error.message : "The request could not be updated."); }
    finally { setPending(false); }
  }

  if (!requests.length) return <div className="request-empty"><h3>No booking requests yet</h3><p>Requests submitted while you are signed in will appear here.</p></div>;

  return <div className="customer-request-list">
    {notice ? <p className="request-notice" role="status">{notice}</p> : <p className="sr-only" aria-live="polite">Request actions are ready.</p>}
    {requests.map((request) => {
      const canEdit = request.status === "NEW" && !request.readAt && !request.withdrawnAt;
      const canReply = request.status === "IN_PROGRESS" || request.status === "AWAITING_USER";
      const isActive = active === request.reference;
      return <article className="customer-request-card" key={request.reference}>
        <header><div><p className="request-reference">{request.reference}</p><h3>{serviceLabel(request.servicePath)}</h3></div><div className="request-badges"><RequestStatusBadge status={request.status} /></div></header>
        <dl className="request-dates"><div><dt>Submitted</dt><dd>{request.createdAt}</dd></div><div><dt>Last updated</dt><dd>{request.updatedAt}</dd></div></dl>
        <section aria-labelledby={`${request.reference}-description`}><h4 id={`${request.reference}-description`}>Original request</h4><p className="request-copy">{request.message}</p></section>
        <p className="request-status-help">{statusHelp(request.status)}</p>
        <section aria-labelledby={`${request.reference}-conversation`} className="request-conversation"><h4 id={`${request.reference}-conversation`}>Conversation</h4>{request.messages.length ? <ol>{request.messages.map((message) => <li key={message.id}><div><strong>{message.authorRole === "admin" ? "BoomoTech" : "You"}</strong><time>{message.createdAt}</time></div><p>{message.body}</p></li>)}</ol> : <p>No conversation messages yet.</p>}</section>
        <div className="request-actions">
          {canEdit ? <><button onClick={() => open(request.reference, "edit", request.message)} type="button">Edit request</button><button className="request-action--danger" onClick={() => open(request.reference, "withdraw")} type="button">Withdraw request</button></> : null}
          {canReply ? <button onClick={() => open(request.reference, "reply")} type="button">Reply to BoomoTech</button> : null}
        </div>
        {isActive && mode ? <form className="request-inline-form" onSubmit={(event) => submit(event, request.reference)}>
          {mode === "withdraw" ? <><h4>Withdraw this request?</h4><p>This cannot be undone from your dashboard. The conversation will remain as an audit record.</p></> : <div className="auth-field"><label htmlFor={`${request.reference}-${mode}`}>{mode === "edit" ? "Request description" : "Your reply"}</label><textarea autoFocus id={`${request.reference}-${mode}`} maxLength={mode === "edit" ? 3000 : 4000} minLength={mode === "edit" ? 20 : 2} onChange={(event) => setValue(event.currentTarget.value)} required rows={6} value={value} /></div>}
          <div className="request-actions"><button disabled={pending} type="submit">{pending ? "Saving…" : mode === "withdraw" ? "Confirm withdrawal" : "Save"}</button><button disabled={pending} onClick={cancel} type="button">Cancel</button></div>
        </form> : null}
      </article>;
    })}
  </div>;
}
