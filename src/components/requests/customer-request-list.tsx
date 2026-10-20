"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { serviceLabel } from "@/features/booking/booking-schema";
import { statusHelp, type RequestStatus } from "@/features/requests/workflow";
import { RequestStatusBadge } from "./status-badge";

type CustomerRequest = {
  reference: string;
  servicePath: string;
  message: string;
  status: RequestStatus;
  readAt: string | null;
  withdrawnAt: string | null;
  createdAt: string;
  createdAtLabel: string;
  updatedAt: string;
  updatedAtLabel: string;
  messages: { id: string; authorRole: string; body: string; createdAt: string; createdAtLabel: string }[];
};

type ActionMode = "edit" | "withdraw" | "reply";
type Notice = { kind: "error" | "success"; message: string };

async function sendAction(reference: string, payload: object) {
  const response = await fetch(`/api/requests/${encodeURIComponent(reference)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json() as { error?: string };
  if (!response.ok) throw new Error(result.error ?? "The request could not be updated.");
}

function nextAction(request: CustomerRequest) {
  if (request.status === "AWAITING_USER") return { label: "Reply requested", detail: "Review BoomoTech's latest message and reply when you are ready." };
  if (request.status === "IN_PROGRESS") return { label: "No action needed", detail: "BoomoTech is working on this request. You can add context if needed." };
  if (request.status === "RESOLVED") return { label: "Complete", detail: "This conversation is read-only. Start a new request if you need more help." };
  if (request.status === "WITHDRAWN") return { label: "No further action", detail: "This request was withdrawn before processing started." };
  if (!request.readAt) return { label: "Review your details", detail: "You can edit or withdraw this request until processing starts." };
  return { label: "Received", detail: "Processing has started, so the original description is locked." };
}

export function CustomerRequestList({ requests }: { requests: CustomerRequest[] }) {
  const router = useRouter();
  const [active, setActive] = useState<string | null>(null);
  const [mode, setMode] = useState<ActionMode | null>(null);
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  function open(reference: string, nextMode: ActionMode, initial = "") {
    setActive(reference);
    setMode(nextMode);
    setValue(initial);
    setNotice(null);
  }

  function cancel() {
    setActive(null);
    setMode(null);
    setValue("");
  }

  async function submit(event: FormEvent, reference: string) {
    event.preventDefault();
    setPending(true);
    setNotice(null);
    try {
      await sendAction(reference, mode === "edit" ? { action: "edit", description: value } : mode === "reply" ? { action: "reply", message: value } : { action: "withdraw" });
      setNotice({ kind: "success", message: mode === "withdraw" ? "Request withdrawn." : mode === "reply" ? "Reply added." : "Description updated." });
      cancel();
      router.refresh();
    } catch (error) {
      setNotice({ kind: "error", message: error instanceof Error ? error.message : "The request could not be updated." });
    } finally {
      setPending(false);
    }
  }

  if (!requests.length) return <div className="request-empty customer-request-empty">
    <span aria-hidden="true">＋</span>
    <h3>No requests yet</h3>
    <p>Support and consultation requests submitted while you are signed in will appear here.</p>
    <div><Link className="button button--primary" href="/booking">Create your first request</Link><Link className="text-link" href="/support">Explore support options</Link></div>
  </div>;

  return <div className="customer-request-list">
    {notice ? <p className={notice.kind === "error" ? "request-notice" : "request-success"} role={notice.kind === "error" ? "alert" : "status"}>{notice.message}</p> : <p className="sr-only" aria-live="polite">Request actions are ready.</p>}
    {requests.map((request) => {
      const canEdit = request.status === "NEW" && !request.readAt && !request.withdrawnAt;
      const canReply = request.status === "IN_PROGRESS" || request.status === "AWAITING_USER";
      const isActive = active === request.reference;
      const action = nextAction(request);
      const titleId = `${request.reference}-title`;
      const formId = `${request.reference}-action-form`;
      return <article aria-labelledby={titleId} className={`customer-request-card customer-request-card--${request.status.toLowerCase()}`} id={`request-${request.reference}`} key={request.reference}>
        <header className="customer-request-card__header">
          <div><p className="request-reference">{request.reference}</p><h3 id={titleId}>{serviceLabel(request.servicePath)}</h3></div>
          <RequestStatusBadge status={request.status} />
        </header>

        <dl className="customer-request-card__meta">
          <div><dt>Submitted</dt><dd><time dateTime={request.createdAt}>{request.createdAtLabel}</time></dd></div>
          <div><dt>Last activity</dt><dd><time dateTime={request.updatedAt}>{request.updatedAtLabel}</time></dd></div>
        </dl>

        <div className="customer-request-card__next-action">
          <span aria-hidden="true">{request.status === "AWAITING_USER" ? "!" : "✓"}</span>
          <div><strong>{action.label}</strong><p>{action.detail}</p></div>
        </div>

        <section aria-labelledby={`${request.reference}-description`} className="customer-request-card__description">
          <h4 id={`${request.reference}-description`}>Your request</h4>
          <p className="request-copy">{request.message}</p>
        </section>

        <details className="customer-request-card__conversation" open={request.status === "AWAITING_USER" || undefined}>
          <summary><span>Conversation history</span><small>{request.messages.length ? `${request.messages.length} ${request.messages.length === 1 ? "message" : "messages"}` : "No replies yet"}</small></summary>
          <ol className="customer-request-thread">
            <li className="customer-request-thread__customer">
              <div><strong>You</strong><time dateTime={request.createdAt}>{request.createdAtLabel}</time></div>
              <p>{request.message}</p>
            </li>
            {request.messages.map((message) => <li className={message.authorRole === "admin" ? "customer-request-thread__admin" : "customer-request-thread__customer"} key={message.id}>
              <div><strong>{message.authorRole === "admin" ? "BoomoTech" : "You"}</strong><time dateTime={message.createdAt}>{message.createdAtLabel}</time></div>
              <p>{message.body}</p>
            </li>)}
          </ol>
        </details>

        <p className="sr-only">{statusHelp(request.status)}</p>
        <div className="request-actions customer-request-card__actions">
          {canEdit ? <><button onClick={() => open(request.reference, "edit", request.message)} type="button">Edit request</button><button className="request-action--danger" onClick={() => open(request.reference, "withdraw")} type="button">Withdraw request</button></> : null}
          {canReply ? <button onClick={() => open(request.reference, "reply")} type="button">Reply to BoomoTech</button> : null}
          {request.status === "RESOLVED" || request.status === "WITHDRAWN" ? <Link className="text-link" href="/booking">Create another request</Link> : null}
        </div>

        {isActive && mode ? <form aria-label={`${mode === "edit" ? "Edit" : mode === "reply" ? "Reply to" : "Withdraw"} ${request.reference}`} className="request-inline-form" id={formId} onSubmit={(event) => submit(event, request.reference)}>
          {mode === "withdraw" ? <><h4 tabIndex={-1}>Withdraw this request?</h4><p>This cannot be undone from your dashboard. The conversation will remain as an audit record.</p></> : <div className="auth-field"><label htmlFor={`${request.reference}-${mode}`}>{mode === "edit" ? "Request description" : "Your reply"}</label><textarea autoFocus id={`${request.reference}-${mode}`} maxLength={mode === "edit" ? 3000 : 4000} minLength={mode === "edit" ? 20 : 2} onChange={(event) => setValue(event.currentTarget.value)} required rows={6} value={value} /></div>}
          <div className="request-actions"><button disabled={pending} type="submit">{pending ? "Saving…" : mode === "withdraw" ? "Confirm withdrawal" : "Save"}</button><button disabled={pending} onClick={cancel} type="button">Cancel</button></div>
        </form> : null}
      </article>;
    })}
  </div>;
}
