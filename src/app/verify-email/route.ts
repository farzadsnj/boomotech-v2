import { NextResponse } from "next/server";
import { consumeVerificationGrant } from "@/features/email-verification/grants";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const errorUrl = new URL("/email-verification-result", url.origin);
  if (!token || token.length > 4096) {
    errorUrl.searchParams.set("error", "invalid_token");
    return NextResponse.redirect(errorUrl);
  }

  const grant = await consumeVerificationGrant(token).catch(() => null);
  if (!grant) {
    errorUrl.searchParams.set("error", "expired_or_used");
    return NextResponse.redirect(errorUrl);
  }

  const callback = "/dashboard?verified=true";
  const authUrl = new URL("/api/auth/verify-email", url.origin);
  authUrl.searchParams.set("token", token);
  authUrl.searchParams.set("callbackURL", callback);
  const { auth } = await import("@/lib/auth/auth");
  const response = await auth.handler(new Request(authUrl, { method: "GET", headers: request.headers }));
  return response;
}
