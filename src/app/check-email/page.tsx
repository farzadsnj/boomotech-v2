import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";

export const metadata: Metadata = { title: "Check your email", robots: { index: false, follow: false } };

export default function CheckEmailPage() {
  return <AuthShell eyebrow="Email verification" title="Check your email" description="We sent a single-use verification link if the registration was accepted. Open it to activate your customer account.">
    <div className="verification-card"><p>The link expires after the configured verification period. If it is missing, check your spam folder or request another link below.</p><ResendVerificationForm /><p className="auth-form__alternate"><Link href="/login">Return to sign in</Link></p></div>
  </AuthShell>;
}
