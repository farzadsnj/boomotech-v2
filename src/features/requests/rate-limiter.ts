import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { rateLimit } from "@/db/schema";

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 20;

export async function checkRequestMutationRateLimit(userId: string) {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const key = `request-mutation:${userId}`;
  const [entry] = await db.insert(rateLimit).values({ id: randomUUID(), key, count: 1, lastRequest: now })
    .onConflictDoUpdate({
      target: rateLimit.key,
      set: {
        count: sql<number>`case when ${rateLimit.lastRequest} <= ${windowStart} then 1 else ${rateLimit.count} + 1 end`,
        lastRequest: sql<number>`case when ${rateLimit.lastRequest} <= ${windowStart} then ${now} else ${rateLimit.lastRequest} end`,
      },
    }).returning({ count: rateLimit.count, lastRequest: rateLimit.lastRequest });
  return { allowed: entry.count <= LIMIT, retryAfterSeconds: Math.max(1, Math.ceil((entry.lastRequest + WINDOW_MS - now) / 1000)) };
}
