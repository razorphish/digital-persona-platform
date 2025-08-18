import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import serverless from "serverless-http";
import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./router.js";

// Enhanced logging for debugging
const logger = {
  info: (message: string, data?: any) => {
    console.log(
      `[INFO] ${new Date().toISOString()} - ${message}`,
      data ? JSON.stringify(data, null, 2) : ""
    );
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
  },
  debug: (message: string, data?: any) => {
    console.log(
      `[DEBUG] ${new Date().toISOString()} - ${message}`,
      data ? JSON.stringify(data, null, 2) : ""
    );
  },
};

// Lambda startup logging
logger.info("🚀 Lambda function starting up");
logger.debug("Environment variables", {
  NODE_ENV: process.env.NODE_ENV,
  AWS_REGION: process.env.AWS_REGION,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  hasJWT_SECRET: !!process.env.JWT_SECRET,
  hasDATABASE_URL: !!process.env.DATABASE_URL,
});

// Create Express app with error handling
const app = express();

// Global error handler for Express
app.use((err: any, req: any, res: any, next: any) => {
  logger.error("Express error handler caught error", {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });
  res.status(500).json({
    error: "Internal server error",
    message: "An error occurred processing your request",
    timestamp: new Date().toISOString(),
    requestId: req.headers["x-request-id"] || "unknown",
  });
});

logger.info("📦 Setting up middleware");

// Middleware with logging
app.use(
  cors({
    origin: function (origin, callback) {
      const configured =
        process.env.CORS_ORIGIN?.split(",").map((o) => o.trim()) || [];
      // Always allow same-site UI based on API host naming (devNN-api.hibiji.com -> devNN.hibiji.com)
      const host = (origin || "").replace(/^https?:\/\//, "");
      const dynamicUi = host.includes("-api.")
        ? origin?.replace("-api.", ".")
        : undefined;
      const allowedOrigins = Array.from(
        new Set([
          "http://localhost:3000",
          "http://localhost:3100",
          "http://127.0.0.1:3000",
          "http://127.0.0.1:3100",
          ...configured,
          ...(dynamicUi ? [dynamicUi] : []),
        ])
      );

      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Check if the origin is in the allowed list
      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        logger.error(
          `CORS blocked request from origin: ${origin}. Allowed origins: ${allowedOrigins.join(
            ", "
          )}`
        );
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "X-Requested-With",
      "Authorization",
      "x-trpc-source",
      "x-amz-date",
      "x-amz-security-token",
      "x-api-key",
    ],
  })
);

// Explicit preflight handler with detailed logging
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    const origin = (req.headers["origin"] as string) || "";
    const acrMethod =
      (req.headers["access-control-request-method"] as string) || "";
    const acrHeaders =
      (req.headers["access-control-request-headers"] as string) || "";

    const configured =
      process.env.CORS_ORIGIN?.split(",").map((o) => o.trim()) || [];
    const hostHeader = (req.headers["host"] as string) || "";
    const dynamicUi = hostHeader.includes("-api.")
      ? `${
          origin?.startsWith("http:") ? "http" : "https"
        }://${hostHeader.replace("-api.", ".")}`
      : undefined;
    const allowedOrigins = Array.from(
      new Set([
        "http://localhost:3000",
        "http://localhost:3100",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3100",
        ...configured,
        ...(dynamicUi ? [dynamicUi] : []),
      ])
    );

    const isAllowed =
      !origin ||
      allowedOrigins.includes("*") ||
      allowedOrigins.includes(origin);

    logger.info("CORS preflight received", {
      url: req.url,
      origin,
      hostHeader,
      acrMethod,
      acrHeaders,
      allowedOrigins,
      isAllowed,
    });

    if (!isAllowed) {
      logger.error("CORS preflight blocked", { origin, allowedOrigins });
      return res.status(403).json({ error: "CORS not allowed", origin });
    }

    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Origin", origin || "");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,HEAD,OPTIONS,POST,PUT,PATCH,DELETE"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      acrHeaders ||
        "Content-Type, Authorization, X-Requested-With, x-trpc-source"
    );
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Max-Age", "86400");
    return res.status(204).end();
  }
  return next();
});

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.debug("Incoming request", {
    method: req.method,
    url: req.url,
    headers: req.headers,
    userAgent: req.headers["user-agent"],
  });
  next();
});

logger.info("🔧 Setting up tRPC middleware");

