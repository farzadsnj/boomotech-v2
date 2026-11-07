import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";

const handlers = toNextJsHandler(auth);

export async function POST(request: Request) {
  try {
    const response = await handlers.POST(request);
    if (response.status >= 500) console.error(`[authentication] category=provider-or-infrastructure-failure status=${response.status}`);
    return response;
  } catch (error) {
    console.error(`[authentication] category=handler-failure type=${error instanceof Error ? error.name : "unknown"}`);
    throw error;
  }
}

export function GET(request: Request) {
  if (new URL(request.url).pathname === "/api/auth/verify-email") {
    return NextResponse.json({ error: "Use the verification link supplied by BoomoTech." }, { status: 404 });
  }
  return handlers.GET(request);
}
