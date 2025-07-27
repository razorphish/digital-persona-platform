import { TRPCClientError } from "@trpc/client";

/**
 * Converts technical errors into user-friendly messages
 */
export class ErrorHandler {
  static getUserFriendlyMessage(error: any): string {
    // Only handle complex errors in browser environment to avoid static generation issues
    if (typeof window === "undefined") {
      return "Something went wrong. Please try again.";
    }

    // Handle network errors
    if (
      error?.message?.includes("NetworkError") ||
      error?.message?.includes("fetch") ||
      error?.message?.includes("Failed to fetch")
    ) {
      return "Unable to connect to the server. Please check your internet connection and try again.";
    }

    // Handle tRPC errors (with runtime check)
    if (
      typeof TRPCClientError !== "undefined" &&
      error instanceof TRPCClientError
    ) {
      const httpStatus = error.data?.httpStatus;

      switch (httpStatus) {
        case 400:
          return "Invalid request. Please check your information and try again.";
        case 401:
          return "Invalid credentials. Please check your email and password.";
        case 403:
          return "Access denied. You don't have permission to perform this action.";
        case 404:
          return "The requested resource was not found.";
        case 409:
          return "This email address is already registered. Please use a different email or try logging in.";
        case 429:
          return "Too many requests. Please wait a moment and try again.";
        case 500:
          return "Server error. Our team has been notified. Please try again later.";
        case 503:
          return "Service temporarily unavailable. Please try again in a few moments.";
        default:
          // Try to extract meaningful message from tRPC error
          if (error.message?.includes("email already exists")) {
            return "This email address is already registered. Please use a different email or try logging in.";
          }
          if (error.message?.includes("Invalid credentials")) {
            return "Invalid email or password. Please check your credentials and try again.";
          }
          if (error.message?.includes("User not found")) {
            return "No account found with this email address. Please check your email or register for a new account.";
          }
          return "Something went wrong. Please try again.";
      }
    }

    // Handle validation errors
    if (
      error?.message?.includes("validation") ||
      error?.message?.includes("required") ||
      error?.message?.includes("Invalid")
    ) {
      return "Please check your information and try again.";
    }

    // Handle timeout errors
    if (
      error?.message?.includes("timeout") ||
      error?.message?.includes("ETIMEDOUT")
    ) {
      return "Request timed out. Please try again.";
    }

    // Handle connection errors
    if (
      error?.message?.includes("ECONNREFUSED") ||
      error?.message?.includes("Connection") ||
      error?.code === "ECONNREFUSED"
    ) {
      return "Unable to connect to the server. Please try again later.";
    }

    // Handle abort errors
    if (error?.name === "AbortError" || error?.message?.includes("aborted")) {
      return "Request was cancelled. Please try again.";
    }

    // Generic fallback for unknown errors
    if (error?.message) {
      // If it's already a user-friendly message, keep it
      if (
        !error.message.includes("Error:") &&
        !error.message.includes("TypeError:") &&
        !error.message.includes("ReferenceError:") &&
        error.message.length < 100
      ) {
        return error.message;
      }
    }

    // Last resort fallback
    return "Something went wrong. Please try again.";
  }

  /**
   * Shows a user-friendly notification for errors
   */
  static showErrorNotification(error: any) {
    const message = this.getUserFriendlyMessage(error);

    // Create a simple toast notification
    if (typeof window !== "undefined") {
      // For now, just console.error with the friendly message
      // In a production app, you'd use a toast library like react-hot-toast
      console.error("User Error:", message);

      // You could also show an alert for immediate feedback
      // alert(message);
    }

    return message;
  }

  /**
   * Handles authentication-specific errors
   */
  static getAuthErrorMessage(error: any): string {
    // Handle in browser environment only
    if (typeof window === "undefined") {
      return "Authentication failed. Please try again.";
    }

    if (
      error?.message?.includes("email already exists") ||
      error?.message?.includes("CONFLICT")
    ) {
      return "An account with this email already exists. Please try logging in instead.";
    }

    if (
      error?.message?.includes("Invalid credentials") ||
      error?.message?.includes("authentication failed")
    ) {
      return "Invalid email or password. Please check your credentials.";
    }

    if (error?.message?.includes("password")) {
      return "Password must be at least 8 characters long.";
    }

    if (error?.message?.includes("email")) {
      return "Please enter a valid email address.";
    }

    return this.getUserFriendlyMessage(error);
  }
}
