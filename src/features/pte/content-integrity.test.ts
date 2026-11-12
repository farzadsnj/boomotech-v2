import { describe, expect, it } from "vitest";
import { exerciseBank, pteOfficialSources, pteTaskGuidance } from "./exercise-bank";
import { academicCollocations, pteLessons } from "./learning-content";
import { pteTaskTypes } from "./types";

describe("PTEpath learning content", () => {
  it("contains the required original content inventory", () => {
    expect(exerciseBank).toHaveLength(70);
    expect(pteLessons).toHaveLength(24);
    expect(academicCollocations).toHaveLength(150);
    expect(new Set(pteLessons.map(({ id }) => id)).size).toBe(24);
    expect(new Set(academicCollocations.map(({ id }) => id)).size).toBe(150);
  });

  it("keeps exercise keys and lesson links internally valid", () => {
    const lessons = new Set(pteLessons.map(({ id }) => id));
    for (const exercise of exerciseBank) {
      expect(exercise.lessonIds.every((id) => lessons.has(id)), exercise.id).toBe(true);
      if (exercise.kind === "fill") {
        for (const blank of exercise.blanks) {
          expect(blank.options).toContain(blank.answer);
          expect(Object.keys(blank.optionRationales).sort()).toEqual([...blank.options].sort());
        }
      }
      if (exercise.kind === "reorder") {
        expect([...exercise.correctOrder].sort()).toEqual(exercise.paragraphs.map(({ id }) => id).sort());
      }
      if (exercise.kind === "choice") {
        const options = new Set(exercise.options.map(({ id }) => id));
        expect(exercise.answers.every((id) => options.has(id))).toBe(true);
        expect(exercise.options.every(({ rationale }) => rationale.length > 20)).toBe(true);
      }
      if (exercise.kind === "writing") {
        expect(exercise.keyIdeas.length).toBeGreaterThanOrEqual(1);
        expect(exercise.structuralBreakdown.length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("records official sources and review dates for every task guide", () => {
    const sourceIds = new Set(pteOfficialSources.map(({ id }) => id));
    expect(pteOfficialSources.every(({ url, reviewedOn }) => url.startsWith("https://www.pearsonpte.com/") && reviewedOn === "2026-11-08")).toBe(true);
    for (const task of pteTaskTypes) {
      expect(pteTaskGuidance[task].sourceIds.every((id) => sourceIds.has(id))).toBe(true);
    }
  });

  it("keeps every collocation contextual and bilingual", () => {
    for (const item of academicCollocations) {
      expect(item.example).toContain(item.phrase);
      expect(item.meaningFa.length).toBeGreaterThan(2);
    }
  });
});
