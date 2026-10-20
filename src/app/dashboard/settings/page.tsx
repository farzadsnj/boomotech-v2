import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { AccountSettingsView } from "@/features/account/components/account-settings-view";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { DASHBOARD_THEME_COOKIE, parseDashboardTheme } from "@/features/dashboard/theme";
import { canAccessCustomerDashboard } from "@/lib/auth/access";
import { auth } from "@/lib/auth/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Account settings", robots: { index: false, follow: false } };

export default async function CustomerSettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login?next=/dashboard/settings");
  if (session.user.role === "admin") redirect("/admin/settings");
  if (!canAccessCustomerDashboard(session)) redirect("/check-email");
  const initialTheme = parseDashboardTheme((await cookies()).get(DASHBOARD_THEME_COOKIE)?.value);
  return <DashboardShell breadcrumbs={[{ href: "/dashboard", label: "Overview" }, { label: "Account settings" }]} initialTheme={initialTheme} role="customer" user={{ email: session.user.email, name: session.user.name }}>
    <AccountSettingsView role="customer" user={{ email: session.user.email, emailVerified: session.user.emailVerified, name: session.user.name }} />
  </DashboardShell>;
}
