import Link from "next/link";

export function ChatBookingButton({ mobile = false }: { mobile?: boolean }) {
  return <Link href="/booking" className={mobile ? "mobile-booking-button" : "header-cta header-cta--primary"}>Request a consultation</Link>;
}
