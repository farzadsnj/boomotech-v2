import { describe, expect, it } from "vitest";
import { exerciseById } from "./exercise-bank";
import { buildLearningPlan, localDateInTimeZone, prioritiseMistakes } from "./planning";

const base = {
  startDate: "2026-11-08",
  durationDays: 12,
  dailyMinutes: 45,
  studyDays: [1, 3, 5],
};

describe("PTE study planning", () => {
  it("supports short, long and custom plans using only real exercises", () => {
    for (const durationDays of [1, 37, 365]) {
      const plan = buildLearningPlan({ ...base, durationDays });
      expect(plan).toHaveLength(durationDays);
      expect(plan.every((day) => day.exerciseIds.every((id) => exerciseById.has(id)))).toBe(true);
      expect(plan.every((day) => [1, 3, 5].includes(new Date(`${day.studyDate}T12:00:00Z`).getUTCDay()))).toBe(true);
    }
  });

  it("prioritises weaker task types without claiming official score weights", () => {
    const plan = buildLearningPlan({ ...base, durationDays: 2, weakness: { "write-essay": 0.9, "reading-fill": 0.1 } });
    expect(plan[0].exerciseIds.every((id) => exerciseById.get(id)?.taskType === "write-essay")).toBe(true);
  });

  it("uses calendar dates safely for different timezones", () => {
    const instant = new Date("2026-11-07T14:30:00.000Z");
    expect(localDateInTimeZone("Australia/Brisbane", instant)).toBe("2026-11-08");
    expect(localDateInTimeZone("UTC", instant)).toBe("2026-11-07");
  });

  it("returns no plan when no study day is available", () => {
    expect(buildLearningPlan({ ...base, studyDays: [] })).toEqual([]);
  });

  it("prioritises overdue unresolved mistakes in frequent categories", () => {
    const ordered = prioritiseMistakes([
      { id: "reviewed", category: "grammar", reviewedAt: "2026-11-08T00:00:00Z", createdAt: "2026-11-01T00:00:00Z" },
      { id: "collocation", category: "collocation", reviewedAt: null, createdAt: "2026-11-02T00:00:00Z" },
      { id: "grammar-new", category: "grammar", reviewedAt: null, createdAt: "2026-11-03T00:00:00Z" },
      { id: "grammar-old", category: "grammar", reviewedAt: null, createdAt: "2026-11-01T00:00:00Z" },
    ]);
    expect(ordered.map(({ id }) => id)).toEqual(["grammar-old", "grammar-new", "collocation", "reviewed"]);
  });
});
