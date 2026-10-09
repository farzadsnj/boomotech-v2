import { describe, expect, it } from "vitest";
import { healthQuestions, scoreHealthCheck } from "./health-check";

describe("IT health check", () => {
  it("contains a concise deterministic question set", () => { expect(healthQuestions).toHaveLength(10); expect(new Set(healthQuestions.map(({ id }) => id)).size).toBe(10); });
  it("classifies low, medium and high concern answers", () => {
    expect(scoreHealthCheck(Object.fromEntries(healthQuestions.map(({ id }) => [id, 0]))).level).toBe("steady");
    expect(scoreHealthCheck(Object.fromEntries(healthQuestions.map(({ id }) => [id, 1]))).level).toBe("review");
    expect(scoreHealthCheck(Object.fromEntries(healthQuestions.map(({ id }) => [id, 2]))).level).toBe("priority");
  });
});
