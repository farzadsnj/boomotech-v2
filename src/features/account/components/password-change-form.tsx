"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import type { ZodError } from "zod";
import { PasswordInput, PasswordRequirements } from "@/components/auth/password-input";
import { authClient } from "@/lib/auth/client";
import { passwordChangeSchema } from "../schemas";

type Errors = Record<string, string>;

function errorsFrom(error: ZodError): Errors {
  return Object.fromEntries(error.issues.map((issue) => [String(issue.path[0] ?? "form"), issue.message]));
}

export function PasswordChangeForm() {
  const form = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");

  function clearFieldError(name: string, value: string) {
    setFormError("");
    setSuccess("");
    if (!errors[name] || !form.current) return;
    const values = Object.fromEntries(new FormData(form.current));
    values[name] = value;
    const parsed = passwordChangeSchema.safeParse(values);
    const stillInvalid = !parsed.success && parsed.error.issues.some((issue) => issue.path[0] === name);
    if (!stillInvalid) setErrors((current) => { const next = { ...current }; delete next[name]; return next; });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setFormError("");
    setSuccess("");
    const values = Object.fromEntries(new FormData(formElement));
    const parsed = passwordChangeSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors = errorsFrom(parsed.error);
      setErrors(nextErrors);
      const first = Object.keys(nextErrors)[0];
      requestAnimationFrame(() => (formElement.elements.namedItem(first) as HTMLElement | null)?.focus());
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const result = await authClient.changePassword({ currentPassword: parsed.data.currentPassword, newPassword: parsed.data.newPassword, revokeOtherSessions: true });
      if (result.error) throw new Error("password");
      form.current?.reset();
      setNewPassword("");
      setConfirmation("");
      setSuccess("Your password has been changed. Other active sessions were signed out.");
    } catch {
      setFormError("The password could not be changed. Check your current password and try again.");
    } finally {
      setPending(false);
    }
  }

  return <form className="dashboard-settings-form" noValidate onSubmit={submit} ref={form}>
    <p className="dashboard-settings-form__required"><span aria-hidden="true">*</span> Required fields</p>
    <div className="dashboard-settings-field"><label htmlFor="current-password">Current password <span aria-hidden="true">*</span></label><PasswordInput autoComplete="current-password" error={errors.currentPassword} id="current-password" name="currentPassword" onValue={(value) => clearFieldError("currentPassword", value)} />{errors.currentPassword ? <p className="dashboard-settings-field__error" id="current-password-error">{errors.currentPassword}</p> : null}</div>
    <div className="dashboard-settings-field"><label htmlFor="new-password">New password <span aria-hidden="true">*</span></label><PasswordInput autoComplete="new-password" error={errors.newPassword} id="new-password" name="newPassword" onValue={(value) => { setNewPassword(value); clearFieldError("newPassword", value); }} />{errors.newPassword ? <p className="dashboard-settings-field__error" id="new-password-error">{errors.newPassword}</p> : null}</div>
    <div className="dashboard-settings-field"><label htmlFor="confirm-new-password">Confirm new password <span aria-hidden="true">*</span></label><PasswordInput autoComplete="new-password" error={errors.confirmPassword} id="confirm-new-password" name="confirmPassword" onValue={(value) => { setConfirmation(value); clearFieldError("confirmPassword", value); }} />{errors.confirmPassword ? <p className="dashboard-settings-field__error" id="confirm-new-password-error">{errors.confirmPassword}</p> : null}</div>
    <PasswordRequirements confirmation={confirmation} password={newPassword} />
    <p className="dashboard-settings-form__recovery">Cannot confirm your current password? <Link href="/forgot-password">Use password recovery</Link>.</p>
    {formError ? <p className="dashboard-settings-form__error" role="alert">{formError}</p> : null}
    {success ? <p className="dashboard-settings-form__success" role="status">{success}</p> : null}
    <button disabled={pending} type="submit">{pending ? "Changing…" : "Change password"}</button>
  </form>;
}
