import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/button-link";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { phaseOneRoutes, routeByPath } from "@/content/site";

type Props = { params: Promise<{ segments: string[] }> };

export function generateStaticParams() {
  return phaseOneRoutes.map(({ href }) => ({ segments: href.slice(1).split("/") }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { segments } = await params;
  const path = `/${segments.join("/")}` as `/${string}`;
  const page = routeByPath.get(path);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: page.href },
    robots: { index: false, follow: false },
  };
}

export default async function PreviewPage({ params }: Props) {
  const { segments } = await params;
  const page = routeByPath.get(`/${segments.join("/")}` as `/${string}`);
  if (!page) notFound();

  return (
    <section className="preview-page">
      <div className="container preview-page__inner">
        <nav aria-label="Breadcrumb" className="breadcrumbs"><Link href="/">Home</Link><ArrowIcon /><span>{page.section}</span></nav>
        <p className="eyebrow"><span className="eyebrow-line" />{page.section.toUpperCase()}</p>
        <h1>{page.title}</h1>
        <p className="preview-page__lead">{page.description}</p>
        <div className="preview-note flex items-start gap-4"><span className="preview-note__mark">i</span><p><strong>This page is being prepared.</strong> The details will be published after service scope and content are reviewed.</p></div>
        <ButtonLink href="/" variant="secondary">Back to homepage</ButtonLink>
      </div>
    </section>
  );
}
