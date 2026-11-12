import type { Metadata } from "next";
import { AccountForm } from "@/components/auth/account-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "Administrator sign in", description: "Restricted BoomoTech administrator access.", robots: { index: false, follow: false } };
export default function AdminLoginPage() { return <AuthShell description="Restricted access for an administrator account created with the secure setup command." eyebrow="Restricted access" title="Administrator sign in"><AccountForm mode="admin" /></AuthShell>; }
