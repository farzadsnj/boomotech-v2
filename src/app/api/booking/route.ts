import { NextResponse } from "next/server";
import { bookingRequestSchema } from "@/features/booking/booking-schema";
import { NotificationConfigurationError, sendBookingNotification } from "@/features/booking/notification";
import { getBookingClientKey, getBookingRateLimiter, RateLimitConfigurationError } from "@/features/booking/rate-limiter";

const MAX_BODY_BYTES = 20_000;

function approvedOrigin(request: Request) {
  const configured = process.env.SITE_URL?.trim();
  if (configured && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configured)) return new URL(configured).origin;
  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== approvedOrigin(request)) return NextResponse.json({ error: "This request did not come from the approved website." }, { status: 403 });

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) return NextResponse.json({ error: "Request is too large." }, { status: 413 });
  let raw = "";
  try { raw = await request.text(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return NextResponse.json({ error: "Request is too large." }, { status: 413 });

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
  try {
    await sendBookingNotification(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof NotificationConfigurationError ? 503 : 502;
    return NextResponse.json({ error: "We could not deliver your request. Your information has not been stored. Please try again later." }, { status });
  }
}
