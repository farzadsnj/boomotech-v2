import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { rateLimit } from "@/db/schema";
import { auth } from "@/lib/auth/auth";
import { canAccessCustomerDashboard } from "@/lib/auth/access";
import { hasApprovedMutationOrigin } from "@/lib/security/origin";

const WINDOW_MS = 10 * 60_000;
const MAX_MUTATIONS = 120;

export async function learningActor(headers: Headers) {
  const session = await auth.api.getSession({ headers });
  if (!session || !canAccessCustomerDashboard(session)) return null;
  return { id: session.user.id, name: session.user.name, email: session.user.email, role: session.user.role };
}

export async function approveLearningMutation(request: Request, userId: string) {
  if (!hasApprovedMutationOrigin(request)) return { allowed: false as const, status: 403 };
  const now = Date.now(); const windowStart = now - WINDOW_MS; const key = `pte:${userId}`;
  const [entry] = await db.insert(rateLimit).values({ id: randomUUID(), key, count: 1, lastRequest: now }).onConflictDoUpdate({ target: rateLimit.key, set: {
    count: sql<number>`case when ${rateLimit.lastRequest} <= ${windowStart} then 1 else ${rateLimit.count} + 1 end`,
    lastRequest: sql<number>`case when ${rateLimit.lastRequest} <= ${windowStart} then ${now} else ${rateLimit.lastRequest} end`,
  } }).returning({ count: rateLimit.count });
  return entry.count <= MAX_MUTATIONS ? { allowed: true as const } : { allowed: false as const, status: 429 };
}

export const learningPrivateHeaders = { "Cache-Control": "private, no-store, max-age=0", "X-Robots-Tag": "noindex, nofollow, noarchive" };
