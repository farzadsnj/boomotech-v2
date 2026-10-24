import type { Metadata } from "next";
import { BookingForm } from "@/features/booking/booking-form";
import { bookingOptions } from "@/features/booking/booking-schema";

export const metadata: Metadata = { title: "Request a consultation", description: "Send BoomoTech a secure booking request for technology support or project advice.", alternates: { canonical: "/booking" }, robots: { index: false, follow: false } };

export default async function BookingPage({ searchParams }: { searchParams: Promise<{ service?: string; intent?: string }> }) {
  const query = await searchParams;
  const intent = query.intent === "quote" ? "quote" : "consultation";
  const initialService = bookingOptions.some(({ value }) => value === query.service) ? query.service : "";
  return <div className="booking-experience"><div className="container booking-page section-space"><header className="booking-page__header"><div><p className="eyebrow"><span className="eyebrow-line" />SECURE {intent === "quote" ? "QUOTE" : "CONSULTATION"} REQUEST</p><h1>{intent === "quote" ? "Request a tailored quote." : "Request a consultation."}</h1><p>Share enough detail for a useful first conversation. This request does not reserve an appointment; BoomoTech will review it and discuss availability and next steps with you.</p></div><aside aria-label="What happens next"><span>What happens next</span><ol><li>Share your contact details</li><li>Describe the request safely</li><li>Review before sending</li></ol><p>Never include passwords, MFA codes, recovery keys or payment-card details.</p></aside></header><BookingForm initialService={initialService} intent={intent} /></div></div>;
}
