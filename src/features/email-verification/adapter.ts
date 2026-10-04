import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

export class VerificationEmailConfigurationError extends Error { name = "VerificationEmailConfigurationError"; }
export class VerificationEmailDeliveryError extends Error { name = "VerificationEmailDeliveryError"; }

export type VerificationEmail = {
  to: string;
  name: string;
  verificationUrl: string;
  expiresInMinutes: number;
};

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
})[character] as string);

export async function deliverVerificationEmail(message: VerificationEmail) {
  const capturePath = process.env.AUTH_EMAIL_CAPTURE_PATH?.trim();
  if (capturePath && process.env.AUTH_EMAIL_CAPTURE_MODE === "test") {
    const resolved = path.resolve(capturePath);
    const permittedRoot = path.resolve(process.cwd(), ".test-db");
    if (!resolved.startsWith(`${permittedRoot}${path.sep}`)) throw new VerificationEmailConfigurationError("Test email capture must remain under .test-db.");
    await mkdir(path.dirname(resolved), { recursive: true });
    await appendFile(resolved, `${JSON.stringify({ ...message, capturedAt: new Date().toISOString() })}\n`, "utf8");
    return;
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.AUTH_FROM_EMAIL?.trim();
  if (!apiKey || !from) throw new VerificationEmailConfigurationError("Authentication email delivery is not configured.");

  const subject = "Verify your BoomoTech email address";
  const text = [
    `Hi ${message.name},`, "", "Verify your email address to activate your BoomoTech customer account:",
    message.verificationUrl, "", `This link expires in ${message.expiresInMinutes} minutes and can be used once.`,
    "If you did not create this account, ignore this email.",
  ].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1D3A49"><h1 style="color:#1D3A49">Verify your BoomoTech email</h1><p>Hi ${escapeHtml(message.name)},</p><p>Verify your email address to activate your BoomoTech customer account.</p><p><a href="${escapeHtml(message.verificationUrl)}" style="display:inline-block;padding:12px 18px;background:#0070B7;color:#fff;text-decoration:none;border-radius:6px;font-weight:700">Verify email address</a></p><p>Or copy this link:<br><span style="word-break:break-all">${escapeHtml(message.verificationUrl)}</span></p><p>This link expires in ${message.expiresInMinutes} minutes and can be used once.</p><p>If you did not create this account, ignore this email.</p></div>`;
  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [message.to], subject, text, html }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new VerificationEmailDeliveryError("The authentication email provider could not be reached.");
  }
  if (!response.ok) throw new VerificationEmailDeliveryError("The authentication email provider rejected the message.");
}
