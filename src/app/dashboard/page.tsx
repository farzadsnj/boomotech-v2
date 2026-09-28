import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { auth } from "@/lib/auth/auth";
import { canAccessCustomerDashboard } from "@/lib/auth/access";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Customer dashboard", robots: { index: false, follow: false } };

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !canAccessCustomerDashboard(session)) redirect("/login?next=/dashboard");
  return <section className="account-dashboard"><div className="container"><div className="account-dashboard__header"><p className="eyebrow"><span className="eyebrow-line" />Customer dashboard</p><h1>Welcome, {session.user.name}</h1><p>Your first account area keeps the essentials clear while future customer tools are being planned.</p></div><section className="account-panel" aria-labelledby="account-details"><h2 id="account-details">Account details</h2><dl><div><dt>Full name</dt><dd>{session.user.name}</dd></div><div><dt>Email</dt><dd>{session.user.email}</dd></div></dl><SignOutButton /></section></div></section>;
}
