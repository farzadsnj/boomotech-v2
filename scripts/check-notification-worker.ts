import { sql } from "drizzle-orm";
import {
  NotificationWorkerConfigurationError,
  validateNotificationWorkerDatabaseEnvironment,
  validateNotificationWorkerEnvironment,
} from "../src/features/notifications/config";

let closeDatabase: (() => Promise<void>) | undefined;

try {
  validateNotificationWorkerEnvironment();
  validateNotificationWorkerDatabaseEnvironment();

  const database = await import("../src/db");
  closeDatabase = database.closeDatabase;
  await database.db.execute(sql`select 1`);
  await database.db.execute(sql`
    select id, booking_id, kind, dedupe_key, status, attempts, last_error,
      next_attempt_at, processing_started_at, sent_at, created_at, updated_at
    from notification_outbox
    limit 0
  `);
  console.log("Notification worker configuration, database connection and outbox schema are valid.");
} catch (error) {
  if (error instanceof NotificationWorkerConfigurationError) console.error(error.message);
  else console.error("Notification worker preflight failed. Check the database connection and applied migrations.");
  process.exitCode = 1;
} finally {
  await closeDatabase?.();
}
