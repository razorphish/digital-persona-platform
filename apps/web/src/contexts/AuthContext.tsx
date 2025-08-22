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
  const logoutMutation = trpc.auth.logout.useMutation();

  // Industry-standard secure logout function
  const logout = useCallback(async (skipServerLogout = false) => {
    console.log("🚪 logout: Starting secure logout process...");
    
    try {
      // 1. Attempt server-side logout first (if available and not skipped)
      if (!skipServerLogout) {
        try {
          const tokens = AuthUtils.getTokens();
          if (tokens?.accessToken) {
            console.log("🔌 logout: Attempting server-side logout...");
            await logoutMutation.mutateAsync();
          }
        } catch (serverError) {
          console.warn("⚠️ logout: Server-side logout failed, continuing with client-side logout:", serverError);
          // Continue with client-side logout even if server logout fails
        }
      }

      // 2. Clear all client-side authentication data (industry standard)
      AuthUtils.clearTokens();
      
      // 3. Clear all user state and cached data
      setUser(null);
      setError(null);
      setIsLoading(false);
      
      // 4. Clear any cached API data (if using query cache)
      // This would clear tRPC cache if needed in the future
      
      console.log("✅ logout: Secure logout completed, redirecting to home");
      
      // 5. Redirect to public page
      router.push("/");
      
    } catch (error) {
      console.error("❌ logout: Error during logout process:", error);
      
      // Emergency logout - clear everything even if there are errors
      AuthUtils.clearTokens();
      setUser(null);
      setError(null);
      setIsLoading(false);
      router.push("/");
    }
  }, [router, logoutMutation]);

  // Enhanced authentication checking with better error handling
  const checkAuthState = useCallback(() => {
    try {
      console.log("🔍 checkAuthState: Starting authentication check...");

      // Ensure we're on the client side
      if (typeof window === "undefined") {
        console.log("🔍 checkAuthState: Server side - skipping auth check");
        setIsLoading(false);
        return;
      }

      console.log("🔍 checkAuthState: Client side - checking localStorage...");
      const tokens = AuthUtils.getTokens();
      console.log("🔍 checkAuthState: Retrieved tokens:", {
        hasAccessToken: !!tokens?.accessToken,
        timestamp: new Date().toISOString(),
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
        // Only clear tokens if they're significantly expired (not just a few seconds)
        const tokenData = AuthUtils.getUserFromToken(tokens.accessToken);
        const currentTime = Date.now() / 1000;
        const timeSinceExpiry = currentTime - (tokenData as any)?.exp;

        console.log("Token expiration details:", {
          exp: (tokenData as any)?.exp,
          currentTime,
          timeSinceExpiry,
          gracePeriod: timeSinceExpiry < 60, // 1 minute grace period
        });

        // Give a 1-minute grace period for clock skew
        if (timeSinceExpiry > 60) {
          AuthUtils.clearTokens();
        } else {
          console.log("Token recently expired, keeping for grace period");
        }

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
        // Don't immediately clear tokens on payload issues - might be temporary
        // Let the user stay on current page and try API calls to determine validity
        console.log(
          "Token payload issue detected, but not clearing tokens immediately"
        );
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
    }, 250); // Increased delay to ensure stable hydration

    return () => clearTimeout(timer);
  }, [isInitialized, checkAuthState]); // Include dependencies to prevent stale closures

  // Periodic token validation (every 10 minutes) - reduced frequency to prevent race conditions
  useEffect(() => {
    // Only start periodic validation after initialization
    if (!isInitialized) return;

    const interval = setInterval(() => {
      if (user) {
        console.log("Periodic token validation check");
        const tokens = AuthUtils.getTokens();
        if (!tokens?.accessToken) {
          console.warn("No token found during periodic check, logging out");
          logout();
          return;
        }

        // Be more lenient with expiration checks in periodic validation
        try {
          if (AuthUtils.isTokenExpired(tokens.accessToken)) {
            const tokenData = AuthUtils.getUserFromToken(tokens.accessToken);
            const currentTime = Date.now() / 1000;
            const timeSinceExpiry = currentTime - (tokenData as any)?.exp;

            // Only logout if token is significantly expired (more than 5 minutes)
            if (timeSinceExpiry > 300) {
              console.warn("Token significantly expired during periodic check, logging out");
              logout();
            } else {
              console.log("Token recently expired, allowing grace period in periodic check");
            }
          }
        } catch (error) {
          console.error("Error during periodic token validation:", error);
          // Don't logout on validation errors during periodic checks
        }
      }
    }, 10 * 60 * 1000); // 10 minutes - reduced frequency

    return () => clearInterval(interval);
  }, [user, logout, isInitialized]);

  // Listen for storage changes and logout broadcasts (cross-tab security)
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

    // Set up logout broadcast listener for cross-tab security
    const cleanupBroadcastListener = AuthUtils.setupLogoutBroadcastListener(() => {
      console.log("🔄 Logout broadcast received, logging out current tab");
      // Skip server logout since it was already done in the originating tab
      logout(true);
    });

    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      if (cleanupBroadcastListener) cleanupBroadcastListener();
    };
  }, [checkAuthState, isInitialized, logout]);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);

      console.log("🔐 login: Starting login process...");
      const result = await loginMutation.mutateAsync({
        email,
        password,
      });

      console.log("🔐 login: Login API successful, saving tokens...");
      // Save tokens
      AuthUtils.setTokens({
        accessToken: result.token,
      });

      // Verify tokens were saved properly
      const verifyTokens = AuthUtils.getTokens();
      console.log("🔑 login: Token verification after save:", {
        tokenSaved: !!verifyTokens?.accessToken,
        tokenMatches: verifyTokens?.accessToken === result.token,
        tokenLength: verifyTokens?.accessToken?.length,
      });

      if (!verifyTokens?.accessToken) {
        console.error(
          "❌ login: Token was not saved properly to localStorage!"
        );
        throw new Error("Failed to save authentication token");
      }

      // Set user state
      setUser(result.user);
      setError(null);
      setIsInitialized(true);

      console.log(
        "✅ login: Login successful, user authenticated:",
        result.user
      );

      // Don't redirect here - let AuthMiddleware handle all auth-based redirects
      // This prevents race conditions between login redirect and middleware redirect
    } catch (err: any) {
      console.error("Login failed:", err);
      const errorMessage = ErrorHandler.getAuthErrorMessage(err);
      setError(errorMessage);

      // Industry-standard: Clear any potentially corrupted tokens on login failure
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

      // Industry-standard: Clear any potentially corrupted tokens on registration failure
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
