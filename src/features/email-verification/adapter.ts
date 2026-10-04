import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

export class VerificationEmailConfigurationError extends Error { name = "VerificationEmailConfigurationError"; }
export class VerificationEmailDeliveryError extends Error { name = "VerificationEmailDeliveryError"; }

export type VerificationEmail = {
  kind?: "verification";
  to: string;
  name: string;
  verificationUrl: string;
  expiresInMinutes: number;
};

export type PasswordResetEmail = {
  kind: "password-reset";
  to: string;
  name: string;
  resetUrl: string;
  expiresInMinutes: number;
};

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
})[character] as string);

async function deliverAuthenticationEmail(message: VerificationEmail | PasswordResetEmail) {
  const capturePath = process.env.AUTH_EMAIL_CAPTURE_PATH?.trim();
  if (capturePath && process.env.AUTH_EMAIL_CAPTURE_MODE === "test") {
    const resolved = path.resolve(capturePath);
    const permittedRoot = path.resolve(process.cwd(), ".test-db");
    if (!resolved.startsWith(`${permittedRoot}${path.sep}`)) throw new VerificationEmailConfigurationError("Test email capture must remain under .test-db.");
    await mkdir(path.dirname(resolved), { recursive: true });
    await appendFile(resolved, `${JSON.stringify({ kind: message.kind ?? "verification", ...message, capturedAt: new Date().toISOString() })}\n`, "utf8");
    return;
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.AUTH_FROM_EMAIL?.trim();
  if (!apiKey || !from) throw new VerificationEmailConfigurationError("Authentication email delivery is not configured.");

  const isReset = message.kind === "password-reset";
  const actionUrl = isReset ? message.resetUrl : message.verificationUrl;
  const subject = isReset ? "Reset your BoomoTech password" : "Verify your BoomoTech email address";
  const heading = isReset ? "Reset your BoomoTech password" : "Verify your BoomoTech email";
  const instruction = isReset
    ? "Use the secure link below to choose a new password for your BoomoTech account."
    : "Verify your email address to activate your BoomoTech customer account.";
  const action = isReset ? "Reset password" : "Verify email address";
  const ignore = isReset ? "If you did not request a password reset, ignore this email and your password will remain unchanged." : "If you did not create this account, ignore this email.";
  const text = [`Hi ${message.name},`, "", instruction, actionUrl, "", `This link expires in ${message.expiresInMinutes} minutes and can be used once.`, ignore].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1D3A49"><h1 style="color:#1D3A49">${heading}</h1><p>Hi ${escapeHtml(message.name)},</p><p>${instruction}</p><p><a href="${escapeHtml(actionUrl)}" style="display:inline-block;padding:12px 18px;background:#0070B7;color:#fff;text-decoration:none;border-radius:6px;font-weight:700">${action}</a></p><p>Or copy this link:<br><span style="word-break:break-all">${escapeHtml(actionUrl)}</span></p><p>This link expires in ${message.expiresInMinutes} minutes and can be used once.</p><p>${ignore}</p></div>`;
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

export function deliverVerificationEmail(message: VerificationEmail) {
  return deliverAuthenticationEmail({ ...message, kind: "verification" });
}

export function deliverPasswordResetEmail(message: PasswordResetEmail) {
  return deliverAuthenticationEmail(message);
}
