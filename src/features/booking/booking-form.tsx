"use client";

import Link from "next/link";
import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { bookingContactSchema, bookingDetailsSchema, bookingOptions, bookingRequestSchema, serviceLabel, type BookingField } from "./booking-schema";

type Fields = { fullName: string; email: string; phone: string; servicePath: string; message: string; consent: boolean; website: string };
type FieldErrors = Partial<Record<BookingField, string>>;
const empty: Fields = { fullName: "", email: "", phone: "", servicePath: "", message: "", consent: false, website: "" };

function issuesToErrors(issues: { path: PropertyKey[]; message: string }[]) {
  return issues.reduce<FieldErrors>((errors, issue) => {
    const field = String(issue.path[0] ?? "") as BookingField;
    if (field && !errors[field]) errors[field] = issue.message;
    return errors;
  }, {});
}

export function BookingForm({ initialService = "", compact = false, onClose }: { initialService?: string; compact?: boolean; onClose?: () => void }) {
  const [fields, setFields] = useState<Fields>({ ...empty, servicePath: initialService });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [formError, setFormError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const stepHeadingRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);
  const id = useId().replace(/:/g, "");
  const steps = ["Contact", "Request", "Review"];

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      if (!compact) return;
    }
    requestAnimationFrame(() => stepHeadingRef.current?.focus());
  }, [step, compact]);

  function fieldError(field: BookingField, value: string | boolean) {
    const schema = bookingRequestSchema.shape[field] as { safeParse: (input: unknown) => { success: boolean; error?: { issues: { message: string }[] } } };
    const result = schema.safeParse(value);
    return result.success ? undefined : result.error?.issues[0]?.message;
  }

  function update(field: keyof Fields, value: string | boolean) {
    setFields((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      const nextErrors = { ...errors };
      const nextError = fieldError(field, value);
      if (nextError) nextErrors[field] = nextError;
      else delete nextErrors[field];
      setErrors(nextErrors);
      if (!Object.values(nextErrors).some(Boolean)) setFormError("");
    }
  }

  function focusFirstInvalid(nextErrors: FieldErrors) {
    const first = Object.keys(nextErrors)[0];
    if (first) requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus());
  }

  function validateStep(currentStep: number) {
    const result = (currentStep === 0 ? bookingContactSchema : bookingDetailsSchema).safeParse(fields);
    if (result.success) { setErrors({}); return true; }
    const nextErrors = issuesToErrors(result.error.issues);
    setErrors(nextErrors);
    setFormError("Please correct the highlighted fields before continuing.");
    focusFirstInvalid(nextErrors);
    return false;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    if (step < 2) { if (validateStep(step)) setStep(step + 1); return; }
    const parsed = bookingRequestSchema.safeParse(fields);
    if (!parsed.success) {
      const nextErrors = issuesToErrors(parsed.error.issues);
      setErrors(nextErrors);
      setFormError("Please review the highlighted information before sending.");
      focusFirstInvalid(nextErrors);
      return;
    }
    setStatus("sending");
    try {
      const response = await fetch("/api/booking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "We could not deliver your request.");
      setStatus("success");
    } catch (cause) {
      setStatus("error");
      setFormError(cause instanceof Error ? cause.message : "We could not deliver your request.");
    }
  }

  const errorId = (field: BookingField) => `${id}-${field}-error`;
  const describedBy = (field: BookingField) => errors[field] ? errorId(field) : undefined;

  if (status === "success") return <section className="booking-success" aria-labelledby={`${id}-success-title`} role="status">
    <h2 id={`${id}-success-title`} ref={stepHeadingRef as React.RefObject<HTMLHeadingElement>} tabIndex={-1}>Request received</h2>
    <p>Thank you. Your booking request has been received. This is not yet a confirmed appointment. The BoomoTech team will contact you to discuss availability and next steps.</p>
    <div className="booking-success__actions">{onClose ? <button className="button-link button-link--primary" onClick={onClose}>Close assistant</button> : null}<Link className="button-link button-link--secondary" href="/">Return home</Link><Link className="button-link button-link--secondary" href="/services">Explore services</Link></div>
  </section>;

  return <form className={`booking-form${compact ? " booking-form--compact" : ""}`} onSubmit={submit} noValidate ref={formRef}>
    <p className="required-note"><span aria-hidden="true">*</span> All fields are required.</p>
    <ol className="booking-progress" aria-label="Booking request progress">{steps.map((label, index) => <li key={label} aria-current={index === step ? "step" : undefined} className={index <= step ? "is-active" : ""}><span>{index + 1}</span>{label}</li>)}</ol>
    {step === 0 && <fieldset><legend ref={stepHeadingRef as React.RefObject<HTMLLegendElement>} tabIndex={-1}>Your contact details</legend>
      <label>Full name <span aria-hidden="true">*</span><input name="fullName" autoComplete="name" required maxLength={100} value={fields.fullName} aria-invalid={Boolean(errors.fullName)} aria-describedby={describedBy("fullName")} onChange={(event) => update("fullName", event.target.value)} />{errors.fullName && <span className="field-error" id={errorId("fullName")}>{errors.fullName}</span>}</label>
      <label>Email address <span aria-hidden="true">*</span><input name="email" type="email" autoComplete="email" required maxLength={254} value={fields.email} aria-invalid={Boolean(errors.email)} aria-describedby={describedBy("email")} onChange={(event) => update("email", event.target.value)} />{errors.email && <span className="field-error" id={errorId("email")}>{errors.email}</span>}</label>
      <label>Phone number <span aria-hidden="true">*</span><input name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={32} value={fields.phone} aria-invalid={Boolean(errors.phone)} aria-describedby={describedBy("phone")} onChange={(event) => update("phone", event.target.value)} />{errors.phone && <span className="field-error" id={errorId("phone")}>{errors.phone}</span>}</label>
      <label className="booking-honeypot" aria-hidden="true">Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" data-1p-ignore="true" data-lpignore="true" value={fields.website} onChange={(event) => update("website", event.target.value)} /></label>
    </fieldset>}
    {step === 1 && <fieldset><legend ref={stepHeadingRef as React.RefObject<HTMLLegendElement>} tabIndex={-1}>Tell us what you need</legend>
      <label>Service required <span aria-hidden="true">*</span><select name="servicePath" required value={fields.servicePath} aria-invalid={Boolean(errors.servicePath)} aria-describedby={describedBy("servicePath")} onChange={(event) => update("servicePath", event.target.value)}><option value="">Choose a service</option>{bookingOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{errors.servicePath && <span className="field-error" id={errorId("servicePath")}>{errors.servicePath}</span>}</label>
      <label>Problem or requested work <span aria-hidden="true">*</span><textarea name="message" required rows={compact ? 4 : 6} minLength={20} maxLength={3000} value={fields.message} aria-invalid={Boolean(errors.message)} aria-describedby={describedBy("message")} onChange={(event) => update("message", event.target.value)} />{errors.message && <span className="field-error" id={errorId("message")}>{errors.message}</span>}</label>
      <div className="booking-consent-wrap"><label className="booking-consent"><input name="consent" type="checkbox" checked={fields.consent} aria-invalid={Boolean(errors.consent)} aria-describedby={describedBy("consent")} onChange={(event) => update("consent", event.target.checked)} /> <span>I agree that BoomoTech may use these details to respond to this request. This does not confirm an appointment. Read the <Link href="/privacy">draft privacy information</Link>.</span></label>{errors.consent && <span className="field-error" id={errorId("consent")}>{errors.consent}</span>}</div>
    </fieldset>}
    {step === 2 && <section className="booking-review" aria-labelledby={`${id}-review-title`}><h2 id={`${id}-review-title`} ref={stepHeadingRef as React.RefObject<HTMLHeadingElement>} tabIndex={-1}>Review your request</h2><dl><div><dt>Name</dt><dd>{fields.fullName}</dd></div><div><dt>Email</dt><dd>{fields.email}</dd></div><div><dt>Phone</dt><dd>{fields.phone}</dd></div><div><dt>Service</dt><dd>{serviceLabel(fields.servicePath)}</dd></div><div><dt>Message</dt><dd>{fields.message}</dd></div></dl><p className="fine-print">Submitting sends a request for discussion. It is not a confirmed appointment.</p></section>}
    {formError && <p className="form-error" role="alert">{formError}{status === "error" ? " Your information has been kept so you can retry." : ""}</p>}
    <div className="booking-actions">{step > 0 && <button type="button" className="button-link button-link--secondary" onClick={() => { setStep(step - 1); setStatus("idle"); setFormError(""); }}>Back</button>}<button className="button-link button-link--primary" disabled={status === "sending"}>{status === "sending" ? "Sending…" : status === "error" && step === 2 ? "Retry sending request" : step === 2 ? "Send booking request" : "Continue"}</button></div>
  </form>;
}
