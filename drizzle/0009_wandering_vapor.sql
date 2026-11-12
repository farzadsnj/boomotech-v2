CREATE TABLE "pte_attempt" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"exercise_id" text NOT NULL,
	"task_type" text NOT NULL,
	"answer" jsonb NOT NULL,
	"correct" integer,
	"total" integer DEFAULT 0 NOT NULL,
	"result_kind" text NOT NULL,
	"self_review" jsonb,
	"elapsed_seconds" integer DEFAULT 0 NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pte_attempt_elapsed_check" CHECK ("pte_attempt"."elapsed_seconds" between 0 and 86400)
);
--> statement-breakpoint
CREATE TABLE "pte_draft" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"exercise_id" text NOT NULL,
	"response" text DEFAULT '' NOT NULL,
	"elapsed_seconds" integer DEFAULT 0 NOT NULL,
	"timer_started_at" timestamp with time zone,
	"timer_duration_seconds" integer,
	"timer_running" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pte_learning_profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"onboarding_complete" boolean DEFAULT false NOT NULL,
	"start_date" date,
	"exam_date" date,
	"duration_days" integer,
	"daily_minutes" integer,
	"study_days" jsonb,
	"preferred_time" text,
	"timezone" text DEFAULT 'Australia/Brisbane' NOT NULL,
	"target_score" integer,
	"current_level" text,
	"previous_reading_score" integer,
	"previous_writing_score" integer,
	"persian_help" boolean DEFAULT true NOT NULL,
	"plan_revision" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pte_learning_profile_duration_check" CHECK ("pte_learning_profile"."duration_days" is null or "pte_learning_profile"."duration_days" between 1 and 730),
	CONSTRAINT "pte_learning_profile_minutes_check" CHECK ("pte_learning_profile"."daily_minutes" is null or "pte_learning_profile"."daily_minutes" between 10 and 480),
	CONSTRAINT "pte_learning_profile_target_check" CHECK ("pte_learning_profile"."target_score" is null or "pte_learning_profile"."target_score" between 10 and 90)
);
--> statement-breakpoint
CREATE TABLE "pte_manual_score" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"source" text NOT NULL,
	"score_date" date NOT NULL,
	"reading_score" integer,
	"writing_score" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pte_mistake" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"attempt_id" text NOT NULL,
	"exercise_id" text NOT NULL,
	"category" text NOT NULL,
	"learner_answer" text NOT NULL,
	"correct_answer" text,
	"explanation" text NOT NULL,
	"lesson_id" text,
	"reviewed_at" timestamp with time zone,
	"review_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pte_plan_day" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"plan_revision" integer NOT NULL,
	"study_date" date NOT NULL,
	"phase" text NOT NULL,
	"exercise_ids" jsonb NOT NULL,
	"review" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pte_attempt" ADD CONSTRAINT "pte_attempt_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pte_draft" ADD CONSTRAINT "pte_draft_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pte_learning_profile" ADD CONSTRAINT "pte_learning_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pte_manual_score" ADD CONSTRAINT "pte_manual_score_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pte_mistake" ADD CONSTRAINT "pte_mistake_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pte_mistake" ADD CONSTRAINT "pte_mistake_attempt_id_pte_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."pte_attempt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pte_plan_day" ADD CONSTRAINT "pte_plan_day_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pte_attempt_user_idempotency_unique" ON "pte_attempt" USING btree ("user_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "pte_attempt_user_submitted_idx" ON "pte_attempt" USING btree ("user_id","submitted_at");--> statement-breakpoint
CREATE INDEX "pte_attempt_user_task_idx" ON "pte_attempt" USING btree ("user_id","task_type");--> statement-breakpoint
CREATE UNIQUE INDEX "pte_draft_user_exercise_unique" ON "pte_draft" USING btree ("user_id","exercise_id");--> statement-breakpoint
CREATE INDEX "pte_draft_user_updated_idx" ON "pte_draft" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "pte_manual_score_user_date_idx" ON "pte_manual_score" USING btree ("user_id","score_date");--> statement-breakpoint
CREATE INDEX "pte_mistake_user_reviewed_idx" ON "pte_mistake" USING btree ("user_id","reviewed_at");--> statement-breakpoint
CREATE INDEX "pte_mistake_attempt_idx" ON "pte_mistake" USING btree ("attempt_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pte_plan_day_user_revision_date_unique" ON "pte_plan_day" USING btree ("user_id","plan_revision","study_date");--> statement-breakpoint
CREATE INDEX "pte_plan_day_user_date_idx" ON "pte_plan_day" USING btree ("user_id","study_date");