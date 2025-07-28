"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { AuthUtils, User } from "@/lib/auth";
import { ErrorHandler } from "@/lib/errorHandling";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
  checkAuthState: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  // Debug logging for state changes
  useEffect(() => {
    console.log("AuthProvider state change:", {
      hasUser: !!user,
      isLoading,
      isInitialized,
      isAuthenticated: !!user,
      timestamp: new Date().toISOString(),
    });
  }, [user, isLoading, isInitialized]);

  // Re-enable tRPC mutations for proper API calls
  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();

  // Centralized logout function
  const logout = useCallback(() => {
    console.log("Logging out user");
    AuthUtils.clearTokens();
    setUser(null);
    setError(null);
    setIsLoading(false);
    // Keep isInitialized as true since we've explicitly logged out
    router.push("/");
  }, [router]);

  // Enhanced authentication checking with better error handling
  const checkAuthState = useCallback(() => {
    try {
      console.log("Checking auth state...");

      // Ensure we're on the client side
      if (typeof window === "undefined") {
        console.log("Server side - skipping auth check");
        setIsLoading(false);
        return;
      }

      const tokens = AuthUtils.getTokens();
      console.log("Retrieved tokens:", {
        hasAccessToken: !!tokens?.accessToken,
      });

      if (!tokens?.accessToken) {
        console.log("No access token found - user not authenticated");
        setUser(null);
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }

      // Check if token is expired (with more graceful error handling)
      const isExpired = AuthUtils.isTokenExpired(tokens.accessToken);
      console.log("Token expiration check:", { isExpired });

      if (isExpired) {
        console.warn("Token expired, clearing auth state");
        AuthUtils.clearTokens();
        setUser(null);
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }

      // Extract user data from valid token (with better error handling)
      const userData = AuthUtils.getUserFromToken(tokens.accessToken);
      console.log("Extracted user data:", {
        userData,
        hasId: !!userData?.id,
        hasEmail: !!userData?.email,
      });

      // More lenient validation - only require basic fields
      if (userData && (userData.id || userData.sub) && userData.email) {
        const authenticatedUser = {
          id: userData.id || userData.sub || "unknown",
          email: userData.email,
          name: userData.name || userData.email.split("@")[0] || "User", // More fallbacks
          createdAt: userData.createdAt || new Date().toISOString(),
        };

        console.log("Setting authenticated user:", authenticatedUser);
        setUser(authenticatedUser);
      } else {
        console.warn("Invalid token payload - missing critical fields:", {
          userData,
        });
        // Clear invalid tokens to prevent redirect loops
        console.log("Clearing invalid tokens");
        AuthUtils.clearTokens();
        setUser(null);
      }

      setIsLoading(false);
      setIsInitialized(true);
    } catch (error) {
      console.error("Error checking auth state:", error);
      // On error, don't clear tokens immediately - might be temporary issue
      setUser(null);
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  // Check for existing authentication on mount (only once after hydration)
  useEffect(() => {
    // Add a small delay to ensure client-side hydration is complete
    const timer = setTimeout(() => {
      if (!isInitialized) {
        console.log("Initializing auth state on mount");
        checkAuthState();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isInitialized, checkAuthState]); // Include dependencies to prevent stale closures

  // Periodic token validation (every 5 minutes)
  useEffect(() => {
    // Only start periodic validation after initialization
    if (!isInitialized) return;

    const interval = setInterval(() => {
      if (user) {
        console.log("Periodic token validation check");
        const tokens = AuthUtils.getTokens();
        if (
          !tokens?.accessToken ||
          AuthUtils.isTokenExpired(tokens.accessToken)
        ) {
          console.warn("Token expired during session, logging out");
          logout();
        }
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user, logout, isInitialized]);

  // Listen for storage changes (token updates in other tabs)
  useEffect(() => {
    // Only listen for storage changes after initialization
    if (!isInitialized) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "accessToken") {
        console.log("Storage change detected for accessToken:", {
          newValue: !!e.newValue,
          oldValue: !!e.oldValue,
        });

        if (e.newValue === null) {
          // Token was removed in another tab
          console.log("Token removed in another tab, logging out");
          setUser(null);
          setError(null);
        } else {
          // Token was updated in another tab
          console.log("Token updated in another tab, re-checking auth state");
          checkAuthState();
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [checkAuthState, isInitialized]);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);

      const result = await loginMutation.mutateAsync({
        email,
        password,
      });

      // Save tokens
      AuthUtils.setTokens({
        accessToken: result.token,
      });

      // Set user state
      setUser(result.user);
      setError(null);
      setIsInitialized(true);

      console.log("Login successful, user authenticated:", result.user);

      // Don't redirect here - let AuthMiddleware handle all auth-based redirects
      // This prevents race conditions between login redirect and middleware redirect
    } catch (err: any) {
      console.error("Login failed:", err);
      const errorMessage = ErrorHandler.getAuthErrorMessage(err);
      setError(errorMessage);

      // Clear any potentially corrupted tokens
      AuthUtils.clearTokens();
      setUser(null);

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      setError(null);
      setIsLoading(true);

      const result = await registerMutation.mutateAsync({
        email,
        password,
        name,
      });

      // Save tokens
      AuthUtils.setTokens({
        accessToken: result.token,
      });

      // Set user state
      setUser(result.user);
      setError(null);
      setIsInitialized(true);

      console.log("Registration successful, user authenticated:", result.user);

      // Don't redirect here - let AuthMiddleware handle all auth-based redirects
      // This prevents race conditions between register redirect and middleware redirect
    } catch (err: any) {
      console.error("Registration failed:", err);
      const errorMessage = ErrorHandler.getAuthErrorMessage(err);
      setError(errorMessage);

      // Clear any potentially corrupted tokens
      AuthUtils.clearTokens();
      setUser(null);

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isInitialized,
    login,
    register,
    logout,
    error,
    clearError,
    checkAuthState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
