import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { recordSecurityEvent } from "@/lib/security/events";

const handlers = toNextJsHandler(auth);
const signInPaths = new Set(["/api/auth/sign-in/email", "/api/auth/sign-in/username"]);

function safeAuthCode(value: unknown) {
  return typeof value === "string" && /^[A-Z0-9_]{1,64}$/.test(value) ? value : "UNCLASSIFIED";
}

export async function POST(request: Request) {
  try {
    const response = await handlers.POST(request);
    const route = new URL(request.url).pathname;
    if (response.status === 429) {
      recordSecurityEvent("rate_limit_hit", { route, control: "authentication" });
    } else if (signInPaths.has(route) && response.status === 403) {
      const payload = await response.clone().json().catch(() => null) as { code?: unknown } | null;
      recordSecurityEvent("authentication_failed", { route, reason: safeAuthCode(payload?.code), status: response.status });
    } else if (response.status >= 500) {
      recordSecurityEvent("security_dependency_unavailable", { route, dependency: "authentication", status: response.status });
    }
    return response;
  } catch (error) {
    recordSecurityEvent("security_dependency_unavailable", {
      route: new URL(request.url).pathname,
      dependency: "authentication",
      errorType: error instanceof Error ? error.name : "unknown",
    });
    throw error;
  }
}

export function GET(request: Request) {
  if (new URL(request.url).pathname === "/api/auth/verify-email") {
    return NextResponse.json({ error: "Use the verification link supplied by BoomoTech." }, { status: 404 });
  }
  return handlers.GET(request);
}
