import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

/**
 * Add critical database indexes for feed performance
 * Run this to optimize feed queries in production
 */
export async function addFeedIndexes() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log("🔧 Adding feed performance indexes...");

  try {
    // Primary feed query index: user_id + feed_position for fast sorting
    await client`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_feed_items_user_position" 
      ON "feed_items" ("user_id", "feed_position")
    `;
    console.log("✅ Added idx_feed_items_user_position");

    // Individual indexes for JOIN operations
    await client`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_feed_items_persona_id" 
      ON "feed_items" ("persona_id") WHERE "persona_id" IS NOT NULL
    `;
    console.log("✅ Added idx_feed_items_persona_id");

    await client`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_feed_items_creator_id" 
      ON "feed_items" ("creator_id") WHERE "creator_id" IS NOT NULL
    `;
    console.log("✅ Added idx_feed_items_creator_id");

    // Composite index for filtering + sorting (most important)
    await client`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_feed_items_user_algo_position" 
      ON "feed_items" ("user_id", "algorithm_source", "feed_position")
    `;
    console.log("✅ Added idx_feed_items_user_algo_position");

    // Index for cleanup/maintenance queries
    await client`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_feed_items_created_at" 
      ON "feed_items" ("created_at")
    `;
    console.log("✅ Added idx_feed_items_created_at");

    // Partial indexes for common filters
    await client`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_feed_items_promoted" 
      ON "feed_items" ("user_id", "is_promoted") WHERE "is_promoted" = true
    `;
    console.log("✅ Added idx_feed_items_promoted");

    await client`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_feed_items_trending" 
      ON "feed_items" ("user_id", "is_trending") WHERE "is_trending" = true
    `;
    console.log("✅ Added idx_feed_items_trending");

    console.log("🎉 All feed indexes added successfully!");
    
  } catch (error) {
    console.error("❌ Error adding indexes:", error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addFeedIndexes()
    .then(() => {
      console.log("✅ Feed index migration completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Feed index migration failed:", error);
      process.exit(1);
    });
}
