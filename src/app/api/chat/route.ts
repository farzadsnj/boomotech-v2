import { NextResponse } from "next/server";
import { chatRequestSchema } from "@/features/chat/chat-schema";
import { ChatConfigurationError, ChatProviderError, generateChatResponse } from "@/features/chat/openai";
import { getChatClientKey, getChatRateLimiter, RateLimitConfigurationError } from "@/features/chat/rate-limiter";
import { isAiChatEnabled } from "@/lib/config/features";

const MAX_BODY_BYTES = 16_000;
class BodyTooLargeError extends Error {}

function approvedOrigin(request: Request) {
  const configured = process.env.SITE_URL?.trim();
  if (configured && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configured)) {
    try { return new URL(configured).origin; } catch { return ""; }
  }
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
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export async function POST(request: Request) {
  if (!isAiChatEnabled()) return NextResponse.json({ error: "AI chat is currently unavailable. Browse services or request a consultation." }, { status: 503 });
  const origin = request.headers.get("origin");
  if (!origin || origin !== approvedOrigin(request)) {
    return NextResponse.json({ error: "This request did not come from the approved website." }, { status: 403 });
  }

  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    return NextResponse.json({ error: "Unsupported request content type." }, { status: 415 });
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request is too large." }, { status: 413 });
  }

  let raw = "";
  try {
    raw = await readRequestBody(request);
  } catch (error) {
    const tooLarge = error instanceof BodyTooLargeError;
    return NextResponse.json({ error: tooLarge ? "Request is too large." : "Invalid request." }, { status: tooLarge ? 413 : 400 });
  }

  let payload: unknown;
  try { payload = JSON.parse(raw); } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = chatRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your message and try again." }, { status: 400 });
  }

  try {
    const result = await getChatRateLimiter().check(getChatClientKey(request));
    if (!result.allowed) {
      return NextResponse.json(
        { error: "Too many chat requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } },
      );
    }
  } catch (error) {
    if (error instanceof RateLimitConfigurationError) {
      return NextResponse.json({ error: "Chat is temporarily unavailable. Please try again later." }, { status: 503 });
    }
    return NextResponse.json({ error: "Chat is temporarily unavailable. Please try again later." }, { status: 503 });
  }

  try {
    const message = await generateChatResponse(parsed.data);
    return NextResponse.json({ ok: true, message });
  } catch (error) {
    const status = error instanceof ChatConfigurationError ? 503 : error instanceof ChatProviderError ? 502 : 500;
    return NextResponse.json({ error: "Chat is temporarily unavailable. Please try again later." }, { status });
  }
}
