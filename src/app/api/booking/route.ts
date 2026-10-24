import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { bookingRequestSchema } from "@/features/booking/booking-schema";
import { getBookingClientKey, getBookingRateLimiter, RateLimitConfigurationError } from "@/features/booking/rate-limiter";
import { BookingSubmissionConflictError, storeBookingRequest } from "@/features/booking/repository";
import { recordSecurityEvent } from "@/lib/security/events";

const MAX_BODY_BYTES = 20_000;
const IDEMPOTENCY_RETENTION_MS = 24 * 60 * 60 * 1000;
class BodyTooLargeError extends Error {}

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function approvedOrigin(request: Request) {
  const configured = process.env.SITE_URL?.trim();
  if (configured && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configured)) return new URL(configured).origin;
  return new URL(request.url).origin;
}

async function readRequestBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel().catch(() => undefined);
        throw new BodyTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}

async function getAuthenticatedUserId(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  if (!/(?:^|;\s*)(?:__Secure-)?better-auth\.session_token=/.test(cookie)) return null;
  const { auth } = await import("@/lib/auth/auth");
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user.emailVerified && session.user.role !== "admin" ? session.user.id : null;
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== approvedOrigin(request)) {
    recordSecurityEvent("origin_rejected", { route: "/api/booking" });
    return NextResponse.json({ error: "This request did not come from the approved website." }, { status: 403 });
  }

  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") return NextResponse.json({ error: "Unsupported request content type." }, { status: 415 });

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) return NextResponse.json({ error: "Request is too large." }, { status: 413 });
  let raw = "";
  try { raw = await readRequestBody(request); } catch (error) {
    return NextResponse.json({ error: error instanceof BodyTooLargeError ? "Request is too large." : "Invalid request." }, { status: error instanceof BodyTooLargeError ? 413 : 400 });
  }

  let payload: unknown;
  try { payload = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (payload && typeof payload === "object" && "website" in payload && String((payload as { website?: unknown }).website ?? "")) return NextResponse.json({ ok: true });

  let clientKey = "";
  try {
    const limiter = getBookingRateLimiter();
    clientKey = getBookingClientKey(request);
    const result = await limiter.check(clientKey);
    if (!result.allowed) {
      recordSecurityEvent("rate_limit_hit", { route: "/api/booking" });
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } });
    }
  } catch (error) {
    if (error instanceof RateLimitConfigurationError) return NextResponse.json({ error: "Booking requests are temporarily unavailable. Please try again later." }, { status: 503 });
    return NextResponse.json({ error: "Booking requests are temporarily unavailable. Please try again later." }, { status: 503 });
  }

  const parsed = bookingRequestSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Please check the highlighted information.", issues: parsed.error.flatten().fieldErrors }, { status: 400 });

  const submissionKey = request.headers.get("idempotency-key")?.trim() ?? "";
  if (!/^[A-Za-z0-9_-]{20,128}$/.test(submissionKey)) {
    return NextResponse.json({ error: "This request needs a valid submission key. Please reload the form and try again." }, { status: 400 });
  }

  let stored: Awaited<ReturnType<typeof storeBookingRequest>>;
  try {
    const userId = await getAuthenticatedUserId(request);
    const canonicalPayload = JSON.stringify(parsed.data);
    stored = await storeBookingRequest(parsed.data, userId, {
      key: submissionKey,
      scopeHash: digest(userId ? `user:${userId}` : `anonymous:${clientKey}`),
      payloadHash: digest(canonicalPayload),
      expiresAt: new Date(Date.now() + IDEMPOTENCY_RETENTION_MS),
    });
  } catch (error) {
    if (error instanceof BookingSubmissionConflictError) {
      return NextResponse.json({ error: "This submission was already used with different information. Reload the form before sending a new request." }, { status: 409 });
    }
    return NextResponse.json({ error: "We could not save your request. Please try again later." }, { status: 503 });
  }

  return NextResponse.json({ ok: true, reference: stored.reference, replayed: stored.replayed }, { status: stored.replayed ? 200 : 201 });
}
