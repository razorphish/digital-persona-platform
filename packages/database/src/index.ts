import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";

// Lazy initialization to ensure env vars are loaded
let pool: Pool;
let dbInstance: ReturnType<typeof drizzle>;

function initializeDatabase() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is required");
    }

    console.log("🔧 Database Configuration:", {
      hasConnectionString: !!connectionString,
      connectionPreview: connectionString.replace(
        /(:\/\/[^:]+:)[^@]+(@)/,
        "$1***$2"
      ),
    });

    pool = new Pool({
      connectionString,
      // Connection pool optimization for cost reduction
      max: 10, // Maximum number of connections in the pool
      min: 2, // Minimum number of connections to maintain
      idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
      connectionTimeoutMillis: 5000, // Timeout after 5 seconds when connecting
      // Aurora Serverless v2 optimization
      keepAlive: true,
      keepAliveInitialDelayMillis: 0,
    });

    dbInstance = drizzle(pool, { schema });
  }
  return { pool, db: dbInstance };
}

// Export getter functions instead of direct exports
export function getPool() {
  return initializeDatabase().pool;
}

export function getDb() {
  return initializeDatabase().db;
}

// For backward compatibility, export db that initializes lazily
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    return getDb()[prop as keyof ReturnType<typeof drizzle>];
  },
});

export * from "./schema.js";
