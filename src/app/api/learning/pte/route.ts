import { NextResponse } from "next/server";
import { getLearningSnapshot, resetLearningData } from "@/features/pte/repository";
import { approveLearningMutation, learningActor, learningPrivateHeaders } from "@/features/pte/server";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const actor = await learningActor(request.headers); if (!actor) return NextResponse.json({ error: "Verified sign-in required." }, { status: 401, headers: learningPrivateHeaders });
  return NextResponse.json({ user: actor, ...(await getLearningSnapshot(actor.id)) }, { headers: learningPrivateHeaders });
}
export async function DELETE(request: Request) {
  const actor = await learningActor(request.headers); if (!actor) return NextResponse.json({ error: "Verified sign-in required." }, { status: 401, headers: learningPrivateHeaders });
  const guard = await approveLearningMutation(request, actor.id); if (!guard.allowed) return NextResponse.json({ error: "Request rejected." }, { status: guard.status, headers: learningPrivateHeaders });
  if (request.headers.get("x-confirm-learning-reset") !== "RESET") return NextResponse.json({ error: "Reset confirmation required." }, { status: 400, headers: learningPrivateHeaders });
  await resetLearningData(actor.id); return NextResponse.json({ ok: true }, { headers: learningPrivateHeaders });
}
