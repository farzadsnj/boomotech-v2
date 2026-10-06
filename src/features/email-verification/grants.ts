import { createHash, randomUUID } from "node:crypto";
import { and, eq, gt, isNull, lt, or } from "drizzle-orm";
import { db } from "@/db";
import { emailVerificationGrant } from "@/db/schema";

export function verificationTtlMinutes() {
  const parsed = Number(process.env.EMAIL_VERIFICATION_TTL_MINUTES ?? "60");
  return Number.isFinite(parsed) ? Math.min(1440, Math.max(15, Math.round(parsed))) : 60;
}

export function verificationTokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function storeVerificationGrant(userId: string, token: string) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + verificationTtlMinutes() * 60_000);
  await db.transaction(async (transaction) => {
    await transaction.delete(emailVerificationGrant)
      .where(or(eq(emailVerificationGrant.userId, userId), lt(emailVerificationGrant.expiresAt, now)));
    await transaction.insert(emailVerificationGrant).values({
      id: randomUUID(), userId, tokenHash: verificationTokenHash(token), expiresAt,
    });
  });
  return expiresAt;
}

export async function consumeVerificationGrant(token: string) {
  const [grant] = await db.update(emailVerificationGrant).set({ usedAt: new Date() })
    .where(and(
      eq(emailVerificationGrant.tokenHash, verificationTokenHash(token)),
      isNull(emailVerificationGrant.usedAt),
      gt(emailVerificationGrant.expiresAt, new Date()),
    )).returning({ id: emailVerificationGrant.id, userId: emailVerificationGrant.userId });
  return grant ?? null;
}
