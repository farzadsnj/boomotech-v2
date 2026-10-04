import { NextResponse } from "next/server";
import { consumeVerificationGrant } from "@/features/email-verification/grants";
import { getSiteUrl } from "@/lib/site-url";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const siteUrl = getSiteUrl();
  const errorUrl = new URL("/email-verification-result", siteUrl);
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
  const authUrl = new URL("/api/auth/verify-email", siteUrl);
  authUrl.searchParams.set("token", token);
  authUrl.searchParams.set("callbackURL", callback);
  const { auth } = await import("@/lib/auth/auth");
  const response = await auth.handler(new Request(authUrl, { method: "GET", headers: request.headers }));
  return response;
}
