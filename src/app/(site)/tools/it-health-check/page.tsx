import type { Metadata } from "next";
import Link from "next/link";
import { HealthCheck } from "@/components/tools/health-check";
import { getSiteUrl, isIndexingEnabled } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Free IT Health Check",
  description: "A short, private self-check to identify practical IT, security, continuity and systems priorities.",
  alternates: { canonical: "/tools/it-health-check" },
  robots: { index: isIndexingEnabled(), follow: isIndexingEnabled() }
};

export default function ItHealthCheckPage() {
  const siteUrl = getSiteUrl();
  const absolute = (path: string) => new URL(path, siteUrl).toString();
  return <>
    <script dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: absolute("/") }, { "@type": "ListItem", position: 2, name: "Resources", item: absolute("/resources") }, { "@type": "ListItem", position: 3, name: "IT Health Check", item: absolute("/tools/it-health-check") }] }).replaceAll("<", "\\u003c") }} type="application/ld+json" />
    <header className="tool-hero"><div className="container"><nav aria-label="Breadcrumb" className="breadcrumbs"><Link href="/">Home</Link><span aria-hidden="true">›</span><Link href="/resources">Resources</Link><span aria-hidden="true">›</span><span aria-current="page">IT Health Check</span></nav><div className="tool-hero__grid"><div><p className="eyebrow"><span className="eyebrow-line" />FREE SELF-CHECK</p><h1>See where your IT foundations may need attention.</h1></div><div><p>Answer six practical questions. Your answers remain on this page and are not submitted, saved or placed in the URL.</p><Link href="/privacy">Read the privacy policy</Link></div></div></div></header>
    <section className="tool-section"><div className="container"><HealthCheck /></div></section>
  </>;
}
