import dotenv from "dotenv";
import path from "path";

// Load environment variables from project root .env file
dotenv.config({ path: path.resolve("../../.env") });

import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./router.js";

const app = express();
const port = Number(process.env.PORT) || 4001;

// Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = process.env.CORS_ORIGIN?.split(",").map((o) =>
        o.trim()
      ) || ["http://localhost:4000"];

      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Check if the origin is in the allowed list
      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.error(
          `CORS blocked request from origin: ${origin}. Allowed origins: ${allowedOrigins.join(
            ", "
          )}`
        );
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// tRPC middleware
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: ({ req, res }) => ({ req, res } as any),
  })
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Digital Persona Platform API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      api: "/api/trpc",
      health: "/health",
    },
    timestamp: new Date().toISOString(),
  });
});

// Favicon endpoint (prevents CSP errors)
app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

// 404 handler for unknown routes
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: ["/", "/health", "/api/trpc/*"],
  });
});

// Start server
app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${port}`);
  console.log(`📚 tRPC API available at http://0.0.0.0:${port}/api/trpc`);
  console.log(`🏥 Health check available at http://0.0.0.0:${port}/health`);
});
