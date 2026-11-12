import { randomUUID } from "node:crypto";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { pteAttempt, pteDraft, pteLearningProfile, pteManualScore, pteMistake, ptePlanDay } from "@/db/schema";
import { exerciseById } from "./exercise-bank";
import { adjacentPairScore, writingFormChecks } from "./logic";
import { buildLearningPlan } from "./planning";
import type { z } from "zod";
import type { attemptInputSchema, draftInputSchema, learningProfileInputSchema, manualScoreSchema } from "./schemas";
import type { PteTaskType } from "./types";

type ProfileInput = z.infer<typeof learningProfileInputSchema>;
type DraftInput = z.infer<typeof draftInputSchema>;
type AttemptInput = z.infer<typeof attemptInputSchema>;
type ManualScoreInput = z.infer<typeof manualScoreSchema>;

export class LearningConflictError extends Error {}
export class LearningContentError extends Error {}

export async function getLearningSnapshot(userId: string) {
  const [profile, plan, attempts, drafts, mistakes, manualScores] = await Promise.all([
    db.query.pteLearningProfile.findFirst({ where: eq(pteLearningProfile.userId, userId) }),
    db.select().from(ptePlanDay).where(eq(ptePlanDay.userId, userId)).orderBy(ptePlanDay.studyDate),
    db.select().from(pteAttempt).where(eq(pteAttempt.userId, userId)).orderBy(desc(pteAttempt.submittedAt)).limit(500),
    db.select().from(pteDraft).where(eq(pteDraft.userId, userId)),
    db.select().from(pteMistake).where(eq(pteMistake.userId, userId)).orderBy(desc(pteMistake.createdAt)).limit(1_000),
    db.select().from(pteManualScore).where(eq(pteManualScore.userId, userId)).orderBy(desc(pteManualScore.scoreDate)).limit(100),
  ]);
  const currentPlan = profile ? plan.filter((day) => day.planRevision === profile.planRevision) : [];
  return { profile: profile ?? null, plan: currentPlan, attempts, drafts, mistakes, manualScores };
}

export async function saveLearningProfile(userId: string, input: ProfileInput, onboardingComplete = true) {
  return db.transaction(async (transaction) => {
    const [existing] = await transaction.select({ revision: pteLearningProfile.planRevision }).from(pteLearningProfile).where(eq(pteLearningProfile.userId, userId)).limit(1);
    const revision = onboardingComplete ? (existing?.revision ?? -1) + 1 : (existing?.revision ?? 0);
    const [profile] = await transaction.insert(pteLearningProfile).values({ userId, ...input, onboardingComplete, planRevision: revision, updatedAt: new Date() })
      .onConflictDoUpdate({ target: pteLearningProfile.userId, set: { ...input, onboardingComplete, planRevision: revision, updatedAt: new Date() } }).returning();
    if (!onboardingComplete) return { profile, plan: [] };

    const attempts = await transaction.select({ taskType: pteAttempt.taskType, correct: pteAttempt.correct, total: pteAttempt.total }).from(pteAttempt).where(eq(pteAttempt.userId, userId));
    const totals = new Map<PteTaskType, { correct: number; total: number }>();
    for (const attempt of attempts) {
      if (attempt.correct === null || attempt.total <= 0) continue;
      const taskType = attempt.taskType as PteTaskType;
      const current = totals.get(taskType) ?? { correct: 0, total: 0 };
      current.correct += attempt.correct;
      current.total += attempt.total;
      totals.set(taskType, current);
    }
    const weakness = Object.fromEntries([...totals].map(([taskType, result]) => [taskType, 1 - (result.correct / result.total)])) as Partial<Record<PteTaskType, number>>;
    const days = buildLearningPlan({ ...input, weakness });
    if (days.length) await transaction.insert(ptePlanDay).values(days.map((day) => ({ id: randomUUID(), userId, planRevision: revision, ...day })));
    return { profile, plan: days };
  });
}

