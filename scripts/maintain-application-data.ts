import { sql } from "drizzle-orm";
import { db, closeDatabase } from "../src/db";

const apply = process.argv.includes("--apply");
const days = (name: string, fallback: number) => {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${name} must be a positive whole number.`);
  return value;
};
const grantsDays = days("MAINTENANCE_EXPIRED_GRANT_DAYS", 30);
const rateLimitDays = days("MAINTENANCE_RATE_LIMIT_DAYS", 2);
const outboxDays = days("MAINTENANCE_SENT_OUTBOX_DAYS", 90);
const sessionDays = days("MAINTENANCE_EXPIRED_SESSION_DAYS", 30);
const loginGuardDays = days("MAINTENANCE_LOGIN_GUARD_DAYS", 30);

const queries = [
  ["expired email verification grants", sql`SELECT count(*)::int AS count FROM email_verification_grant WHERE expires_at < now() - (${grantsDays} * interval '1 day') OR used_at < now() - (${grantsDays} * interval '1 day')`, sql`DELETE FROM email_verification_grant WHERE expires_at < now() - (${grantsDays} * interval '1 day') OR used_at < now() - (${grantsDays} * interval '1 day')`],
  ["stale rate-limit buckets", sql`SELECT count(*)::int AS count FROM rate_limit WHERE last_request < (extract(epoch from now() - (${rateLimitDays} * interval '1 day')) * 1000)::bigint`, sql`DELETE FROM rate_limit WHERE last_request < (extract(epoch from now() - (${rateLimitDays} * interval '1 day')) * 1000)::bigint`],
  ["sent notification outbox records", sql`SELECT count(*)::int AS count FROM notification_outbox WHERE status = 'sent' AND sent_at < now() - (${outboxDays} * interval '1 day')`, sql`DELETE FROM notification_outbox WHERE status = 'sent' AND sent_at < now() - (${outboxDays} * interval '1 day')`],
  ["expired sessions", sql`SELECT count(*)::int AS count FROM session WHERE expires_at < now() - (${sessionDays} * interval '1 day')`, sql`DELETE FROM session WHERE expires_at < now() - (${sessionDays} * interval '1 day')`],
  ["expired login-guard records", sql`SELECT count(*)::int AS count FROM auth_login_guard WHERE updated_at < now() - (${loginGuardDays} * interval '1 day') AND (locked_until IS NULL OR locked_until < now())`, sql`DELETE FROM auth_login_guard WHERE updated_at < now() - (${loginGuardDays} * interval '1 day') AND (locked_until IS NULL OR locked_until < now())`],
  ["expired booking submission keys", sql`SELECT count(*)::int AS count FROM booking_request WHERE submission_expires_at < now()`, sql`UPDATE booking_request SET submission_key = NULL, submission_scope_hash = NULL, submission_payload_hash = NULL, submission_expires_at = NULL WHERE submission_expires_at < now()`],
] as const;

try {
  for (const [label, countQuery, deletion] of queries) {
    if (apply) {
      const result = await db.execute(deletion);
      console.log(`${label}: cleanup applied (${result.count ?? "completed"}).`);
    } else {
      const result = await db.execute(countQuery);
      console.log(`${label}: ${Array.from(result as unknown as Iterable<{ count: number }>)[0]?.count ?? 0} eligible.`);
    }
  }
  console.log(apply ? "Maintenance completed." : "Dry run only. Re-run with --apply after reviewing counts.");
} finally { await closeDatabase(); }
