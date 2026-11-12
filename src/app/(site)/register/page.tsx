import type { Metadata } from "next";
import { AccountForm } from "@/components/auth/account-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "Create customer account", description: "Create a secure BoomoTech customer account.", alternates: { canonical: "/register" }, robots: { index: false, follow: false } };
export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) { const { returnTo } = await searchParams; return <AuthShell description={returnTo ? "Create one BoomoTech account for PTEpath and BoomoTech services, then verify your email." : "Create a customer account, verify your email and manage requests and conversations from a protected dashboard."} eyebrow="Customer account" title="Create your account"><AccountForm mode="register" returnTo={returnTo} /></AuthShell>; }
