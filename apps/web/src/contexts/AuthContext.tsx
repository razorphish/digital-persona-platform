"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      const tokens = AuthUtils.getTokens();

      if (tokens && !AuthUtils.isTokenExpired(tokens.accessToken)) {
        const userData = AuthUtils.getUserFromToken(tokens.accessToken);
        if (userData) {
          setUser({
            id: userData.id!,
            email: userData.email!,
            name: userData.name!,
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        AuthUtils.clearTokens();
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

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

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      const errorMessage = err?.message || "Login failed. Please try again.";
      setError(errorMessage);
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

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      const errorMessage =
        err?.message || "Registration failed. Please try again.";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    AuthUtils.clearTokens();
    setUser(null);
    router.push("/");
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
