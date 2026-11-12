import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { AccountSettingsView } from "@/features/account/components/account-settings-view";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { DASHBOARD_THEME_COOKIE, parseDashboardTheme } from "@/features/dashboard/theme";
import { canAccessAdminDashboard } from "@/lib/auth/access";
import { auth } from "@/lib/auth/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administrator account settings", robots: { index: false, follow: false } };

export default async function AdminSettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/admin/login");
  if (session.user.role === "admin" && !session.user.twoFactorEnabled) redirect("/admin/mfa/setup");
  if (!canAccessAdminDashboard(session)) redirect("/dashboard?access=denied");
  const initialTheme = parseDashboardTheme((await cookies()).get(DASHBOARD_THEME_COOKIE)?.value);
  return <DashboardShell breadcrumbs={[{ href: "/admin", label: "Overview" }, { label: "Account settings" }]} initialTheme={initialTheme} role="admin" user={{ email: session.user.email, name: session.user.name }}>
    <AccountSettingsView role="admin" user={{ email: session.user.email, emailVerified: session.user.emailVerified, name: session.user.name, username: session.user.username }} />
  </DashboardShell>;
}
