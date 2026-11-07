import { and, eq, or } from "drizzle-orm";
import { account, user } from "@/db/schema";
import { hashPassword } from "./password";

type ApplicationDatabase = typeof import("@/db").db;

export type AdministratorBootstrapInput = {
  username: string;
  email: string;
  password?: string;
};

export type AdministratorBootstrapResult =
  | { status: "created"; userId: string }
  | { status: "unnecessary"; userId: string };

export class AdministratorBootstrapConflictError extends Error {
  name = "AdministratorBootstrapConflictError";
}

export class AdministratorBootstrapPasswordError extends Error {
  name = "AdministratorBootstrapPasswordError";
}

export async function bootstrapInitialAdministrator(database: ApplicationDatabase, input: AdministratorBootstrapInput): Promise<AdministratorBootstrapResult> {
  return database.transaction(async (transaction) => {
    const matches = await transaction.select({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
    }).from(user).where(or(eq(user.username, input.username), eq(user.email, input.email)));

    if (new Set(matches.map(({ id }) => id)).size > 1) {
      throw new AdministratorBootstrapConflictError("The configured administrator identity conflicts with existing accounts.");
    }

    const [existing] = matches;
    if (existing) {
      const exactIdentity = existing.username === input.username && existing.email === input.email;
      if (!exactIdentity || existing.role !== "admin" || existing.emailVerified !== true) {
        throw new AdministratorBootstrapConflictError("An existing account conflicts with the approved administrator identity. Review it without changing credentials.");
      }
      const credentials = await transaction.select({ id: account.id }).from(account)
        .where(and(eq(account.userId, existing.id), eq(account.providerId, "credential"))).limit(2);
      if (credentials.length !== 1) {
        throw new AdministratorBootstrapConflictError("The existing administrator credential relationship requires manual review.");
      }
      return { status: "unnecessary", userId: existing.id };
    }

    const userId = crypto.randomUUID();
    if (!input.password) throw new AdministratorBootstrapPasswordError("ADMIN_TEMP_PASSWORD is required only when creating the initial administrator.");
    const passwordHash = await hashPassword(input.password);
    await transaction.insert(user).values({
      id: userId,
      name: "BoomoTech Administrator",
      email: input.email,
      username: input.username,
      displayUsername: input.username,
      role: "admin",
      emailVerified: true,
    });
    await transaction.insert(account).values({
      id: crypto.randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: passwordHash,
    });
    return { status: "created", userId };
  });
}
