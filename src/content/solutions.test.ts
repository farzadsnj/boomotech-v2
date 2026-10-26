import { describe, expect, it } from "vitest";
import { solutionByPath } from "./solutions";

describe("primary audience solution content", () => {
  for (const path of ["/solutions/home-office-individuals", "/solutions/small-business"] as const) {
    it(`${path} provides a complete, audience-aware decision path`, () => {
      const page = solutionByPath.get(path);
      expect(page).toBeDefined();
      expect(page?.challenges.length).toBeGreaterThanOrEqual(4);
      expect(page?.pathways?.length).toBeGreaterThanOrEqual(5);
      expect(page?.diagram?.caption.length).toBeGreaterThan(80);
      expect(page?.inclusions?.length).toBeGreaterThanOrEqual(4);
      expect(page?.separateAgreement?.length).toBeGreaterThanOrEqual(4);
      expect(page?.example?.deliverables.length).toBeGreaterThanOrEqual(4);
      expect(page?.faqs?.length).toBeGreaterThanOrEqual(4);
      expect(page?.cta?.href).toContain(path.includes("small-business") ? "audience=business" : "audience=personal");
    });
  }
});
