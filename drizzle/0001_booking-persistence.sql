CREATE TABLE "booking_request" (
	"id" text PRIMARY KEY NOT NULL,
	"reference" text NOT NULL,
	"user_id" text,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"service_path" text NOT NULL,
	"message" text NOT NULL,
	"source" text DEFAULT 'booking-page' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"consent_version" text NOT NULL,
	"consented_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notification_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_outbox" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"kind" text DEFAULT 'booking-created' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking_request" ADD CONSTRAINT "booking_request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_outbox" ADD CONSTRAINT "notification_outbox_booking_id_booking_request_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "booking_request_reference_unique" ON "booking_request" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "booking_request_user_id_idx" ON "booking_request" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "booking_request_status_idx" ON "booking_request" USING btree ("status");--> statement-breakpoint
CREATE INDEX "booking_request_created_at_idx" ON "booking_request" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_outbox_booking_kind_unique" ON "notification_outbox" USING btree ("booking_id","kind");--> statement-breakpoint
CREATE INDEX "notification_outbox_status_idx" ON "notification_outbox" USING btree ("status");