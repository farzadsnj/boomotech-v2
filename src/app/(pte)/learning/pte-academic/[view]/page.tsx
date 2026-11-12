import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PtePathPageContent, type PtePathView } from "@/features/pte/ptepath-page";

const views = ["practice","mistakes","grammar","progress","plan","settings"] as const;
export const dynamicParams = false;
export const metadata: Metadata = { robots: { index: false, follow: false, noarchive: true } };
export function generateStaticParams() { return views.map((view) => ({ view })); }
export default async function PteViewPage({ params }: { params: Promise<{ view: string }> }) { const { view } = await params; if (!views.includes(view as typeof views[number])) notFound(); return <PtePathPageContent view={view as PtePathView} />; }
