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
    if (typeof window === "undefined") return null;

    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    if (!accessToken) return null;

    return {
      accessToken,
      refreshToken: refreshToken || undefined,
    };
  },

  // Save tokens to localStorage
  setTokens: (tokens: AuthTokens) => {
    if (typeof window === "undefined") return;

    localStorage.setItem("accessToken", tokens.accessToken);
    if (tokens.refreshToken) {
      localStorage.setItem("refreshToken", tokens.refreshToken);
    }
  },

  // Remove tokens from localStorage
  clearTokens: () => {
    if (typeof window === "undefined") return;

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!AuthUtils.getTokens();
  },

  // Check if token is expired (basic check)
  isTokenExpired: (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  },

  // Get user from token payload
  getUserFromToken: (token: string): Partial<User> | null => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));

      const userData = {
        id: payload.sub || payload.userId,
        email: payload.email,
        name: payload.name,
      };

      return userData;
    } catch (error) {
      console.error("Failed to parse JWT token:", error);
      return null;
    }
  },
};
