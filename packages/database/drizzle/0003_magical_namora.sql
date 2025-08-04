CREATE TABLE IF NOT EXISTS "creator_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"total_personas" integer DEFAULT 0,
	"active_personas" integer DEFAULT 0,
	"total_views" integer DEFAULT 0,
	"total_likes" integer DEFAULT 0,
	"total_followers" integer DEFAULT 0,
	"total_subscribers" integer DEFAULT 0,
	"view_to_like_rate" numeric(5, 4) DEFAULT '0.0000',
	"view_to_follow_rate" numeric(5, 4) DEFAULT '0.0000',
	"view_to_subscribe_rate" numeric(5, 4) DEFAULT '0.0000',
	"follower_to_subscriber_rate" numeric(5, 4) DEFAULT '0.0000',
	"total_revenue" numeric(12, 2) DEFAULT '0.00',
	"monthly_recurring_revenue" numeric(10, 2) DEFAULT '0.00',
	"average_revenue_per_user" numeric(8, 2) DEFAULT '0.00',
	"subscriber_growth_rate" numeric(5, 4) DEFAULT '0.0000',
	"subscriber_churn_rate" numeric(5, 4) DEFAULT '0.0000',
	"average_subscription_duration" integer DEFAULT 0,
	"average_rating" numeric(3, 2) DEFAULT '0.00',
	"total_reviews" integer DEFAULT 0,
	"response_rate" numeric(5, 4) DEFAULT '0.0000',
	"average_response_time" integer DEFAULT 0,
	"view_growth_rate" numeric(5, 4) DEFAULT '0.0000',
	"follower_growth_rate" numeric(5, 4) DEFAULT '0.0000',
	"revenue_growth_rate" numeric(5, 4) DEFAULT '0.0000',
	"category_rank" integer DEFAULT 999999,
	"overall_rank" integer DEFAULT 999999,
	"percentile_score" numeric(5, 2) DEFAULT '50.00',
	"calculation_period" text DEFAULT 'weekly',
	"last_calculated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "performance_benchmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text NOT NULL,
	"tier" text NOT NULL,
	"benchmark_date" timestamp NOT NULL,
	"sample_size" integer NOT NULL,
	"average_views" integer DEFAULT 0,
	"average_likes" integer DEFAULT 0,
	"average_followers" integer DEFAULT 0,
	"average_subscribers" integer DEFAULT 0,
	"median_view_to_like_rate" numeric(5, 4) DEFAULT '0.0000',
	"median_view_to_follow_rate" numeric(5, 4) DEFAULT '0.0000',
	"median_view_to_subscribe_rate" numeric(5, 4) DEFAULT '0.0000',
	"median_monthly_revenue" numeric(10, 2) DEFAULT '0.00',
	"median_average_revenue_per_user" numeric(8, 2) DEFAULT '0.00',
	"median_subscriber_growth_rate" numeric(5, 4) DEFAULT '0.0000',
	"median_revenue_growth_rate" numeric(5, 4) DEFAULT '0.0000',
	"median_rating" numeric(3, 2) DEFAULT '0.00',
	"median_response_rate" numeric(5, 4) DEFAULT '0.0000',
	"median_response_time" integer DEFAULT 0,
	"percentile_data" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "persona_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"persona_id" uuid NOT NULL,
	"analysis_date" timestamp NOT NULL,
	"total_views" integer DEFAULT 0,
	"unique_views" integer DEFAULT 0,
	"total_likes" integer DEFAULT 0,
	"total_shares" integer DEFAULT 0,
	"total_subscribers" integer DEFAULT 0,
	"total_conversations" integer DEFAULT 0,
	"total_messages" integer DEFAULT 0,
	"average_conversation_length" numeric(5, 2) DEFAULT '0.00',
	"average_response_time" integer DEFAULT 0,
	"subscription_revenue" numeric(10, 2) DEFAULT '0.00',
	"time_based_revenue" numeric(10, 2) DEFAULT '0.00',
	"total_revenue" numeric(10, 2) DEFAULT '0.00',
	"average_rating" numeric(3, 2) DEFAULT '0.00',
	"total_reviews" integer DEFAULT 0,
	"satisfaction_score" numeric(3, 2) DEFAULT '0.00',
	"discovery_views" integer DEFAULT 0,
	"search_views" integer DEFAULT 0,
	"direct_views" integer DEFAULT 0,
	"view_growth_rate" numeric(5, 4) DEFAULT '0.0000',
	"subscriber_growth_rate" numeric(5, 4) DEFAULT '0.0000',
	"top_age_groups" jsonb DEFAULT '[]'::jsonb,
	"top_locations" jsonb DEFAULT '[]'::jsonb,
	"average_session_duration" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "revenue_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"period" text NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"subscription_revenue" numeric(10, 2) DEFAULT '0.00',
	"time_based_revenue" numeric(10, 2) DEFAULT '0.00',
	"tip_revenue" numeric(10, 2) DEFAULT '0.00',
	"total_revenue" numeric(10, 2) DEFAULT '0.00',
	"platform_fee" numeric(10, 2) DEFAULT '0.00',
	"processing_fee" numeric(10, 2) DEFAULT '0.00',
	"net_revenue" numeric(10, 2) DEFAULT '0.00',
	"new_subscribers" integer DEFAULT 0,
	"churned_subscribers" integer DEFAULT 0,
	"total_active_subscribers" integer DEFAULT 0,
	"forecasted_revenue" numeric(10, 2),
	"forecast_confidence" numeric(3, 2),
	"forecast_method" text,
	"period_over_period_growth" numeric(5, 4),
	"year_over_year_growth" numeric(5, 4),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriber_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"analysis_date" timestamp NOT NULL,
	"age_distribution" jsonb DEFAULT '{}'::jsonb,
	"gender_distribution" jsonb DEFAULT '{}'::jsonb,
	"location_distribution" jsonb DEFAULT '{}'::jsonb,
	"tier_distribution" jsonb DEFAULT '{}'::jsonb,
	"average_subscription_value" numeric(8, 2) DEFAULT '0.00',
	"average_session_length" integer DEFAULT 0,
	"average_messages_per_session" numeric(5, 2) DEFAULT '0.00',
	"peak_activity_hours" jsonb DEFAULT '{}'::jsonb,
	"most_popular_features" jsonb DEFAULT '[]'::jsonb,
	"retention_rate_30_day" numeric(5, 2) DEFAULT '0.00',
	"retention_rate_90_day" numeric(5, 2) DEFAULT '0.00',
	"churn_risk_segments" jsonb DEFAULT '{}'::jsonb,
	"high_engagement_percentage" numeric(5, 2) DEFAULT '0.00',
	"average_rating" numeric(3, 2) DEFAULT '0.00',
	"nps_score" numeric(5, 2),
	"acquisition_channels" jsonb DEFAULT '{}'::jsonb,
	"conversion_funnel_data" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"age_range" text,
	"gender" text,
	"location" jsonb DEFAULT '{}'::jsonb,
	"language" text DEFAULT 'en',
	"device_type" text,
	"total_sessions" integer DEFAULT 0,
	"total_session_duration" integer DEFAULT 0,
	"average_session_duration" integer DEFAULT 0,
	"last_active_date" timestamp,
	"total_personas_viewed" integer DEFAULT 0,
	"total_personas_interacted" integer DEFAULT 0,
	"total_conversations" integer DEFAULT 0,
	"total_messages" integer DEFAULT 0,
	"total_subscriptions" integer DEFAULT 0,
	"total_spent" numeric(10, 2) DEFAULT '0.00',
	"preferred_interaction_time" jsonb DEFAULT '{}'::jsonb,
	"preferred_categories" jsonb DEFAULT '[]'::jsonb,
	"most_used_features" jsonb DEFAULT '[]'::jsonb,
	"conversion_rate" numeric(5, 4) DEFAULT '0.0000',
	"days_since_first_visit" integer DEFAULT 0,
	"days_since_last_visit" integer DEFAULT 0,
	"visit_streak" integer DEFAULT 0,
	"longest_streak" integer DEFAULT 0,
	"last_calculated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_start" timestamp NOT NULL,
	"session_end" timestamp,
	"duration" integer,
	"user_agent" text,
	"ip_address" text,
	"country" text,
	"city" text,
	"device_type" text,
	"pages_visited" jsonb DEFAULT '[]'::jsonb,
	"personas_viewed" jsonb DEFAULT '[]'::jsonb,
	"personas_interacted" jsonb DEFAULT '[]'::jsonb,
	"messages_exchanged" integer DEFAULT 0,
	"subscriptions_created" jsonb DEFAULT '[]'::jsonb,
	"payments_completed" jsonb DEFAULT '[]'::jsonb,
	"bounce_rate" boolean DEFAULT false,
	"exit_page" text,
	"referrer_source" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "creator_analytics" ADD CONSTRAINT "creator_analytics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "persona_analytics" ADD CONSTRAINT "persona_analytics_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "revenue_analytics" ADD CONSTRAINT "revenue_analytics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriber_analytics" ADD CONSTRAINT "subscriber_analytics_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_analytics" ADD CONSTRAINT "user_analytics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
