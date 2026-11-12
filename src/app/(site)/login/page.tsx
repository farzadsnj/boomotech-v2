import type { Metadata } from "next";
import { AccountForm } from "@/components/auth/account-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "Customer sign in", description: "Sign in to your secure BoomoTech customer account.", alternates: { canonical: "/login" }, robots: { index: false, follow: false } };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) { const { returnTo } = await searchParams; return <AuthShell description={returnTo ? "Use your BoomoTech account for PTEpath and BoomoTech services." : "Use your customer email and password to access the protected account area."} eyebrow="Customer account" title="Welcome back"><AccountForm mode="login" returnTo={returnTo} /></AuthShell>; }
