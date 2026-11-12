import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { createHash } from "node:crypto";
import path from "node:path";
import * as schema from "./schema";
import { getDatabaseUrl } from "@/lib/config/environment";

const configuredE2ePath = process.env.AUTH_E2E_DATABASE_PATH?.trim();
const testDatabaseAllowed = process.env.NODE_ENV === "test" || process.env.AUTH_EMAIL_CAPTURE_MODE === "test";
if (configuredE2ePath && !testDatabaseAllowed) {
  throw new Error("Database configuration error: AUTH_E2E_DATABASE_PATH is permitted only in the isolated test environment.");
}
const e2eDatabasePath = configuredE2ePath ? path.resolve(configuredE2ePath) : undefined;
if (e2eDatabasePath && process.env.NODE_ENV !== "test") {
  const permittedRoot = path.resolve(process.cwd(), ".test-db");
  if (!e2eDatabasePath.startsWith(`${permittedRoot}${path.sep}`)) {
    throw new Error("Database configuration error: the isolated test database must remain under .test-db.");
  }
}
const connectionString = e2eDatabasePath ? "" : getDatabaseUrl();
const connectionIdentity = e2eDatabasePath
  ? `test:${e2eDatabasePath}`
  : `postgres:${createHash("sha256").update(connectionString).digest("hex")}`;

const globalDatabase = globalThis as typeof globalThis & {
  boomotechSql?: ReturnType<typeof postgres>;
  boomotechDb?: ReturnType<typeof drizzle<typeof schema>>;
  boomotechClose?: () => Promise<void>;
  boomotechConnectionIdentity?: string;
};

if (process.env.NODE_ENV !== "production" && globalDatabase.boomotechDb
  && globalDatabase.boomotechConnectionIdentity !== connectionIdentity) {
  throw new Error("Database configuration changed while this process was running. Restart the process before continuing so it cannot reuse a connection to a different database.");
}

async function createDatabase() {
  if (e2eDatabasePath) {
    const [{ PGlite }, { drizzle: drizzlePglite }] = await Promise.all([import("@electric-sql/pglite"), import("drizzle-orm/pglite")]);
    const client = new PGlite(e2eDatabasePath);
    return {
      database: drizzlePglite(client, { schema }) as unknown as ReturnType<typeof drizzle<typeof schema>>,
      close: () => client.close(),
    };
  }
  const sql = globalDatabase.boomotechSql ?? postgres(connectionString, {
    max: process.env.NODE_ENV === "production" ? 10 : 3,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });
  if (process.env.NODE_ENV !== "production") globalDatabase.boomotechSql = sql;
  return { database: drizzle(sql, { schema }), close: () => sql.end() };
}

const connection = globalDatabase.boomotechDb && globalDatabase.boomotechClose
  ? { database: globalDatabase.boomotechDb, close: globalDatabase.boomotechClose }
  : await createDatabase();

if (process.env.NODE_ENV !== "production") {
  globalDatabase.boomotechDb = connection.database;
  globalDatabase.boomotechClose = connection.close;
  globalDatabase.boomotechConnectionIdentity = connectionIdentity;
}

export const db = connection.database;
export const closeDatabase = connection.close;
