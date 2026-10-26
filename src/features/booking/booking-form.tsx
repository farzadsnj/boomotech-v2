"use client";

import Link from "next/link";
import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { useEnquiryContext } from "@/features/enquiry/context";
import { categoryForService } from "@/features/enquiry/recommendation";
import { audienceLabels, categoryLabels, enquiryAudiences, enquiryCategories, type EnquiryIntent, type PreparationAnswer } from "@/features/enquiry/types";
import { audienceLabel, bookingContactSchema, bookingFieldSchemas, bookingOptions, bookingProblemSchema, bookingRequestSchema, categoryLabel, serviceLabel, type BookingField } from "./booking-schema";

type Fields = {
  audience: (typeof enquiryAudiences)[number]; category: (typeof enquiryCategories)[number]; servicePath: string; intent: EnquiryIntent;
  message: string; preparation: PreparationAnswer[]; fullName: string; email: string; preferredContact: "email" | "phone";
  phone: string; businessName: string; consent: boolean; website: string;
};
type FieldErrors = Partial<Record<BookingField, string>>;

function issuesToErrors(issues: { path: PropertyKey[]; message: string }[]) {
  return issues.reduce<FieldErrors>((errors, issue) => {
    const field = String(issue.path[0] ?? "") as BookingField;
    if (field && !errors[field]) errors[field] = issue.message;
    return errors;
  }, {});
}

