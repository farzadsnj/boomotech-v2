"use client";

import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth/client";
import { validatedReturnPath } from "@/lib/auth/return-path";
import { authenticationErrorCategory } from "@/lib/auth/client-error";

export function ResendVerificationForm({ returnTo }: { returnTo?: string }) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setError("");
    try {
      const result = await authClient.sendVerificationEmail({ email: email.trim().toLowerCase(), callbackURL: validatedReturnPath(returnTo) ?? "/dashboard?verified=true" });
      if (result.error) {
        const category = authenticationErrorCategory(result.error);
        setError(category === "rate-limited"
          ? "Too many resend attempts. Wait before trying again."
          : "Verification email is temporarily unavailable. Your request was not reported as sent; try again after the email service is restored.");
        return;
      }
      setMessage("If an unverified account matches that address, a new link will be sent. Check your inbox and spam folder.");
    } catch {
      setError("Verification email is temporarily unavailable. Your request was not reported as sent; try again later.");
    } finally {
      setPending(false);
    }
  }

  return <form className="auth-form" onSubmit={submit}>
    <div className="auth-field"><label htmlFor="resend-email">Email address</label><input autoComplete="email" id="resend-email" name="email" onChange={(event) => setEmail(event.currentTarget.value)} required type="email" value={email} /></div>
    <button className="auth-submit" disabled={pending} type="submit">{pending ? "Sending…" : "Resend verification email"}</button>
    {error ? <p className="auth-form__error" role="alert">{error}</p> : null}
    {message ? <p className="auth-form__notice" role="status">{message}</p> : null}
  </form>;
}
