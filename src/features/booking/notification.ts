import type { BookingRequest } from "./booking-schema";
import { serviceLabel } from "./booking-schema";

export class NotificationConfigurationError extends Error {}
export class NotificationDeliveryError extends Error {}

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
})[character] as string);
const htmlValue = (value: string) => escapeHtml(value).replace(/\r?\n/g, "<br>");

export async function sendBookingNotification(request: BookingRequest) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.BOOKING_NOTIFICATION_EMAIL?.trim();
  const from = process.env.BOOKING_FROM_EMAIL?.trim();
  if (!apiKey || !to || !from) throw new NotificationConfigurationError("Booking notifications are not configured.");

  const fields = [
    ["Name", request.fullName], ["Email", request.email], ["Phone", request.phone],
    ["Service", serviceLabel(request.servicePath)], ["Message", request.message],
  ];
  const text = ["New booking request", "", ...fields.map(([label, value]) => `${label}: ${value}`)].join("\n");
  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        from,
        to: [to],
        subject: `Booking request: ${serviceLabel(request.servicePath)}`,
        reply_to: request.email,
        text,
        html: `<h1>New booking request</h1>${fields.map(([label, value]) => `<p><strong>${label}:</strong> ${htmlValue(value)}</p>`).join("")}`,
      }),
    });
  } catch {
    throw new NotificationDeliveryError("The notification provider could not be reached.");
  }
  if (!response.ok) throw new NotificationDeliveryError("The notification provider did not accept the request.");
}
