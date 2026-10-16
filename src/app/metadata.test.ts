import { afterEach, describe, expect, it, vi } from "vitest";
import { generateMetadata as generateContentMetadata } from "./[...segments]/page";
import { generateMetadata as generateArticleMetadata } from "./blog/[slug]/page";
import { metadata as blogMetadata } from "./blog/page";
import { metadata as homeMetadata } from "./page";
import { siteMetadata as rootMetadata } from "@/lib/site-metadata";
import { publishedArticles } from "@/content/blog";

afterEach(() => vi.unstubAllEnvs());

describe("public page metadata", () => {
  it("defines the homepage canonical on the homepage rather than sharing it from the root layout", () => {
    expect(rootMetadata.alternates).toBeUndefined();
    expect(homeMetadata.alternates).toEqual({ canonical: "/" });
    expect(homeMetadata.openGraph).toMatchObject({ url: "/" });
  });

  it("generates a page-specific canonical and social URL for public content", async () => {
    vi.stubEnv("SITE_URL", "https://boomotech.com.au");
    vi.stubEnv("SITE_INDEXING_ENABLED", "true");
    const metadata = await generateContentMetadata({ params: Promise.resolve({ segments: ["services", "it-support"] }) });
    expect(metadata.alternates).toEqual({ canonical: "/services/it-support" });
    expect(metadata.openGraph).toMatchObject({ url: "/services/it-support" });
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });

  it("keeps draft catch-all content noindex even when site indexing is enabled", async () => {
    vi.stubEnv("SITE_URL", "https://boomotech.com.au");
    vi.stubEnv("SITE_INDEXING_ENABLED", "true");
    const metadata = await generateContentMetadata({ params: Promise.resolve({ segments: ["privacy"] }) });
    expect(metadata.alternates).toEqual({ canonical: "/privacy" });
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("gives the blog index and every published article a unique canonical and social image", async () => {
    expect(blogMetadata.alternates).toEqual({ canonical: "/blog" });
    for (const article of publishedArticles) {
      const metadata = await generateArticleMetadata({ params: Promise.resolve({ slug: article.slug }) });
      const path = `/blog/${article.slug}`;
      expect(metadata.alternates).toEqual({ canonical: path });
      expect(metadata.openGraph).toMatchObject({ type: "article", url: path });
      expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
      expect(JSON.stringify(metadata.openGraph)).toContain(`${path}/opengraph-image`);
    }
  });
});
