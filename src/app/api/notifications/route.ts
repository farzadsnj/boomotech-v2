import { NextResponse } from "next/server";
import { InAppNotificationError, listInAppNotifications, markAllInAppNotificationsRead, markInAppNotificationRead } from "@/features/notifications/in-app";
import { notificationMutationSchema, notificationQuerySchema } from "@/features/notifications/schemas";
import { canAccessAdminDashboard, canAccessCustomerDashboard } from "@/lib/auth/access";
import { auth } from "@/lib/auth/auth";
import { recordSecurityEvent } from "@/lib/security/events";
import { readLimitedJson, RequestBodyError } from "@/lib/security/json-body";
import { hasApprovedMutationOrigin } from "@/lib/security/origin";

export const dynamic = "force-dynamic";

function actorFrom(session: Awaited<ReturnType<typeof auth.api.getSession>>) {
  if (!session?.user.id) return null;
  return { id: session.user.id, role: session.user.role, emailVerified: session.user.emailVerified, twoFactorEnabled: session.user.twoFactorEnabled };
}

function canUseNotifications(session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>) {
  return session.user.role === "admin" ? canAccessAdminDashboard(session) : canAccessCustomerDashboard(session);
}

function safeError(error: unknown) {
  if (error instanceof InAppNotificationError) {
    if (error.code === "not-found") return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    return NextResponse.json({ error: "Notification access denied." }, { status: 403 });
  }
  return NextResponse.json({ error: "Notifications are temporarily unavailable." }, { status: 500 });
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  const actor = actorFrom(session);
  if (!session || !actor) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!canUseNotifications(session)) return NextResponse.json({ error: "Verified account access required." }, { status: 403 });
  const url = new URL(request.url);
  const query = notificationQuerySchema.parse({ page: url.searchParams.get("page") ?? "1", limit: url.searchParams.get("limit") ?? "6" });
  try { return NextResponse.json(await listInAppNotifications(actor, query.page, query.limit)); }
  catch (error) { return safeError(error); }
}

export async function POST(request: Request) {
  if (!hasApprovedMutationOrigin(request)) {
    recordSecurityEvent("origin_rejected", { route: "/api/notifications" });
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const session = await auth.api.getSession({ headers: request.headers });
  const actor = actorFrom(session);
  if (!session || !actor) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!canUseNotifications(session)) return NextResponse.json({ error: "Verified account access required." }, { status: 403 });
  let input: unknown;
  try { input = await readLimitedJson(request, 2_000); }
  catch (error) { const status = error instanceof RequestBodyError ? error.status : 400; return NextResponse.json({ error: status === 413 ? "Request is too large." : status === 415 ? "Unsupported request content type." : "Invalid request." }, { status }); }
  const parsed = notificationMutationSchema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ error: "Invalid notification action." }, { status: 400 });
  try {
    const result = parsed.data.action === "read-all"
      ? await markAllInAppNotificationsRead(actor)
      : await markInAppNotificationRead(actor, parsed.data.id);
    return NextResponse.json({ ok: true, result });
  } catch (error) { return safeError(error); }
}