export async function saveLearningDraft(userId: string, input: DraftInput) {
  if (!exerciseById.has(input.exerciseId)) throw new LearningContentError("Unknown exercise.");
  return db.transaction(async (transaction) => {
    const [existing] = await transaction.select().from(pteDraft).where(and(eq(pteDraft.userId, userId), eq(pteDraft.exerciseId, input.exerciseId))).limit(1);
    const timerStartedAt = input.timerStartedAt ? new Date(input.timerStartedAt) : null;
    if (!existing) {
      if (input.expectedVersion !== 0) throw new LearningConflictError("Draft version changed.");
      const [created] = await transaction.insert(pteDraft).values({ id: randomUUID(), userId, ...input, timerStartedAt, version: 1, updatedAt: new Date() }).returning();
      return created;
    }
    if (existing.version !== input.expectedVersion) throw new LearningConflictError("Draft version changed.");
    const [updated] = await transaction.update(pteDraft).set({ response: input.response, elapsedSeconds: input.elapsedSeconds, timerStartedAt, timerDurationSeconds: input.timerDurationSeconds, timerRunning: input.timerRunning, version: existing.version + 1, updatedAt: new Date() }).where(and(eq(pteDraft.id, existing.id), eq(pteDraft.userId, userId), eq(pteDraft.version, input.expectedVersion))).returning();
    if (!updated) throw new LearningConflictError("Draft version changed.");
    return updated;
  });
}

export async function submitLearningAttempt(userId: string, input: AttemptInput) {
  const exercise = exerciseById.get(input.exerciseId);
  if (!exercise || exercise.taskType !== input.taskType) throw new LearningContentError("Unknown exercise.");
  const [existing] = await db.select().from(pteAttempt).where(and(eq(pteAttempt.userId, userId), eq(pteAttempt.idempotencyKey, input.idempotencyKey))).limit(1);
  if (existing) return { attempt: existing, repeated: true };
  const scored = scoreAttempt(exercise, input.answer, input.selfReview);
  try {
    return await db.transaction(async (transaction) => {
      const attemptId = randomUUID();
      const [attempt] = await transaction.insert(pteAttempt).values({ id: attemptId, userId, idempotencyKey: input.idempotencyKey, exerciseId: exercise.id, taskType: exercise.taskType, answer: input.answer, correct: scored.correct, total: scored.total, resultKind: scored.resultKind, selfReview: input.selfReview, elapsedSeconds: input.elapsedSeconds }).returning();
      if (scored.mistakes.length) await transaction.insert(pteMistake).values(scored.mistakes.map((mistake) => ({ id: randomUUID(), userId, attemptId, exerciseId: exercise.id, ...mistake })));
      await transaction.delete(pteDraft).where(and(eq(pteDraft.userId, userId), eq(pteDraft.exerciseId, exercise.id)));
      const [profile] = await transaction.select({ planRevision: pteLearningProfile.planRevision }).from(pteLearningProfile).where(eq(pteLearningProfile.userId, userId)).limit(1);
      if (profile) {
        const days = await transaction.select().from(ptePlanDay).where(and(eq(ptePlanDay.userId, userId), eq(ptePlanDay.planRevision, profile.planRevision), isNull(ptePlanDay.completedAt))).orderBy(ptePlanDay.studyDate);
        const candidate = days.find((day) => day.exerciseIds.includes(exercise.id));
        if (candidate) {
          const submitted = await transaction.select({ exerciseId: pteAttempt.exerciseId }).from(pteAttempt).where(eq(pteAttempt.userId, userId));
          const completedExercises = new Set(submitted.map(({ exerciseId }) => exerciseId));
          if (candidate.exerciseIds.every((exerciseId) => completedExercises.has(exerciseId))) {
            await transaction.update(ptePlanDay).set({ completedAt: new Date() }).where(and(eq(ptePlanDay.id, candidate.id), eq(ptePlanDay.userId, userId)));
          }
        }
      }
      return { attempt, repeated: false };
    });
  } catch (error) {
    const [repeated] = await db.select().from(pteAttempt).where(and(eq(pteAttempt.userId, userId), eq(pteAttempt.idempotencyKey, input.idempotencyKey))).limit(1);
    if (repeated) return { attempt: repeated, repeated: true };
    throw error;
  }
}

