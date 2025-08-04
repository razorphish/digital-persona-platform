CREATE TABLE IF NOT EXISTS "content_moderations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_type" text NOT NULL,
	"content_id" text NOT NULL,
	"user_id" uuid,
	"persona_id" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"ai_moderation_score" numeric(3, 2),
	"flagged_categories" jsonb DEFAULT '[]'::jsonb,
	"severity" text,
	"original_content" text,
	"content_summary" text,
	"detected_language" text,
	"age_rating" text,
	"compliance_flags" jsonb DEFAULT '[]'::jsonb,
	"moderated_by" uuid,
	"moderator_notes" text,
	"action_taken" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "content_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_name" text NOT NULL,
	"policy_type" text NOT NULL,
	"description" text NOT NULL,
	"rules" jsonb NOT NULL,
	"severity" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"applies_to" jsonb DEFAULT '[]'::jsonb,
	"jurisdiction" text DEFAULT 'US',
	"legal_basis" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "interaction_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rater_id" uuid NOT NULL,
	"rated_user_id" uuid NOT NULL,
	"persona_id" uuid NOT NULL,
	"conversation_id" uuid,
	"safety_rating" integer NOT NULL,
	"behavior_tags" jsonb DEFAULT '[]'::jsonb,
	"is_inappropriate" boolean DEFAULT false,
	"is_threatening" boolean DEFAULT false,
	"is_harassing" boolean DEFAULT false,
	"is_spam" boolean DEFAULT false,
	"rating_reason" text,
	"rating_notes" text,
	"is_blocked" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "safety_incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"persona_id" uuid,
	"content_moderation_id" uuid,
	"incident_type" text NOT NULL,
	"severity" text NOT NULL,
	"detection_method" text NOT NULL,
	"confidence" numeric(3, 2),
	"description" text NOT NULL,
	"evidence" jsonb DEFAULT '{}'::jsonb,
	"status" text DEFAULT 'open',
	"resolved_by" uuid,
	"resolution" text,
	"action_taken" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_safety_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"overall_safety_score" numeric(3, 2) DEFAULT '1.00',
	"trust_level" text DEFAULT 'new',
	"total_interactions" integer DEFAULT 0,
	"flagged_interactions" integer DEFAULT 0,
	"positive_ratings" integer DEFAULT 0,
	"negative_ratings" integer DEFAULT 0,
	"content_violations" integer DEFAULT 0,
	"severity_score" numeric(3, 2) DEFAULT '0.00',
	"last_violation_date" timestamp,
	"age_verified" boolean DEFAULT false,
	"age_verification_date" timestamp,
	"date_of_birth" timestamp,
	"is_restricted" boolean DEFAULT false,
	"restriction_reason" text,
	"restriction_expires_at" timestamp,
	"family_friendly_mode" boolean DEFAULT false,
	"parental_controls" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_safety_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_moderations" ADD CONSTRAINT "content_moderations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_moderations" ADD CONSTRAINT "content_moderations_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_moderations" ADD CONSTRAINT "content_moderations_moderated_by_users_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interaction_ratings" ADD CONSTRAINT "interaction_ratings_rater_id_users_id_fk" FOREIGN KEY ("rater_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interaction_ratings" ADD CONSTRAINT "interaction_ratings_rated_user_id_users_id_fk" FOREIGN KEY ("rated_user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interaction_ratings" ADD CONSTRAINT "interaction_ratings_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interaction_ratings" ADD CONSTRAINT "interaction_ratings_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "safety_incidents" ADD CONSTRAINT "safety_incidents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "safety_incidents" ADD CONSTRAINT "safety_incidents_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "safety_incidents" ADD CONSTRAINT "safety_incidents_content_moderation_id_content_moderations_id_fk" FOREIGN KEY ("content_moderation_id") REFERENCES "content_moderations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "safety_incidents" ADD CONSTRAINT "safety_incidents_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_safety_profiles" ADD CONSTRAINT "user_safety_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
