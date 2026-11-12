import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { MfaRecoveryCodesForm } from "@/components/auth/mfa-recovery-codes-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { canAccessAdminDashboard } from "@/lib/auth/access";
import { auth } from "@/lib/auth/auth";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { DASHBOARD_THEME_COOKIE, parseDashboardTheme } from "@/features/dashboard/theme";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Replace administrator recovery codes", robots: { index: false, follow: false } };
export default async function AdminMfaRecoveryPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/admin/login");
  if (!canAccessAdminDashboard(session)) redirect(session.user.role === "admin" ? "/admin/mfa/setup" : "/dashboard?access=denied");
  const initialTheme = parseDashboardTheme((await cookies()).get(DASHBOARD_THEME_COOKIE)?.value);
  return <DashboardShell breadcrumbs={[{ href: "/admin", label: "Overview" }, { label: "Security settings" }]} initialTheme={initialTheme} role="admin" user={{ email: session.user.email, name: session.user.name }}><AuthShell description="Generating a new set immediately invalidates every previous recovery code." eyebrow="Security settings" title="Replace recovery codes"><MfaRecoveryCodesForm /></AuthShell></DashboardShell>;
}
