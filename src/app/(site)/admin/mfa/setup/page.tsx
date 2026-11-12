import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MfaSetupForm } from "@/components/auth/mfa-setup-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { isAdministrator } from "@/lib/auth/access";
import { auth } from "@/lib/auth/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Set up administrator MFA", robots: { index: false, follow: false } };
export default async function AdminMfaSetupPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/admin/login");
  if (!isAdministrator(session)) redirect("/dashboard?access=denied");
  if (session.user.twoFactorEnabled) redirect("/admin");
  return <AuthShell description="Administrator access requires an authenticator app and recovery codes." eyebrow="Security setup" title="Protect administrator access"><MfaSetupForm /></AuthShell>;
}
