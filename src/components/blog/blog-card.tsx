import Image from "next/image";
import Link from "next/link";
import { calculateReadingTime, type BlogArticle } from "@/content/blog";

export function BlogCard({ article, featured = false, headingLevel = 3 }: { article: BlogArticle; featured?: boolean; headingLevel?: 2 | 3 }) {
  const Heading = `h${headingLevel}` as const;
  return <article className={`blog-card${featured ? " blog-card--featured" : ""}`}>
    <div className="blog-card__image"><Image alt={article.heroImageAlt} fill sizes={featured ? "(max-width: 760px) 92vw, 1160px" : "(max-width: 760px) 92vw, 560px"} src={article.heroImage} /></div>
    <div className="blog-card__body">
      <div className="blog-card__meta"><span>{article.category}</span><time dateTime={article.published}>{new Intl.DateTimeFormat("en-AU", { dateStyle: "long" }).format(new Date(article.published))}</time><span>{calculateReadingTime(article)}</span></div>
      <Heading><Link href={`/blog/${article.slug}`}>{article.title}</Link></Heading>
      <p>{article.excerpt}</p>
      <div className="blog-card__links"><Link href={`/blog/${article.slug}`}>Read article <span aria-hidden="true">→</span></Link><Link href={article.relatedService.href}>{article.relatedService.label}</Link></div>
    </div>
  </article>;
}
