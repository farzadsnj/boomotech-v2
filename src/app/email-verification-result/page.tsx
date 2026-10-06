import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";

export const metadata: Metadata = { title: "Email verification", robots: { index: false, follow: false } };

export default async function EmailVerificationResultPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <AuthShell eyebrow="Email verification" title="This verification link cannot be used" description={error === "expired_or_used" ? "The link has expired or has already been used." : "The verification link is invalid."}>
    <div className="verification-card"><p>Request a new single-use link. For privacy, the response is the same whether or not an account matches the address.</p><ResendVerificationForm /><p className="auth-form__alternate"><Link href="/login">Return to sign in</Link></p></div>
  </AuthShell>;
}
