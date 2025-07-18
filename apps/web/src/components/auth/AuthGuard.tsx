"use client";

import React, { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
  requiresAuth?: boolean;
}

/**
 * AuthGuard component that protects routes requiring authentication
 * Automatically redirects to login when:
 * - Token is missing
 * - Token is expired
 * - Token is corrupted/invalid
 * - User is not authenticated
 */
export function AuthGuard({
  children,
  fallback,
  redirectTo = "/auth/login",
  requiresAuth = true,
}: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      if (isLoading) return;

      if (requiresAuth && !isAuthenticated) {
        // Clear any potentially corrupted state and redirect
        router.replace(redirectTo);
        return;
      }

      setIsChecking(false);
    };

    checkAuthentication();
  }, [isAuthenticated, isLoading, router, redirectTo, requiresAuth]);

  // Show loading state while checking authentication
  if (isLoading || isChecking) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated, don't render children
  // The redirect will handle navigation
  if (requiresAuth && !isAuthenticated) {
    return null;
  }

  // Render children if authenticated or authentication is not required
  return <>{children}</>;
}

/**
 * Higher-order component for protecting pages
 */
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: ReactNode;
    redirectTo?: string;
    requiresAuth?: boolean;
  }
) {
  const AuthGuardedComponent = (props: P) => {
    return (
      <AuthGuard {...options}>
        <Component {...props} />
      </AuthGuard>
    );
  };

  AuthGuardedComponent.displayName = `withAuthGuard(${
    Component.displayName || Component.name
  })`;

  return AuthGuardedComponent;
}
