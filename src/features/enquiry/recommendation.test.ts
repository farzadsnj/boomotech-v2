import { describe, expect, it } from "vitest";
import { problemOptions, recommendationFor } from "./recommendation";

describe("deterministic enquiry recommendations", () => {
  it("provides one clear service or an honest uncertain path for every category", () => {
    for (const option of problemOptions) {
      const result = recommendationFor(option.id);
      expect(result.option.id).toBe(option.id);
      expect(result.alternatives.length).toBeLessThanOrEqual(2);
      if (option.id === "other") expect(result.primary).toBeUndefined();
      else expect(result.primary?.path).toBe(option.servicePath);
    }
  });

  it("does not present a recommendation as a diagnosis", () => {
    expect(recommendationFor("it-problem").why).toMatch(/suggested pathway, not a diagnosis/i);
  });
});
