ALTER TABLE "notification_outbox" ADD COLUMN "next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_outbox" ADD COLUMN "processing_started_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "notification_outbox_retry_idx" ON "notification_outbox" USING btree ("status","next_attempt_at");