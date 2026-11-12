import type { Metadata } from "next";
import { headers } from "next/headers";
import { PtePathPageContent } from "@/features/pte/ptepath-page";
import { auth } from "@/lib/auth/auth";
import { PTE_RETURN_PATH } from "@/lib/auth/return-path";
import { isIndexingEnabled } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> { const session = await auth.api.getSession({ headers: await headers() }); const personal = Boolean(session?.user.emailVerified); return { title: "PTE Academic Reading & Writing", description: "PTEpath Reading and Writing practice with plans, explanations, Persian support and account-linked progress.", alternates: { canonical: PTE_RETURN_PATH }, robots: personal ? { index: false, follow: false, noarchive: true } : { index: isIndexingEnabled(), follow: isIndexingEnabled() } }; }
export default async function PtePathPage() { return <PtePathPageContent view="dashboard" />; }
