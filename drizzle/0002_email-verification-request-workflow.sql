CREATE TABLE "booking_request_event" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_request_id" text NOT NULL,
	"actor_user_id" text,
	"actor_role" text NOT NULL,
	"event_type" text NOT NULL,
	"from_status" text,
	"to_status" text,
	"from_priority" text,
	"to_priority" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "booking_request_event_actor_role_check" CHECK ("booking_request_event"."actor_role" in ('customer', 'admin', 'system'))
);
--> statement-breakpoint
CREATE TABLE "booking_request_message" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_request_id" text NOT NULL,
	"author_user_id" text NOT NULL,
	"author_role" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"edited_at" timestamp with time zone,
	CONSTRAINT "booking_request_message_author_role_check" CHECK ("booking_request_message"."author_role" in ('customer', 'admin'))
);
--> statement-breakpoint
CREATE TABLE "email_verification_grant" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "notification_outbox_booking_kind_unique";--> statement-breakpoint
ALTER TABLE "booking_request" ALTER COLUMN "status" SET DEFAULT 'NEW';--> statement-breakpoint
ALTER TABLE "notification_outbox" ALTER COLUMN "kind" SET DEFAULT 'BOOKING_CREATED';--> statement-breakpoint
ALTER TABLE "booking_request" ADD COLUMN "priority" text DEFAULT 'MEDIUM' NOT NULL;--> statement-breakpoint
ALTER TABLE "booking_request" ADD COLUMN "read_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "booking_request" ADD COLUMN "read_by_admin_id" text;--> statement-breakpoint
ALTER TABLE "booking_request" ADD COLUMN "resolved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "booking_request" ADD COLUMN "withdrawn_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "booking_request" ADD COLUMN "version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_outbox" ADD COLUMN "dedupe_key" text;--> statement-breakpoint
ALTER TABLE "notification_outbox" ADD COLUMN "request_message_id" text;--> statement-breakpoint
UPDATE "user" SET "email_verified" = true WHERE "email_verified" = false;--> statement-breakpoint
UPDATE "booking_request" SET "status" = CASE lower("status")
	WHEN 'new' THEN 'NEW'
	WHEN 'in_progress' THEN 'IN_PROGRESS'
	WHEN 'awaiting_user' THEN 'AWAITING_USER'
	WHEN 'resolved' THEN 'RESOLVED'
	WHEN 'withdrawn' THEN 'WITHDRAWN'
	ELSE 'NEW'
END;--> statement-breakpoint
UPDATE "notification_outbox" SET "kind" = CASE lower("kind")
	WHEN 'booking-created' THEN 'BOOKING_CREATED'
	ELSE upper(replace("kind", '-', '_'))
END, "dedupe_key" = "id" WHERE "dedupe_key" IS NULL;--> statement-breakpoint
ALTER TABLE "booking_request_event" ADD CONSTRAINT "booking_request_event_booking_request_id_booking_request_id_fk" FOREIGN KEY ("booking_request_id") REFERENCES "public"."booking_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_request_event" ADD CONSTRAINT "booking_request_event_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_request_message" ADD CONSTRAINT "booking_request_message_booking_request_id_booking_request_id_fk" FOREIGN KEY ("booking_request_id") REFERENCES "public"."booking_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_request_message" ADD CONSTRAINT "booking_request_message_author_user_id_user_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verification_grant" ADD CONSTRAINT "email_verification_grant_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_request_event_request_date_idx" ON "booking_request_event" USING btree ("booking_request_id","created_at");--> statement-breakpoint
CREATE INDEX "booking_request_message_request_date_idx" ON "booking_request_message" USING btree ("booking_request_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "email_verification_grant_token_hash_unique" ON "email_verification_grant" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "email_verification_grant_user_id_idx" ON "email_verification_grant" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_verification_grant_expires_at_idx" ON "email_verification_grant" USING btree ("expires_at");--> statement-breakpoint
ALTER TABLE "booking_request" ADD CONSTRAINT "booking_request_read_by_admin_id_user_id_fk" FOREIGN KEY ("read_by_admin_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_outbox" ADD CONSTRAINT "notification_outbox_request_message_id_booking_request_message_id_fk" FOREIGN KEY ("request_message_id") REFERENCES "public"."booking_request_message"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_request_priority_idx" ON "booking_request" USING btree ("priority");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_outbox_dedupe_key_unique" ON "notification_outbox" USING btree ("dedupe_key");--> statement-breakpoint
CREATE INDEX "notification_outbox_booking_kind_idx" ON "notification_outbox" USING btree ("booking_id","kind");--> statement-breakpoint
ALTER TABLE "booking_request" ADD CONSTRAINT "booking_request_status_check" CHECK ("booking_request"."status" in ('NEW', 'IN_PROGRESS', 'AWAITING_USER', 'RESOLVED', 'WITHDRAWN'));--> statement-breakpoint
ALTER TABLE "booking_request" ADD CONSTRAINT "booking_request_priority_check" CHECK ("booking_request"."priority" in ('HIGH', 'MEDIUM', 'LOW'));
