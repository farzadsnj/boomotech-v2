"use client";

import { useSearchParams } from "next/navigation";
import { BookingForm } from "./booking-form";
import { bookingOptions } from "./booking-schema";

const allowedServices = new Set(bookingOptions.map(({ value }) => value).filter((value) => value.startsWith("/services/")));

export function SupportRequestForm() {
  const searchParams = useSearchParams();
  const requested = searchParams.get("service") ?? "";
  const initialService = allowedServices.has(requested) ? requested : "";
  return <BookingForm initialService={initialService} />;
}
