"use client";

import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth/client";

export function ResendVerificationForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    try {
      await authClient.sendVerificationEmail({ email: email.trim().toLowerCase(), callbackURL: "/dashboard?verified=true" });
      setMessage("If an unverified account matches that address, a new link will be sent. Check your inbox and spam folder.");
    } catch {
      setMessage("We could not process the resend request. Please wait and try again.");
    } finally {
      setPending(false);
    }
  }

  return <form className="auth-form" onSubmit={submit}>
    <div className="auth-field"><label htmlFor="resend-email">Email address</label><input autoComplete="email" id="resend-email" name="email" onChange={(event) => setEmail(event.currentTarget.value)} required type="email" value={email} /></div>
    <button className="auth-submit" disabled={pending} type="submit">{pending ? "Sending…" : "Resend verification email"}</button>
    {message ? <p className="auth-form__notice" role="status">{message}</p> : null}
  </form>;
}
