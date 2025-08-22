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
      "/feed",
      "/dashboard",
      "/files",
      "/social",
      "/analytics",
      "/personas",
      "/creator",
      "/safety",
      "/monetization",
      "/privacy",
      "/account",
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
      pathname,
      isProtectedRoute,
      isPublicRoute,
      isAuthRoute,
      isAuthenticated,
      hasUser: !!user,
    });

    // Handle protected routes - only redirect if clearly not authenticated
    if (isProtectedRoute && !isAuthenticated) {
      console.warn(
        `Access denied to protected route: ${pathname} - redirecting to login`
      );
      router.replace("/");
      return;
    }

    // Only redirect authenticated users from root path, not from auth routes
    // This prevents redirect loops during login process
    if (pathname === "/" && isAuthenticated && user) {
      console.info("Authenticated user redirected to dashboard from root");
      router.replace("/dashboard");
      return;
    }

    // Don't redirect from auth routes - let the auth pages handle their own logic
    // This prevents loops when login process is completing

    // Only validate token integrity if user is authenticated and has a user object
    // Add debouncing to prevent rapid logout/login cycles
    if (isAuthenticated && user) {
      const tokens = AuthUtils.getTokens();

      if (!tokens?.accessToken) {
        console.warn("Missing token for authenticated user, logging out");
        logout();
        return;
      }

      // Be more lenient with token expiration to prevent race conditions
      try {
        if (AuthUtils.isTokenExpired(tokens.accessToken)) {
          const tokenData = AuthUtils.getUserFromToken(tokens.accessToken);
          const currentTime = Date.now() / 1000;
          const timeSinceExpiry = currentTime - (tokenData as any)?.exp;

          // Only logout if token is significantly expired (more than 2 minutes)
          if (timeSinceExpiry > 120) {
            console.warn("Token significantly expired, logging out");
            logout();
            return;
          } else {
            console.log("Token recently expired, allowing grace period");
          }
        }
      } catch (error) {
        console.error("Error checking token expiration:", error);
        // Don't logout on token parsing errors - might be temporary
      }

      // Validate token payload integrity - be very lenient
      try {
        const userData = AuthUtils.getUserFromToken(tokens.accessToken);
        
        // Only logout if token is completely invalid AND we can't extract any data
        if (!userData || (!userData.id && !userData.sub && !userData.email)) {
          console.warn("Completely invalid token payload detected, logging out");
          logout();
          return;
        }
      } catch (error) {
        console.error("Error validating token payload:", error);
        // Don't logout on parsing errors - might be temporary
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
