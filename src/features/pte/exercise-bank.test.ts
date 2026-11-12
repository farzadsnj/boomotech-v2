import { describe, expect, it } from "vitest";
import { exerciseBank, exercisesByTask, pteTaskGuidance } from "./exercise-bank";
import { pteTaskTypes } from "./types";

const words = (value: string) => value.trim().split(/\s+/u).length;

describe("PTE exercise bank", () => {
  it("contains ten original exercises for each supported task", () => {
    expect(exerciseBank).toHaveLength(70);
    expect(new Set(exerciseBank.map(({ id }) => id)).size).toBe(70);
    for (const taskType of pteTaskTypes) expect(exercisesByTask(taskType)).toHaveLength(10);
  });

  it("keeps writing samples inside the published form ranges", () => {
    for (const exercise of exerciseBank) {
      if (exercise.kind !== "writing") continue;
      expect(words(exercise.sample), exercise.id).toBeGreaterThanOrEqual(exercise.wordRange[0]);
      expect(words(exercise.sample), exercise.id).toBeLessThanOrEqual(exercise.wordRange[1]);
      if (exercise.taskType === "summarise-written-text") {
        expect((exercise.sample.match(/[.!?](?:\s|$)/gu) ?? []).length, exercise.id).toBe(1);
      }
    }
  });

  it("describes app scoring boundaries for every task", () => {
    for (const taskType of pteTaskTypes) {
      expect(pteTaskGuidance[taskType].official.length).toBeGreaterThan(70);
    }
    expect(pteTaskGuidance["reorder-paragraphs"].official).toMatch(/adjacent pair/i);
    expect(pteTaskGuidance["write-essay"].official).toMatch(/never an official or predicted score/i);
  });
});
