"use client";

export function ChatBookingButton({ mobile = false }: { mobile?: boolean }) {
  return <button type="button" className={mobile ? "mobile-booking-button" : "header-cta header-cta--primary"} onClick={() => window.dispatchEvent(new CustomEvent("boomotech:open-booking"))}>Book a Consultation</button>;
}
