import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogCard } from "@/components/blog/blog-card";
import { articleBySlug, publishedArticles } from "@/content/blog";
import { getSiteUrl } from "@/lib/site-url";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return publishedArticles.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = articleBySlug.get((await params).slug); if (!article?.isPublished) return {};
  const path = `/blog/${article.slug}`;
  return { title: article.title, description: article.summary, alternates: { canonical: path }, openGraph: { type: "article", title: article.title, description: article.summary, url: path, publishedTime: article.published, modifiedTime: article.updated, authors: [article.author] } };
}
export default async function ArticlePage({ params }: Props) {
  const article = articleBySlug.get((await params).slug); if (!article?.isPublished) notFound();
  const related = article.relatedSlugs.map((slug) => articleBySlug.get(slug)).filter((item): item is NonNullable<typeof item> => Boolean(item?.isPublished));
  const url = new URL(`/blog/${article.slug}`, getSiteUrl()).toString();
  const structured = [{ "@context": "https://schema.org", "@type": "BlogPosting", headline: article.title, description: article.summary, author: { "@type": "Organization", name: article.author }, datePublished: article.published, dateModified: article.updated, mainEntityOfPage: url }, { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: new URL("/", getSiteUrl()).toString() }, { "@type": "ListItem", position: 2, name: "Blog", item: new URL("/blog", getSiteUrl()).toString() }, { "@type": "ListItem", position: 3, name: article.title, item: url }] }];
  return <article className="article-page"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, "\\u003c") }} /><header className="article-header section-space"><div className="article-shell"><nav aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/blog">Blog</Link></nav><p className="eyebrow"><span className="eyebrow-line" />{article.category}</p><h1>{article.title}</h1><p className="article-summary">{article.summary}</p><div className="article-meta"><span>{article.author}</span><time dateTime={article.published}>{new Intl.DateTimeFormat("en-AU", { dateStyle: "long" }).format(new Date(article.published))}</time><span>{article.readingTime}</span></div></div></header><div className="article-layout container section-space"><aside className="article-toc"><h2>In this article</h2><ol>{article.sections.map((section) => <li key={section.id}><a href={`#${section.id}`}>{section.title}</a></li>)}</ol></aside><div className="article-content">{article.sections.map((section) => <section id={section.id} key={section.id}><h2>{section.title}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.points && <ul>{section.points.map((point) => <li key={point}>{point}</li>)}</ul>}</section>)}<aside className="article-cta"><h2>Need help applying this?</h2><p>Discuss your current setup and the outcome you need. A booking request starts a conversation and does not confirm an appointment.</p><Link className="button-link button-link--primary" href={article.relatedService.href}>{article.relatedService.label}</Link><Link className="button-link button-link--secondary" href="/booking">Request a consultation</Link></aside></div></div><section className="related-articles container section-space"><h2>Related articles</h2><div className="blog-grid">{related.map((item) => <BlogCard key={item.slug} article={item} />)}</div><Link href="/blog">← Back to all articles</Link></section></article>;
}
