ALTER TABLE "booking_request" ADD COLUMN "submission_key" text;--> statement-breakpoint
ALTER TABLE "booking_request" ADD COLUMN "submission_scope_hash" text;--> statement-breakpoint
ALTER TABLE "booking_request" ADD COLUMN "submission_payload_hash" text;--> statement-breakpoint
ALTER TABLE "booking_request" ADD COLUMN "submission_expires_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "booking_request_submission_scope_key_unique" ON "booking_request" USING btree ("submission_scope_hash","submission_key");--> statement-breakpoint
CREATE INDEX "booking_request_submission_expires_idx" ON "booking_request" USING btree ("submission_expires_at");