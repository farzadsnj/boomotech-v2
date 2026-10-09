import { sql } from "drizzle-orm";
import { bigint, boolean, check, index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  username: text("username"),
  displayUsername: text("display_username"),
  role: text("role").default("user").notNull(),
  banned: boolean("banned").default(false).notNull(),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("user_email_unique").on(table.email),
  uniqueIndex("user_username_unique").on(table.username),
  index("user_created_at_idx").on(table.createdAt),
]);

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
}, (table) => [
  uniqueIndex("session_token_unique").on(table.token),
  index("session_user_id_idx").on(table.userId),
  index("session_expires_at_idx").on(table.expiresAt),
]);

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("account_user_id_idx").on(table.userId),
  uniqueIndex("account_provider_account_unique").on(table.providerId, table.accountId),
]);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("verification_identifier_idx").on(table.identifier)]);

export const emailVerificationGrant = pgTable("email_verification_grant", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("email_verification_grant_token_hash_unique").on(table.tokenHash),
  index("email_verification_grant_user_id_idx").on(table.userId),
  index("email_verification_grant_expires_at_idx").on(table.expiresAt),
]);

export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
}, (table) => [uniqueIndex("rate_limit_key_unique").on(table.key)]);

export const bookingRequest = pgTable("booking_request", {
  id: text("id").primaryKey(),
  reference: text("reference").notNull(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  servicePath: text("service_path").notNull(),
  message: text("message").notNull(),
  source: text("source").default("booking-page").notNull(),
  status: text("status").default("NEW").notNull(),
  priority: text("priority").default("MEDIUM").notNull(),
  internalNotes: text("internal_notes"),
  readAt: timestamp("read_at", { withTimezone: true }),
  readByAdminId: text("read_by_admin_id").references(() => user.id, { onDelete: "set null" }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
  version: integer("version").default(0).notNull(),
  consentVersion: text("consent_version").notNull(),
  consentedAt: timestamp("consented_at", { withTimezone: true }).defaultNow().notNull(),
  notificationStatus: text("notification_status").default("pending").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("booking_request_reference_unique").on(table.reference),
  index("booking_request_user_id_idx").on(table.userId),
  index("booking_request_status_idx").on(table.status),
  index("booking_request_priority_idx").on(table.priority),
  index("booking_request_created_at_idx").on(table.createdAt),
  check("booking_request_status_check", sql`${table.status} in ('NEW', 'IN_PROGRESS', 'AWAITING_USER', 'RESOLVED', 'WITHDRAWN')`),
  check("booking_request_priority_check", sql`${table.priority} in ('HIGH', 'MEDIUM', 'LOW')`),
]);

export const bookingRequestMessage = pgTable("booking_request_message", {
  id: text("id").primaryKey(),
  bookingRequestId: text("booking_request_id").notNull().references(() => bookingRequest.id, { onDelete: "cascade" }),
  authorUserId: text("author_user_id").notNull().references(() => user.id, { onDelete: "restrict" }),
  authorRole: text("author_role").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  editedAt: timestamp("edited_at", { withTimezone: true }),
}, (table) => [
  index("booking_request_message_request_date_idx").on(table.bookingRequestId, table.createdAt),
  check("booking_request_message_author_role_check", sql`${table.authorRole} in ('customer', 'admin')`),
]);

export const bookingRequestEvent = pgTable("booking_request_event", {
  id: text("id").primaryKey(),
  bookingRequestId: text("booking_request_id").notNull().references(() => bookingRequest.id, { onDelete: "cascade" }),
  actorUserId: text("actor_user_id").references(() => user.id, { onDelete: "set null" }),
  actorRole: text("actor_role").notNull(),
  eventType: text("event_type").notNull(),
  fromStatus: text("from_status"),
  toStatus: text("to_status"),
  fromPriority: text("from_priority"),
  toPriority: text("to_priority"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("booking_request_event_request_date_idx").on(table.bookingRequestId, table.createdAt),
  check("booking_request_event_actor_role_check", sql`${table.actorRole} in ('customer', 'admin', 'system')`),
]);

export const notificationOutbox = pgTable("notification_outbox", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").notNull().references(() => bookingRequest.id, { onDelete: "cascade" }),
  kind: text("kind").default("BOOKING_CREATED").notNull(),
  dedupeKey: text("dedupe_key"),
  requestMessageId: text("request_message_id").references(() => bookingRequestMessage.id, { onDelete: "set null" }),
  status: text("status").default("pending").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  lastError: text("last_error"),
  nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).defaultNow().notNull(),
  processingStartedAt: timestamp("processing_started_at", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("notification_outbox_dedupe_key_unique").on(table.dedupeKey),
  index("notification_outbox_status_idx").on(table.status),
  index("notification_outbox_retry_idx").on(table.status, table.nextAttemptAt),
  index("notification_outbox_booking_kind_idx").on(table.bookingId, table.kind),
]);

export const authSchema = { user, session, account, verification, rateLimit };
