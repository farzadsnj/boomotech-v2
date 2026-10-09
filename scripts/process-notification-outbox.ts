import { closeDatabase } from "../src/db";
import { processNotificationOutbox } from "../src/features/notifications/outbox";

try {
  const result = await processNotificationOutbox();
  console.log(`Notification worker completed: ${result.sent} sent, ${result.failed} scheduled for retry or review.`);
  process.exitCode = result.failed ? 1 : 0;
} catch (error) {
  console.error(error instanceof Error ? error.message : "Notification worker failed.");
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
