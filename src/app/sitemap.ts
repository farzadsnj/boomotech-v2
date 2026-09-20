import type { MetadataRoute } from "next";
import { getSiteUrl, isIndexingEnabled } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!isIndexingEnabled()) return [];
  return [{ url: getSiteUrl().toString(), changeFrequency: "monthly", priority: 1 }];
}
