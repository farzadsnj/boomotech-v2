import type { Metadata } from "next";
import { site } from "@/content/site";
import { getSiteUrl, isIndexingEnabled } from "./site-url";

export const siteMetadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: { default: "BoomoTech | Practical technology help", template: "%s | BoomoTech" },
  description: site.description,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: "BoomoTech | Practical technology help",
    description: site.description,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "BoomoTech practical technology support and smarter systems" }],
  },
  twitter: { card: "summary_large_image", title: "BoomoTech | Practical technology help", description: site.description, images: ["/opengraph-image"] },
  robots: { index: isIndexingEnabled(), follow: isIndexingEnabled() },
};
