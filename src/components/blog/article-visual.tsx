import type { BlogArticle } from "@/content/blog";

export function ArticleVisual({ article }: { article: BlogArticle }) {
  const items = article.sections.slice(0, 3);
  return <figure className="article-visual" aria-labelledby={`visual-${article.slug}`}>
    <div className="article-visual__mark" aria-hidden="true">B</div>
    <ol>{items.map((item, index) => <li key={item.id}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><strong>{item.title}</strong></li>)}</ol>
    <figcaption id={`visual-${article.slug}`}>A quick starting checklist: {items.map((item) => item.title.toLowerCase()).join(", ")}.</figcaption>
  </figure>;
}
