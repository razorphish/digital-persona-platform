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

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
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
  const router = useRouter();

  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();

  // Centralized logout function
  const logout = useCallback(() => {
    AuthUtils.clearTokens();
    setUser(null);
    setError(null);
    router.push("/");
  }, [router]);

  // Enhanced authentication checking
  const checkAuthState = useCallback(() => {
    const tokens = AuthUtils.getTokens();

    if (!tokens?.accessToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    // Check if token is expired
    if (AuthUtils.isTokenExpired(tokens.accessToken)) {
      console.warn("Token expired, logging out");
      AuthUtils.clearTokens();
      setUser(null);
      setIsLoading(false);
      return;
    }

    // Extract user data from valid token
    const userData = AuthUtils.getUserFromToken(tokens.accessToken);

    // Be less strict - only require id and email, name is optional
    if (userData && userData.id && userData.email) {
      setUser({
        id: userData.id,
        email: userData.email,
        name: userData.name || "User", // Fallback if name is missing
        createdAt: new Date().toISOString(),
      });
    } else {
      console.warn("Invalid token payload - missing id or email, logging out");
      AuthUtils.clearTokens();
      setUser(null);
    }

    setIsLoading(false);
  }, []);

  // Check for existing authentication on mount
  useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);

  // Periodic token validation (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
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
  }, [user, logout]);

  // Listen for storage changes (token updates in other tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "accessToken") {
        if (e.newValue === null) {
          // Token was removed in another tab
          setUser(null);
        } else {
          // Token was updated in another tab
          checkAuthState();
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [checkAuthState]);

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

      // Don't redirect here - let AuthMiddleware handle all auth-based redirects
      // This prevents race conditions between login redirect and middleware redirect
    } catch (err: any) {
      console.error("Login failed:", err);
      const errorMessage = err?.message || "Login failed. Please try again.";
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

      // Don't redirect here - let AuthMiddleware handle all auth-based redirects
      // This prevents race conditions between register redirect and middleware redirect
    } catch (err: any) {
      const errorMessage =
        err?.message || "Registration failed. Please try again.";
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
