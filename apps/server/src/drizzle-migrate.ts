import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Proper Drizzle migration runner
 * Replaces the custom migration script with proper incremental migrations
 */

export async function runDrizzleMigrations() {
  console.log("🚀 Starting Drizzle database migrations...");

  // Validate DATABASE_URL
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  console.log("🔗 Connecting to database...");
  
  // Create connection for migrations
  const migrationConnection = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationConnection);

  try {
    // Test connection
    console.log("🧪 Testing database connection...");
    await migrationConnection`SELECT 1 as test`;
    console.log("✅ Database connection successful");

    // Determine migrations folder path
    // In Lambda, migrations should be bundled to /var/task/packages/database/drizzle
    // In local development, use relative path
    let migrationsFolder: string;
    
    if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
      // Lambda environment - migrations are bundled to this location by build script
      migrationsFolder = "/var/task/packages/database/drizzle";
      console.log("🔧 Using Lambda migrations path:", migrationsFolder);
    } else {
      // Local development
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      migrationsFolder = path.join(__dirname, "../../../packages/database/drizzle");
      console.log("🔧 Using local migrations path:", migrationsFolder);
    }

    console.log("📋 Running Drizzle migrations...");
    
    // Run all pending migrations
    await migrate(db, { migrationsFolder });
    
    console.log("✅ All migrations completed successfully");

    // Verify critical tables exist
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

    return {
      success: true,
      message: "Drizzle migrations completed successfully",
      tablesFound: tables.map((t: any) => t.table_name),
    };
  } catch (error: any) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    console.log("🔌 Closing database connection...");
    await migrationConnection.end();
  }
}

// Allow direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runDrizzleMigrations()
    .then((result) => {
      console.log("🎉 Migration completed:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration failed:", error);
      process.exit(1);
    });
}
