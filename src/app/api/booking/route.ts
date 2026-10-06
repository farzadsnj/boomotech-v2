import { NextResponse } from "next/server";
import { bookingRequestSchema } from "@/features/booking/booking-schema";
import { NotificationConfigurationError, sendBookingNotification } from "@/features/booking/notification";
import { getBookingClientKey, getBookingRateLimiter, RateLimitConfigurationError } from "@/features/booking/rate-limiter";
import { recordBookingNotification, storeBookingRequest } from "@/features/booking/repository";

const MAX_BODY_BYTES = 20_000;
class BodyTooLargeError extends Error {}

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
  if (!origin || origin !== approvedOrigin(request)) return NextResponse.json({ error: "This request did not come from the approved website." }, { status: 403 });

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

  try {
    const limiter = getBookingRateLimiter();
    const result = await limiter.check(getBookingClientKey(request));
    if (!result.allowed) return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } });
  } catch (error) {
    if (error instanceof RateLimitConfigurationError) return NextResponse.json({ error: "Booking requests are temporarily unavailable. Please try again later." }, { status: 503 });
    return NextResponse.json({ error: "Booking requests are temporarily unavailable. Please try again later." }, { status: 503 });
  }

  const parsed = bookingRequestSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Please check the highlighted information.", issues: parsed.error.flatten().fieldErrors }, { status: 400 });

  let stored: Awaited<ReturnType<typeof storeBookingRequest>>;
  try {
    stored = await storeBookingRequest(parsed.data, await getAuthenticatedUserId(request));
  } catch {
    return NextResponse.json({ error: "We could not save your request. Please try again later." }, { status: 503 });
  }

  try {
    await sendBookingNotification(parsed.data);
    await recordBookingNotification(stored.id, stored.outboxId, "sent");
  } catch (error) {
    await recordBookingNotification(
      stored.id,
      stored.outboxId,
      "failed",
      error instanceof NotificationConfigurationError ? "configuration" : "delivery",
    ).catch(() => undefined);
  }

  return NextResponse.json({ ok: true, reference: stored.reference }, { status: 201 });
}
