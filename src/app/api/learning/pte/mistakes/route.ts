import { NextResponse } from "next/server";
import { setMistakeReviewed } from "@/features/pte/repository";
import { mistakeReviewSchema } from "@/features/pte/schemas";
import { approveLearningMutation, learningActor, learningPrivateHeaders } from "@/features/pte/server";
import { readLimitedJson } from "@/lib/security/json-body";

export async function PATCH(request: Request) {
  const actor = await learningActor(request.headers); if (!actor) return NextResponse.json({ error: "Verified sign-in required." }, { status: 401, headers: learningPrivateHeaders });
  const guard = await approveLearningMutation(request, actor.id); if (!guard.allowed) return NextResponse.json({ error: "Request rejected." }, { status: guard.status, headers: learningPrivateHeaders });
  try { const parsed = mistakeReviewSchema.safeParse(await readLimitedJson(request, 2_000)); if (!parsed.success) return NextResponse.json({ error: "Invalid review." }, { status: 400, headers: learningPrivateHeaders }); const mistake = await setMistakeReviewed(actor.id, parsed.data.mistakeId, parsed.data.reviewed); return mistake ? NextResponse.json({ ok: true, mistake }, { headers: learningPrivateHeaders }) : NextResponse.json({ error: "Mistake not found." }, { status: 404, headers: learningPrivateHeaders }); }
  catch { return NextResponse.json({ error: "Review could not be saved." }, { status: 400, headers: learningPrivateHeaders }); }
}
