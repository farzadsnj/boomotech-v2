import type { Metadata } from "next";
import { BookingForm } from "@/features/booking/booking-form";

export const metadata: Metadata = { title: "Request a consultation", description: "Send BoomoTech a secure booking request for technology support or project advice.", robots: { index: false, follow: false } };

export default function BookingPage() {
  return <div className="container booking-page section-space"><header className="section-heading"><p className="eyebrow"><span className="eyebrow-line" />Booking request</p><h1>Tell us what you need help with</h1><p className="section-heading__description">Share enough detail for a useful first conversation. A request is not a confirmed appointment; availability and next steps will be discussed with you.</p></header><BookingForm /></div>;
}
