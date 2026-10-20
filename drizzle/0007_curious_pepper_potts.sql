CREATE TABLE "in_app_notification" (
	"id" text PRIMARY KEY NOT NULL,
	"recipient_role" text NOT NULL,
	"recipient_user_id" text,
	"booking_request_id" text NOT NULL,
	"request_message_id" text,
	"kind" text NOT NULL,
	"dedupe_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "in_app_notification_recipient_check" CHECK (("in_app_notification"."recipient_role" = 'admin' and "in_app_notification"."recipient_user_id" is null) or ("in_app_notification"."recipient_role" = 'customer' and "in_app_notification"."recipient_user_id" is not null)),
	CONSTRAINT "in_app_notification_kind_check" CHECK ("in_app_notification"."kind" in ('ADMIN_NEW_REQUEST', 'ADMIN_CUSTOMER_REPLY', 'CUSTOMER_ADMIN_REPLY', 'CUSTOMER_STATUS_CHANGED', 'CUSTOMER_REQUEST_RESOLVED'))
);
--> statement-breakpoint
CREATE TABLE "in_app_notification_read" (
	"notification_id" text NOT NULL,
	"user_id" text NOT NULL,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "in_app_notification_read_notification_id_user_id_pk" PRIMARY KEY("notification_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "in_app_notification" ADD CONSTRAINT "in_app_notification_recipient_user_id_user_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "in_app_notification" ADD CONSTRAINT "in_app_notification_booking_request_id_booking_request_id_fk" FOREIGN KEY ("booking_request_id") REFERENCES "public"."booking_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "in_app_notification" ADD CONSTRAINT "in_app_notification_request_message_id_booking_request_message_id_fk" FOREIGN KEY ("request_message_id") REFERENCES "public"."booking_request_message"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "in_app_notification_read" ADD CONSTRAINT "in_app_notification_read_notification_id_in_app_notification_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."in_app_notification"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "in_app_notification_read" ADD CONSTRAINT "in_app_notification_read_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "in_app_notification_dedupe_key_unique" ON "in_app_notification" USING btree ("dedupe_key");--> statement-breakpoint
CREATE INDEX "in_app_notification_admin_created_idx" ON "in_app_notification" USING btree ("recipient_role","created_at");--> statement-breakpoint
CREATE INDEX "in_app_notification_customer_created_idx" ON "in_app_notification" USING btree ("recipient_user_id","created_at");--> statement-breakpoint
CREATE INDEX "in_app_notification_read_user_idx" ON "in_app_notification_read" USING btree ("user_id","read_at");