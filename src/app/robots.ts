import type { MetadataRoute } from "next";
import { getSiteUrl, isIndexingEnabled } from "@/lib/site-url";

export const privateCrawlerPaths = [
  "/admin",
  "/api",
  "/dashboard",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/check-email",
  "/email-verification-result",
  "/verify-email",
] as const;

export default function robots(): MetadataRoute.Robots {
  if (!isIndexingEnabled()) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: [...privateCrawlerPaths] },
    sitemap: new URL("/sitemap.xml", getSiteUrl()).toString(),
  };
}
