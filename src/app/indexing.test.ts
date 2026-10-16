import { afterEach, describe, expect, it } from "vitest";
import robots from "./robots";
import sitemap from "./sitemap";
import { intendedPublicRoutes } from "@/content/routes";
import { privateCrawlerPaths } from "./robots";

const originalUrl = process.env.SITE_URL;
const originalIndexing = process.env.SITE_INDEXING_ENABLED;
const originalShop = process.env.SHOP_ENABLED;

afterEach(() => {
  process.env.SITE_URL = originalUrl;
  process.env.SITE_INDEXING_ENABLED = originalIndexing;
  process.env.SHOP_ENABLED = originalShop;
});

describe("search indexing", () => {
  it("blocks crawlers and emits no sitemap routes by default", () => {
    process.env.SITE_INDEXING_ENABLED = "false";
    expect(sitemap()).toEqual([]);
    expect(robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  });

  it("includes only intended public routes when explicitly enabled for the approved production origin", () => {
    process.env.SITE_URL = "https://boomotech.com.au";
    process.env.SITE_INDEXING_ENABLED = "true";
    const entries = sitemap();
    expect(entries).toHaveLength(intendedPublicRoutes.length);
    expect(entries.map((entry) => new URL(entry.url).pathname)).toEqual(intendedPublicRoutes);
    expect(entries.some((entry) => entry.url.includes("checkout"))).toBe(false);
    for (const privatePath of ["/shop", "/register", "/login", "/forgot-password", "/reset-password", "/dashboard", "/admin"]) {
      expect(entries.some((entry) => new URL(entry.url).pathname === privatePath)).toBe(false);
    }
    expect(robots()).toMatchObject({
      rules: { userAgent: "*", allow: "/", disallow: [...privateCrawlerPaths] },
      sitemap: "https://boomotech.com.au/sitemap.xml",
    });
  });

  it("keeps HTTPS staging and preview origins non-indexable", () => {
    process.env.SITE_URL = "https://preview.boomotech.com.au";
    process.env.SITE_INDEXING_ENABLED = "true";
    expect(sitemap()).toEqual([]);
    expect(robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  });

  it("includes the shop hub only when the public shop flag is enabled", () => {
    process.env.SITE_URL = "https://boomotech.com.au";
    process.env.SITE_INDEXING_ENABLED = "true";
    process.env.SHOP_ENABLED = "true";
    expect(sitemap().map((entry) => new URL(entry.url).pathname)).toContain("/shop");
  });
});
