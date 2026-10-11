"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export function SignOutButton({ admin = false }: { admin?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function signOut() {
    setPending(true);
    await authClient.signOut();
    router.push(admin ? "/admin/login" : "/login");
    router.refresh();
  }
  return <button className="auth-signout" disabled={pending} onClick={signOut} type="button">{pending ? "Signing out…" : "Sign out"}</button>;
}

export function SignOutAllDevicesButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function signOutEverywhere() {
    if (!window.confirm("Sign out this account on every device? You will need to sign in again.")) return;
    setPending(true);
    setError("");
    const result = await authClient.revokeSessions();
    if (result.error) {
      setError("We could not sign out every device. Please try again.");
      setPending(false);
      return;
    }
    router.push("/login");
    router.refresh();
  }

  return <div>
    <button className="auth-signout" disabled={pending} onClick={signOutEverywhere} type="button">{pending ? "Signing out devices…" : "Sign out all devices"}</button>
    {error ? <p className="auth-form__error" role="alert">{error}</p> : null}
  </div>;
}
