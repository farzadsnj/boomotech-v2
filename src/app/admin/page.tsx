import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { serviceLabel } from "@/features/booking/booking-schema";
import { ADMIN_BOOKING_PAGE_SIZE, listAdminBookings } from "@/features/booking/repository";
import { auth } from "@/lib/auth/auth";
import { canAccessAdminDashboard } from "@/lib/auth/access";
import { CUSTOMER_PAGE_SIZE, listCustomers } from "@/lib/auth/customers";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administrator dashboard", robots: { index: false, follow: false } };

function pageNumber(value?: string) {
  const parsed = Number(value ?? "1");
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

function adminHref(customerPage: number, bookingPage: number) {
  return `/admin?customerPage=${customerPage}&bookingPage=${bookingPage}`;
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ customerPage?: string; bookingPage?: string; page?: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/admin/login");
  if (!canAccessAdminDashboard(session)) redirect("/dashboard?access=denied");

  const params = await searchParams;
  const customerPage = pageNumber(params.customerPage ?? params.page);
  const bookingPage = pageNumber(params.bookingPage);
  const [customersResult, bookingsResult] = await Promise.all([listCustomers(customerPage), listAdminBookings(bookingPage)]);
  const date = new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short" });

  return <section className="admin-page"><div className="container">
    <header className="admin-page__header"><div><p className="eyebrow"><span className="eyebrow-line" />Administrator</p><h1>Operations dashboard</h1><p>Review registered customers and incoming booking requests.</p></div><SignOutButton admin /></header>
    <section className="admin-table-wrap" aria-labelledby="booking-list"><div className="admin-table__heading"><h2 id="booking-list">Booking requests</h2><p>{bookingsResult.total} request{bookingsResult.total === 1 ? "" : "s"} · maximum {ADMIN_BOOKING_PAGE_SIZE} per page</p></div>{bookingsResult.records.length ? <div className="admin-table-scroll"><table><thead><tr><th scope="col">Reference</th><th scope="col">Customer</th><th scope="col">Service</th><th scope="col">Source</th><th scope="col">Submitted</th><th scope="col">Status</th><th scope="col">Details</th></tr></thead><tbody>{bookingsResult.records.map((booking) => <tr key={booking.id}><td>{booking.reference}</td><td><strong>{booking.fullName}</strong><br /><a href={`mailto:${booking.email}`}>{booking.email}</a><br /><a href={`tel:${booking.phone}`}>{booking.phone}</a></td><td>{serviceLabel(booking.servicePath)}</td><td>{booking.source === "chatbot" ? "Chatbot" : "Booking page"}</td><td>{date.format(booking.createdAt)}</td><td><span className={`booking-status booking-status--${booking.status}`}>{booking.status}</span><small className="notification-state">Notification: {booking.notificationStatus}</small></td><td><details><summary>View message</summary><p>{booking.message}</p></details></td></tr>)}</tbody></table></div> : <div className="admin-empty"><h3>No booking requests yet</h3><p>Booking-page and chatbot requests will appear here after they are saved.</p></div>}<nav aria-label="Booking request pages" className="admin-pagination">{bookingPage > 1 ? <Link href={adminHref(customerPage, bookingPage - 1)}>← Previous</Link> : <span />}{bookingPage < bookingsResult.totalPages ? <Link href={adminHref(customerPage, bookingPage + 1)}>Next →</Link> : null}</nav></section>
    <section className="admin-table-wrap" aria-labelledby="customer-list"><div className="admin-table__heading"><h2 id="customer-list">Registered customers</h2><p>{customersResult.total} customer{customersResult.total === 1 ? "" : "s"} · maximum {CUSTOMER_PAGE_SIZE} per page</p></div>{customersResult.records.length ? <div className="admin-table-scroll"><table><thead><tr><th scope="col">Full name</th><th scope="col">Email</th><th scope="col">Created</th></tr></thead><tbody>{customersResult.records.map((customer) => <tr key={customer.id}><td>{customer.name}</td><td>{customer.email}</td><td>{date.format(customer.createdAt)}</td></tr>)}</tbody></table></div> : <div className="admin-empty"><h3>No customer accounts yet</h3><p>Registered customers will appear here when account creation is used.</p></div>}<nav aria-label="Customer pages" className="admin-pagination">{customerPage > 1 ? <Link href={adminHref(customerPage - 1, bookingPage)}>← Previous</Link> : <span />}{customerPage < customersResult.totalPages ? <Link href={adminHref(customerPage + 1, bookingPage)}>Next →</Link> : null}</nav></section>
  </div></section>;
}
