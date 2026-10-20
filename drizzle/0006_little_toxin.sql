CREATE INDEX "booking_request_status_priority_created_idx" ON "booking_request" USING btree ("status","priority","created_at");--> statement-breakpoint
CREATE INDEX "booking_request_event_created_at_idx" ON "booking_request_event" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_role_created_at_idx" ON "user" USING btree ("role","created_at");