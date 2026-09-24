import type { Metadata } from "next";
import { BlogCard } from "@/components/blog/blog-card";
import { publishedArticles } from "@/content/blog";

export const metadata: Metadata = { title: "Technology advice for small businesses", description: "Practical BoomoTech articles about IT support, networks, cybersecurity and useful business technology.", alternates: { canonical: "/blog" } };

export default function BlogPage() {
  const [featured, ...articles] = publishedArticles;
  return <><section className="blog-hero section-space"><div className="container"><p className="eyebrow"><span className="eyebrow-line" />BoomoTech journal</p><h1>Practical technology guidance</h1><p>Clear, useful articles for small businesses making everyday IT, network and security decisions.</p></div></section><section className="container blog-index section-space" aria-labelledby="latest"><h2 id="latest">Latest articles</h2>{featured ? <BlogCard article={featured} featured /> : <p className="empty-state">No articles are published yet.</p>}<div className="blog-grid">{articles.map((article) => <BlogCard key={article.slug} article={article} />)}</div></section></>;
}
