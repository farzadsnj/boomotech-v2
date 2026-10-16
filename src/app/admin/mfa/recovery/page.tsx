import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MfaRecoveryCodesForm } from "@/components/auth/mfa-recovery-codes-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { canAccessAdminDashboard } from "@/lib/auth/access";
import { auth } from "@/lib/auth/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Replace administrator recovery codes", robots: { index: false, follow: false } };
export default async function AdminMfaRecoveryPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/admin/login");
  if (!canAccessAdminDashboard(session)) redirect(session.user.role === "admin" ? "/admin/mfa/setup" : "/dashboard?access=denied");
  return <AuthShell description="Generating a new set immediately invalidates every previous recovery code." eyebrow="Security settings" title="Replace recovery codes"><MfaRecoveryCodesForm /></AuthShell>;
}
