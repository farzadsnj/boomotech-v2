import { NextResponse } from "next/server";
import { getLearningSnapshot } from "@/features/pte/repository";
import { learningActor, learningPrivateHeaders } from "@/features/pte/server";

export async function GET(request: Request) {
  const actor = await learningActor(request.headers); if (!actor) return NextResponse.json({ error: "Verified sign-in required." }, { status: 401, headers: learningPrivateHeaders });
  const data = await getLearningSnapshot(actor.id);
  return new NextResponse(JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), profile: data.profile, plan: data.plan, attempts: data.attempts, drafts: data.drafts, mistakes: data.mistakes, manualScores: data.manualScores }, null, 2), { headers: { ...learningPrivateHeaders, "Content-Type": "application/json; charset=utf-8", "Content-Disposition": "attachment; filename=boomotech-ptepath-export.json" } });
}
