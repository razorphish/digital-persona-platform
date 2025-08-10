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
// Dynamic CORS: compute allowed origins per-request based on API host, env, and domain suffixes
app.use((req, res, next) => {
  const requestHost = (req.headers.host || "").toLowerCase();

  // Merge env-provided origins with sensible local defaults
  const envOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
    : [];
  const defaultLocalOrigins = [
    "http://localhost:4000",
    "http://127.0.0.1:4000",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ];
  const baseAllowedOrigins = new Set<string>([...defaultLocalOrigins, ...envOrigins]);

  // Allow-list by domain suffix (e.g., all subdomains of hibiji.com)
  const allowedDomainSuffixes = (process.env.CORS_ALLOW_DOMAIN_SUFFIXES || "hibiji.com")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  // If API host looks like devXX-api.hibiji.com, allow https?://devXX.hibiji.com as well
  if (requestHost.includes("-api.")) {
    const counterpartHost = requestHost.replace("-api.", ".");
    baseAllowedOrigins.add(`https://${counterpartHost}`);
    baseAllowedOrigins.add(`http://${counterpartHost}`);
  }

  return cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      const isExplicitlyAllowed = baseAllowedOrigins.has(origin) || baseAllowedOrigins.has("*");

      let isSuffixAllowed = false;
      if (!isExplicitlyAllowed && allowedDomainSuffixes.length > 0) {
        try {
          const url = new URL(origin);
          const host = url.hostname.toLowerCase();
          isSuffixAllowed = allowedDomainSuffixes.some(
            (suffix) => host === suffix || host.endsWith(`.${suffix}`)
          );
        } catch {
          // ignore parse errors
        }
      }

      if (isExplicitlyAllowed || isSuffixAllowed) {
        return callback(null, true);
      } else {
        console.error(
          `CORS blocked request from origin: ${origin}. Allowed origins: ${Array.from(
            baseAllowedOrigins
          ).join(", ")}`
        );
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    optionsSuccessStatus: 204,
  })(req, res, next);
});

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
