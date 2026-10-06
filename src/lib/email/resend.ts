export class EmailTransportConfigurationError extends Error {
  name = "EmailTransportConfigurationError";
}

export class EmailTransportDeliveryError extends Error {
  name = "EmailTransportDeliveryError";
}

export type ServerEmail = {
  from: string;
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
};

export const escapeEmailHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
})[character] as string);

export const preserveEmailLineBreaks = (value: string) => escapeEmailHtml(value).replace(/\r?\n/g, "<br>");

export async function sendEmailWithResend(message: ServerEmail) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) throw new EmailTransportConfigurationError("Email delivery is not configured.");

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: message.from,
        to: Array.isArray(message.to) ? message.to : [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new EmailTransportDeliveryError("The email provider could not be reached.");
  }

  if (!response.ok) throw new EmailTransportDeliveryError("The email provider rejected the message.");
}
