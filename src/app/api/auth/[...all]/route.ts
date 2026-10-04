import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";

const handlers = toNextJsHandler(auth);
export const POST = handlers.POST;

export function GET(request: Request) {
  if (new URL(request.url).pathname === "/api/auth/verify-email") {
    return NextResponse.json({ error: "Use the verification link supplied by BoomoTech." }, { status: 404 });
  }
  return handlers.GET(request);
}
