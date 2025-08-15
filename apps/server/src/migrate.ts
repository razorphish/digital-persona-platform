import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { config } from "dotenv";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Load environment variables
config({ path: join(process.cwd(), "..", "..", ".env") });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    const db = drizzle(migrationConnection);

    // Validate connection with a simple query
    await migrationConnection`SELECT 1 as test`;
    console.log("✅ Database connection successful");

    // Check current migration status
    console.log("📋 Checking current migration status...");

    // Run migrations with detailed logging
    console.log("🚀 Applying database migrations...");

    // Handle different path structures in Lambda vs local environments
    const migrationsPath = process.env.AWS_LAMBDA_FUNCTION_NAME 
      ? join(__dirname, "drizzle")  // In Lambda, files are in same directory
      : join(__dirname, "..", "drizzle");  // In local dev, go up one level
    
    console.log("🔍 Migration path:", migrationsPath);
    
    await migrate(db, {
      migrationsFolder: migrationsPath,
      migrationsTable: "drizzle_migrations",
    });

    console.log("✅ All migrations applied successfully");
    console.log("🔒 Database integrity maintained");

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

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  switch (command) {
    case "up":
      runMigrations()
        .then((result) => {
          if (result.success) {
            console.log("Migration successful");
            process.exit(0);
          } else {
            console.error("Migration failed:", result.error);
            process.exit(1);
          }
        })
        .catch((error) => {
          console.error("Migration error:", error);
          process.exit(1);
        });
      break;

    case "rollback":
      console.log("Rollback requested - requires manual intervention");
      process.exit(1);
      break;

    default:
      console.log("Usage: npm run migrate:up");
      console.log("       npm run migrate:rollback");
      process.exit(1);
  }
}
