import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { hasApprovedMutationOrigin } from "@/lib/security/origin";
import { readLimitedJson, RequestBodyError } from "@/lib/security/json-body";
import { adminRequestActionSchema } from "@/features/requests/schemas";
import { addAdminMessage, changeRequestPriority, changeRequestStatus, markRequestRead, RequestWorkflowError, updateRequestInternalNotes } from "@/features/requests/repository";
import { recordSecurityEvent } from "@/lib/security/events";
import { canAccessAdminDashboard } from "@/lib/auth/access";

function safeError(error: unknown) {
  if (error instanceof RequestWorkflowError) {
    if (error.code === "not-found") return NextResponse.json({ error: "Request not found." }, { status: 404 });
    if (error.code === "invalid-transition") return NextResponse.json({ error: "That status transition is not allowed." }, { status: 409 });
    if (error.code === "locked") return NextResponse.json({ error: "This request is locked for that action." }, { status: 409 });
    if (error.code === "conflict") return NextResponse.json({ error: "The request changed. Refresh and try again." }, { status: 409 });
  }
  return NextResponse.json({ error: "We could not update the request." }, { status: 500 });
}

export async function POST(request: Request, { params }: { params: Promise<{ reference: string }> }) {
  if (!hasApprovedMutationOrigin(request)) {
    recordSecurityEvent("origin_rejected", { route: "/api/admin/requests/[reference]" });
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user.id) {
    recordSecurityEvent("authorization_denied", { route: "/api/admin/requests/[reference]", reason: "authentication" });
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (!canAccessAdminDashboard(session)) {
    recordSecurityEvent("authorization_denied", { route: "/api/admin/requests/[reference]", reason: session.user.role === "admin" ? "mfa" : "role" });
    return NextResponse.json({ error: "Verified administrator access required." }, { status: 403 });
  }
  let input: unknown;
  try { input = await readLimitedJson(request); } catch (error) { const status = error instanceof RequestBodyError ? error.status : 400; return NextResponse.json({ error: status === 413 ? "Request is too large." : status === 415 ? "Unsupported request content type." : "Invalid request." }, { status }); }
  const parsed = adminRequestActionSchema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ error: "Invalid action.", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  const { reference } = await params;
  if (!/^BT-[A-F0-9]{10}$/.test(reference)) return NextResponse.json({ error: "Request not found." }, { status: 404 });
  try {
    const action = parsed.data;
    const result = action.action === "start" ? await markRequestRead(reference, session.user.id, action.version)
      : action.action === "reply" ? await addAdminMessage(reference, session.user.id, action.message, action.resolve, action.version)
        : action.action === "status" ? await changeRequestStatus(reference, session.user.id, action.status, action.version)
          : action.action === "priority" ? await changeRequestPriority(reference, session.user.id, action.priority, action.version)
            : await updateRequestInternalNotes(reference, session.user.id, action.notes, action.version);
    return NextResponse.json({ ok: true, result });
  } catch (error) { return safeError(error); }
}
