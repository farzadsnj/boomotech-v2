import type { Metadata } from "next";
import { BookingForm } from "@/features/booking/booking-form";

export const metadata: Metadata = { title: "Request a consultation", description: "Send BoomoTech a secure booking request for technology support or project advice.", alternates: { canonical: "/booking" }, robots: { index: false, follow: false } };

export default function BookingPage() {
  return <div className="booking-experience"><div className="container booking-page section-space"><header className="booking-page__header"><div><p className="eyebrow"><span className="eyebrow-line" />SECURE BOOKING REQUEST</p><h1>Start with what you need to achieve.</h1><p>Share enough detail for a useful first conversation. A request is not a confirmed appointment; availability and next steps will be discussed with you.</p></div><aside aria-label="What happens next"><span>What happens next</span><ol><li>Share your contact details</li><li>Describe the request safely</li><li>Review before sending</li></ol><p>Never include passwords, MFA codes, recovery keys or payment-card details.</p></aside></header><BookingForm /></div></div>;
}
