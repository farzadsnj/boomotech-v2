"use client";

import { BookingActionLink } from "@/features/booking/booking-action-link";

export function ChatBookingButton({ mobile = false }: { mobile?: boolean }) {
  return <BookingActionLink href="/booking" className={mobile ? "mobile-booking-button" : "header-cta header-cta--primary"}>Book a Consultation</BookingActionLink>;
}
