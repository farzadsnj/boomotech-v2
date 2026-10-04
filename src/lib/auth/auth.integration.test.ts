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
  ({ account } = await import("@/db/schema"));
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
    expect(records[0]?.password).toMatch(/^\$argon2id\$/);
    expect(records[0]?.password).not.toContain("SecurePassword9");
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
});
