import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let auth: (typeof import("./auth"))["auth"];
let closeDatabase: (typeof import("@/db"))["closeDatabase"];
let db: (typeof import("@/db"))["db"];
let account: (typeof import("@/db/schema"))["account"];
let listCustomers: (typeof import("./customers"))["listCustomers"];
let testDirectory = "";

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
  const databasePath = path.join(testDirectory, "database");
  const client = new PGlite(databasePath);
  const migration = await readFile(path.resolve(process.cwd(), "drizzle", "0000_auth_foundation.sql"), "utf8");
  for (const statement of migration.split("--> statement-breakpoint").map((value) => value.trim()).filter(Boolean)) await client.exec(statement);
  await client.close();
  process.env.AUTH_E2E_DATABASE_PATH = databasePath;
  process.env.BETTER_AUTH_SECRET = "unit-test-secret-with-more-than-thirty-two-characters";
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
  ({ auth } = await import("./auth"));
  ({ db, closeDatabase } = await import("@/db"));
  ({ account } = await import("@/db/schema"));
  ({ listCustomers } = await import("./customers"));
});

afterAll(async () => {
  await closeDatabase?.();
  delete process.env.AUTH_E2E_DATABASE_PATH;
  await rm(testDirectory, { recursive: true, force: true });
});

describe("database-backed account authentication", () => {
  it("creates one normalized account and rejects a duplicate", async () => {
    const body = { name: "Taylor Morgan", email: "TAYLOR@Example.com", password: "SecurePassword9" };
    const first = await call("/sign-up/email", body);
    expect(first.status).toBe(200);
    const duplicate = await call("/sign-up/email", body);
    expect(duplicate.ok).toBe(false);
  });

  it("stores an Argon2id password hash", async () => {
    const records = await db.select({ password: account.password }).from(account);
    expect(records[0]?.password).toMatch(/^\$argon2id\$/);
    expect(records[0]?.password).not.toContain("SecurePassword9");
  });

  it("rejects an incorrect login and accepts the correct one", async () => {
    const incorrect = await call("/sign-in/email", { email: "taylor@example.com", password: "IncorrectPassword9" });
    expect(incorrect.ok).toBe(false);
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
});
