-- Add critical indexes for feed performance
-- These indexes are essential for fast feed queries in production

-- Primary feed query index: user_id + feed_position for fast sorting
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_feed_items_user_position" 
ON "feed_items" ("user_id", "feed_position");

-- Individual indexes for JOIN operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_feed_items_persona_id" 
ON "feed_items" ("persona_id") WHERE "persona_id" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_feed_items_creator_id" 
ON "feed_items" ("creator_id") WHERE "creator_id" IS NOT NULL;

-- Composite index for filtering + sorting (most important)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_feed_items_user_algo_position" 
ON "feed_items" ("user_id", "algorithm_source", "feed_position");

-- Index for cleanup/maintenance queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_feed_items_created_at" 
ON "feed_items" ("created_at");

-- Partial indexes for common filters
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_feed_items_promoted" 
ON "feed_items" ("user_id", "is_promoted") WHERE "is_promoted" = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_feed_items_trending" 
ON "feed_items" ("user_id", "is_trending") WHERE "is_trending" = true;
