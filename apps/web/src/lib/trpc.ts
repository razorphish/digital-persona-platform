import { createTRPCNext } from "@trpc/next";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import superjson from "superjson";

// Import the actual AppRouter type from the server
import type { AppRouter } from "../../../server/src/router.js";

const getBaseUrl = () => {
  if (typeof window !== "undefined")
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001"; // browser should use API URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001"; // dev SSR should use correct API URL
};

// Re-export the trpc instance from TRPCProvider to avoid conflicts
export { trpc } from "../components/providers/TRPCProvider";

// Note: The main tRPC client is now configured in TRPCProvider.tsx
// This maintains compatibility while using the React Query based setup

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
