"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { authClient } from "@/lib/auth/client";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/auth/schemas";
import { PasswordInput, PasswordRequirements } from "./password-input";

function fieldErrors(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  return Object.fromEntries(error.issues.map((issue) => [String(issue.path[0]), issue.message]));
}

export function ForgotPasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);
  const [formError, setFormError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) {
      const next = fieldErrors(parsed.error);
      setErrors(next);
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLInputElement>("[aria-invalid='true']")?.focus());
      return;
    }
    setErrors({}); setFormError(""); setPending(true);
    try {
      const result = await authClient.requestPasswordReset({ email: parsed.data.email, redirectTo: "/reset-password" });
      if (result.error) throw new Error("request");
      setComplete(true);
    } catch {
      setFormError("We could not accept the reset request. Please wait and try again.");
    } finally { setPending(false); }
  }

  if (complete) return <div className="auth-result" role="status"><p>If an account matches that address, password-reset instructions will arrive by email. The message may take a few minutes.</p><Link className="auth-submit" href="/login">Return to sign in</Link></div>;
  return <form className="auth-form" noValidate onSubmit={submit} ref={formRef}>
    <p>Enter the email address used for your customer account.</p>
    {formError ? <p className="auth-form__error" role="alert">{formError}</p> : null}
    <div className="auth-field"><label htmlFor="recovery-email">Email address <span aria-hidden="true">*</span></label><input aria-describedby={errors.email ? "recovery-email-error" : undefined} aria-invalid={Boolean(errors.email)} autoComplete="email" id="recovery-email" name="email" onChange={() => setErrors({})} required type="email" />{errors.email ? <p className="auth-field__error" id="recovery-email-error">{errors.email}</p> : null}</div>
    <button className="auth-submit" disabled={pending} type="submit">{pending ? "Sending…" : "Send reset instructions"}</button>
    <p className="auth-form__alternate"><Link href="/login">Return to sign in</Link></p>
  </form>;
}

export function ResetPasswordForm({ token, invalid }: { token?: string; invalid?: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState(invalid || !token ? "This password-reset link is invalid or has expired. Request a new link." : "");
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const parsed = resetPasswordSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) {
      const next = fieldErrors(parsed.error);
      setErrors(next); setFormError("");
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLInputElement>("[aria-invalid='true']")?.focus());
      return;
    }
    setErrors({}); setFormError(""); setPending(true);
    try {
      const result = await authClient.resetPassword({ newPassword: parsed.data.password, token });
      if (result.error) throw new Error("reset");
      setComplete(true);
    } catch {
      setFormError("This password-reset link is invalid or has expired. Request a new link.");
    } finally { setPending(false); }
  }

  if (complete) return <div className="auth-result" role="status"><p>Your password has been changed and existing sessions have been signed out.</p><Link className="auth-submit" href="/login">Sign in with the new password</Link></div>;
  return <form className="auth-form" noValidate onSubmit={submit} ref={formRef}>
    {formError ? <p className="auth-form__error" role="alert">{formError}</p> : null}
    {token && !invalid ? <>
      <div className="auth-field"><label htmlFor="reset-password">New password <span aria-hidden="true">*</span></label><PasswordInput autoComplete="new-password" error={errors.password} id="reset-password" name="password" onValue={(value) => { setPassword(value); setErrors({}); setFormError(""); }} />{errors.password ? <p className="auth-field__error" id="reset-password-error">{errors.password}</p> : null}</div>
      <div className="auth-field"><label htmlFor="reset-confirm-password">Confirm new password <span aria-hidden="true">*</span></label><PasswordInput autoComplete="new-password" error={errors.confirmPassword} id="reset-confirm-password" name="confirmPassword" onValue={(value) => { setConfirmation(value); setErrors({}); setFormError(""); }} />{errors.confirmPassword ? <p className="auth-field__error" id="reset-confirm-password-error">{errors.confirmPassword}</p> : null}</div>
      <PasswordRequirements confirmation={confirmation} password={password} />
      <button className="auth-submit" disabled={pending} type="submit">{pending ? "Updating…" : "Set new password"}</button>
    </> : null}
    <p className="auth-form__alternate"><Link href="/forgot-password">Request a new reset link</Link></p>
  </form>;
}
