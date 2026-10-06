import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { getDatabaseUrl } from "@/lib/config/environment";

const e2eDatabasePath = process.env.AUTH_E2E_DATABASE_PATH;
const connectionString = e2eDatabasePath ? "" : getDatabaseUrl();

const globalDatabase = globalThis as typeof globalThis & {
  boomotechSql?: ReturnType<typeof postgres>;
  boomotechDb?: ReturnType<typeof drizzle<typeof schema>>;
  boomotechClose?: () => Promise<void>;
};

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
}

export const db = connection.database;
export const closeDatabase = connection.close;
