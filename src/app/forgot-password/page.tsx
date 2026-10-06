import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/password-recovery-form";

export const metadata: Metadata = { title: "Forgot password", description: "Request secure password-reset instructions for a BoomoTech customer account.", alternates: { canonical: "/forgot-password" }, robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return <AuthShell description="Request a private, time-limited link to choose a new password. The response does not reveal whether an account exists." eyebrow="Customer account" title="Reset your password"><ForgotPasswordForm /></AuthShell>;
}
