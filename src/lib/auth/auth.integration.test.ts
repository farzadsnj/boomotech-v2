import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

let auth: (typeof import("./auth"))["auth"];
let closeDatabase: (typeof import("@/db"))["closeDatabase"];
let db: (typeof import("@/db"))["db"];
let account: (typeof import("@/db/schema"))["account"];
let verification: (typeof import("@/db/schema"))["verification"];
let userTable: (typeof import("@/db/schema"))["user"];
let authLoginGuard: (typeof import("@/db/schema"))["authLoginGuard"];
let rateLimitTable: (typeof import("@/db/schema"))["rateLimit"];
let listCustomers: (typeof import("./customers"))["listCustomers"];
let testDirectory = "";
let capturePath = "";
let verificationToken = "";

async function call(pathname: string, body?: unknown, cookie?: string) {
  return auth.handler(new Request(`http://localhost:3000/api/auth${pathname}`, {
    method: body ? "POST" : "GET",
    headers: {
      ...(body ? { "content-type": "application/json", origin: "http://localhost:3000" } : {}),
      ...(cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  }));
}

function sessionCookie(response: Response) {
  const cookies = response.headers.getSetCookie();
  const session = cookies.find((value) => value.includes("session_token"));
  if (!session) throw new Error("Session cookie missing from auth response.");
  return session.split(";", 1)[0];
}

function responseCookie(response: Response, fragment: string) {
  const value = response.headers.getSetCookie().find((cookie) => cookie.includes(fragment));
  if (!value) throw new Error(`Cookie containing ${fragment} is missing from auth response.`);
  return value.split(";", 1)[0];
}

function decodeBase32(value: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const character of value.toUpperCase()) bits += alphabet.indexOf(character).toString(2).padStart(5, "0");
  const bytes = Array.from({ length: Math.floor(bits.length / 8) }, (_, index) => Number.parseInt(bits.slice(index * 8, index * 8 + 8), 2));
  return new TextDecoder().decode(Uint8Array.from(bytes));
}

beforeAll(async () => {
  testDirectory = await mkdtemp(path.join(tmpdir(), "boomotech-auth-"));
  capturePath = path.resolve(process.cwd(), ".test-db", `auth-verification-${Date.now()}.jsonl`);
  await rm(capturePath, { force: true });
  const databasePath = path.join(testDirectory, "database");
  const client = new PGlite(databasePath);
  const migrationDirectory = path.resolve(process.cwd(), "drizzle");
  for (const name of (await readdir(migrationDirectory)).filter((value) => value.endsWith(".sql")).sort()) {
    const migration = await readFile(path.join(migrationDirectory, name), "utf8");
    for (const statement of migration.split("--> statement-breakpoint").map((value) => value.trim()).filter(Boolean)) await client.exec(statement);
  }
  await client.close();
  process.env.AUTH_E2E_DATABASE_PATH = databasePath;
  process.env.BETTER_AUTH_SECRET = "unit-test-secret-with-more-than-thirty-two-characters";
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
  process.env.AUTH_EMAIL_CAPTURE_PATH = capturePath;
  process.env.AUTH_EMAIL_CAPTURE_MODE = "test";
  ({ auth } = await import("./auth"));
  ({ db, closeDatabase } = await import("@/db"));
  ({ account, verification, user: userTable, authLoginGuard, rateLimit: rateLimitTable } = await import("@/db/schema"));
  ({ listCustomers } = await import("./customers"));
});

afterAll(async () => {
  await closeDatabase?.();
  delete process.env.AUTH_E2E_DATABASE_PATH;
  delete process.env.AUTH_EMAIL_CAPTURE_PATH;
  delete process.env.AUTH_EMAIL_CAPTURE_MODE;
  await rm(capturePath, { force: true });
  await rm(testDirectory, { recursive: true, force: true });
});

describe("database-backed account authentication", () => {
  it("creates one normalized unverified account, captures email and gives a generic duplicate response", async () => {
    const body = { name: "Taylor Morgan", email: "TAYLOR@Example.com", password: "SecurePassword9", callbackURL: "/dashboard?verified=true" };
    const first = await call("/sign-up/email", body);
    expect(first.status).toBe(200);
    const duplicate = await call("/sign-up/email", body);
    expect(duplicate.status).toBe(200);
    const capture = JSON.parse((await readFile(process.env.AUTH_EMAIL_CAPTURE_PATH!, "utf8")).trim().split("\n")[0]) as { verificationUrl: string };
    verificationToken = new URL(capture.verificationUrl).searchParams.get("token") ?? "";
    expect(verificationToken.length).toBeGreaterThan(20);
  });

  it("stores an Argon2id password hash", async () => {
    const records = await db.select({ password: account.password }).from(account);
    const encoded = records[0]?.password ?? "";
    const parameters = Object.fromEntries((encoded.split("$")[3] ?? "").split(",").map((part) => part.split("=")));
    expect({ algorithm: encoded.startsWith("$argon2id$"), memory: Number(parameters.m), iterations: Number(parameters.t), parallelism: Number(parameters.p), containsPlaintext: encoded.includes("SecurePassword9") })
      .toEqual({ algorithm: true, memory: 65_536, iterations: 3, parallelism: 1, containsPlaintext: false });
  });

  it("does not distinguish an unknown account from a wrong password", async () => {
    const existing = await call("/sign-in/email", { email: "taylor@example.com", password: "IncorrectPassword9" });
    const unknown = await call("/sign-in/email", { email: "unknown@example.test", password: "IncorrectPassword9" });
    expect(unknown.status).toBe(existing.status);
    expect(await unknown.json()).toEqual(await existing.json());
  });

  it("blocks login until the one-time token verifies the email", async () => {
    const incorrect = await call("/sign-in/email", { email: "taylor@example.com", password: "IncorrectPassword9" });
    expect(incorrect.ok).toBe(false);
    const unverified = await call("/sign-in/email", { email: "taylor@example.com", password: "SecurePassword9" });
    expect(unverified.status).toBe(403);
    const { consumeVerificationGrant } = await import("@/features/email-verification/grants");
    expect(await consumeVerificationGrant(verificationToken)).not.toBeNull();
    const verified = await call(`/verify-email?token=${encodeURIComponent(verificationToken)}`);
    expect(verified.status).toBe(200);
    expect(await consumeVerificationGrant(verificationToken)).toBeNull();
    const correct = await call("/sign-in/email", { email: "taylor@example.com", password: "SecurePassword9" });
    expect(correct.status).toBe(200);
    expect(sessionCookie(correct)).toContain("session_token");
  });

  it("returns only safe customer-list fields", async () => {
    const result = await listCustomers(1);
    expect(result.total).toBe(1);
    expect(result.records[0]).toMatchObject({ name: "Taylor Morgan", email: "taylor@example.com" });
    expect(result.records[0]).not.toHaveProperty("password");
    expect(result.records[0]).not.toHaveProperty("role");
  });

  it("rejects invalid and expired one-time verification grants", async () => {
    const { consumeVerificationGrant, storeVerificationGrant, verificationTokenHash } = await import("@/features/email-verification/grants");
    const { emailVerificationGrant } = await import("@/db/schema");
    const customer = (await listCustomers(1)).records[0];
    expect(await consumeVerificationGrant("invalid-token")).toBeNull();
    await storeVerificationGrant(customer.id, "expired-token");
    await db.update(emailVerificationGrant).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(emailVerificationGrant.tokenHash, verificationTokenHash("expired-token")));
    expect(await consumeVerificationGrant("expired-token")).toBeNull();
  });

  it("invalidates the server session on sign-out", async () => {
    const login = await call("/sign-in/email", { email: "taylor@example.com", password: "SecurePassword9" });
    const cookie = sessionCookie(login);
    const before = await call("/get-session", undefined, cookie);
    expect(await before.json()).not.toBeNull();
    const signOut = await call("/sign-out", {}, cookie);
    expect(signOut.status).toBe(200);
    const after = await call("/get-session", undefined, cookie);
    expect(await after.json()).toBeNull();
  });

  it("rotates session material on sign-in and revokes every device session", async () => {
    const fixedCookie = "better-auth.session_token=synthetic-fixed-session";
    const firstLogin = await call("/sign-in/email", { email: "taylor@example.com", password: "SecurePassword9" }, fixedCookie);
    const firstCookie = sessionCookie(firstLogin);
    const secondLogin = await call("/sign-in/email", { email: "taylor@example.com", password: "SecurePassword9" });
    const secondCookie = sessionCookie(secondLogin);
    expect(firstCookie).not.toBe(fixedCookie);
    expect(secondCookie).not.toBe(firstCookie);
    expect((await call("/revoke-sessions", {}, firstCookie)).status).toBe(200);
    expect(await (await call("/get-session", undefined, firstCookie)).json()).toBeNull();
    expect(await (await call("/get-session", undefined, secondCookie)).json()).toBeNull();
  });

  it("rate limits repeated login attempts in shared database storage", async () => {
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 12; attempt += 1) {
      statuses.push((await call("/sign-in/username", { username: "unknown-admin", password: "IncorrectPassword9" })).status);
    }
    expect(statuses).toContain(429);
  });

  it("uses a generic verification resend response and rate limits repeated attempts", async () => {
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await call("/send-verification-email", { email: "unknown@example.test", callbackURL: "/dashboard?verified=true" });
      statuses.push(response.status);
      if (response.status === 200) expect(await response.json()).toEqual({ status: true });
    }
    expect(statuses.slice(0, 3)).toEqual([200, 200, 200]);
    expect(statuses[3]).toBe(429);
  });

  it("uses a generic password-reset response and changes the password with a single-use token", async () => {
    const requested = await call("/request-password-reset", { email: "taylor@example.com", redirectTo: "/reset-password" });
    expect(requested.status).toBe(200);
    expect(await requested.json()).toMatchObject({ status: true });
    const captures = (await readFile(capturePath, "utf8")).trim().split("\n").map((line) => JSON.parse(line) as { kind?: string; resetUrl?: string });
    const captured = captures.findLast(({ kind }) => kind === "password-reset");
    expect(captured?.resetUrl).toBeTruthy();
    const resetUrl = new URL(captured!.resetUrl!);
    const callback = await call(`${resetUrl.pathname.replace("/api/auth", "")}${resetUrl.search}`);
    expect(callback.status).toBe(302);
    const resetToken = new URL(callback.headers.get("location")!, "http://localhost:3000").searchParams.get("token");
    expect(resetToken).toBeTruthy();
    const changed = await call("/reset-password", { newPassword: "ReplacementPassword8", token: resetToken });
    expect(changed.status).toBe(200);
    expect((await call("/reset-password", { newPassword: "AnotherPassword8", token: resetToken })).status).toBe(400);
    expect((await call("/sign-in/email", { email: "taylor@example.com", password: "SecurePassword9" })).ok).toBe(false);
    expect((await call("/sign-in/email", { email: "taylor@example.com", password: "ReplacementPassword8" })).status).toBe(200);
  });

  it("fails expired and invalid password-reset links safely without account enumeration", async () => {
    const unknown = await call("/request-password-reset", { email: "unknown-reset@example.test", redirectTo: "/reset-password" });
    expect(unknown.status).toBe(200);
    expect(await unknown.json()).toMatchObject({ status: true });
    await call("/request-password-reset", { email: "taylor@example.com", redirectTo: "/reset-password" });
    const captures = (await readFile(capturePath, "utf8")).trim().split("\n").map((line) => JSON.parse(line) as { kind?: string; resetUrl?: string });
    const resetUrl = new URL(captures.findLast(({ kind }) => kind === "password-reset")!.resetUrl!);
    await db.update(verification).set({ expiresAt: new Date(Date.now() - 1000) });
    const expired = await call(`${resetUrl.pathname.replace("/api/auth", "")}${resetUrl.search}`);
    expect(expired.status).toBe(302);
    expect(expired.headers.get("location")).toContain("error=INVALID_TOKEN");
    expect((await call("/reset-password", { newPassword: "ReplacementPassword8", token: "invalid-token" })).status).toBe(400);
  });

  it("locks an account after five password failures, expires safely and resets on success", async () => {
    await db.delete(authLoginGuard);
    await db.delete(rateLimitTable);
    const { hashPassword } = await import("./password");
    const id = "lockout-customer";
    await db.insert(userTable).values({ id, name: "Lockout Customer", email: "lockout@example.test", emailVerified: true });
    await db.insert(account).values({ id: "lockout-account", accountId: id, providerId: "credential", userId: id, password: await hashPassword("CorrectPassword99") });
    let fifth: Response | undefined;
    for (let attempt = 0; attempt < 5; attempt += 1) fifth = await call("/sign-in/email", { email: "lockout@example.test", password: "IncorrectPassword99" });
    const locked = await call("/sign-in/email", { email: "lockout@example.test", password: "CorrectPassword99" });
    expect(locked.status).toBe(401);
    expect(await locked.json()).toEqual(await fifth!.json());
    const [guard] = await db.select().from(authLoginGuard);
    expect(guard.failedAttempts).toBe(5);
    expect(guard.lockedUntil?.getTime()).toBeGreaterThan(Date.now());
    await db.update(authLoginGuard).set({ lockedUntil: new Date(Date.now() - 1_000), windowStartedAt: new Date(Date.now() - 31 * 60_000) });
    const succeeded = await call("/sign-in/email", { email: "lockout@example.test", password: "CorrectPassword99" });
    expect(succeeded.status).toBe(200);
    expect(await db.select().from(authLoginGuard)).toHaveLength(0);
  });

  it("records concurrent password failures atomically", async () => {
    await db.delete(authLoginGuard);
    await db.delete(rateLimitTable);
    const { hashPassword } = await import("./password");
    const id = "concurrent-lockout-customer";
    await db.insert(userTable).values({ id, name: "Concurrent Customer", email: "concurrent@example.test", emailVerified: true });
    await db.insert(account).values({ id: "concurrent-account", accountId: id, providerId: "credential", userId: id, password: await hashPassword("CorrectPassword88") });
    await Promise.all(Array.from({ length: 5 }, () => call("/sign-in/email", { email: "concurrent@example.test", password: "IncorrectPassword88" })));
    const guards = await db.select().from(authLoginGuard);
    expect(guards.find((guard) => guard.failedAttempts === 5)?.lockedUntil?.getTime()).toBeGreaterThan(Date.now());
    expect((await call("/sign-in/email", { email: "concurrent@example.test", password: "CorrectPassword88" })).status).toBe(401);
  });

  it("requires administrator TOTP, revokes pre-enrolment sessions and consumes recovery codes once", async () => {
    await db.delete(authLoginGuard);
    await db.delete(rateLimitTable);
    const { hashPassword } = await import("./password");
    const adminId = "mfa-administrator";
    await db.insert(userTable).values({ id: adminId, name: "MFA Administrator", email: "mfa-admin@example.test", emailVerified: true, username: "mfaadmin", displayUsername: "mfaadmin", role: "admin" });
    await db.insert(account).values({ id: "mfa-admin-account", accountId: adminId, providerId: "credential", userId: adminId, password: await hashPassword("AdministratorPassword99") });

    const firstLogin = await call("/sign-in/username", { username: "mfaadmin", password: "AdministratorPassword99" });
    expect(firstLogin.status, await firstLogin.clone().text()).toBe(200);
    const firstCookie = sessionCookie(firstLogin);
    const secondCookie = sessionCookie(await call("/sign-in/username", { username: "mfaadmin", password: "AdministratorPassword99" }));
    expect((await call("/admin/list-users", undefined, firstCookie)).status).toBe(403);

    const enabled = await call("/two-factor/enable", { password: "AdministratorPassword99", method: "totp", issuer: "BoomoTech" }, firstCookie);
    expect(enabled.status).toBe(200);
    const enrolment = await enabled.json() as { totpURI: string; backupCodes: string[] };
    const secret = new URL(enrolment.totpURI).searchParams.get("secret");
    expect(secret).toBeTruthy();
    const rawSecret = decodeBase32(secret!);
    const generated = await auth.api.generateTOTP({ body: { secret: rawSecret } });
    expect(generated.code).toMatch(/^\d{6}$/);
    const verified = await call("/two-factor/verify-totp", { code: generated.code, trustDevice: false }, firstCookie);
    expect(verified.status, await verified.clone().text()).toBe(200);
    expect(await (await call("/get-session", undefined, secondCookie)).json()).toBeNull();

    const expiredLogin = await call("/sign-in/username", { username: "mfaadmin", password: "AdministratorPassword99" });
    const expiredChallenge = responseCookie(expiredLogin, "two_factor");
    await db.update(verification).set({ expiresAt: new Date(Date.now() - 1_000) });
    const expiredCode = await auth.api.generateTOTP({ body: { secret: rawSecret } });
    expect((await call("/two-factor/verify-totp", { code: expiredCode.code, trustDevice: false }, expiredChallenge)).status).toBe(401);

    const challenged = await call("/sign-in/username", { username: "mfaadmin", password: "AdministratorPassword99" });
    expect(await challenged.clone().json()).toMatchObject({ twoFactorRedirect: true });
    const pendingCookies = challenged.headers.getSetCookie().map((cookie) => cookie.split(";", 1)[0]).join("; ");
    expect(await (await call("/get-session", undefined, pendingCookies)).json()).toBeNull();
    const challengeCookie = responseCookie(challenged, "two_factor");
    const challengeCode = await auth.api.generateTOTP({ body: { secret: rawSecret } });
    const completed = await call("/two-factor/verify-totp", { code: challengeCode.code, trustDevice: false }, challengeCookie);
    expect(completed.status).toBe(200);
    const completedCookie = sessionCookie(completed);
    expect((await call("/admin/list-users", undefined, completedCookie)).status).toBe(200);
    expect((await call("/two-factor/disable", { password: "AdministratorPassword99" }, completedCookie)).status).toBe(403);

    const regenerated = await call("/two-factor/generate-backup-codes", { password: "AdministratorPassword99" }, completedCookie);
    expect(regenerated.status).toBe(200);
    const replacementCodes = (await regenerated.json() as { backupCodes: string[] }).backupCodes;
    expect(await (await call("/get-session", undefined, completedCookie)).json()).toBeNull();

    const recoveryLogin = await call("/sign-in/username", { username: "mfaadmin", password: "AdministratorPassword99" });
    const recoveryChallenge = responseCookie(recoveryLogin, "two_factor");
    expect((await call("/two-factor/verify-backup-code", { code: replacementCodes[0], trustDevice: false }, recoveryChallenge)).status).toBe(200);
    const replayLogin = await call("/sign-in/username", { username: "mfaadmin", password: "AdministratorPassword99" });
    const replayChallenge = responseCookie(replayLogin, "two_factor");
    expect((await call("/two-factor/verify-backup-code", { code: replacementCodes[0], trustDevice: false }, replayChallenge)).status).toBe(401);
  });
});
