import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { requireBetterAuthSecret } from "@/lib/auth/auth-env";

export const ADMIN_REQUEST_SEARCH_COOKIE = "boomotech-admin-request-search";
export const ADMIN_CUSTOMER_SEARCH_COOKIE = "boomotech-admin-customer-search";
export const PRIVATE_SEARCH_MAX_AGE_SECONDS = 15 * 60;

type SearchEnvelope = { userId: string; query: string; expiresAt: number };

function key() {
  return createHash("sha256").update(`${requireBetterAuthSecret()}|admin-private-search-v1`).digest();
}

export function sealPrivateSearch(userId: string, query: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.from(JSON.stringify({ userId, query, expiresAt: Date.now() + PRIVATE_SEARCH_MAX_AGE_SECONDS * 1000 } satisfies SearchEnvelope));
  const encrypted = Buffer.concat([cipher.update(body), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}

export function openPrivateSearch(value: string | undefined, userId: string) {
  if (!value) return undefined;
  try {
    const packed = Buffer.from(value, "base64url");
    if (packed.length < 29) return undefined;
    const decipher = createDecipheriv("aes-256-gcm", key(), packed.subarray(0, 12));
    decipher.setAuthTag(packed.subarray(12, 28));
    const envelope = JSON.parse(Buffer.concat([decipher.update(packed.subarray(28)), decipher.final()]).toString("utf8")) as SearchEnvelope;
    if (envelope.userId !== userId || envelope.expiresAt <= Date.now() || typeof envelope.query !== "string" || envelope.query.length > 100) return undefined;
    return envelope.query;
  } catch { return undefined; }
}
