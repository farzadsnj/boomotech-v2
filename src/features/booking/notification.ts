import type { BookingRequest } from "./booking-schema";
import { serviceLabel } from "./booking-schema";

export class NotificationConfigurationError extends Error {}

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
})[character] as string);

export async function sendBookingNotification(request: BookingRequest) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.BOOKING_NOTIFICATION_EMAIL?.trim();
  const from = process.env.BOOKING_FROM_EMAIL?.trim();
  if (!apiKey || !to || !from) throw new NotificationConfigurationError("Booking notifications are not configured.");

  const fields = [
    ["Name", request.fullName], ["Email", request.email], ["Phone", request.phone],
    ["Service", serviceLabel(request.servicePath)], ["Message", request.message],
  ];
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Booking request: ${serviceLabel(request.servicePath)}`,
      reply_to: request.email,
      html: `<h1>New booking request</h1>${fields.map(([label, value]) => `<p><strong>${label}:</strong> ${escapeHtml(value)}</p>`).join("")}`,
    }),
  });
  if (!response.ok) throw new Error("The notification provider did not accept the request.");
}
