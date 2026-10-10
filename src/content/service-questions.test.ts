import { describe, expect, it } from "vitest";
import { services } from "./services";
import { serviceQuestions, servicesMissingQuestions } from "./service-questions";

describe("service mini questions", () => {
  it("covers every public service with two or three concise questions", () => {
    expect(servicesMissingQuestions).toEqual([]);
    for (const service of services) expect([2, 3]).toContain(serviceQuestions[service.path].length);
  });
  it("uses unique question identifiers within each service", () => {
    for (const questions of Object.values(serviceQuestions)) expect(new Set(questions.map(({ id }) => id)).size).toBe(questions.length);
  });
});
