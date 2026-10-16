"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import { authClient } from "@/lib/auth/client";

export function MfaChallengeForm() {
  const router = useRouter();
  const codeRef = useRef<HTMLInputElement>(null);
  const [useRecovery, setUseRecovery] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const code = String(new FormData(form).get("code") ?? "").trim();
    if (!code) {
      setError(useRecovery ? "Enter one recovery code." : "Enter the six-digit authenticator code.");
      codeRef.current?.focus();
      return;
    }
    setPending(true);
    setError("");
    const result = useRecovery
      ? await authClient.twoFactor.verifyBackupCode({ code, trustDevice: false })
      : await authClient.twoFactor.verifyTotp({ code, trustDevice: false });
    setPending(false);
    if (result.error) {
      setError("That code could not be verified. Check it and try again.");
      codeRef.current?.focus();
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return <form className="auth-form" noValidate onSubmit={submit}>
    <div className="auth-field">
      <label htmlFor="mfa-code">{useRecovery ? "Recovery code" : "Authenticator code"} <span aria-hidden="true">*</span></label>
      <input aria-describedby={error ? "mfa-code-error" : undefined} aria-invalid={Boolean(error)} autoComplete="one-time-code" id="mfa-code" inputMode={useRecovery ? "text" : "numeric"} name="code" onChange={() => setError("")} ref={codeRef} required />
      {error ? <p className="auth-field__error" id="mfa-code-error" role="alert">{error}</p> : null}
    </div>
    <button className="auth-submit" disabled={pending} type="submit">{pending ? "Verifying…" : "Verify and continue"}</button>
    <button className="auth-secondary-action" onClick={() => { setUseRecovery((current) => !current); setError(""); }} type="button">{useRecovery ? "Use an authenticator code" : "Use a recovery code"}</button>
    <p className="auth-form__alternate"><Link href="/admin/login">Return to administrator sign in</Link></p>
  </form>;
}
