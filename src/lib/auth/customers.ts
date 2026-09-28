import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";

export const CUSTOMER_PAGE_SIZE = 25;

export async function listCustomers(page: number) {
  const [{ total }] = await db.select({ total: count() }).from(user).where(eq(user.role, "user"));
  const records = await db.select({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt })
    .from(user).where(eq(user.role, "user")).orderBy(asc(user.createdAt)).limit(CUSTOMER_PAGE_SIZE).offset((page - 1) * CUSTOMER_PAGE_SIZE);
  return { records, total, totalPages: Math.max(1, Math.ceil(total / CUSTOMER_PAGE_SIZE)) };
}
