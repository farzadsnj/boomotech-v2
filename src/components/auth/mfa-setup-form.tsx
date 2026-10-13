"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import QRCode from "qrcode";
import { authClient } from "@/lib/auth/client";

type Setup = { qrCode: string; secret: string; recoveryCodes: string[] };

export function MfaSetupForm() {
  const router = useRouter();
  const passwordRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function begin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    if (!password) { setError("Enter the administrator password."); passwordRef.current?.focus(); return; }
    setPending(true); setError("");
    const result = await authClient.twoFactor.enable({ password, method: "totp", issuer: "BoomoTech" });
    if (result.error || !result.data || !("totpURI" in result.data)) {
      setPending(false); setError("Multi-factor setup could not be started. Check the password and try again."); passwordRef.current?.focus(); return;
    }
    const uri = result.data.totpURI;
    const qrCode = await QRCode.toDataURL(uri, { errorCorrectionLevel: "M", margin: 2, width: 240 });
    const secret = new URL(uri).searchParams.get("secret") ?? "";
    setSetup({ qrCode, secret, recoveryCodes: result.data.backupCodes });
    setPending(false);
    requestAnimationFrame(() => codeRef.current?.focus());
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code") ?? "").trim();
    if (!/^\d{6}$/.test(code)) { setError("Enter the current six-digit authenticator code."); codeRef.current?.focus(); return; }
    setPending(true); setError("");
    const result = await authClient.twoFactor.verifyTotp({ code, trustDevice: false });
    setPending(false);
    if (result.error) { setError("That code could not be verified. Check the authenticator and try again."); codeRef.current?.focus(); return; }
    router.replace("/admin"); router.refresh();
  }

  if (!setup) return <form className="auth-form" noValidate onSubmit={begin}>
    <p>Administrator access requires a time-based one-time password. Confirm the administrator password to begin enrolment.</p>
    <div className="auth-field"><label htmlFor="mfa-password">Administrator password <span aria-hidden="true">*</span></label><input aria-describedby={error ? "mfa-setup-error" : undefined} aria-invalid={Boolean(error)} autoComplete="current-password" id="mfa-password" name="password" ref={passwordRef} required type="password" /></div>
    {error ? <p className="auth-form__error" id="mfa-setup-error" role="alert">{error}</p> : null}
    <button className="auth-submit" disabled={pending} type="submit">{pending ? "Preparing…" : "Set up authenticator"}</button>
  </form>;

  return <div className="mfa-setup">
    <h2>Scan the authenticator code</h2>
    <p>Scan this QR code with an authenticator app. If scanning is unavailable, enter the setup key manually.</p>
    <Image alt="BoomoTech administrator authenticator setup QR code" className="mfa-setup__qr" height={240} src={setup.qrCode} unoptimized width={240} />
    <p className="mfa-setup__secret"><strong>Manual setup key</strong><code>{setup.secret}</code></p>
    <section className="mfa-recovery" aria-labelledby="recovery-heading"><h2 id="recovery-heading">Save the recovery codes now</h2><p>Store these single-use codes in a secure password manager. They will not be shown again.</p><ul>{setup.recoveryCodes.map((code) => <li key={code}><code>{code}</code></li>)}</ul></section>
    <form className="auth-form" noValidate onSubmit={verify}><div className="auth-field"><label htmlFor="mfa-setup-code">Authenticator code <span aria-hidden="true">*</span></label><input aria-describedby={error ? "mfa-verify-error" : undefined} aria-invalid={Boolean(error)} autoComplete="one-time-code" id="mfa-setup-code" inputMode="numeric" name="code" ref={codeRef} required /></div>{error ? <p className="auth-form__error" id="mfa-verify-error" role="alert">{error}</p> : null}<button className="auth-submit" disabled={pending} type="submit">{pending ? "Verifying…" : "Verify and finish"}</button></form>
  </div>;
}