export async function setMistakeReviewed(userId: string, mistakeId: string, reviewed: boolean) {
  const [updated] = await db.update(pteMistake).set({ reviewedAt: reviewed ? new Date() : null, reviewCount: reviewed ? sql`${pteMistake.reviewCount} + 1` : pteMistake.reviewCount }).where(and(eq(pteMistake.id, mistakeId), eq(pteMistake.userId, userId))).returning();
  return updated ?? null;
}

export async function addManualScore(userId: string, input: ManualScoreInput) {
  const [created] = await db.insert(pteManualScore).values({ id: randomUUID(), userId, ...input }).returning();
  return created;
}

export async function resetLearningData(userId: string) {
  await db.transaction(async (transaction) => {
    await transaction.delete(pteLearningProfile).where(eq(pteLearningProfile.userId, userId));
    await transaction.delete(ptePlanDay).where(eq(ptePlanDay.userId, userId));
    await transaction.delete(pteMistake).where(eq(pteMistake.userId, userId));
    await transaction.delete(pteDraft).where(eq(pteDraft.userId, userId));
    await transaction.delete(pteAttempt).where(eq(pteAttempt.userId, userId));
    await transaction.delete(pteManualScore).where(eq(pteManualScore.userId, userId));
  });
}

function scoreAttempt(exercise: NonNullable<ReturnType<typeof exerciseById.get>>, answer: AttemptInput["answer"], selfReview: string[]) {
  const mistakes: Array<{ category: string; learnerAnswer: string; correctAnswer?: string; explanation: string; lessonId?: string }> = [];
  if (exercise.kind === "fill") {
    const values = typeof answer === "object" && !Array.isArray(answer) ? answer as Record<string, string> : {};
    const correct = exercise.blanks.filter((blank) => values[blank.id] === blank.answer).length;
    const lessonByCategory = { grammar: "sentence-structure", collocation: "collocations", vocabulary: "academic-word-choice" } as const;
    for (const blank of exercise.blanks) if (values[blank.id] !== blank.answer) mistakes.push({ category: blank.category, learnerAnswer: values[blank.id] ?? "No answer", correctAnswer: blank.answer, explanation: blank.explanation, lessonId: lessonByCategory[blank.category] });
    return { correct, total: exercise.blanks.length, resultKind: "reading-accuracy", mistakes };
  }
  if (exercise.kind === "reorder") {
    const order = Array.isArray(answer) ? answer : [];
    const result = adjacentPairScore(order, exercise.correctOrder);
    if (result.correct < result.total) mistakes.push({ category: "paragraph-order", learnerAnswer: order.join(" → "), correctAnswer: exercise.correctOrder.join(" → "), explanation: exercise.explanation, lessonId: "paragraph-cohesion" });
    return { correct: result.correct, total: result.total, resultKind: "reading-accuracy", mistakes };
  }
  if (exercise.kind === "choice") {
    const selected = new Set(Array.isArray(answer) ? answer : []); const expected = new Set(exercise.answers);
    const correctSelections = [...selected].filter((id) => expected.has(id)).length;
    const incorrectSelections = [...selected].filter((id) => !expected.has(id)).length;
    const correct = exercise.taskType === "reading-multiple-multiple" ? Math.max(0, correctSelections - incorrectSelections) : Number(selected.size === 1 && correctSelections === 1);
    if (correct !== exercise.answers.length) mistakes.push({ category: "vocabulary", learnerAnswer: [...selected].join(", ") || "No answer", correctAnswer: exercise.answers.join(", "), explanation: exercise.explanation, lessonId: exercise.lessonIds[0] });
    return { correct, total: exercise.answers.length, resultKind: "reading-accuracy", mistakes };
  }
  const response = typeof answer === "string" ? answer : ""; const checks = writingFormChecks(exercise.taskType, response, exercise.wordRange);
  if (!checks.withinWordRange || checks.oneSentence === false) mistakes.push({ category: "writing-form", learnerAnswer: response, explanation: "Review the published word range and sentence form before comparing ideas and language.", lessonId: "sentence-structure" });
  return { correct: null, total: 0, resultKind: "writing-self-review", mistakes: selfReview.length ? mistakes : [...mistakes, { category: "writing-form", learnerAnswer: response, explanation: "Complete the self-review checklist after writing.", lessonId: "writing-review" }] };
}
