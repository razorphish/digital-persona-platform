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
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Define protected routes that require authentication (memoized for performance)
  const protectedRoutes = useMemo(
    () => [
      "/dashboard",
      "/files",
      "/chat",
      "/social",
      "/analytics",
      "/personas",
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
    // Skip redirect logic during initial loading
    if (isLoading) return;

    const isProtectedRoute = protectedRoutes.some((route) =>
      pathname.startsWith(route)
    );
    const isPublicRoute = publicRoutes.some((route) => pathname === route);
    const isAuthRoute = pathname.startsWith("/auth/");

    // Handle protected routes
    if (isProtectedRoute && !isAuthenticated) {
      console.warn(`Access denied to protected route: ${pathname}`);
      router.replace("/auth/login");
      return;
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
