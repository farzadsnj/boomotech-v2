import { NextResponse } from "next/server";
import { saveLearningProfile } from "@/features/pte/repository";
import { learningProfileInputSchema } from "@/features/pte/schemas";
import { approveLearningMutation, learningActor, learningPrivateHeaders } from "@/features/pte/server";
import { readLimitedJson, RequestBodyError } from "@/lib/security/json-body";

export async function PUT(request: Request) {
  const actor = await learningActor(request.headers); if (!actor) return NextResponse.json({ error: "Verified sign-in required." }, { status: 401, headers: learningPrivateHeaders });
  const guard = await approveLearningMutation(request, actor.id); if (!guard.allowed) return NextResponse.json({ error: "Request rejected." }, { status: guard.status, headers: learningPrivateHeaders });
  try {
    const parsed = learningProfileInputSchema.safeParse(await readLimitedJson(request, 8_000));
    if (!parsed.success) return NextResponse.json({ error: "Check the highlighted study settings.", issues: parsed.error.flatten().fieldErrors }, { status: 400, headers: learningPrivateHeaders });
    const onboardingComplete = new URL(request.url).searchParams.get("draft") !== "1";
    return NextResponse.json({ ok: true, ...(await saveLearningProfile(actor.id, parsed.data, onboardingComplete)) }, { headers: learningPrivateHeaders });
  } catch (error) { const status = error instanceof RequestBodyError ? error.status : 500; return NextResponse.json({ error: status === 413 ? "Request is too large." : status === 415 ? "JSON is required." : "Study settings could not be saved." }, { status, headers: learningPrivateHeaders }); }
}
