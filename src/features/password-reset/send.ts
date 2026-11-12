import { deliverPasswordResetEmail } from "@/features/email-verification/adapter";
import { getBetterAuthUrl } from "@/lib/auth/auth-env";
import { validatedReturnPath } from "@/lib/auth/return-path";

export function passwordResetTtlMinutes() {
  const parsed = Number(process.env.PASSWORD_RESET_TTL_MINUTES ?? "60");
  return Number.isFinite(parsed) ? Math.min(240, Math.max(15, Math.round(parsed))) : 60;
}

export async function sendAccountPasswordResetEmail(input: { user: { email: string; name: string }; token: string; callbackURL?: string }) {
  const resetUrl = new URL(`/api/auth/reset-password/${encodeURIComponent(input.token)}`, getBetterAuthUrl());
  const supplied = new URL(input.callbackURL ?? "/reset-password", getBetterAuthUrl());
  const returnTo = validatedReturnPath(supplied.searchParams.get("returnTo"));
  resetUrl.searchParams.set("callbackURL", returnTo ? `/reset-password?returnTo=${encodeURIComponent(returnTo)}` : "/reset-password");
  await deliverPasswordResetEmail({
    kind: "password-reset",
    to: input.user.email,
    name: input.user.name,
    resetUrl: resetUrl.toString(),
    expiresInMinutes: passwordResetTtlMinutes(),
  });
}
