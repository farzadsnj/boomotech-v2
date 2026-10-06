import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/password-recovery-form";

export const metadata: Metadata = { title: "Choose a new password", description: "Complete a secure BoomoTech password reset.", alternates: { canonical: "/reset-password" }, robots: { index: false, follow: false } };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token, error } = await searchParams;
  return <AuthShell description="Choose a strong password for your customer account. A valid reset link can be used once." eyebrow="Customer account" title="Choose a new password"><ResetPasswordForm invalid={Boolean(error)} token={token} /></AuthShell>;
}
