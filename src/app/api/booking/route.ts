import { NextResponse } from "next/server";
import { bookingRequestSchema } from "@/features/booking/booking-schema";
import { NotificationConfigurationError, sendBookingNotification } from "@/features/booking/notification";

const attempts = new Map<string, number[]>();
const WINDOW = 10 * 60 * 1000;

export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 20_000) return NextResponse.json({ error: "Request is too large." }, { status: 413 });
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  const recent = (attempts.get(forwarded) ?? []).filter((time) => now - time < WINDOW);
  if (recent.length >= 5) return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  attempts.set(forwarded, [...recent, now]);

  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (payload && typeof payload === "object" && "website" in payload && String((payload as { website?: unknown }).website ?? "")) {
    return NextResponse.json({ ok: true });
  }
  const parsed = bookingRequestSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Please check the highlighted information.", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  try {
    await sendBookingNotification(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof NotificationConfigurationError ? 503 : 502;
    return NextResponse.json({ error: "We could not deliver your request. Please try again later or use the contact guidance on our website." }, { status });
  }
}
