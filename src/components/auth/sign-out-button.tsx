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
