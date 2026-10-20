"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import { profileUpdateSchema } from "../schemas";

export function ProfileSettingsForm({ initialName }: { initialName: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);

  function validate(value: string) {
    const parsed = profileUpdateSchema.safeParse({ name: value });
    return parsed.success ? "" : parsed.error.issues[0]?.message ?? "Check your full name.";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSuccess("");
    const parsed = profileUpdateSchema.safeParse({ name });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your full name.");
      requestAnimationFrame(() => input.current?.focus());
      return;
    }
    setError("");
    setPending(true);
    try {
      const response = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const result = await response.json() as { error?: string; profile?: { name: string } };
      if (!response.ok || !result.profile) throw new Error(result.error ?? "update");
      setName(result.profile.name);
      setSuccess("Your account name has been updated.");
      router.refresh();
    } catch {
      setFormError("We could not update your account details. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return <form className="dashboard-settings-form" noValidate onSubmit={submit}>
    <p className="dashboard-settings-form__required"><span aria-hidden="true">*</span> Required field</p>
    <div className="dashboard-settings-field">
      <label htmlFor="account-full-name">Full name <span aria-hidden="true">*</span></label>
      <input aria-describedby={error ? "account-full-name-error" : "account-full-name-help"} aria-invalid={Boolean(error)} autoComplete="name" id="account-full-name" maxLength={100} name="name" onChange={(event) => { const value = event.currentTarget.value; setName(value); setSuccess(""); setFormError(""); if (error && !validate(value)) setError(""); }} ref={input} required type="text" value={name} />
      <p className="dashboard-settings-field__hint" id="account-full-name-help">Used in your protected dashboard and account communications.</p>
      {error ? <p className="dashboard-settings-field__error" id="account-full-name-error">{error}</p> : null}
    </div>
    {formError ? <p className="dashboard-settings-form__error" role="alert">{formError}</p> : null}
    {success ? <p className="dashboard-settings-form__success" role="status">{success}</p> : null}
    <button disabled={pending} type="submit">{pending ? "Saving…" : "Save profile"}</button>
  </form>;
}
