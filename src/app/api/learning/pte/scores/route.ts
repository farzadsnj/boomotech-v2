import { NextResponse } from "next/server";
import { addManualScore } from "@/features/pte/repository";
import { manualScoreSchema } from "@/features/pte/schemas";
import { approveLearningMutation, learningActor, learningPrivateHeaders } from "@/features/pte/server";
import { readLimitedJson } from "@/lib/security/json-body";

export async function POST(request: Request) {
  const actor = await learningActor(request.headers); if (!actor) return NextResponse.json({ error: "Verified sign-in required." }, { status: 401, headers: learningPrivateHeaders });
  const guard = await approveLearningMutation(request, actor.id); if (!guard.allowed) return NextResponse.json({ error: "Request rejected." }, { status: guard.status, headers: learningPrivateHeaders });
  try { const parsed = manualScoreSchema.safeParse(await readLimitedJson(request, 3_000)); if (!parsed.success) return NextResponse.json({ error: "Check the score and source." }, { status: 400, headers: learningPrivateHeaders }); return NextResponse.json({ ok: true, score: await addManualScore(actor.id, parsed.data) }, { headers: learningPrivateHeaders }); }
  catch { return NextResponse.json({ error: "Score could not be saved." }, { status: 400, headers: learningPrivateHeaders }); }
}
