CREATE TABLE IF NOT EXISTS "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"persona_id" uuid,
	"title" text,
	"conversation_type" text DEFAULT 'chat',
	"privacy_level" text DEFAULT 'private',
	"allowed_users" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "creator_earnings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"stripe_account_id" uuid NOT NULL,
	"period_type" text NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"gross_revenue" numeric(12, 2) DEFAULT '0.00',
	"platform_fee" numeric(12, 2) DEFAULT '0.00',
	"processing_fee" numeric(12, 2) DEFAULT '0.00',
	"net_earnings" numeric(12, 2) DEFAULT '0.00',
	"total_subscribers" integer DEFAULT 0,
	"new_subscribers" integer DEFAULT 0,
	"cancelled_subscribers" integer DEFAULT 0,
	"total_interactions" integer DEFAULT 0,
	"paid_interactions" integer DEFAULT 0,
	"free_interactions" integer DEFAULT 0,
	"total_billable_minutes" integer DEFAULT 0,
	"average_session_length" numeric(6, 2),
	"payout_status" text DEFAULT 'pending',
	"payout_id" text,
	"payout_date" timestamp,
	"payout_amount" numeric(12, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "creator_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" text DEFAULT 'pending',
	"verification_level" text DEFAULT 'basic',
	"legal_name" text,
	"date_of_birth" timestamp,
	"government_id_type" text,
	"government_id_number" text,
	"government_id_expiry_date" timestamp,
	"address_line1" text,
	"address_line2" text,
	"city" text,
	"state" text,
	"postal_code" text,
	"country" text DEFAULT 'US',
	"face_verification_score" numeric(4, 3),
	"face_verification_provider" text,
	"face_verification_id" text,
	"face_verification_completed_at" timestamp,
	"bank_account_verified" boolean DEFAULT false,
	"bank_name" text,
	"bank_account_type" text,
	"bank_account_last4" text,
	"routing_number" text,
	"tax_id_type" text,
	"tax_id_last4" text,
	"tax_forms_submitted" jsonb,
	"ip_address" text,
	"user_agent" text,
	"verification_document_ids" jsonb,
	"verification_notes" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"rejection_reason" text,
	"suspension_reason" text,
	"appeal_submitted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"suspended_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "learning_interviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"persona_id" uuid NOT NULL,
	"session_type" text NOT NULL,
	"status" text DEFAULT 'pending',
	"current_question_index" integer DEFAULT 0,
	"total_questions" integer,
	"questions_data" jsonb,
	"insights" jsonb,
	"personality_updates" jsonb,
	"completion_percentage" integer DEFAULT 0,
	"next_session_date" timestamp,
	"reminders_sent" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "media_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_id" text NOT NULL,
	"filename" text NOT NULL,
	"original_filename" text NOT NULL,
	"file_path" text,
	"file_size" integer NOT NULL,
	"mime_type" text NOT NULL,
	"media_type" text NOT NULL,
	"s3_key" text,
	"s3_bucket" text,
	"s3_url" text,
	"presigned_url" text,
	"is_s3_stored" boolean DEFAULT false,
	"upload_method" text DEFAULT 'direct',
	"upload_status" text DEFAULT 'pending' NOT NULL,
	"user_id" uuid NOT NULL,
	"persona_id" uuid,
	"conversation_id" uuid,
	"privacy_level" text DEFAULT 'private',
	"allowed_users" jsonb,
	"requires_subscription" boolean DEFAULT false,
	"description" text,
	"metadata" jsonb,
	"is_learning_data" boolean DEFAULT false,
	"ai_analysis" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"uploaded_at" timestamp,
	CONSTRAINT "media_files_file_id_unique" UNIQUE("file_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"message_type" text DEFAULT 'text',
	"metadata" jsonb,
	"personality_insights" jsonb,
	"is_learning_data" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "persona_learning_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"persona_id" uuid NOT NULL,
	"source_type" text NOT NULL,
	"source_id" text,
	"content" text NOT NULL,
	"insights" jsonb,
	"confidence" integer DEFAULT 50,
	"processed" boolean DEFAULT false,
	"category" text,
	"importance" integer DEFAULT 50,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "persona_monetization" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"persona_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"is_monetized" boolean DEFAULT false,
	"requires_verification" boolean DEFAULT true,
	"pricing_model" text DEFAULT 'hybrid',
	"basic_tier_price" numeric(8, 2),
	"basic_tier_features" jsonb,
	"average_tier_price" numeric(8, 2),
	"average_tier_features" jsonb,
	"advanced_tier_price" numeric(8, 2),
	"advanced_tier_features" jsonb,
	"time_based_enabled" boolean DEFAULT false,
	"hourly_rate" numeric(8, 2),
	"minimum_session_minutes" integer DEFAULT 15,
	"free_messages_per_day" integer DEFAULT 3,
	"free_minutes_per_day" integer DEFAULT 10,
	"auto_accept_subscriptions" boolean DEFAULT true,
	"require_manual_approval" boolean DEFAULT false,
	"allow_tips" boolean DEFAULT true,
	"total_revenue" numeric(12, 2) DEFAULT '0.00',
	"total_subscribers" integer DEFAULT 0,
	"average_session_revenue" numeric(8, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "personas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"avatar" text,
	"persona_type" text DEFAULT 'child' NOT NULL,
	"is_main_persona" boolean DEFAULT false,
	"parent_persona_id" uuid,
	"traits" jsonb,
	"preferences" jsonb,
	"memory_context" text,
	"personality_profile" jsonb,
	"privacy_level" text DEFAULT 'friends',
	"content_filter" jsonb,
	"guard_rails" jsonb,
	"is_publicly_listed" boolean DEFAULT false,
	"allow_connections" boolean DEFAULT true,
	"requires_subscription" boolean DEFAULT false,
	"subscription_price" numeric(10, 2),
	"learning_enabled" boolean DEFAULT true,
	"interaction_count" integer DEFAULT 0,
	"last_interaction" timestamp,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"is_deletable" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "social_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"platform" text NOT NULL,
	"platform_user_id" text NOT NULL,
	"platform_username" text,
	"access_token" text,
	"refresh_token" text,
	"token_expiry" timestamp,
	"is_active" boolean DEFAULT true,
	"last_sync" timestamp,
	"allow_learning" boolean DEFAULT true,
	"learning_frequency" text DEFAULT 'daily',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "social_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connection_id" uuid NOT NULL,
	"platform_post_id" text NOT NULL,
	"content" text,
	"post_type" text,
	"media_urls" jsonb,
	"likes" integer DEFAULT 0,
	"shares" integer DEFAULT 0,
	"comments" integer DEFAULT 0,
	"published_at" timestamp,
	"imported_at" timestamp DEFAULT now() NOT NULL,
	"processed_for_learning" boolean DEFAULT false,
	"learning_insights" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stripe_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"verification_id" uuid,
	"stripe_account_id" text NOT NULL,
	"stripe_account_type" text DEFAULT 'express',
	"charges_enabled" boolean DEFAULT false,
	"payouts_enabled" boolean DEFAULT false,
	"details_submitted" boolean DEFAULT false,
	"onboarding_url" text,
	"onboarding_expires_at" timestamp,
	"onboarding_completed_at" timestamp,
	"currently_due" jsonb,
	"eventually_due" jsonb,
	"past_due" jsonb,
	"pending_verification" jsonb,
	"capabilities" jsonb,
	"requirements" jsonb,
	"payout_schedule" jsonb,
	"default_currency" text DEFAULT 'usd',
	"is_active" boolean DEFAULT true,
	"last_webhook_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stripe_accounts_stripe_account_id_unique" UNIQUE("stripe_account_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscription_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payer_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"persona_id" uuid NOT NULL,
	"subscription_plan_id" uuid,
	"stripe_payment_intent_id" text,
	"stripe_subscription_id" text,
	"stripe_invoice_id" text,
	"stripe_customer_id" text,
	"payment_type" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD',
	"creator_amount" numeric(10, 2) NOT NULL,
	"platform_amount" numeric(10, 2) NOT NULL,
	"processing_fee" numeric(10, 2) DEFAULT '0.00',
	"status" text DEFAULT 'pending',
	"billing_period_start" timestamp,
	"billing_period_end" timestamp,
	"session_minutes" integer,
	"hourly_rate" numeric(8, 2),
	"description" text,
	"metadata" jsonb,
	"refund_amount" numeric(10, 2),
	"refund_reason" text,
	"refunded_at" timestamp,
	"failure_code" text,
	"failure_message" text,
	"failed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp,
	CONSTRAINT "subscription_payments_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"persona_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD',
	"billing_period" text DEFAULT 'monthly',
	"access_level" text NOT NULL,
	"features" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" uuid NOT NULL,
	"target_persona_id" uuid NOT NULL,
	"target_user_id" uuid NOT NULL,
	"connection_type" text NOT NULL,
	"status" text DEFAULT 'pending',
	"subscription_tier" text,
	"subscription_price" numeric(10, 2),
	"subscription_start_date" timestamp,
	"subscription_end_date" timestamp,
	"is_subscription_active" boolean DEFAULT false,
	"custom_permissions" jsonb,
	"access_level" text DEFAULT 'basic',
	"retain_historical_data" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text,
	"email_verified" timestamp,
	"image" text,
	"date_of_birth" timestamp,
	"location" text,
	"bio" text,
	"is_active" boolean DEFAULT true,
	"allow_social_connections" boolean DEFAULT true,
	"default_privacy_level" text DEFAULT 'friends',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"verification_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"document_type" text NOT NULL,
	"document_name" text NOT NULL,
	"s3_bucket" text NOT NULL,
	"s3_key" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"status" text DEFAULT 'uploaded',
	"ocr_text" text,
	"confidence_score" numeric(4, 3),
	"processing_results" jsonb,
	"encryption_key" text,
	"retention_expiry_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"verified_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversations" ADD CONSTRAINT "conversations_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "creator_earnings" ADD CONSTRAINT "creator_earnings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "creator_earnings" ADD CONSTRAINT "creator_earnings_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "stripe_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "creator_verifications" ADD CONSTRAINT "creator_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "learning_interviews" ADD CONSTRAINT "learning_interviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "learning_interviews" ADD CONSTRAINT "learning_interviews_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media_files" ADD CONSTRAINT "media_files_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media_files" ADD CONSTRAINT "media_files_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media_files" ADD CONSTRAINT "media_files_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "persona_learning_data" ADD CONSTRAINT "persona_learning_data_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "persona_monetization" ADD CONSTRAINT "persona_monetization_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "persona_monetization" ADD CONSTRAINT "persona_monetization_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "personas" ADD CONSTRAINT "personas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "social_connections" ADD CONSTRAINT "social_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_connection_id_social_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "social_connections"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stripe_accounts" ADD CONSTRAINT "stripe_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stripe_accounts" ADD CONSTRAINT "stripe_accounts_verification_id_creator_verifications_id_fk" FOREIGN KEY ("verification_id") REFERENCES "creator_verifications"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_payer_id_users_id_fk" FOREIGN KEY ("payer_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_subscription_plan_id_subscription_plans_id_fk" FOREIGN KEY ("subscription_plan_id") REFERENCES "subscription_plans"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscription_plans" ADD CONSTRAINT "subscription_plans_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_connections" ADD CONSTRAINT "user_connections_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_connections" ADD CONSTRAINT "user_connections_target_persona_id_personas_id_fk" FOREIGN KEY ("target_persona_id") REFERENCES "personas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_connections" ADD CONSTRAINT "user_connections_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_verification_id_creator_verifications_id_fk" FOREIGN KEY ("verification_id") REFERENCES "creator_verifications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
