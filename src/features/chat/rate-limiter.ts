import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { rateLimit } from "@/db/schema";
import { getBookingClientKey, RateLimitConfigurationError } from "@/features/booking/rate-limiter";

export { RateLimitConfigurationError };

type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };
export interface ChatRateLimiter { check(key: string): Promise<RateLimitResult> }

const WINDOW_SECONDS = 10 * 60;
const LIMIT = 10;
const MAX_DEVELOPMENT_KEYS = 500;
const developmentAttempts = new Map<string, { count: number; resetAt: number }>();

function developmentLimiter(): ChatRateLimiter {
  return { async check(key) {
    const now = Date.now();
    for (const [entryKey, entry] of developmentAttempts) {
      if (entry.resetAt <= now) developmentAttempts.delete(entryKey);
    }
    if (!developmentAttempts.has(key) && developmentAttempts.size >= MAX_DEVELOPMENT_KEYS) {
      const oldest = developmentAttempts.keys().next().value;
      if (oldest) developmentAttempts.delete(oldest);
    }
    const current = developmentAttempts.get(key);
    const entry = !current || current.resetAt <= now
      ? { count: 0, resetAt: now + WINDOW_SECONDS * 1000 }
      : current;
    entry.count += 1;
    developmentAttempts.set(key, entry);
    return {
      allowed: entry.count <= LIMIT,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1_000)),
    };
  } };
}

function sharedLimiter(url: string, token: string): ChatRateLimiter {
  async function command(parts: (string | number)[]) {
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(parts),
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) throw new RateLimitConfigurationError("The shared chat rate limiter is unavailable.");
    return response.json() as Promise<{ result: number }>;
  }

  return { async check(key) {
    const redisKey = `boomotech:chat:${key}`;
    const { result } = await command(["INCR", redisKey]);
    if (result === 1) await command(["EXPIRE", redisKey, WINDOW_SECONDS]);
    return { allowed: result <= LIMIT, retryAfterSeconds: WINDOW_SECONDS };
  } };
}

function databaseLimiter(): ChatRateLimiter {
  return { async check(key) {
    const now = Date.now();
    const windowStart = now - WINDOW_SECONDS * 1000;
    const namespacedKey = `chat:${key}`;
    const [entry] = await db.insert(rateLimit).values({
      id: randomUUID(),
      key: namespacedKey,
      count: 1,
      lastRequest: now,
    }).onConflictDoUpdate({
      target: rateLimit.key,
      set: {
        count: sql<number>`case when ${rateLimit.lastRequest} <= ${windowStart} then 1 else ${rateLimit.count} + 1 end`,
        lastRequest: sql<number>`case when ${rateLimit.lastRequest} <= ${windowStart} then ${now} else ${rateLimit.lastRequest} end`,
      },
    }).returning({ count: rateLimit.count, lastRequest: rateLimit.lastRequest });

    const resetAt = entry.lastRequest + WINDOW_SECONDS * 1000;
    return {
      allowed: entry.count <= LIMIT,
      retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1_000)),
    };
  } };
}

export function getChatRateLimiter(): ChatRateLimiter {
  const url = process.env.BOOKING_RATE_LIMIT_REST_URL?.trim();
  const token = process.env.BOOKING_RATE_LIMIT_REST_TOKEN?.trim();
  if (url && token) return sharedLimiter(url, token);
  if (process.env.NODE_ENV !== "production") return developmentLimiter();
  return databaseLimiter();
}

export function getChatClientKey(request: Request) {
  return getBookingClientKey(request);
}

export function resetDevelopmentChatRateLimiter() {
  developmentAttempts.clear();
}
