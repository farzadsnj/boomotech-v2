import { afterEach, describe, expect, it, vi } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { getSiteUrl, isIndexingEnabled } from "./site-url";
import { intendedPublicRoutes } from "@/content/routes";

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

  it("requires both explicit approval and the exact production origin", () => {
    vi.stubEnv("SITE_URL", "http://example.com");
    vi.stubEnv("SITE_INDEXING_ENABLED", "true");
    expect(isIndexingEnabled()).toBe(false);

    vi.stubEnv("SITE_URL", "https://preview.boomotech.com.au");
    expect(isIndexingEnabled()).toBe(false);

    vi.stubEnv("SITE_URL", "https://boomotech.com.au");
    expect(isIndexingEnabled()).toBe(true);
    expect(robots().sitemap).toBe("https://boomotech.com.au/sitemap.xml");
    const entries = sitemap();
    expect(entries).toHaveLength(intendedPublicRoutes.length);
    expect(entries[0]).toEqual({ url: "https://boomotech.com.au/", changeFrequency: "monthly", priority: 1 });
  });
});
