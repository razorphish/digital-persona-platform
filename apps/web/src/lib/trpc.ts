import { createTRPCNext } from "@trpc/next";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import superjson from "superjson";

import type { AppRouter } from "@server/router";

const getBaseUrl = () => {
  if (typeof window !== "undefined")
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001"; // browser should use API URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001"; // dev SSR should use correct API URL
};

export const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      transformer: superjson,
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          headers() {
            if (typeof window === "undefined") {
              // During SSR, don't access localStorage
              return {};
            }
            return {
              authorization: localStorage.getItem("accessToken")
                ? `Bearer ${localStorage.getItem("accessToken")}`
                : "",
            };
          },
        }),
      ],
    };
  },
  ssr: false,
});

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
