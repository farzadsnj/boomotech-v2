import { afterEach, describe, expect, it, vi } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { getSiteUrl, isIndexingEnabled } from "./site-url";

afterEach(() => vi.unstubAllEnvs());

describe("search indexing gate", () => {
  it("uses a safe local origin and disables indexing by default", () => {
    vi.stubEnv("SITE_URL", "invalid-url");
    vi.stubEnv("SITE_INDEXING_ENABLED", "false");
    expect(getSiteUrl().origin).toBe("http://localhost:3000");
    expect(isIndexingEnabled()).toBe(false);
    expect(robots().rules).toEqual({ userAgent: "*", disallow: "/" });
    expect(sitemap()).toEqual([]);
  });

  it("requires both explicit approval and an HTTPS origin", () => {
    vi.stubEnv("SITE_URL", "http://example.com");
    vi.stubEnv("SITE_INDEXING_ENABLED", "true");
    expect(isIndexingEnabled()).toBe(false);

    vi.stubEnv("SITE_URL", "https://example.com");
    expect(isIndexingEnabled()).toBe(true);
    expect(robots().sitemap).toBe("https://example.com/sitemap.xml");
    expect(sitemap()).toEqual([{ url: "https://example.com/", changeFrequency: "monthly", priority: 1 }]);
  });
});
