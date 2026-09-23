import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageRenderer } from "@/components/content/page-renderer";
import { allPages, pageByPath } from "@/content/routes";
import { getRobotsPolicy } from "@/lib/site-url";

type Props = { params: Promise<{ segments: string[] }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return allPages.map(({ path }) => ({ segments: path.slice(1).split("/") }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { segments } = await params;
  const path = `/${segments.join("/")}` as `/${string}`;
  const page = pageByPath.get(path);
  if (!page) return {};
  return {
    title: page.title,
    description: page.metaDescription,
    alternates: { canonical: page.path },
    openGraph: { title: page.title, description: page.metaDescription, url: page.path },
    robots: getRobotsPolicy(page),
  };
}

export default async function ContentPage({ params }: Props) {
  const { segments } = await params;
  const page = pageByPath.get(`/${segments.join("/")}` as `/${string}`);
  if (!page) notFound();
  return <PageRenderer page={page} />;
}
