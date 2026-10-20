import { NextResponse } from "next/server";
import { createOperationalSummaryCsv } from "@/features/analytics/csv";
import { AdminAnalyticsError, getAdminAnalytics } from "@/features/analytics/repository";
import { analyticsPeriodSchema } from "@/features/analytics/range";
import { auth } from "@/lib/auth/auth";
import { canAccessAdminDashboard } from "@/lib/auth/access";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!canAccessAdminDashboard(session)) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });

  const periodResult = analyticsPeriodSchema.safeParse(new URL(request.url).searchParams.get("period") ?? "30d");
  if (!periodResult.success) return NextResponse.json({ error: "Select a valid reporting period." }, { status: 400 });

  try {
    const data = await getAdminAnalytics({ id: session.user.id, role: session.user.role, twoFactorEnabled: session.user.twoFactorEnabled }, periodResult.data);
    const date = new Date().toISOString().slice(0, 10);
    return new Response(`\uFEFF${createOperationalSummaryCsv(data)}`, {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Disposition": `attachment; filename="boomotech-operational-summary-${periodResult.data}-${date}.csv"`,
        "Content-Type": "text/csv; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof AdminAnalyticsError) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
    return NextResponse.json({ error: "The report could not be generated." }, { status: 500 });
  }
}
