"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { canAccessAdminDashboard } from "@/lib/auth/access";
import { adminRequestFiltersSchema } from "@/features/requests/schemas";
import { customerDirectoryFiltersSchema } from "@/features/customers/schemas";
import { ADMIN_CUSTOMER_SEARCH_COOKIE, ADMIN_REQUEST_SEARCH_COOKIE, PRIVATE_SEARCH_MAX_AGE_SECONDS, sealPrivateSearch } from "./private-search";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !canAccessAdminDashboard(session)) redirect("/admin/login");
  return session;
}

async function saveSearch(name: string, userId: string, query: string | undefined) {
  const store = await cookies();
  if (!query) { store.delete(name); return; }
  store.set(name, sealPrivateSearch(userId, query), {
    httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production",
    path: "/admin", maxAge: PRIVATE_SEARCH_MAX_AGE_SECONDS,
  });
}

const text = (data: FormData, name: string) => String(data.get(name) ?? "");

export async function applyPrivateRequestSearch(data: FormData) {
  const session = await requireAdmin();
  const parsed = adminRequestFiltersSchema.safeParse({
    page: "1", period: text(data, "period") || undefined, dateField: text(data, "dateField") || undefined,
    scope: text(data, "scope") || undefined, status: text(data, "status") || undefined,
    priority: text(data, "priority") || undefined, service: text(data, "service") || undefined,
    search: text(data, "search") || undefined, sort: text(data, "sort") || undefined,
  });
  if (!parsed.success) redirect("/admin#request-list");
  await saveSearch(ADMIN_REQUEST_SEARCH_COOKIE, session.user.id, parsed.data.search);
  const query = new URLSearchParams({ bookingPage: "1", period: parsed.data.period, sort: parsed.data.sort });
  for (const name of ["dateField", "scope", "status", "priority", "service"] as const) {
    const value = parsed.data[name]; if (value) query.set(name, value);
  }
  redirect(`/admin?${query}#request-list`);
}

export async function clearPrivateRequestSearch() {
  await requireAdmin(); (await cookies()).delete(ADMIN_REQUEST_SEARCH_COOKIE); redirect("/admin#request-list");
}

export async function applyPrivateCustomerSearch(data: FormData) {
  const session = await requireAdmin();
  const parsed = customerDirectoryFiltersSchema.safeParse({ page: "1", search: text(data, "search") || undefined, verification: text(data, "verification") || undefined, sort: text(data, "sort") || undefined });
  if (!parsed.success) redirect("/admin/customers");
  await saveSearch(ADMIN_CUSTOMER_SEARCH_COOKIE, session.user.id, parsed.data.search);
  const query = new URLSearchParams({ page: "1", sort: parsed.data.sort });
  if (parsed.data.verification) query.set("verification", parsed.data.verification);
  redirect(`/admin/customers?${query}`);
}

export async function clearPrivateCustomerSearch() {
  await requireAdmin(); (await cookies()).delete(ADMIN_CUSTOMER_SEARCH_COOKIE); redirect("/admin/customers");
}
