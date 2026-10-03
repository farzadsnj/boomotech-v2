import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type * as Repository from "./repository";

const databasePath = path.resolve(process.cwd(), ".test-db", `bookings-${randomUUID()}`);
let repository: typeof Repository;
let closeDatabase: () => Promise<void>;

beforeAll(async () => {
  await rm(databasePath, { recursive: true, force: true });
  await mkdir(path.dirname(databasePath), { recursive: true });
  const client = new PGlite(databasePath);
  const migrationDirectory = path.resolve(process.cwd(), "drizzle");
  const migrations = (await readdir(migrationDirectory)).filter((name) => name.endsWith(".sql")).sort();
  for (const name of migrations) {
    const migration = await readFile(path.join(migrationDirectory, name), "utf8");
    for (const statement of migration.split("--> statement-breakpoint").map((value) => value.trim()).filter(Boolean)) await client.exec(statement);
  }
  await client.close();
  process.env.AUTH_E2E_DATABASE_PATH = databasePath;
  repository = await import("./repository");
  ({ closeDatabase } = await import("@/db"));
});

afterAll(async () => {
  await closeDatabase?.();
  delete process.env.AUTH_E2E_DATABASE_PATH;
  await rm(databasePath, { recursive: true, force: true });
});

describe("booking repository", () => {
  it("stores guest requests and exposes them to the administrator list", async () => {
    const stored = await repository.storeBookingRequest({
      fullName: "Taylor Smith",
      email: "taylor@example.com",
      phone: "+61400000000",
      servicePath: "/services/it-support",
      message: "Several office computers need troubleshooting support.",
      source: "chatbot",
      consent: true,
      website: "",
    }, null);

    expect(stored.reference).toMatch(/^BT-[A-F0-9]{10}$/);
    const result = await repository.listAdminBookings(1);
    expect(result.total).toBe(1);
    expect(result.records[0]).toMatchObject({ reference: stored.reference, source: "chatbot", status: "new" });
  });
});
