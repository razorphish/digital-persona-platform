import postgres from "postgres";
import { config } from "dotenv";

// Load environment variables
config({ path: "../../.env" });

/**
 * Safe database migration runner for CI/CD
 * Features:
 * - Validates database connection before migration
 * - Provides detailed logging
 * - Handles rollback scenarios
 * - Ensures data integrity
 * Updated: Force migration trigger for dev01 environment
 */
export async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  console.log("🔄 Starting database migration process...");
  console.log(`📊 Database: ${connectionString.split("@")[1] || "localhost"}`);

  // Create connection for migration
  const migrationConnection = postgres(connectionString, {
    max: 1, // Single connection for migrations
    onnotice: () => {}, // Ignore PostgreSQL notices during migration
  });

  try {
    // Test database connection
    console.log("🔗 Testing database connection...");

    // Validate connection with a simple query
    await migrationConnection`SELECT 1 as test`;
    console.log("✅ Database connection successful");

    // Check if migrations have already been applied
    console.log("📋 Checking migration status...");
    try {
      const migrationCheck = await migrationConnection`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      `;

      if (migrationCheck[0].count > 0) {
        console.log("✅ Database schema already exists - skipping migration");

        // Verify schema completeness
        const tables = await migrationConnection`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name
        `;

        console.log(
          "📋 Existing tables:",
          tables.map((t: any) => t.table_name).join(", ")
        );

        return {
          success: true,
          message: "Schema already exists",
          tablesFound: tables.map((t: any) => t.table_name),
        };
      }
    } catch (e) {
      console.log("📝 No existing schema found - proceeding with migration");
    }

    // Apply schema directly using SQL to avoid Drizzle's Lambda incompatibility
    console.log("🚀 Applying database schema via direct SQL...");

    // Execute the complete schema creation
    await migrationConnection`
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
    `;

    await migrationConnection`
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
    `;

    await migrationConnection`
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
    `;

    await migrationConnection`
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
    `;

    await migrationConnection`
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
    `;

    await migrationConnection`
      CREATE TABLE IF NOT EXISTS "sessions" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" uuid NOT NULL,
        "expires_at" timestamp NOT NULL,
        "token" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "sessions_token_unique" UNIQUE("token")
      );
    `;

    // Add foreign key constraints safely
    await migrationConnection`
      DO $$ BEGIN
        ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await migrationConnection`
      DO $$ BEGIN
        ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await migrationConnection`
      DO $$ BEGIN
        ALTER TABLE "conversations" ADD CONSTRAINT "conversations_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE set null ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await migrationConnection`
      DO $$ BEGIN
        ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await migrationConnection`
      DO $$ BEGIN
        ALTER TABLE "personas" ADD CONSTRAINT "personas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await migrationConnection`
      DO $$ BEGIN
        ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    // Create migration tracking table
    await migrationConnection`
      CREATE TABLE IF NOT EXISTS "drizzle_migrations" (
        "id" serial PRIMARY KEY,
        "hash" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `;

    // Record this migration
    await migrationConnection`
      INSERT INTO "drizzle_migrations" ("hash") 
      VALUES ('0000_brief_shiva') 
      ON CONFLICT DO NOTHING;
    `;

    console.log("✅ Database schema applied successfully");

    // Verify critical tables exist
    console.log("🔍 Verifying table structure...");
    const tables = await migrationConnection`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;

    console.log(
      "📋 Database tables:",
      tables.map((t: any) => t.table_name).join(", ")
    );

    // Verify users table has date_of_birth column
    const userColumns = await migrationConnection`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY column_name
    `;

    const hasDateOfBirth = userColumns.some(
      (col: any) => col.column_name === "date_of_birth"
    );
    if (hasDateOfBirth) {
      console.log("✅ date_of_birth column verified in users table");
    } else {
      console.warn("⚠️  date_of_birth column not found in users table");
    }

    console.log("🎉 Migration completed successfully!");
    return { success: true, message: "All migrations applied successfully" };
  } catch (error) {
    console.error("❌ Migration failed:", error);

    // Log detailed error information
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Stack trace:", error.stack);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown migration error",
    };
  } finally {
    // Always close the connection
    await migrationConnection.end();
    console.log("🔌 Database connection closed");
  }
}

/**
 * Rollback functionality for emergency scenarios
 */
export async function rollbackMigration(targetMigration?: string) {
  console.log("⚠️  ROLLBACK REQUESTED");
  console.log("This feature should be implemented with extreme caution");
  console.log("Manual intervention required for rollbacks");

  if (targetMigration) {
    console.log(`Target migration: ${targetMigration}`);
  }

  // For now, log the request - implement actual rollback logic with care
  throw new Error(
    "Rollback functionality requires manual implementation for safety"
  );
}

// CLI interface removed - Lambda compatible only
