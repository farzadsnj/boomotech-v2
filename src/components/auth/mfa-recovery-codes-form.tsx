"use client";

import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth/client";

export function MfaRecoveryCodesForm() {
  const [codes, setCodes] = useState<string[] | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setPending(true);
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    const result = await authClient.twoFactor.generateBackupCodes({ password });
    setPending(false);
    if (result.error) { setError("Recovery codes could not be regenerated. Check the password and try again."); return; }
    setCodes(result.data.backupCodes);
  }
  if (codes) return <section className="mfa-recovery"><h2>New recovery codes</h2><p>The previous recovery codes no longer work. Save these single-use codes in a secure password manager.</p><ul>{codes.map((code) => <li key={code}><code>{code}</code></li>)}</ul></section>;
  return <form className="auth-form" onSubmit={submit}><div className="auth-field"><label htmlFor="recovery-password">Administrator password <span aria-hidden="true">*</span></label><input autoComplete="current-password" id="recovery-password" name="password" required type="password" /></div>{error ? <p className="auth-form__error" role="alert">{error}</p> : null}<button className="auth-submit" disabled={pending} type="submit">{pending ? "Regenerating…" : "Replace recovery codes"}</button></form>;
}
