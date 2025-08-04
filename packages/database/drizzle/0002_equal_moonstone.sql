CREATE TABLE IF NOT EXISTS "discovery_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"persona_id" uuid NOT NULL,
	"views_last_24h" integer DEFAULT 0,
	"views_last_7d" integer DEFAULT 0,
	"views_last_30d" integer DEFAULT 0,
	"likes_last_24h" integer DEFAULT 0,
	"likes_last_7d" integer DEFAULT 0,
	"likes_last_30d" integer DEFAULT 0,
	"subscriptions_last_24h" integer DEFAULT 0,
	"subscriptions_last_7d" integer DEFAULT 0,
	"subscriptions_last_30d" integer DEFAULT 0,
	"trending_score" numeric(10, 4) DEFAULT '0.0000',
	"popularity_score" numeric(10, 4) DEFAULT '0.0000',
	"quality_score" numeric(10, 4) DEFAULT '0.0000',
	"engagement_score" numeric(10, 4) DEFAULT '0.0000',
	"discovery_rank" integer DEFAULT 999999,
	"category_rank" integer DEFAULT 999999,
	"last_calculated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feed_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"item_type" text NOT NULL,
	"persona_id" uuid,
	"creator_id" uuid,
	"algorithm_source" text NOT NULL,
	"relevance_score" numeric(3, 2) DEFAULT '0.50',
	"feed_position" integer,
	"is_promoted" boolean DEFAULT false,
	"is_trending" boolean DEFAULT false,
	"was_viewed" boolean DEFAULT false,
	"was_clicked" boolean DEFAULT false,
	"was_liked" boolean DEFAULT false,
	"was_shared" boolean DEFAULT false,
	"was_dismissed" boolean DEFAULT false,
	"viewed_at" timestamp,
	"clicked_at" timestamp,
	"dismissed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "persona_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"persona_id" uuid NOT NULL,
	"like_type" text DEFAULT 'like',
	"discovered_via" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "persona_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"persona_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"title" text,
	"review_text" text,
	"categories" jsonb DEFAULT '[]'::jsonb,
	"pros" jsonb DEFAULT '[]'::jsonb,
	"cons" jsonb DEFAULT '[]'::jsonb,
	"interaction_duration" integer,
	"subscription_tier" text,
	"is_verified_purchase" boolean DEFAULT false,
	"is_public" boolean DEFAULT true,
	"is_helpful" integer DEFAULT 0,
	"is_reported" boolean DEFAULT false,
	"moderation_status" text DEFAULT 'pending',
	"moderated_by" uuid,
	"moderated_at" timestamp,
	"moderation_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trending_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_name" text NOT NULL,
	"topic_type" text NOT NULL,
	"mention_count" integer DEFAULT 0,
	"persona_count" integer DEFAULT 0,
	"engagement_count" integer DEFAULT 0,
	"trending_score" numeric(10, 4) DEFAULT '0.0000',
	"velocity_score" numeric(10, 4) DEFAULT '0.0000',
	"top_regions" jsonb DEFAULT '[]'::jsonb,
	"top_age_groups" jsonb DEFAULT '[]'::jsonb,
	"first_seen" timestamp DEFAULT now(),
	"peak_date" timestamp,
	"is_currently_trending" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_feed_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"preferred_categories" jsonb DEFAULT '[]'::jsonb,
	"blocked_categories" jsonb DEFAULT '[]'::jsonb,
	"show_trending" boolean DEFAULT true,
	"show_recommendations" boolean DEFAULT true,
	"show_followed_creators" boolean DEFAULT true,
	"show_similar_personas" boolean DEFAULT true,
	"trending_weight" numeric(3, 2) DEFAULT '0.30',
	"personalized_weight" numeric(3, 2) DEFAULT '0.40',
	"social_weight" numeric(3, 2) DEFAULT '0.20',
	"new_creator_weight" numeric(3, 2) DEFAULT '0.10',
	"min_rating" numeric(2, 1) DEFAULT '3.0',
	"hide_nsfw" boolean DEFAULT true,
	"only_verified_creators" boolean DEFAULT false,
	"auto_refresh_feed" boolean DEFAULT true,
	"feed_refresh_interval" integer DEFAULT 300,
	"max_feed_items" integer DEFAULT 50,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_feed_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_follows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"follower_id" uuid NOT NULL,
	"following_id" uuid NOT NULL,
	"follow_reason" text,
	"notify_on_new_persona" boolean DEFAULT true,
	"notify_on_updates" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "discovery_metrics" ADD CONSTRAINT "discovery_metrics_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feed_items" ADD CONSTRAINT "feed_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feed_items" ADD CONSTRAINT "feed_items_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feed_items" ADD CONSTRAINT "feed_items_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "persona_likes" ADD CONSTRAINT "persona_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "persona_likes" ADD CONSTRAINT "persona_likes_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "persona_reviews" ADD CONSTRAINT "persona_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "persona_reviews" ADD CONSTRAINT "persona_reviews_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "persona_reviews" ADD CONSTRAINT "persona_reviews_moderated_by_users_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_feed_preferences" ADD CONSTRAINT "user_feed_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_following_id_users_id_fk" FOREIGN KEY ("following_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
