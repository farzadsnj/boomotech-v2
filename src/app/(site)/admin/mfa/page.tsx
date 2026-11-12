import type { Metadata } from "next";
import { MfaChallengeForm } from "@/components/auth/mfa-challenge-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "Administrator verification", robots: { index: false, follow: false } };
export default function AdminMfaPage() {
  return <AuthShell description="Enter an authenticator or recovery code to complete administrator sign in." eyebrow="Restricted access" title="Verify administrator access"><MfaChallengeForm /></AuthShell>;
}