export function BookingForm({ initialService = "", initialAudience, initialCategory, initialFullName = "", initialEmail = "", intent = "consultation", compact = false, onClose, onDirtyChange }: { initialService?: string; initialAudience?: Fields["audience"]; initialCategory?: Fields["category"]; initialFullName?: string; initialEmail?: string; intent?: EnquiryIntent; compact?: boolean; onClose?: () => void; onDirtyChange?: (dirty: boolean) => void }) {
  const { context, updateContext, clearContext } = useEnquiryContext();
  const selectedService = initialService || context.servicePath || "other";
  const [fields, setFields] = useState<Fields>({
    audience: initialAudience ?? context.audience ?? "unsure", category: initialCategory ?? context.category ?? categoryForService(selectedService), servicePath: selectedService,
    intent: context.intent ?? intent, message: context.description ?? "", preparation: context.preparation ?? [], fullName: initialFullName, email: initialEmail,
    preferredContact: "email", phone: "", businessName: "", consent: false, website: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [formError, setFormError] = useState("");
  const [reference, setReference] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const stepHeadingRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);
  const submissionKey = useRef("");
  const id = useId().replace(/:/g, "");
  const steps = ["Your need", "Contact", "Review"];

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; if (!compact) return; }
    requestAnimationFrame(() => stepHeadingRef.current?.focus());
  }, [step, compact]);
  useEffect(() => {
    const dirty = status !== "success" && Boolean(fields.fullName || fields.email || fields.phone || fields.message || fields.consent || fields.servicePath !== selectedService);
    onDirtyChange?.(dirty);
  }, [fields, onDirtyChange, selectedService, status]);
  useEffect(() => {
    updateContext({ audience: fields.audience, category: fields.category, servicePath: fields.servicePath, intent: fields.intent, preparation: fields.preparation, description: fields.message });
  }, [fields.audience, fields.category, fields.servicePath, fields.intent, fields.preparation, fields.message, updateContext]);

  function fieldError(field: BookingField, value: string | boolean) {
    const schema = bookingFieldSchemas[field] as { safeParse: (input: unknown) => { success: boolean; error?: { issues: { message: string }[] } } };
    const result = schema.safeParse(value);
    return result.success ? undefined : result.error?.issues[0]?.message;
  }
  function update<K extends keyof Fields>(field: K, value: Fields[K]) {
    setFields((current) => ({ ...current, [field]: value }));
    if (errors[field as BookingField]) {
      const nextErrors = { ...errors };
      const nextError = fieldError(field as BookingField, value as string | boolean);
      if (nextError) nextErrors[field as BookingField] = nextError; else delete nextErrors[field as BookingField];
      setErrors(nextErrors); if (!Object.values(nextErrors).some(Boolean)) setFormError("");
    }
    if (status === "error") { submissionKey.current = ""; setStatus("idle"); }
  }
  function focusFirstInvalid(nextErrors: FieldErrors) {
    const first = Object.keys(nextErrors)[0];
    if (first) requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus());
  }
  function validateStep(currentStep: number) {
    const result = (currentStep === 0 ? bookingProblemSchema : bookingContactSchema).safeParse(fields);
    if (result.success) { setErrors({}); setFormError(""); return true; }
    const nextErrors = issuesToErrors(result.error.issues); setErrors(nextErrors); setFormError("Please correct the highlighted fields before continuing."); focusFirstInvalid(nextErrors); return false;
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); setFormError("");
    if (step < 2) { if (validateStep(step)) setStep(step + 1); return; }
    const parsed = bookingRequestSchema.safeParse({ ...fields, source: compact ? "chatbot" : "booking-page" });
    if (!parsed.success) { const nextErrors = issuesToErrors(parsed.error.issues); setErrors(nextErrors); setFormError("Please review the highlighted information before sending."); focusFirstInvalid(nextErrors); return; }
    setStatus("sending");
    try {
      submissionKey.current ||= crypto.randomUUID();
      const response = await fetch("/api/booking", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": submissionKey.current }, body: JSON.stringify(parsed.data) });
      const result = await response.json() as { error?: string; reference?: string };
      if (!response.ok) throw new Error(result.error ?? "We could not deliver your request.");
      if (result.reference) setReference(result.reference);
      setStatus("success"); clearContext();
    } catch (cause) { setStatus("error"); setFormError(cause instanceof Error ? cause.message : "We could not deliver your request."); }
  }

  const errorId = (field: BookingField) => `${id}-${field}-error`;
  const describedBy = (field: BookingField) => errors[field] ? errorId(field) : undefined;
  const submitName = fields.intent === "quote" ? "quote request" : fields.intent === "support" ? "support request" : fields.intent === "project" ? "project request" : "consultation request";

  if (status === "success") return <section className="booking-success" aria-labelledby={`${id}-success-title`} role="status">
    <h2 id={`${id}-success-title`} ref={stepHeadingRef as React.RefObject<HTMLHeadingElement>} tabIndex={-1}>Request received</h2>
    <p>BoomoTech received your <strong>{serviceLabel(fields.servicePath).toLowerCase()}</strong> request and will review the information before following up by {fields.preferredContact === "phone" ? "phone or email" : "email"}. This receipt is not a confirmed appointment.</p>
    {reference ? <p><strong>Your reference:</strong> {reference}</p> : null}
    <div className="booking-success__actions">{onClose ? <button className="button-link button-link--primary" onClick={onClose}>Close assistant</button> : null}<Link className="button-link button-link--secondary" href="/">Return home</Link><Link className="button-link button-link--secondary" href="/services">Explore services</Link></div>
  </section>;

  return <form className={`booking-form${compact ? " booking-form--compact" : ""}`} onSubmit={submit} noValidate ref={formRef}>
    <p className="required-note"><span aria-hidden="true">*</span> Required fields are marked. Phone and business name are optional unless you request phone contact.</p>
    <ol className="booking-progress" aria-label="Request progress">{steps.map((label, index) => <li key={label} aria-current={index === step ? "step" : undefined} className={index <= step ? "is-active" : ""}><span>{index + 1}</span>{label}</li>)}</ol>

    {step === 0 && <fieldset><legend ref={stepHeadingRef as React.RefObject<HTMLLegendElement>} tabIndex={-1}>What do you need help with?</legend>
      <label><span className="field-label">Who is this for? <span aria-hidden="true">*</span></span><select name="audience" value={fields.audience} onChange={(event) => update("audience", event.target.value as Fields["audience"])}>{enquiryAudiences.map((value) => <option key={value} value={value}>{audienceLabels[value]}</option>)}</select></label>
      <label><span className="field-label">Problem or goal <span aria-hidden="true">*</span></span><select name="category" value={fields.category} onChange={(event) => update("category", event.target.value as Fields["category"])}>{enquiryCategories.map((value) => <option key={value} value={value}>{categoryLabels[value]}</option>)}</select></label>
      <label><span className="field-label">Service required or suggested <span aria-hidden="true">*</span></span><select name="servicePath" value={fields.servicePath} aria-invalid={Boolean(errors.servicePath)} aria-describedby={describedBy("servicePath")} onChange={(event) => update("servicePath", event.target.value)}>{bookingOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{context.serviceChoice === "suggested" ? <small className="field-help">This is a suggestion from your answers. You can change it or choose “Not sure”.</small> : null}{errors.servicePath && <span className="field-error" id={errorId("servicePath")}>{errors.servicePath}</span>}</label>
      {fields.preparation.length ? <aside className="booking-context-summary"><h3>Here is what you have told us</h3><dl>{fields.preparation.map(({ question, answer }) => <div key={question}><dt>{question}</dt><dd>{answer}</dd></div>)}</dl><button type="button" onClick={() => update("preparation", [])}>Clear preparation answers</button><p>This summary is held only while you navigate this open page. Refreshing clears it.</p></aside> : null}
      <label><span className="field-label">Problem or requested work <span aria-hidden="true">*</span></span><textarea name="message" required rows={compact ? 4 : 6} minLength={20} maxLength={3000} placeholder="For example: My laptop has become very slow when I open email, and I need it for work tomorrow." value={fields.message} aria-invalid={Boolean(errors.message)} aria-describedby={describedBy("message")} onChange={(event) => update("message", event.target.value)} />{errors.message && <span className="field-error" id={errorId("message")}>{errors.message}</span>}</label>
      <label className="booking-honeypot" aria-hidden="true">Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" data-1p-ignore="true" data-lpignore="true" value={fields.website} onChange={(event) => update("website", event.target.value)} /></label>
    </fieldset>}

    {step === 1 && <fieldset><legend ref={stepHeadingRef as React.RefObject<HTMLLegendElement>} tabIndex={-1}>How can we contact you?</legend>
      <label><span className="field-label">Full name <span aria-hidden="true">*</span></span><input name="fullName" autoComplete="name" required maxLength={100} value={fields.fullName} aria-invalid={Boolean(errors.fullName)} aria-describedby={describedBy("fullName")} onChange={(event) => update("fullName", event.target.value)} />{errors.fullName && <span className="field-error" id={errorId("fullName")}>{errors.fullName}</span>}</label>
      <label><span className="field-label">Email address <span aria-hidden="true">*</span></span><input name="email" type="email" autoComplete="email" required maxLength={254} value={fields.email} aria-invalid={Boolean(errors.email)} aria-describedby={describedBy("email")} onChange={(event) => update("email", event.target.value)} />{errors.email && <span className="field-error" id={errorId("email")}>{errors.email}</span>}</label>
      <label><span className="field-label">Preferred contact <span aria-hidden="true">*</span></span><select name="preferredContact" value={fields.preferredContact} onChange={(event) => update("preferredContact", event.target.value as Fields["preferredContact"])}><option value="email">Email</option><option value="phone">Phone or email</option></select></label>
      <label><span className="field-label">Phone number {fields.preferredContact === "phone" ? <span aria-hidden="true">*</span> : <small>(optional)</small>}</span><input name="phone" type="tel" inputMode="tel" autoComplete="tel" required={fields.preferredContact === "phone"} maxLength={32} value={fields.phone} aria-invalid={Boolean(errors.phone)} aria-describedby={describedBy("phone")} onChange={(event) => update("phone", event.target.value)} />{errors.phone && <span className="field-error" id={errorId("phone")}>{errors.phone}</span>}</label>
      {fields.audience === "business" ? <label><span className="field-label">Business name <small>(optional)</small></span><input name="businessName" autoComplete="organization" maxLength={120} value={fields.businessName} onChange={(event) => update("businessName", event.target.value)} /></label> : null}
    </fieldset>}

    {step === 2 && <section className="booking-review" aria-labelledby={`${id}-review-title`}><h2 id={`${id}-review-title`} ref={stepHeadingRef as React.RefObject<HTMLHeadingElement>} tabIndex={-1}>Review your request</h2><p className="booking-review__lead">You’re asking about <strong>{serviceLabel(fields.servicePath)}</strong>. Check the summary and use Back if anything needs changing.</p><dl><div><dt>For</dt><dd>{audienceLabel(fields.audience)}</dd></div><div><dt>Problem or goal</dt><dd>{categoryLabel(fields.category)}</dd></div>{fields.preparation.map(({ question, answer }) => <div key={question}><dt>{question}</dt><dd>{answer}</dd></div>)}<div><dt>Description</dt><dd>{fields.message}</dd></div><div><dt>Contact</dt><dd>{fields.fullName} · {fields.email}{fields.phone ? ` · ${fields.phone}` : ""}</dd></div>{fields.businessName ? <div><dt>Business</dt><dd>{fields.businessName}</dd></div> : null}</dl><div className="booking-consent-wrap"><label className="booking-consent"><input name="consent" type="checkbox" checked={fields.consent} aria-invalid={Boolean(errors.consent)} aria-describedby={describedBy("consent")} onChange={(event) => update("consent", event.target.checked)} /> <span>I agree that BoomoTech may use these details to respond to this request. Read the <Link href="/privacy">Privacy Policy</Link> and <Link href="/cookies">Cookies &amp; browser storage</Link>.</span></label>{errors.consent && <span className="field-error" id={errorId("consent")}>{errors.consent}</span>}</div><p className="fine-print">Submitting sends a request for review. It is not a confirmed appointment and does not create a response-time commitment.</p></section>}
    {formError && <p className="form-error" role="alert">{formError}{status === "error" ? " Your information has been kept so you can retry." : ""}</p>}
    <div className="booking-actions">{step > 0 && <button type="button" className="button-link button-link--secondary" onClick={() => { setStep(step - 1); setStatus("idle"); setFormError(""); }}>Back</button>}<button className="button-link button-link--primary" disabled={status === "sending"}>{status === "sending" ? "Sending…" : status === "error" && step === 2 ? "Retry sending request" : step === 2 ? `Send ${submitName}` : "Continue"}</button></div>
  </form>;
}
