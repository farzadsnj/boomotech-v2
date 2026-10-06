import type { BookingRequest } from "./booking-schema";
import { serviceLabel } from "./booking-schema";
import { EmailTransportConfigurationError, preserveEmailLineBreaks, sendEmailWithResend } from "@/lib/email/resend";

export class NotificationConfigurationError extends Error {}
export class NotificationDeliveryError extends Error {}

export async function sendBookingNotification(request: BookingRequest) {
  const to = process.env.BOOKING_NOTIFICATION_EMAIL?.trim();
  const from = process.env.BOOKING_FROM_EMAIL?.trim();
  if (!to || !from) throw new NotificationConfigurationError("Booking notifications are not configured.");

  const fields = [
    ["Name", request.fullName], ["Email", request.email], ["Phone", request.phone],
    ["Service", serviceLabel(request.servicePath)], ["Message", request.message],
  ];
  const text = ["New booking request", "", ...fields.map(([label, value]) => `${label}: ${value}`)].join("\n");
  try {
    await sendEmailWithResend({
      from,
      to,
      subject: `Booking request: ${serviceLabel(request.servicePath)}`,
      replyTo: request.email,
      text,
      html: `<h1>New booking request</h1>${fields.map(([label, value]) => `<p><strong>${label}:</strong> ${preserveEmailLineBreaks(value)}</p>`).join("")}`,
    });
  } catch (error) {
    if (error instanceof EmailTransportConfigurationError) throw new NotificationConfigurationError("Booking notifications are not configured.");
    throw new NotificationDeliveryError("The notification provider could not be reached.");
  }
}
