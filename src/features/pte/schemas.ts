import { z } from "zod";
import { pteTaskTypes } from "./types";

const localDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const score = z.number().int().min(10).max(90);

export const learningProfileInputSchema = z.object({
  startDate: localDate,
  examDate: localDate.nullable(),
  durationDays: z.number().int().min(1).max(730),
  dailyMinutes: z.number().int().min(10).max(480),
  studyDays: z.array(z.number().int().min(0).max(6)).min(1).max(7).transform((days) => [...new Set(days)].sort()),
  preferredTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  timezone: z.string().min(1).max(80).refine((value) => { try { new Intl.DateTimeFormat("en-AU", { timeZone: value }); return true; } catch { return false; } }, "Choose a valid timezone."),
  targetScore: score.nullable(),
  currentLevel: z.enum(["starting", "developing", "confident", "unsure"]),
  previousReadingScore: score.nullable(),
  previousWritingScore: score.nullable(),
  persianHelp: z.boolean(),
}).strict().superRefine((value, context) => {
  if (value.examDate && value.examDate < value.startDate) context.addIssue({ code: "custom", path: ["examDate"], message: "The estimated exam date must be on or after the start date." });
});

export const draftInputSchema = z.object({
  exerciseId: z.string().min(1).max(100), response: z.string().max(20_000), elapsedSeconds: z.number().int().min(0).max(86_400),
  timerStartedAt: z.string().datetime().nullable(), timerDurationSeconds: z.number().int().min(60).max(7_200).nullable(), timerRunning: z.boolean(), expectedVersion: z.number().int().min(0),
}).strict();

export const attemptInputSchema = z.object({
  idempotencyKey: z.string().uuid(), exerciseId: z.string().min(1).max(100), taskType: z.enum(pteTaskTypes),
  answer: z.union([z.string().max(20_000), z.array(z.string().max(1_000)).max(30), z.record(z.string(), z.string().max(1_000))]),
  selfReview: z.array(z.string().max(160)).max(20).default([]), elapsedSeconds: z.number().int().min(0).max(86_400), revealed: z.literal(false),
}).strict();

export const mistakeReviewSchema = z.object({ mistakeId: z.string().uuid(), reviewed: z.boolean() }).strict();
export const manualScoreSchema = z.object({ source: z.string().trim().min(2).max(120), scoreDate: localDate, readingScore: score.nullable(), writingScore: score.nullable() }).strict().refine((value) => value.readingScore !== null || value.writingScore !== null, { message: "Add at least one score." });
