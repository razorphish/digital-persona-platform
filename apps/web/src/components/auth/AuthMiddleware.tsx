"use client";

import { useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthUtils } from "@/lib/auth";

/**
 * Authentication middleware that runs globally to:
 * - Monitor authentication state changes
 * - Handle automatic redirects for protected routes
 * - Clear corrupted authentication state
 * - Provide consistent auth behavior across the app
 */
export function AuthMiddleware() {
  const { user, isLoading, isAuthenticated, isInitialized, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Add debug logging
  console.log("AuthMiddleware check:", {
    pathname,
    isLoading,
    isAuthenticated,
    isInitialized,
    hasUser: !!user,
    currentTime: new Date().toISOString(),
  });

  // Define protected routes that require authentication (memoized for performance)
  const protectedRoutes = useMemo(
    () => [
      "/dashboard",
      "/files",
      "/chat",
      "/social",
      "/analytics",
      "/personas",
      "/learning",
      "/monetization",
      "/privacy",
    ],
    []
  );

  // Define public routes that don't require authentication (memoized for performance)
  const publicRoutes = useMemo(
    () => [
      "/",
      "/auth/login",
      "/auth/register",
      "/test", // Test page is publicly accessible
    ],
    []
  );

  useEffect(() => {
    // Skip redirect logic during initial loading or before auth system is initialized
    if (isLoading || !isInitialized) {
      console.log(
        "AuthMiddleware: Still loading or not initialized, skipping redirects",
        {
          isLoading,
          isInitialized,
        }
      );
      return;
    }

    const isProtectedRoute = protectedRoutes.some((route) =>
      pathname.startsWith(route)
    );
    const isPublicRoute = publicRoutes.some((route) => pathname === route);
    const isAuthRoute = pathname.startsWith("/auth/");

    console.log("AuthMiddleware: Route analysis:", {
      isProtectedRoute,
      isPublicRoute,
      isAuthRoute,
      isAuthenticated,
    });

    // Handle protected routes - but be less aggressive on first load
    if (isProtectedRoute && !isAuthenticated) {
      // Give more time to allow for auth state restoration
      const timer = setTimeout(() => {
        // Re-check authentication state before redirecting
        const tokens = AuthUtils.getTokens();
        if (!tokens?.accessToken) {
          console.warn(
            `Access denied to protected route: ${pathname} - no valid token found`
          );
          router.replace("/auth/login");
        } else {
          console.log(
            `Protected route access delayed - token exists, waiting for auth context`
          );
          // If token exists but user not authenticated, give more time
          setTimeout(() => {
            const stillNotAuthenticated = !AuthUtils.getTokens()?.accessToken;
            if (stillNotAuthenticated) {
              console.warn(
                `Final redirect to login - auth state not resolved for ${pathname}`
              );
              router.replace("/auth/login");
            }
          }, 300); // Additional delay if token exists
        }
      }, 500); // Increased from 200ms to 500ms

      return () => clearTimeout(timer);
    }

    // Redirect authenticated users away from auth pages
    if (isAuthRoute && isAuthenticated) {
      console.info("Authenticated user redirected from auth page to dashboard");
      router.replace("/dashboard");
      return;
    }

    // Validate token integrity for authenticated users
    if (isAuthenticated && user) {
      const tokens = AuthUtils.getTokens();

      if (!tokens?.accessToken) {
        console.warn("Missing token for authenticated user, logging out");
        logout();
        return;
      }

      if (AuthUtils.isTokenExpired(tokens.accessToken)) {
        console.warn("Expired token detected, logging out");
        logout();
        return;
      }

      // Validate token payload integrity - but be less strict to prevent immediate logout
      const userData = AuthUtils.getUserFromToken(tokens.accessToken);

      // Only logout if token is completely invalid (null), not if some fields are missing
      if (!userData) {
        console.warn("Completely invalid token payload detected, logging out");
        logout();
        return;
      }
    }
  }, [
    isLoading,
    isAuthenticated,
    isInitialized,
    user,
    pathname,
    router,
    logout,
    protectedRoutes,
    publicRoutes,
  ]);

  // Listen for browser navigation events that might bypass our auth checks
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Validate token before page unload
      if (isAuthenticated) {
        const tokens = AuthUtils.getTokens();
        if (
          !tokens?.accessToken ||
          AuthUtils.isTokenExpired(tokens.accessToken)
        ) {
          AuthUtils.clearTokens();
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isAuthenticated]);

  // Listen for browser focus events to check auth state
  useEffect(() => {
    const handleFocus = () => {
      // Re-validate authentication when user returns to tab
      if (isAuthenticated) {
        const tokens = AuthUtils.getTokens();
        if (
          !tokens?.accessToken ||
          AuthUtils.isTokenExpired(tokens.accessToken)
        ) {
          console.warn("Token expired while tab was inactive, logging out");
          logout();
        }
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [isAuthenticated, logout]);

  // This component doesn't render anything
  return null;
}
