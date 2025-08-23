"use client";

import { useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Re-enabled AuthMiddleware with conservative route protection only
 */
export function AuthMiddleware() {
  const { isLoading, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  console.log("✅ AuthMiddleware: RE-ENABLED - Conservative route protection", {
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

  // Conservative route protection - ONLY protect routes, no other redirects
  useEffect(() => {
    // Skip during loading or before initialization
    if (isLoading || !isInitialized) {
      console.log("AuthMiddleware: Still initializing, skipping protection");
      return;
    }

    const isProtectedRoute = protectedRoutes.some((route) =>
      pathname.startsWith(route)
    );

    console.log("AuthMiddleware: Conservative route protection check:", {
      pathname,
      isProtectedRoute,
      isAuthenticated,
    });

    // ONLY handle protected routes - redirect unauthenticated users to login
    // Add delay to prevent race conditions with auth state changes
    if (isProtectedRoute && !isAuthenticated) {
      console.warn(
        `🛡️ Protected route access denied: ${pathname} - redirecting to login in 200ms`
      );
      
      const protectionTimer = setTimeout(() => {
        console.log("🚨 Executing protection redirect to login");
        router.replace("/");
      }, 200); // Small delay to prevent race conditions
      
      return () => clearTimeout(protectionTimer);
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
