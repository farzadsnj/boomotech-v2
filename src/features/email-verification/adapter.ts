import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { EmailTransportConfigurationError, sendEmailWithResend } from "@/lib/email/resend";
import { renderBrandedEmail } from "@/lib/email/template";

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

  const from = process.env.AUTH_FROM_EMAIL?.trim();
  if (!from) throw new VerificationEmailConfigurationError("Authentication email delivery is not configured.");

  const isReset = message.kind === "password-reset";
  const actionUrl = isReset ? message.resetUrl : message.verificationUrl;
  const subject = isReset ? "Reset your BoomoTech password" : "Verify your BoomoTech email address";
  const heading = isReset ? "Reset your BoomoTech password" : "Verify your BoomoTech email";
  const instruction = isReset
    ? "Use the secure link below to choose a new password for your BoomoTech account."
    : "Verify your email address to activate your BoomoTech customer account.";
  const action = isReset ? "Reset password" : "Verify email address";
  const ignore = isReset ? "If you did not request a password reset, ignore this email and your password will remain unchanged." : "If you did not create this account, ignore this email.";
  const { text, html } = renderBrandedEmail({
    approvedOrigin: new URL(actionUrl).origin,
    preheader: instruction,
    heading,
    greeting: `Hi ${message.name || "there"},`,
    introduction: instruction,
    paragraphs: [`This link expires in ${message.expiresInMinutes} minutes and can be used once.`, ignore],
    action: { label: action, url: actionUrl },
    safety: "BoomoTech will never ask you to send your password, MFA code or recovery code by email.",
  });
  try {
    await sendEmailWithResend({ from, to: message.to, subject, text, html });
  } catch (error) {
    if (error instanceof EmailTransportConfigurationError) throw new VerificationEmailConfigurationError("Authentication email delivery is not configured.");
    throw new VerificationEmailDeliveryError("The authentication email provider could not be reached.");
  }
}

export function deliverVerificationEmail(message: VerificationEmail) {
  return deliverAuthenticationEmail({ ...message, kind: "verification" });
}

export function deliverPasswordResetEmail(message: PasswordResetEmail) {
  return deliverAuthenticationEmail(message);
}
