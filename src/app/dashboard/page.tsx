import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { serviceLabel } from "@/features/booking/booking-schema";
import { listCustomerBookings } from "@/features/booking/repository";
import { auth } from "@/lib/auth/auth";
import { canAccessCustomerDashboard } from "@/lib/auth/access";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Customer dashboard", robots: { index: false, follow: false } };

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !canAccessCustomerDashboard(session)) redirect("/login?next=/dashboard");
  const bookings = await listCustomerBookings(session.user.id);
  const date = new Intl.DateTimeFormat("en-AU", { dateStyle: "medium" });

  return <section className="account-dashboard"><div className="container">
    <div className="account-dashboard__header"><p className="eyebrow"><span className="eyebrow-line" />Customer dashboard</p><h1>Welcome, {session.user.name}</h1><p>Review your account and booking requests from one protected place.</p></div>
    <section className="account-panel" aria-labelledby="account-details"><h2 id="account-details">Account details</h2><dl><div><dt>Full name</dt><dd>{session.user.name}</dd></div><div><dt>Email</dt><dd>{session.user.email}</dd></div></dl><SignOutButton /></section>
    <section className="admin-table-wrap account-bookings" aria-labelledby="customer-bookings"><div className="admin-table__heading"><h2 id="customer-bookings">Your booking requests</h2><p>Latest {bookings.length} request{bookings.length === 1 ? "" : "s"}</p></div>{bookings.length ? <div className="admin-table-scroll"><table><thead><tr><th scope="col">Reference</th><th scope="col">Service</th><th scope="col">Submitted</th><th scope="col">Status</th></tr></thead><tbody>{bookings.map((booking) => <tr key={booking.id}><td>{booking.reference}</td><td>{serviceLabel(booking.servicePath)}</td><td>{date.format(booking.createdAt)}</td><td><span className={`booking-status booking-status--${booking.status}`}>{booking.status}</span></td></tr>)}</tbody></table></div> : <div className="admin-empty"><h3>No booking requests yet</h3><p>Requests submitted while you are signed in will appear here.</p></div>}</section>
  </div></section>;
}
