import { NextResponse } from "next/server";
import { LearningConflictError, LearningContentError, saveLearningDraft } from "@/features/pte/repository";
import { draftInputSchema } from "@/features/pte/schemas";
import { approveLearningMutation, learningActor, learningPrivateHeaders } from "@/features/pte/server";
import { readLimitedJson, RequestBodyError } from "@/lib/security/json-body";

export async function PUT(request: Request) {
  const actor = await learningActor(request.headers); if (!actor) return NextResponse.json({ error: "Verified sign-in required." }, { status: 401, headers: learningPrivateHeaders });
  const guard = await approveLearningMutation(request, actor.id); if (!guard.allowed) return NextResponse.json({ error: "Request rejected." }, { status: guard.status, headers: learningPrivateHeaders });
  try { const parsed = draftInputSchema.safeParse(await readLimitedJson(request, 24_000)); if (!parsed.success) return NextResponse.json({ error: "Invalid draft." }, { status: 400, headers: learningPrivateHeaders }); return NextResponse.json({ ok: true, draft: await saveLearningDraft(actor.id, parsed.data) }, { headers: learningPrivateHeaders }); }
  catch (error) { const status = error instanceof LearningConflictError ? 409 : error instanceof LearningContentError ? 400 : error instanceof RequestBodyError ? error.status : 500; return NextResponse.json({ error: status === 409 ? "This draft changed in another tab. Reload before replacing it." : "Draft could not be saved." }, { status, headers: learningPrivateHeaders }); }
}
