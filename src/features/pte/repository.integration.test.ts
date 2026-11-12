import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type * as PteRepository from "./repository";

const databasePath = path.resolve(process.cwd(), ".test-db", `pte-${randomUUID()}`);
const learnerA = randomUUID();
const learnerB = randomUUID();
let repository: typeof PteRepository;
let db: (typeof import("@/db"))["db"];
let closeDatabase: (typeof import("@/db"))["closeDatabase"];
let tables: typeof import("@/db/schema");

const profile = {
  startDate: "2026-11-08",
  examDate: null,
  durationDays: 12,
  dailyMinutes: 45,
  studyDays: [1, 3, 5],
  preferredTime: "18:00",
  timezone: "Australia/Brisbane",
  targetScore: 79,
  currentLevel: "unsure" as const,
  previousReadingScore: null,
  previousWritingScore: null,
  persianHelp: true,
};

beforeAll(async () => {
  await rm(databasePath, { recursive: true, force: true });
  await mkdir(path.dirname(databasePath), { recursive: true });
  const client = new PGlite(databasePath);
  const migrationDirectory = path.resolve(process.cwd(), "drizzle");
  for (const name of (await readdir(migrationDirectory)).filter((value) => value.endsWith(".sql")).sort()) {
    const migration = await readFile(path.join(migrationDirectory, name), "utf8");
    for (const statement of migration.split("--> statement-breakpoint").map((value) => value.trim()).filter(Boolean)) await client.exec(statement);
  }
  await client.close();
  process.env.AUTH_E2E_DATABASE_PATH = databasePath;
  ({ db, closeDatabase } = await import("@/db"));
  tables = await import("@/db/schema");
  repository = await import("./repository");
  await db.insert(tables.user).values([
    { id: learnerA, name: "Learner A", email: "learner-a@example.test", emailVerified: true, role: "user" },
    { id: learnerB, name: "Learner B", email: "learner-b@example.test", emailVerified: true, role: "user" },
  ]);
});

afterAll(async () => {
  await closeDatabase?.();
  delete process.env.AUTH_E2E_DATABASE_PATH;
  await rm(databasePath, { recursive: true, force: true });
});

describe("PTEpath account-linked repository", () => {
  it("resumes interrupted onboarding without creating a plan until completion", async () => {
    const draft = await repository.saveLearningProfile(learnerA, profile, false);
    expect(draft.profile.onboardingComplete).toBe(false);
    expect(draft.plan).toEqual([]);
    const resumed = await repository.getLearningSnapshot(learnerA);
    expect(resumed.profile).toMatchObject({ onboardingComplete: false, durationDays: 12 });

    const completed = await repository.saveLearningProfile(learnerA, profile, true);
    expect(completed.profile.onboardingComplete).toBe(true);
    expect(completed.plan).toHaveLength(12);
  });

  it("isolates two accounts and detects conflicting draft updates", async () => {
    const created = await repository.saveLearningDraft(learnerA, {
      exerciseId: "essay-remote-study", response: "Learner A private draft", elapsedSeconds: 30,
      timerStartedAt: null, timerDurationSeconds: 1_200, timerRunning: false, expectedVersion: 0,
    });
    expect(created.version).toBe(1);
    expect((await repository.getLearningSnapshot(learnerB)).drafts).toEqual([]);
    await expect(repository.saveLearningDraft(learnerA, {
      exerciseId: "essay-remote-study", response: "Stale overwrite", elapsedSeconds: 40,
      timerStartedAt: null, timerDurationSeconds: 1_200, timerRunning: false, expectedVersion: 0,
    })).rejects.toBeInstanceOf(repository.LearningConflictError);
    expect((await repository.getLearningSnapshot(learnerA)).drafts[0].response).toBe("Learner A private draft");
  });

  it("submits an attempt once for a stable idempotency key and never exposes it to another account", async () => {
    const idempotencyKey = randomUUID();
    const input = {
      idempotencyKey,
      exerciseId: "rfb-urban-trees",
      taskType: "reading-fill" as const,
      answer: { b1: "portable", b2: "planning" },
      selfReview: [],
      elapsedSeconds: 45,
      revealed: false as const,
    };
    expect((await repository.submitLearningAttempt(learnerA, input)).repeated).toBe(false);
    expect((await repository.submitLearningAttempt(learnerA, input)).repeated).toBe(true);
    const own = await repository.getLearningSnapshot(learnerA);
    expect(own.attempts.filter(({ idempotencyKey: key }) => key === idempotencyKey)).toHaveLength(1);
    expect(own.mistakes.some(({ exerciseId }) => exerciseId === input.exerciseId)).toBe(true);
    expect((await repository.getLearningSnapshot(learnerB)).attempts).toEqual([]);
  });

  it("resets only the authenticated account's learning domain", async () => {
    await repository.saveLearningProfile(learnerB, { ...profile, targetScore: 65 }, true);
    await repository.resetLearningData(learnerA);
    expect(await repository.getLearningSnapshot(learnerA)).toMatchObject({ profile: null, plan: [], attempts: [], drafts: [], mistakes: [] });
    expect((await repository.getLearningSnapshot(learnerB)).profile).toMatchObject({ targetScore: 65 });
  });
});
