import { deliverVerificationEmail } from "./adapter";
import { storeVerificationGrant, verificationTtlMinutes } from "./grants";
import { getBetterAuthUrl } from "@/lib/auth/auth-env";

export async function sendAccountVerificationEmail(input: { user: { id: string; email: string; name: string }; token: string }) {
  await storeVerificationGrant(input.user.id, input.token);
  const verificationUrl = new URL("/verify-email", getBetterAuthUrl());
  verificationUrl.searchParams.set("token", input.token);
  await deliverVerificationEmail({
    to: input.user.email,
    name: input.user.name,
    verificationUrl: verificationUrl.toString(),
    expiresInMinutes: verificationTtlMinutes(),
  });
}
