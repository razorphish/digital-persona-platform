"use client";

import { useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Simplified authentication middleware that ONLY protects routes
 * Does NOT handle redirects for authenticated users to prevent loops
 */
export function AuthMiddleware() {
  const { isLoading, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  console.log("AuthMiddleware: SIMPLIFIED - route protection only", {
    pathname,
    isLoading,
    isAuthenticated,
    isInitialized,
    currentTime: new Date().toISOString(),
  });

  // Define protected routes that require authentication
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

  // SIMPLIFIED: Only protect routes, don't handle authenticated user redirects
  useEffect(() => {
    // Skip during loading or before initialization
    if (isLoading || !isInitialized) {
      console.log("AuthMiddleware: Still initializing, skipping protection");
      return;
    }

    const isProtectedRoute = protectedRoutes.some((route) =>
      pathname.startsWith(route)
    );

    console.log("AuthMiddleware: Route protection check:", {
      pathname,
      isProtectedRoute,
      isAuthenticated,
    });

    // ONLY handle protected routes - redirect unauthenticated users to login
    if (isProtectedRoute && !isAuthenticated) {
      console.warn(
        `🛡️ Protected route access denied: ${pathname} - redirecting to login`
      );
      router.replace("/");
      return;
    }

    // Do NOT handle authenticated user redirects here - let pages handle their own logic
    // This prevents redirect loops between AuthMiddleware and page-level redirects
  }, [
    isLoading,
    isAuthenticated,
    isInitialized,
    pathname,
    router,
    protectedRoutes,
  ]);

  // This component doesn't render anything
  return null;
}
