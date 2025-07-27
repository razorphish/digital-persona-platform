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

      // Don't handle auth errors if we're already on auth pages
      // This prevents redirects during login/register attempts with invalid credentials
      const isOnAuthPage = window.location.pathname.startsWith("/auth/");
      if (isOnAuthPage) {
        return;
      }

      // Handle authentication/authorization errors for authenticated sessions only
      if (isAuthError) {
        console.warn("Session expired or invalid. Redirecting to login.");

        // Clear corrupted/invalid tokens
        AuthUtils.clearTokens();

        // Redirect to login page
        window.location.href = "/auth/login";
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
                // Token is expired, clear it and don't send authorization header
                AuthUtils.clearTokens();
                return {};
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
                response.status
              );

              // Clear corrupted/invalid tokens
              AuthUtils.clearTokens();

              // Check if we're not already on login page to prevent redirect loops
              if (!window.location.pathname.startsWith("/auth/")) {
                window.location.href = "/auth/login";
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
