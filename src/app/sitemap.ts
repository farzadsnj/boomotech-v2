import type { MetadataRoute } from "next";
import { getSiteUrl, isIndexingEnabled } from "@/lib/site-url";
import { intendedPublicRoutes } from "@/content/routes";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!isIndexingEnabled()) return [];
  const base = getSiteUrl();
  return intendedPublicRoutes.map((path) => ({
    url: new URL(path, base).toString(),
    changeFrequency: path === "/" ? "monthly" as const : "yearly" as const,
    priority: path === "/" ? 1 : path.split("/").length === 2 ? 0.8 : 0.6,
  }));
}
