import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import serverless from "serverless-http";
import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./router-simple.js";

// Create Express app
const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);

app.use(express.json());

// tRPC middleware
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: ({ req, res }) => ({ req, res }),
  })
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Digital Persona Platform API",
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
  });
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

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: ["/", "/health", "/api/trpc/*"],
  });
});

// Create serverless handler
const handler = serverless(app, {
  // Binary media types for file uploads
  binary: [
    "application/octet-stream",
    "image/*",
    "video/*",
    "audio/*",
    "application/pdf",
  ],
});

export { handler };
