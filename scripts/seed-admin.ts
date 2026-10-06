import nextEnv from "@next/env";
import { and, eq, or } from "drizzle-orm";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

const username = process.env.ADMIN_USERNAME?.trim().toLocaleLowerCase("en-AU");
const email = process.env.ADMIN_EMAIL?.trim().toLocaleLowerCase("en-AU");
const password = process.env.ADMIN_TEMP_PASSWORD;

if (!username || !email || !password) {
  console.error("Set ADMIN_USERNAME, ADMIN_EMAIL and ADMIN_TEMP_PASSWORD in the protected bootstrap environment before running this command.");
  process.exit(1);
}
if (username !== "farzadsnj") {
  console.error("ADMIN_USERNAME must match the approved initial administrator username.");
  process.exit(1);
}
if (password.length < 16 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
  console.error("ADMIN_TEMP_PASSWORD must contain at least 16 characters with uppercase and lowercase letters and a number. Replace it before public deployment.");
  process.exit(1);
}

const [{ db, closeDatabase }, schema, { hashPassword }] = await Promise.all([
  import("../src/db/index"),
  import("../src/db/schema"),
  import("../src/lib/auth/password"),
]);

const passwordHash = await hashPassword(password);
await db.transaction(async (tx) => {
  const matches = await tx.select({ id: schema.user.id }).from(schema.user)
    .where(or(eq(schema.user.username, username), eq(schema.user.email, email)));
  if (new Set(matches.map(({ id }) => id)).size > 1) throw new Error("The configured administrator identity conflicts with existing accounts.");
  const [existing] = matches;
  const userId = existing?.id ?? crypto.randomUUID();
  if (existing) {
    await tx.update(schema.user).set({ name: "BoomoTech Administrator", email, username, displayUsername: username, role: "admin", banned: false, updatedAt: new Date() }).where(eq(schema.user.id, userId));
  } else {
    await tx.insert(schema.user).values({ id: userId, name: "BoomoTech Administrator", email, username, displayUsername: username, role: "admin", emailVerified: true });
  }
  const [credential] = await tx.select({ id: schema.account.id }).from(schema.account)
    .where(and(eq(schema.account.userId, userId), eq(schema.account.providerId, "credential"))).limit(1);
  if (credential) {
    await tx.update(schema.account).set({ password: passwordHash, updatedAt: new Date() }).where(eq(schema.account.id, credential.id));
  } else {
    await tx.insert(schema.account).values({ id: crypto.randomUUID(), accountId: userId, providerId: "credential", userId, password: passwordHash });
  }
  await tx.delete(schema.session).where(eq(schema.session.userId, userId));
});

await closeDatabase();
console.log("Administrator account created or updated. Remove ADMIN_TEMP_PASSWORD from the environment now.");
