import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/password-recovery-form";

export const metadata: Metadata = { title: "Forgot password", description: "Request secure password-reset instructions for a BoomoTech account.", alternates: { canonical: "/forgot-password" }, robots: { index: false, follow: false } };

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo } = await searchParams;
  return <AuthShell description="Request a private, time-limited link to choose a new password. The response does not reveal whether an account exists." eyebrow="Customer account" title="Reset your password"><ForgotPasswordForm returnTo={returnTo} /></AuthShell>;
}
