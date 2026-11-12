import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { authHref, PTE_RETURN_PATH } from "@/lib/auth/return-path";
import { PtePathApp } from "./ptepath-app";
import { getLearningSnapshot } from "./repository";

export type PtePathView = "dashboard" | "practice" | "mistakes" | "grammar" | "progress" | "plan" | "settings";

export async function PtePathPageContent({ view }: { view: PtePathView }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session && !session.user.emailVerified) redirect(authHref("/check-email", PTE_RETURN_PATH));
  const snapshot = session ? await getLearningSnapshot(session.user.id) : null;
  const serialised = snapshot ? JSON.parse(JSON.stringify(snapshot)) : null;
  return <PtePathApp initial={serialised} initialView={view} user={session ? { id: session.user.id, name: session.user.name, email: session.user.email, role: session.user.role } : null} />;
}
