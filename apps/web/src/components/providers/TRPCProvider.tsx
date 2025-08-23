"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthUtils } from "@/lib/auth";
import { ErrorHandler } from "@/lib/errorHandling";
import superjson from "superjson";

// Import the actual AppRouter type from the server
import type { AppRouter } from "../../../../server/src/router.js";

export const trpc = createTRPCReact<AppRouter>();

function getBaseUrl() {
  if (typeof window !== "undefined") {
    // In the browser, we use the API URL from environment
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";
  }
  // When rendering on the server, we return an absolute URL

  // reference for vercel.com
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // assume localhost with correct port
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 60 * 1000,
            // Global error handling for queries
            onError: (error) => {
              handleGlobalError(error);
            },
          },
          mutations: {
            // Global error handling for mutations
            onError: (error) => {
              handleGlobalError(error);
            },
          },
        },
      })
  );

  // Global error handler with user-friendly messages
  const handleGlobalError = (error: unknown) => {
    if (typeof window === "undefined") return;

    // Get user-friendly error message
    const friendlyMessage = ErrorHandler.getUserFriendlyMessage(error);

    // Log technical details for debugging (only in development)
    if (process.env.NODE_ENV === "development") {
      console.error("Technical error details:", error);
    }

    // Log user-friendly message
    console.error("User-facing error:", friendlyMessage);

    // Check if error is a tRPC error with authentication issues
    const isTRPCError = error instanceof TRPCClientError;
    if (isTRPCError) {
      const status = error.data?.httpStatus;
      const isAuthError = status === 401 || status === 403;

      // Don't handle auth errors if we're already on auth pages or login page
      // This prevents redirects during login/register attempts with invalid credentials
      const isOnAuthPage =
        window.location.pathname.startsWith("/auth/") ||
        window.location.pathname === "/";
      if (isOnAuthPage) {
        return;
      }

      // Re-enable conservative auth error handling
      if (isAuthError) {
        console.warn("🔒 Auth error detected - handling conservatively:", {
          status,
          error,
          pathname: window.location.pathname,
        });

        // Clear corrupted/invalid tokens
        AuthUtils.clearTokens();

        // Conservative redirect with delay to prevent loops
        console.log("🔄 Redirecting to login in 1 second due to auth error");
        setTimeout(() => {
          window.location.href = "/";
        }, 1000); // 1 second delay to prevent rapid redirects
      }
    }
  };

  // Re-enable tRPC client for proper API calls
  const [trpcClient] = useState(() =>
    trpc.createClient({
      transformer: superjson,
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          // You can pass any HTTP headers you wish here
          async headers() {
            if (typeof window === "undefined") {
              // During SSR, don't access localStorage
              return {};
            }

            const tokens = AuthUtils.getTokens();

            // Check token validity before sending requests
            if (tokens?.accessToken) {
              if (AuthUtils.isTokenExpired(tokens.accessToken)) {
                // Token is expired, but don't clear it immediately in headers function
                // Let the response handling deal with 401 errors instead
                console.warn(
                  "🕐 Token appears expired, but letting server decide"
                );

                // Still send the token - let the server respond with 401 if truly invalid
                // This prevents race conditions where tokens are cleared too aggressively
                return {
                  authorization: `Bearer ${tokens.accessToken}`,
                };
              }

              return {
                authorization: `Bearer ${tokens.accessToken}`,
              };
            }

            return {};
          },
          // Custom fetch with auth error handling
          fetch: async (url, options) => {
            const response = await fetch(url, options);

            // Handle authentication errors at the HTTP level
            if (response.status === 401 || response.status === 403) {
              console.warn(
                "HTTP authentication error detected:",
                response.status,
                "URL:",
                url
              );

              // Don't clear tokens immediately on first 401 - might be a temporary issue
              // Only clear tokens if we're not on an auth page and this isn't during initial load
              const isInitialLoad = performance.navigation?.type === 1; // PAGE_LOAD type
              const isOnAuthPage =
                window.location.pathname.startsWith("/auth/") ||
                window.location.pathname === "/";

              console.log("401 Response context:", {
                isInitialLoad,
                isOnAuthPage,
                pathname: window.location.pathname,
                url: url.toString(),
              });

              if (!isOnAuthPage && !isInitialLoad) {
                console.warn("Clearing tokens due to confirmed 401 response");
                AuthUtils.clearTokens();

                // Add a small delay to prevent race conditions
                setTimeout(() => {
                  if (
                    !window.location.pathname.startsWith("/auth/") &&
                    window.location.pathname !== "/"
                  ) {
                    window.location.href = "/";
                  }
                }, 100);
              } else {
                console.log("Skipping token clear - initial load or auth page");
              }
            }

            return response;
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
