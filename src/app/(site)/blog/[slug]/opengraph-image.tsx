import { ImageResponse } from "next/og";
import { articleBySlug, publishedArticles } from "@/content/blog";

export const alt = "BoomoTech article";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamicParams = false;
export function generateStaticParams() { return publishedArticles.map(({ slug }) => ({ slug })); }

export default async function ArticleOpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const article = articleBySlug.get((await params).slug);
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px", background: "#EAF5FB", color: "#1D3A49", fontFamily: "Arial" }}><div style={{ display: "flex", color: "#0070B7", fontSize: 30, fontWeight: 700 }}>BoomoTech journal</div><div style={{ maxWidth: 1000, fontSize: 64, fontWeight: 700, lineHeight: 1.06, letterSpacing: "-3px" }}>{article?.title ?? "Practical technology guidance"}</div><div style={{ display: "flex", alignItems: "center", gap: "18px", fontSize: 25 }}><span>{article?.category ?? "Technology"}</span><span style={{ width: 100, height: 7, borderRadius: 7, background: "#0070B7" }} /></div></div>, size);
}
