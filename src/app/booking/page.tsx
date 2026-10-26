import type { Metadata } from "next";
import { headers } from "next/headers";
import { BookingForm } from "@/features/booking/booking-form";
import { bookingOptions } from "@/features/booking/booking-schema";
import { enquiryAudiences, enquiryCategories, enquiryIntents } from "@/features/enquiry/types";
import { auth } from "@/lib/auth/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Request a consultation", description: "Send BoomoTech a secure booking request for technology support or project advice.", alternates: { canonical: "/booking" }, robots: { index: false, follow: false } };

export default async function BookingPage({ searchParams }: { searchParams: Promise<{ service?: string; intent?: string; audience?: string; category?: string }> }) {
  const query = await searchParams;
  const intent = enquiryIntents.includes(query.intent as never) ? query.intent as (typeof enquiryIntents)[number] : "consultation";
  const initialService = bookingOptions.some(({ value }) => value === query.service) ? query.service : "";
  const initialAudience = enquiryAudiences.includes(query.audience as never) ? query.audience as (typeof enquiryAudiences)[number] : undefined;
  const initialCategory = enquiryCategories.includes(query.category as never) ? query.category as (typeof enquiryCategories)[number] : undefined;
  const session = await auth.api.getSession({ headers: await headers() });
  return <div className="booking-experience"><div className="container booking-page section-space"><header className="booking-page__header"><div><p className="eyebrow"><span className="eyebrow-line" />SECURE {intent === "quote" ? "QUOTE" : "HELP"} REQUEST</p><h1>{intent === "quote" ? "Request a tailored quote." : "Tell us what you need help with."}</h1><p>Start with the problem or goal in your own words. You can choose “Not sure” and change any suggested service before sending.</p></div><aside aria-label="What happens next"><span>What happens next</span><ol><li>Describe the need</li><li>Choose how to be contacted</li><li>Review before sending</li></ol><p>BoomoTech reviews the request before discussing scope, availability or an appointment. Never include passwords, MFA codes, recovery keys or payment-card details.</p></aside></header><BookingForm initialAudience={initialAudience} initialCategory={initialCategory} initialEmail={session?.user.email ?? ""} initialFullName={session?.user.name ?? ""} initialService={initialService} intent={intent} /></div></div>;
}