// tRPC middleware with error handling
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: ({ req, res }) => ({ req, res } as any),
    onError: ({ error, type, path, input, ctx, req }) => {
      logger.error("tRPC error occurred", {
        error: error.message,
        type,
        path,
        input,
        stack: error.stack,
      });
    },
  })
);

// Mirror tRPC under stage path so CloudFront origin path "/v1" works
app.use(
  "/v1/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: ({ req, res }) => ({ req, res } as any),
    onError: ({ error, type, path, input }) => {
      logger.error("tRPC error occurred (/v1)", {
        error: error.message,
        type,
        path,
        input,
        stack: error.stack,
      });
    },
  })
);

logger.info("🏥 Setting up health check endpoint");

// Enhanced health check endpoint with comprehensive diagnostics
app.get("/health", (req, res) => {
  logger.info("Health check requested");

  try {
    const healthData = {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "Digital Persona Platform API",
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
      lambda: {
        region: process.env.AWS_REGION,
        functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
        runtime: process.env.AWS_EXECUTION_ENV,
        memorySize: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE,
        timeout: process.env.AWS_LAMBDA_FUNCTION_TIMEOUT,
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
      config: {
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        corsOrigin: process.env.CORS_ORIGIN || "*",
      },
    };

    logger.info("Health check successful", healthData);
    res.json(healthData);
  } catch (error) {
    logger.error("Health check failed", error);
    res.status(500).json({
      status: "error",
      message: "Health check failed",
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
  }
});

// Health check endpoint with stage prefix (for API Gateway v1 compatibility)
app.get("/v1/health", (req, res) => {
  logger.info("Health check requested with stage prefix");

  try {
    const healthData = {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "Digital Persona Platform API",
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
      stage: "v1",
      lambda: {
        region: process.env.AWS_REGION,
        functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
        runtime: process.env.AWS_EXECUTION_ENV,
        memorySize: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE,
        timeout: process.env.AWS_LAMBDA_FUNCTION_TIMEOUT,
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
      config: {
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        corsOrigin: process.env.CORS_ORIGIN || "*",
      },
    };

    logger.info("Health check successful (with stage prefix)", healthData);
    res.json(healthData);
  } catch (error) {
    logger.error("Health check failed", error);
    res.status(500).json({
      status: "error",
      message: "Health check failed",
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
  }
});

logger.info("🏠 Setting up root endpoint");

// Root endpoint
app.get("/", (req, res) => {
  logger.debug("Root endpoint accessed");
  res.json({
    message: "Digital Persona Platform API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      api: "/api/trpc",
      health: "/health",
      healthWithStage: "/v1/health",
      migrate: "/migrate", // Temporary endpoint for database initialization (custom SQL)
      drizzleMigrate: "/drizzle-migrate", // New endpoint for proper Drizzle migrations
      seed: "/seed", // Temporary endpoint for database seeding
      debugSchema: "/debug-schema", // Temporary endpoint for schema inspection
      fixMigrations: "/fix-migrations", // Temporary endpoint to fix migration tracking
      debugUser: "/debug-user", // Temporary endpoint to check user credentials
    },
    timestamp: new Date().toISOString(),
  });
});

logger.info("🚀 Setting up temporary migration endpoint");

// Temporary migration endpoint for database initialization
app.post("/migrate", async (req, res) => {
  logger.info("Database migration requested");

  try {
    // Import and run migrations
    const { runMigrations } = await import("./migrate.js");
    const result = await runMigrations();

    logger.info("Migration completed", result);
    res.json({
      status: "success",
      message: "Database migration completed successfully",
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Migration failed", error);
    res.status(500).json({
      status: "error",
      message: "Database migration failed",
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
  }
});

logger.info("🔧 Setting up Drizzle migration endpoint");

// New Drizzle-based migration endpoint
app.post("/drizzle-migrate", async (req, res) => {
  logger.info("Drizzle database migration requested");

  try {
    // Import and run Drizzle migrations
    const { runDrizzleMigrations } = await import("./drizzle-migrate.js");
    const result = await runDrizzleMigrations();

    logger.info("Drizzle migration completed", result);
    res.json({
      status: "success",
      message: "Drizzle migrations completed successfully",
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error("Drizzle migration failed", error);
    res.status(500).json({
      status: "error",
      message: "Drizzle migration failed",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

logger.info("🔍 Setting up temporary debug endpoint");

// Temporary debug endpoint for schema inspection
app.get("/debug-schema", async (req, res) => {
  logger.info("Schema debug requested");

  try {
    const postgres = (await import("postgres")).default;
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL not configured");

    const db = postgres(connectionString);

    const columns = await db`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'personas' AND table_schema = 'public' 
      ORDER BY column_name
    `;

    // Test the exact query the migration uses
    const isPublicColumnCheck = await db`
      SELECT COUNT(*) as count 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'personas' 
      AND column_name = 'is_public'
    `;

    await db.end();

    logger.info("Schema debug completed", {
      columnCount: columns.length,
      isPublicCount: isPublicColumnCheck[0].count,
    });

    res.json({
      status: "success",
      columns: columns.map((c) => `${c.column_name}: ${c.data_type}`),
      isPublicColumnCount: isPublicColumnCheck[0].count,
      migrationWouldAdd: Number(isPublicColumnCheck[0].count) === 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error("Schema debug failed", error);
    res.status(500).json({
      status: "error",
      message: "Schema check failed",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

logger.info("🔍 Setting up temporary debug user endpoint");

// Temporary debug user endpoint
app.get("/debug-user", async (req, res) => {
  logger.info("Debug user requested");

  try {
    const postgres = (await import("postgres")).default;
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL not configured");

    const db = postgres(connectionString);

    // Check if user1@seed.local exists
    const testUser = await db`
      SELECT id, email, password_hash, created_at 
      FROM users 
      WHERE email = 'user1@seed.local'
    `;

    // Count total users with seed domain
    const seedUserCount = await db`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE email LIKE '%@seed.local' OR email LIKE '%@dev.seed.local'
    `;

    // Get first few seed users for verification
    const sampleUsers = await db`
      SELECT email, created_at 
      FROM users 
      WHERE email LIKE '%@seed.local' OR email LIKE '%@dev.seed.local'
      ORDER BY created_at 
      LIMIT 5
    `;

    await db.end();

    const result = {
      status: "success",
      targetUser: {
        exists: testUser.length > 0,
        email: testUser.length > 0 ? testUser[0].email : null,
        hasPassword: testUser.length > 0 ? !!testUser[0].password_hash : false,
        passwordLength:
          testUser.length > 0 ? testUser[0].password_hash?.length : 0,
        createdAt: testUser.length > 0 ? testUser[0].created_at : null,
      },
      seedUsers: {
        totalCount: Number(seedUserCount[0].count),
        sampleEmails: sampleUsers.map((u) => u.email),
      },
      timestamp: new Date().toISOString(),
    };

    logger.info("User debug completed", result);
    res.json(result);
  } catch (error: any) {
    logger.error("User debug failed", error);
    res.status(500).json({
      status: "error",
      message: "User debug failed",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

logger.info("🔧 Setting up temporary fix migrations endpoint");

// Temporary fix migrations endpoint
app.post("/fix-migrations", async (req, res) => {
  logger.info("Fix migration tracking requested");

  try {
    const postgres = (await import("postgres")).default;
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL not configured");

    const db = postgres(connectionString);

    // Create drizzle migrations table if it doesn't exist
    await db`
          CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
            id SERIAL PRIMARY KEY,
            hash text NOT NULL,
            created_at bigint
          )
        `;

    // For this specific case, we need to clear existing migration tracking
    // and use a different approach since our custom SQL migration already
    // applied the schema changes
    await db`DELETE FROM "__drizzle_migrations"`;

    // Read migration files from the bundled directory
    const fs = (await import("fs")).default;
    const path = (await import("path")).default;

    let migrationsDir;
    if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
      // Lambda environment - migrations are bundled
      migrationsDir = "/var/task/packages/database/drizzle";
    } else {
      // Local development
      migrationsDir = path.join(process.cwd(), "packages/database/drizzle");
    }

    console.log("📁 Looking for migrations in:", migrationsDir);

    let migrationFiles = [];
    try {
      migrationFiles = fs
        .readdirSync(migrationsDir)
        .filter((file) => file.endsWith(".sql"))
        .sort();
      console.log("📋 Found migration files:", migrationFiles);
    } catch (error) {
      console.warn("⚠️ Could not read migration files, using fallback list");
      // Fallback to known migrations
      migrationFiles = [
        "0000_pink_shockwave.sql",
        "0001_curvy_brood.sql",
        "0002_equal_moonstone.sql",
        "0003_magical_namora.sql",
        "0004_clean_mad_thinker.sql",
      ];
    }

    // Insert all migrations as applied (since database is in correct state)
    let insertedCount = 0;
    for (let i = 0; i < migrationFiles.length; i++) {
      const fileName = migrationFiles[i];
      const migrationName = fileName.replace(".sql", "");
      const timestamp = Date.now() - (migrationFiles.length - i) * 60000;

      console.log(`📝 Marking migration as applied: ${migrationName}`);
      await db`
            INSERT INTO "__drizzle_migrations" (hash, created_at)
            VALUES (${migrationName}, ${timestamp})
          `;
      insertedCount++;
    }

    await db.end();

    logger.info("Migration tracking fixed", {
      insertedCount,
      totalMigrations: migrationFiles.length,
    });

    res.json({
      status: "success",
      message: "Migration tracking fixed",
      migrationsCleared: true,
      migrationsAdded: insertedCount,
      totalMigrations: migrationFiles.length,
      migrationFiles: migrationFiles,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error("Migration tracking fix failed", error);
    res.status(500).json({
      status: "error",
      message: "Migration tracking fix failed",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

logger.info("🌱 Setting up temporary seeding endpoint");

// Temporary seeding endpoint for database population
app.post("/seed", async (req, res) => {
  logger.info("Database seeding requested");

  try {
    // Parse environment variables from request body if provided
    const requestBody = req.body || {};
    const userCount =
      requestBody.userCount || process.env.SEED_USER_COUNT || 300;
    const emailDomain =
      requestBody.emailDomain || process.env.SEED_EMAIL_DOMAIN || "seed.local";

    logger.info("Seeding parameters", { userCount, emailDomain });

    // Set environment variables for seeding script
    process.env.SEED_USER_COUNT = String(userCount);
    process.env.SEED_EMAIL_DOMAIN = emailDomain;

    // Import and run seeding script
    const { main: runSeeding } = await import("./scripts/seedUsers.js");
    await runSeeding();

    logger.info("Database seeding completed successfully");
    res.json({
      status: "success",
      message: "Database seeding completed successfully",
      result: {
        userCount: Number(userCount),
        emailDomain,
        credentialsFile: "data/.local-seed-users.md",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Database seeding failed", error);
    res.status(500).json({
      status: "error",
      message: "Database seeding failed",
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
  }
});

logger.info("🔍 Setting up 404 handler");

// 404 handler
app.use("*", (req, res) => {
  logger.debug("404 - Route not found", {
    url: req.originalUrl,
    method: req.method,
  });
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: ["/", "/health", "/v1/health", "/api/trpc/*"],
  });
});

logger.info("⚡ Creating serverless handler");

// Create serverless handler with enhanced error handling
const handler = serverless(app, {
  // Binary media types for file uploads
  binary: [
    "application/octet-stream",
    "image/*",
    "video/*",
    "audio/*",
    "application/pdf",
  ],
  // Custom request and response transformations
  request: (request: any, event: APIGatewayProxyEvent, context: Context) => {
    logger.debug("Lambda invocation started", {
      httpMethod: event.httpMethod,
      path: event.path,
      requestId: context.awsRequestId,
      functionName: context.functionName,
      remainingTimeInMillis: context.getRemainingTimeInMillis(),
    });
    return request;
  },
  response: (response: any, event: APIGatewayProxyEvent, context: Context) => {
    logger.debug("Lambda invocation completed", {
      statusCode: response.statusCode,
      requestId: context.awsRequestId,
      remainingTimeInMillis: context.getRemainingTimeInMillis(),
    });
    return response;
  },
});

// Wrap handler with global error catching
const wrappedHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    logger.info("🎯 Lambda handler invoked", {
      httpMethod: event.httpMethod,
      path: event.path,
      requestId: context.awsRequestId,
      functionName: context.functionName,
      remainingTimeInMillis: context.getRemainingTimeInMillis(),
    });

    const result = (await handler(event, context)) as APIGatewayProxyResult;

    logger.info("✅ Lambda handler completed successfully", {
      statusCode: result.statusCode,
      requestId: context.awsRequestId,
    });

    return result;
  } catch (error) {
    logger.error("❌ Lambda handler error", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      event: {
        httpMethod: event.httpMethod,
        path: event.path,
        headers: event.headers,
      },
      context: {
        requestId: context.awsRequestId,
        functionName: context.functionName,
        remainingTimeInMillis: context.getRemainingTimeInMillis(),
      },
    });

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*",
      },
      body: JSON.stringify({
        error: "Internal Server Error",
        message: "Lambda function encountered an error",
        requestId: context.awsRequestId,
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.message : String(error),
      }),
    };
  }
};

logger.info("🎉 Lambda setup completed successfully");

export { wrappedHandler as handler };
