import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { dashboardHelpItems } from "@/features/dashboard/help-content";
import { DASHBOARD_THEME_COOKIE, parseDashboardTheme } from "@/features/dashboard/theme";
import { canAccessCustomerDashboard } from "@/lib/auth/access";
import { auth } from "@/lib/auth/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard help", robots: { index: false, follow: false } };

export default async function DashboardHelpPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login?next=/dashboard/help");
  if (session.user.role === "admin") redirect("/admin");
  if (!canAccessCustomerDashboard(session)) redirect("/check-email");
  const initialTheme = parseDashboardTheme((await cookies()).get(DASHBOARD_THEME_COOKIE)?.value);
  return <DashboardShell breadcrumbs={[{ href: "/dashboard", label: "Overview" }, { label: "Help" }]} initialTheme={initialTheme} role="customer" user={{ email: session.user.email, name: session.user.name }}>
    <main className="dashboard-help-page">
      <header><p className="eyebrow"><span className="eyebrow-line" />Customer help</p><h1>Dashboard help centre</h1><p>Practical guidance for requests, replies and account access.</p></header>
      <section aria-labelledby="dashboard-help-faq-title" className="dashboard-help-faq">
        <div><h2 id="dashboard-help-faq-title">Common questions</h2><p>Expand a question for a short answer.</p></div>
        <div className="dashboard-help-accordion">{dashboardHelpItems.map((item, index) => <details key={item.question} open={index === 0}><summary><span>{item.question}</span><span aria-hidden="true">+</span></summary><div><p>{item.answer}</p>{item.links?.length ? <p className="dashboard-help-links">{item.links.map((link) => <Link href={link.href} key={link.href}>{link.label}<span aria-hidden="true"> →</span></Link>)}</p> : null}</div></details>)}</div>
      </section>
      <aside className="dashboard-help-contact" aria-labelledby="dashboard-help-contact-title"><div><p className="eyebrow">Need another path?</p><h2 id="dashboard-help-contact-title">Start with safe support guidance.</h2><p>Review what to prepare and what information should never be shared before creating a request.</p></div><div><Link className="button button--primary" href="/support">View support guidance</Link><Link className="button button--secondary" href="/booking">Create a request</Link></div></aside>
    </main>
  </DashboardShell>;
}
