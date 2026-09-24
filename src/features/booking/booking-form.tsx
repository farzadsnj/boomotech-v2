"use client";

import { FormEvent, useMemo, useState } from "react";
import { bookingOptions, bookingRequestSchema, serviceLabel } from "./booking-schema";

type Fields = { fullName: string; email: string; phone: string; servicePath: string; message: string; consent: boolean; website: string };
const empty: Fields = { fullName: "", email: "", phone: "", servicePath: "", message: "", consent: false, website: "" };

export function BookingForm({ initialService = "", compact = false }: { initialService?: string; compact?: boolean }) {
  const [fields, setFields] = useState<Fields>({ ...empty, servicePath: initialService });
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const steps = ["Contact", "Request", "Review"];
  const update = (key: keyof Fields, value: string | boolean) => setFields((current) => ({ ...current, [key]: value }));

  const stepValid = useMemo(() => {
    if (step === 0) return fields.fullName.trim().length >= 2 && /@/.test(fields.email) && fields.phone.trim().length >= 8;
    if (step === 1) return Boolean(fields.servicePath) && fields.message.trim().length >= 20 && fields.consent;
    return true;
  }, [fields, step]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (step < 2) { if (stepValid) setStep(step + 1); return; }
    const parsed = bookingRequestSchema.safeParse(fields);
    if (!parsed.success) { setError("Please review each field before sending."); return; }
    setStatus("sending"); setError("");
    try {
      const response = await fetch("/api/booking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Delivery failed.");
      setStatus("success");
    } catch (cause) { setStatus("error"); setError(cause instanceof Error ? cause.message : "Delivery failed. Please try again later."); }
  }

  if (status === "success") return <div className="booking-success" role="status"><h2>Request received</h2><p>Thank you. Your booking request has been received. This is not yet a confirmed appointment. The BoomoTech team will contact you to discuss availability and the next steps.</p></div>;

  return <form className={`booking-form${compact ? " booking-form--compact" : ""}`} onSubmit={submit} noValidate>
    <ol className="booking-progress" aria-label="Booking request progress">{steps.map((label, index) => <li key={label} aria-current={index === step ? "step" : undefined} className={index <= step ? "is-active" : ""}><span>{index + 1}</span>{label}</li>)}</ol>
    {step === 0 && <fieldset><legend>Your contact details</legend>
      <label>Full name<input name="fullName" autoComplete="name" required maxLength={100} value={fields.fullName} onChange={(e) => update("fullName", e.target.value)} /></label>
      <label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} value={fields.email} onChange={(e) => update("email", e.target.value)} /></label>
      <label>Phone number<input name="phone" type="tel" autoComplete="tel" required maxLength={32} value={fields.phone} onChange={(e) => update("phone", e.target.value)} /></label>
      <label className="booking-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" value={fields.website} onChange={(e) => update("website", e.target.value)} /></label>
    </fieldset>}
    {step === 1 && <fieldset><legend>Tell us what you need</legend>
      <label>Service required<select required value={fields.servicePath} onChange={(e) => update("servicePath", e.target.value)}><option value="">Choose a service</option>{bookingOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
      <label>Problem or requested work<textarea required rows={compact ? 4 : 6} minLength={20} maxLength={3000} value={fields.message} onChange={(e) => update("message", e.target.value)} /></label>
      <label className="booking-consent"><input type="checkbox" checked={fields.consent} onChange={(e) => update("consent", e.target.checked)} /> <span>I agree that BoomoTech may use these details to respond to this request. This does not confirm an appointment.</span></label>
    </fieldset>}
    {step === 2 && <section className="booking-review" aria-labelledby="review-title"><h2 id="review-title">Review your request</h2><dl><div><dt>Name</dt><dd>{fields.fullName}</dd></div><div><dt>Email</dt><dd>{fields.email}</dd></div><div><dt>Phone</dt><dd>{fields.phone}</dd></div><div><dt>Service</dt><dd>{serviceLabel(fields.servicePath)}</dd></div><div><dt>Message</dt><dd>{fields.message}</dd></div></dl><p className="fine-print">Submitting sends a request for discussion. It is not a confirmed appointment.</p></section>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="booking-actions">{step > 0 && <button type="button" className="button-link button-link--secondary" onClick={() => { setStep(step - 1); setStatus("idle"); }}>Back</button>}<button className="button-link button-link--primary" disabled={!stepValid || status === "sending"}>{status === "sending" ? "Sending…" : step === 2 ? "Send booking request" : "Continue"}</button></div>
  </form>;
}
