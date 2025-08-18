#!/usr/bin/env node

/**
 * One-off script to synchronize Drizzle migration tracking with current database state
 * This script should be run when the database schema has been applied via custom SQL
 * but Drizzle's migration tracking is out of sync.
 */

const postgres = require("postgres");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

async function syncDrizzleMigrations() {
  console.log("🔄 Starting Drizzle migration sync...");

  // Get database connection
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable not set");
  }

  const db = postgres(connectionString);

  try {
    // 1. Create the migrations table if it doesn't exist
    console.log("📋 Creating __drizzle_migrations table...");
    await db`
      CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `;

    // 2. Clear existing migration records
    console.log("🧹 Clearing existing migration records...");
    await db`DELETE FROM "__drizzle_migrations"`;

    // 3. Read migration files and calculate their hashes
    const migrationsDir = path.join(__dirname, "../packages/database/drizzle");
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    console.log("📁 Found migration files:", migrationFiles);

    // 4. For each migration file, calculate hash and insert record
    let insertedCount = 0;
    for (let i = 0; i < migrationFiles.length; i++) {
      const fileName = migrationFiles[i];
      const filePath = path.join(migrationsDir, fileName);
      const fileContent = fs.readFileSync(filePath, "utf8");

      // Calculate hash the way Drizzle does it
      const hash = crypto
        .createHash("sha256")
        .update(fileContent)
        .digest("hex");

      // Extract migration name (without .sql extension)
      const migrationName = fileName.replace(".sql", "");

      // Use the migration name as the hash (this is what Drizzle expects)
      const timestamp = Date.now() - (migrationFiles.length - i) * 60000;

      console.log(`📝 Inserting migration: ${migrationName}`);
      await db`
        INSERT INTO "__drizzle_migrations" (hash, created_at)
        VALUES (${migrationName}, ${timestamp})
      `;

      insertedCount++;
    }

    // 5. Verify the migration state
    const allMigrations =
      await db`SELECT hash, created_at FROM "__drizzle_migrations" ORDER BY created_at`;

    console.log("✅ Migration sync completed!");
    console.log(`📊 Migrations inserted: ${insertedCount}`);
    console.log("📋 Current migration state:");
    allMigrations.forEach((migration, index) => {
      const date = new Date(Number(migration.created_at)).toISOString();
      console.log(`  ${index + 1}. ${migration.hash} (${date})`);
    });
  } catch (error) {
    console.error("❌ Migration sync failed:", error);
    throw error;
  } finally {
    await db.end();
  }
}

// Run the script if called directly
if (require.main === module) {
  syncDrizzleMigrations()
    .then(() => {
      console.log("🎉 Drizzle migration sync completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Sync failed:", error);
      process.exit(1);
    });
}

module.exports = { syncDrizzleMigrations };
