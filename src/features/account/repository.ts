import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { canAccessAdminDashboard, canAccessCustomerDashboard } from "@/lib/auth/access";

export type AccountSettingsActor = {
  id: string;
  role?: string | null;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean | null;
};

export class AccountSettingsError extends Error {
  constructor(public readonly code: "forbidden" | "not-found") {
    super(code);
  }
}

function assertAccountAccess(actor: AccountSettingsActor) {
  const allowed = actor.role === "admin"
    ? canAccessAdminDashboard({ user: actor })
    : canAccessCustomerDashboard({ user: actor });
  if (!allowed) throw new AccountSettingsError("forbidden");
}

export async function updateOwnProfile(actor: AccountSettingsActor, name: string) {
  assertAccountAccess(actor);
  const [updated] = await db.update(user).set({ name, updatedAt: new Date() }).where(eq(user.id, actor.id)).returning({ id: user.id, name: user.name });
  if (!updated) throw new AccountSettingsError("not-found");
  return updated;
}
