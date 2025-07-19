import { initTRPC } from "@trpc/server";
import superjson from "superjson";

// Initialize tRPC
const t = initTRPC.create({
  transformer: superjson,
});

// Base router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;

// Main app router with just hello endpoint
export const appRouter = router({
  hello: publicProcedure.query(() => {
    return {
      message: "Hello World from tRPC server!",
      timestamp: new Date().toISOString(),
      status: "success",
    };
  }),
});

export type AppRouter = typeof appRouter;
