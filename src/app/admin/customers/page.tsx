import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { canAccessAdminDashboard } from "@/lib/auth/access";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { DASHBOARD_THEME_COOKIE, parseDashboardTheme } from "@/features/dashboard/theme";
import { CustomerDirectory } from "@/features/customers/components/customer-directory";
import { listCustomersForAdmin } from "@/features/customers/repository";
import { customerDirectoryFiltersSchema } from "@/features/customers/schemas";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Customer directory", robots: { index: false, follow: false } };

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/admin/login");
  if (session.user.role === "admin" && !session.user.twoFactorEnabled) redirect("/admin/mfa/setup");
  if (!canAccessAdminDashboard(session)) redirect("/dashboard?access=denied");
  const initialTheme = parseDashboardTheme((await cookies()).get(DASHBOARD_THEME_COOKIE)?.value);
  const params = await searchParams;
  const parsed = customerDirectoryFiltersSchema.safeParse({ page: params.page ?? "1", search: params.search || undefined, verification: params.verification || undefined, sort: params.sort || undefined });
  const filters = parsed.success ? parsed.data : { page: 1, sort: "registered-desc" as const };
  const actor = { id: session.user.id, role: session.user.role, twoFactorEnabled: session.user.twoFactorEnabled };
  const result = await listCustomersForAdmin(actor, filters);

  return <DashboardShell breadcrumbs={[{ href: "/admin", label: "Overview" }, { label: "Customers" }]} initialTheme={initialTheme} role="admin" user={{ email: session.user.email, name: session.user.name }}>
    <section className="admin-page"><div className="container">
      <header className="admin-page__header"><div><p className="eyebrow"><span className="eyebrow-line" />Administrator</p><h1>Customer directory</h1><p>Review registered customer accounts and their linked service-request history.</p></div></header>
      <aside className="customer-directory__notice"><strong>Registered accounts only</strong><p>Guest booking requests remain in the request queue and are never matched to an account by email address.</p></aside>
      <CustomerDirectory filterError={parsed.success ? undefined : "Some customer filters were not recognised and have been reset."} filters={filters} result={result} />
    </div></section>
  </DashboardShell>;
}

