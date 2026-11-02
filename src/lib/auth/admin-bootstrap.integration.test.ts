import { randomUUID } from "node:crypto";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it, vi } from "vitest";

const databasePath = path.resolve(process.cwd(), ".test-db", `admin-bootstrap-${randomUUID()}`);
const originalPassword = "BootstrapAdministrator99";
const replacementPassword = "ReplacementMustNotApply99";
const secret = "bootstrap-test-secret-with-more-than-thirty-two-characters";
let closeDatabase: (() => Promise<void>) | undefined;

function decodeBase32(value: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const character of value.toUpperCase()) bits += alphabet.indexOf(character).toString(2).padStart(5, "0");
  return new TextDecoder().decode(Uint8Array.from(Array.from({ length: Math.floor(bits.length / 8) }, (_, index) => Number.parseInt(bits.slice(index * 8, index * 8 + 8), 2))));
}

function responseCookie(response: Response, fragment: string) {
  const value = response.headers.getSetCookie().find((cookie) => cookie.includes(fragment));
  if (!value) throw new Error(`Expected ${fragment} cookie was not created.`);
  return value.split(";", 1)[0];
}

async function call(auth: (typeof import("./auth"))["auth"], pathname: string, body?: unknown, cookie?: string) {
  return auth.handler(new Request(`http://localhost:3000/api/auth${pathname}`, {
    method: body ? "POST" : "GET",
    headers: { ...(body ? { "content-type": "application/json", origin: "http://localhost:3000" } : {}), ...(cookie ? { cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  }));
}

afterAll(async () => {
  await closeDatabase?.().catch(() => undefined);
  delete process.env.AUTH_E2E_DATABASE_PATH;
  delete process.env.BETTER_AUTH_SECRET;
  delete process.env.BETTER_AUTH_URL;
  delete process.env.AUTH_EMAIL_CAPTURE_MODE;
  await rm(databasePath, { recursive: true, force: true });
});

describe("create-only administrator bootstrap", () => {
  it("preserves password, MFA and sessions across repeated bootstrap, migrations and a process-style reload", async () => {
    await rm(databasePath, { recursive: true, force: true });
    await mkdir(path.dirname(databasePath), { recursive: true });
    const migrationClient = new PGlite(databasePath);
    const migrationDatabase = drizzlePglite(migrationClient);
    await migrate(migrationDatabase, { migrationsFolder: path.resolve(process.cwd(), "drizzle") });
    await migrate(migrationDatabase, { migrationsFolder: path.resolve(process.cwd(), "drizzle") });
    await migrationClient.close();

    process.env.AUTH_E2E_DATABASE_PATH = databasePath;
    process.env.BETTER_AUTH_SECRET = secret;
    process.env.BETTER_AUTH_URL = "http://localhost:3000";
    process.env.AUTH_EMAIL_CAPTURE_MODE = "test";

    let databaseModule = await import("@/db");
    const schema = await import("@/db/schema");
    let authModule = await import("./auth");
    const { bootstrapInitialAdministrator } = await import("./admin-bootstrap");
    closeDatabase = databaseModule.closeDatabase;
    const identity = { username: "farzadsnj", email: "admin-bootstrap@example.test" };
    expect(await bootstrapInitialAdministrator(databaseModule.db, { ...identity, password: originalPassword })).toMatchObject({ status: "created" });

    const login = await call(authModule.auth, "/sign-in/username", { username: identity.username, password: originalPassword });
    expect(login.status).toBe(200);
    const loginCookie = responseCookie(login, "session_token");
    const enabled = await call(authModule.auth, "/two-factor/enable", { password: originalPassword, method: "totp", issuer: "BoomoTech" }, loginCookie);
    expect(enabled.status).toBe(200);
    const enrolment = await enabled.json() as { totpURI: string };
    const encodedSecret = new URL(enrolment.totpURI).searchParams.get("secret");
    expect(encodedSecret).toBeTruthy();
    const rawSecret = decodeBase32(encodedSecret!);
    const verificationCode = await authModule.auth.api.generateTOTP({ body: { secret: rawSecret } });
    const verified = await call(authModule.auth, "/two-factor/verify-totp", { code: verificationCode.code, trustDevice: false }, loginCookie);
    expect(verified.status).toBe(200);

    const [administrator] = await databaseModule.db.select().from(schema.user).where(eq(schema.user.username, identity.username));
    const [credentialBefore] = await databaseModule.db.select().from(schema.account).where(eq(schema.account.userId, administrator.id));
    const [factorBefore] = await databaseModule.db.select().from(schema.twoFactor).where(eq(schema.twoFactor.userId, administrator.id));
    const sessionsBefore = await databaseModule.db.select({ id: schema.session.id }).from(schema.session).where(eq(schema.session.userId, administrator.id));
    expect(administrator).toMatchObject({ role: "admin", emailVerified: true, twoFactorEnabled: true });
    expect(factorBefore).toBeTruthy();
    expect(sessionsBefore.length).toBeGreaterThan(0);

    expect(await bootstrapInitialAdministrator(databaseModule.db, identity)).toMatchObject({ status: "unnecessary", userId: administrator.id });
    expect(await bootstrapInitialAdministrator(databaseModule.db, { ...identity, password: replacementPassword })).toMatchObject({ status: "unnecessary", userId: administrator.id });
    await expect(bootstrapInitialAdministrator(databaseModule.db, { username: identity.username, email: "conflict@example.test", password: replacementPassword })).rejects.toMatchObject({ name: "AdministratorBootstrapConflictError" });
    const [credentialAfter] = await databaseModule.db.select().from(schema.account).where(eq(schema.account.userId, administrator.id));
    const [factorAfter] = await databaseModule.db.select().from(schema.twoFactor).where(eq(schema.twoFactor.userId, administrator.id));
    const sessionsAfter = await databaseModule.db.select({ id: schema.session.id }).from(schema.session).where(eq(schema.session.userId, administrator.id));
    expect(credentialAfter.password).toBe(credentialBefore.password);
    expect(factorAfter).toEqual(factorBefore);
    expect(sessionsAfter).toEqual(sessionsBefore);
    expect((await call(authModule.auth, "/sign-in/username", { username: identity.username, password: replacementPassword })).status).toBe(401);
    expect((await call(authModule.auth, "/sign-in/username", { username: identity.username, password: originalPassword })).status).toBe(200);

    await closeDatabase();
    closeDatabase = undefined;
    const globals = globalThis as typeof globalThis & { boomotechDb?: unknown; boomotechClose?: unknown; boomotechSql?: unknown };
    delete globals.boomotechDb; delete globals.boomotechClose; delete globals.boomotechSql;
    vi.resetModules();
    databaseModule = await import("@/db");
    authModule = await import("./auth");
    closeDatabase = databaseModule.closeDatabase;
    const restartedLogin = await call(authModule.auth, "/sign-in/username", { username: identity.username, password: originalPassword });
    expect(restartedLogin.status).toBe(200);
    expect(await restartedLogin.clone().json()).toMatchObject({ twoFactorRedirect: true });
    const challenge = responseCookie(restartedLogin, "two_factor");
    const restartedCode = await authModule.auth.api.generateTOTP({ body: { secret: rawSecret } });
    expect((await call(authModule.auth, "/two-factor/verify-totp", { code: restartedCode.code, trustDevice: false }, challenge)).status).toBe(200);
  }, 120_000);
});
