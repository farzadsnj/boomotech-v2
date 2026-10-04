import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { hasApprovedMutationOrigin } from "@/lib/security/origin";
import { readLimitedJson, RequestBodyError } from "@/lib/security/json-body";
import { checkRequestMutationRateLimit } from "@/features/requests/rate-limiter";
import { customerRequestActionSchema } from "@/features/requests/schemas";
import { addCustomerMessage, editCustomerRequest, RequestWorkflowError, withdrawCustomerRequest } from "@/features/requests/repository";

function safeError(error: unknown) {
  if (error instanceof RequestWorkflowError) {
    if (error.code === "not-found") return NextResponse.json({ error: "Request not found." }, { status: 404 });
    if (error.code === "locked") return NextResponse.json({ error: "This request can no longer be changed in that way." }, { status: 409 });
    if (error.code === "conflict") return NextResponse.json({ error: "The request changed while you were working. Refresh and try again." }, { status: 409 });
  }
  return NextResponse.json({ error: "We could not update the request. Please try again." }, { status: 500 });
}

export async function POST(request: Request, { params }: { params: Promise<{ reference: string }> }) {
  if (!hasApprovedMutationOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user.id || !session.user.emailVerified) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const limit = await checkRequestMutationRateLimit(session.user.id).catch(() => null);
  if (!limit) return NextResponse.json({ error: "Request updates are temporarily unavailable." }, { status: 503 });
  if (!limit.allowed) return NextResponse.json({ error: "Too many updates. Please try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  let input: unknown;
  try { input = await readLimitedJson(request); } catch (error) { const status = error instanceof RequestBodyError ? error.status : 400; return NextResponse.json({ error: status === 413 ? "Request is too large." : status === 415 ? "Unsupported request content type." : "Invalid request." }, { status }); }
  const parsed = customerRequestActionSchema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ error: "Please check the highlighted information.", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  const { reference } = await params;
  if (!/^BT-[A-F0-9]{10}$/.test(reference)) return NextResponse.json({ error: "Request not found." }, { status: 404 });
  try {
    const result = parsed.data.action === "edit"
      ? await editCustomerRequest(reference, session.user.id, parsed.data.description)
      : parsed.data.action === "withdraw"
        ? await withdrawCustomerRequest(reference, session.user.id)
        : await addCustomerMessage(reference, session.user.id, parsed.data.message);
    return NextResponse.json({ ok: true, result });
  } catch (error) { return safeError(error); }
}
