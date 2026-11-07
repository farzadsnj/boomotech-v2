import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildNotificationEmail, type NotificationContext, type NotificationKind } from "../src/features/notifications/outbox";
import { renderBrandedEmail } from "../src/lib/email/template";

const output = path.resolve(process.cwd(), "artifacts", "email-previews");
await mkdir(output, { recursive: true });

const configuration = {
  resendApiKey: "preview-only",
  adminEmail: "operations@example.test",
  fromEmail: "BoomoTech <sender@example.test>",
  siteUrl: "https://boomotech.com.au",
};
const context: NotificationContext = {
  reference: "BT-PREVIEW001",
  fullName: "Alexandra A Very Long Fictional Customer Name <Example>",
  email: "alexandra@example.test",
  phone: "",
  servicePath: "/services/cloud-infrastructure",
  requestBody: "Our fictional team is reviewing a cloud and infrastructure change.\nPlease explain the safe assessment steps before anything is moved.\n<This must be rendered as text, not HTML.>\nAReallyLongUnbrokenExampleValueThatMustWrapWithoutBreakingTheEmailLayout1234567890",
  messageBody: "This is a fictional multiline update.\nNo real customer or request data is included.",
  verifiedAccount: true,
  createdAt: new Date("2026-11-01T00:30:00Z"),
};

for (const kind of ["BOOKING_CREATED", "BOOKING_CUSTOMER_ACK", "REQUEST_CUSTOMER_REPLY", "REQUEST_ADMIN_REPLY", "REQUEST_RESOLVED"] as NotificationKind[]) {
  const email = buildNotificationEmail(kind, context, configuration);
  await writeFile(path.join(output, `${kind.toLocaleLowerCase("en-AU")}.html`), email.html, "utf8");
  await writeFile(path.join(output, `${kind.toLocaleLowerCase("en-AU")}.txt`), email.text, "utf8");
}

for (const preview of [
  { name: "email-verification", heading: "Verify your BoomoTech email", introduction: "Verify your email address to activate your BoomoTech customer account.", action: "Verify email address", url: "https://boomotech.com.au/verify-email?token=FICTIONAL_PREVIEW_ONLY", ignore: "If you did not create this account, ignore this email." },
  { name: "password-reset", heading: "Reset your BoomoTech password", introduction: "Use the secure link below to choose a new password for your BoomoTech account.", action: "Reset password", url: "https://boomotech.com.au/api/auth/reset-password/FICTIONAL_PREVIEW_ONLY?callbackURL=%2Freset-password", ignore: "If you did not request a password reset, ignore this email and your password will remain unchanged." },
]) {
  const email = renderBrandedEmail({ approvedOrigin: configuration.siteUrl, preheader: preview.introduction, heading: preview.heading, greeting: "Hi Fictional Preview Customer,", introduction: preview.introduction, paragraphs: ["This fictional preview link expires in 60 minutes and can be used once.", preview.ignore], action: { label: preview.action, url: preview.url }, safety: "BoomoTech will never ask you to send your password, MFA code or recovery code by email." });
  await writeFile(path.join(output, `${preview.name}.html`), email.html, "utf8");
  await writeFile(path.join(output, `${preview.name}.txt`), email.text, "utf8");
}

console.log(`Rendered fictional email previews under ${path.relative(process.cwd(), output)}.`);
