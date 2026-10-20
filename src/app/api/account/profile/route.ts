import { NextResponse } from "next/server";
import { AccountSettingsError, updateOwnProfile } from "@/features/account/repository";
import { profileUpdateSchema } from "@/features/account/schemas";
import { auth } from "@/lib/auth/auth";
import { recordSecurityEvent } from "@/lib/security/events";
import { readLimitedJson, RequestBodyError } from "@/lib/security/json-body";
import { hasApprovedMutationOrigin } from "@/lib/security/origin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!hasApprovedMutationOrigin(request)) {
    recordSecurityEvent("origin_rejected", { route: "/api/account/profile" });
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  let input: unknown;
  try { input = await readLimitedJson(request, 2_000); }
  catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json({ error: status === 413 ? "Request is too large." : status === 415 ? "Unsupported request content type." : "Invalid request." }, { status });
  }
  const parsed = profileUpdateSchema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ error: "Check the highlighted account details.", issues: parsed.error.flatten().fieldErrors }, { status: 400 });

  try {
    const result = await updateOwnProfile({
      id: session.user.id,
      role: session.user.role,
      emailVerified: session.user.emailVerified,
      twoFactorEnabled: session.user.twoFactorEnabled,
    }, parsed.data.name);
    return NextResponse.json({ ok: true, profile: result });
  } catch (error) {
    if (error instanceof AccountSettingsError) {
      return NextResponse.json({ error: error.code === "not-found" ? "Account not found." : "Account access denied." }, { status: error.code === "not-found" ? 404 : 403 });
    }
    return NextResponse.json({ error: "Account details could not be updated." }, { status: 500 });
  }
}
