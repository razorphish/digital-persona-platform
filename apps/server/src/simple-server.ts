import dotenv from "dotenv";
import path from "path";

// Load environment variables first
dotenv.config({ path: path.resolve("../../.env") });

import express from "express";
import cors from "cors";

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
          `CORS Error: Origin ${origin} not allowed. Allowed origins:`,
          allowedOrigins
        );
        return callback(new Error("Not allowed by CORS"), false);
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// Health endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Basic TRPC endpoint structure
app.post("/api/trpc/*", (req, res) => {
  // Return mock data for now
  res.json({
    result: {
      data: {
        json: [],
      },
    },
  });
});

app.get("/api/trpc/*", (req, res) => {
  // Return mock data for now
  res.json({
    result: {
      data: {
        json: [],
      },
    },
  });
});

app.listen(port, () => {
  console.log(`🚀 Simple server running on http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
});
