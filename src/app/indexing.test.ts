import { afterEach, describe, expect, it } from "vitest";
import robots from "./robots";
import sitemap from "./sitemap";
import { sitemapRoutes } from "@/content/routes";

const originalUrl = process.env.SITE_URL;
const originalIndexing = process.env.SITE_INDEXING_ENABLED;

afterEach(() => {
  process.env.SITE_URL = originalUrl;
  process.env.SITE_INDEXING_ENABLED = originalIndexing;
});

describe("search indexing", () => {
  it("blocks crawlers and emits no sitemap routes by default", () => {
    process.env.SITE_INDEXING_ENABLED = "false";
    expect(sitemap()).toEqual([]);
    expect(robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  });

  it("includes only intended public routes when explicitly enabled on HTTPS", () => {
    process.env.SITE_URL = "https://boomotech.example";
    process.env.SITE_INDEXING_ENABLED = "true";
    const entries = sitemap();
    expect(entries).toHaveLength(sitemapRoutes.length);
    expect(entries.map((entry) => new URL(entry.url).pathname)).toEqual(sitemapRoutes);
    for (const excluded of ["/support", "/book", "/shop", "/privacy", "/terms", "/contact", "/blog"]) {
      expect(entries.some((entry) => new URL(entry.url).pathname === excluded)).toBe(false);
    }
    expect(robots()).toMatchObject({ rules: { userAgent: "*", allow: "/" } });
  });
});
