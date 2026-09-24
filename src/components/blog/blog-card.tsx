import Link from "next/link";
import type { BlogArticle } from "@/content/blog";

export function BlogCard({ article, featured = false }: { article: BlogArticle; featured?: boolean }) {
  return <article className={`blog-card${featured ? " blog-card--featured" : ""}`}><div className="blog-card__meta"><span>{article.category}</span><time dateTime={article.published}>{new Intl.DateTimeFormat("en-AU", { dateStyle: "long" }).format(new Date(article.published))}</time><span>{article.readingTime}</span></div><h2><Link href={`/blog/${article.slug}`}>{article.title}</Link></h2><p>{article.excerpt}</p><div className="blog-card__links"><Link href={`/blog/${article.slug}`}>Read article <span aria-hidden="true">→</span></Link><Link href={article.relatedService.href}>{article.relatedService.label}</Link></div></article>;
}
