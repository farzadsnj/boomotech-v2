import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";
import { authHref, validatedReturnPath } from "@/lib/auth/return-path";

export const metadata: Metadata = { title: "Check your email", robots: { index: false, follow: false } };

export default async function CheckEmailPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo } = await searchParams; const safeReturn = validatedReturnPath(returnTo);
  return <AuthShell eyebrow="Email verification" title="Check your email" description="A single-use verification link is sent when the account is eligible and the email provider accepts delivery. Open it to activate your account.">
    <div className="verification-card"><p>The link expires after the configured verification period. If it is missing, check your spam folder or request another link below.</p><ResendVerificationForm returnTo={safeReturn} /><p className="auth-form__alternate"><Link href={authHref("/login", safeReturn)}>Return to sign in</Link></p></div>
  </AuthShell>;
}
