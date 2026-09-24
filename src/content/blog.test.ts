import { describe, expect, it } from "vitest";
import { publishedArticles } from "./blog";

describe("blog content", () => {
  it("contains three unique, complete published articles", () => {
    expect(publishedArticles).toHaveLength(3);
    expect(new Set(publishedArticles.map(({ slug }) => slug)).size).toBe(3);
    for (const article of publishedArticles) { expect(article.sections.length).toBeGreaterThanOrEqual(5); expect(article.summary.length).toBeGreaterThan(50); }
  });
});
