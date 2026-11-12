import { NextResponse } from "next/server";
import { LearningContentError, submitLearningAttempt } from "@/features/pte/repository";
import { attemptInputSchema } from "@/features/pte/schemas";
import { approveLearningMutation, learningActor, learningPrivateHeaders } from "@/features/pte/server";
import { readLimitedJson, RequestBodyError } from "@/lib/security/json-body";

export async function POST(request: Request) {
  const actor = await learningActor(request.headers); if (!actor) return NextResponse.json({ error: "Verified sign-in required." }, { status: 401, headers: learningPrivateHeaders });
  const guard = await approveLearningMutation(request, actor.id); if (!guard.allowed) return NextResponse.json({ error: "Request rejected." }, { status: guard.status, headers: learningPrivateHeaders });
  try { const parsed = attemptInputSchema.safeParse(await readLimitedJson(request, 30_000)); if (!parsed.success) return NextResponse.json({ error: "Invalid attempt." }, { status: 400, headers: learningPrivateHeaders }); return NextResponse.json({ ok: true, ...(await submitLearningAttempt(actor.id, parsed.data)) }, { headers: learningPrivateHeaders }); }
  catch (error) { const status = error instanceof LearningContentError ? 400 : error instanceof RequestBodyError ? error.status : 500; return NextResponse.json({ error: status === 413 ? "Attempt is too large." : "Attempt could not be saved." }, { status, headers: learningPrivateHeaders }); }
}
