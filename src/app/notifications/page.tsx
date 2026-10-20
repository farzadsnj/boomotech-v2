import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { DASHBOARD_THEME_COOKIE, parseDashboardTheme } from "@/features/dashboard/theme";
import { NotificationPageList } from "@/features/notifications/components/notification-centre";
import { canAccessAdminDashboard, canAccessCustomerDashboard } from "@/lib/auth/access";
import { auth } from "@/lib/auth/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Notifications", robots: { index: false, follow: false } };

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login?next=/notifications");
  const admin = session.user.role === "admin";
  if (admin && !canAccessAdminDashboard(session)) redirect("/admin/mfa/setup");
  if (!admin && !canAccessCustomerDashboard(session)) redirect("/check-email");
  const requestedPage = Number((await searchParams).page ?? "1");
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const initialTheme = parseDashboardTheme((await cookies()).get(DASHBOARD_THEME_COOKIE)?.value);
  return <DashboardShell breadcrumbs={[{ href: admin ? "/admin" : "/dashboard", label: "Overview" }, { label: "Notifications" }]} initialTheme={initialTheme} role={admin ? "admin" : "customer"} user={{ email: session.user.email, name: session.user.name }}>
    <main className="notifications-page"><NotificationPageList initialPage={page} /></main>
  </DashboardShell>;
}
