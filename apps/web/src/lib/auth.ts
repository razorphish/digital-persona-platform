// Auth utilities for managing authentication state
export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

// Token management
export const AuthUtils = {
  // Get tokens from localStorage
  getTokens: (): AuthTokens | null => {
    if (typeof window === "undefined") {
      console.log("getTokens: Server side, returning null");
      return null;
    }

    try {
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      console.log("getTokens: Retrieved from localStorage:", {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
      });

      if (!accessToken) return null;

      return {
        accessToken,
        refreshToken: refreshToken || undefined,
      };
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      return null;
    }
  },

  // Save tokens to localStorage
  setTokens: (tokens: AuthTokens) => {
    if (typeof window === "undefined") {
      console.log("setTokens: Server side, skipping");
      return;
    }

    try {
      console.log("setTokens: Saving to localStorage:", {
        hasAccessToken: !!tokens.accessToken,
        hasRefreshToken: !!tokens.refreshToken,
      });

      localStorage.setItem("accessToken", tokens.accessToken);
      if (tokens.refreshToken) {
        localStorage.setItem("refreshToken", tokens.refreshToken);
      }

      console.log("setTokens: Successfully saved tokens");
    } catch (error) {
      console.error("Error saving tokens to localStorage:", error);
    }
  },

  // Remove tokens from localStorage
  clearTokens: () => {
    if (typeof window === "undefined") {
      console.log("clearTokens: Server side, skipping");
      return;
    }

    try {
      console.log("clearTokens: Removing tokens from localStorage");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      console.log("clearTokens: Successfully cleared tokens");
    } catch (error) {
      console.error("Error clearing tokens from localStorage:", error);
    }
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!AuthUtils.getTokens();
  },

  // Check if token is expired (basic check)
  isTokenExpired: (token: string): boolean => {
    try {
      if (!token || typeof token !== "string") {
        console.warn("Invalid token format for expiration check");
        return true;
      }

      const parts = token.split(".");
      if (parts.length !== 3) {
        console.warn("JWT token doesn't have 3 parts");
        return true;
      }

      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Date.now() / 1000;

      if (!payload.exp) {
        console.warn("Token doesn't have expiration time");
        return false; // If no expiration, consider it valid
      }

      const isExpired = payload.exp < currentTime;
      console.log("Token expiration check:", {
        exp: payload.exp,
        currentTime,
        isExpired,
        timeLeft: payload.exp - currentTime,
      });

      return isExpired;
    } catch (error) {
      console.error("Error checking token expiration:", error);
      return true;
    }
  },

  // Get user from token payload
  getUserFromToken: (
    token: string
  ): (Partial<User> & { sub?: string }) | null => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));

      const userData = {
        id: payload.id || payload.sub || payload.userId,
        sub: payload.sub, // Keep sub for fallback use
        email: payload.email,
        name: payload.name,
        createdAt: payload.createdAt,
      };

      return userData;
    } catch (error) {
      console.error("Failed to parse JWT token:", error);
      return null;
    }
  },
};
