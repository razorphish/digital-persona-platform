import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@digital-persona/database";
import { passwordResetTokens, users } from "@digital-persona/database/schema";

export class PasswordResetUtils {
  private static readonly TOKEN_EXPIRY_HOURS = 24; // 24 hours
  private static readonly TOKEN_LENGTH = 32;

  /**
   * Generate a secure random token for password reset
   */
  static generateResetToken(): string {
    return crypto.randomBytes(this.TOKEN_LENGTH).toString("hex");
  }

  /**
   * Create a password reset token for a user
   */
  static async createResetToken(userId: string): Promise<string> {
    // First, invalidate any existing tokens for this user
    await this.invalidateUserTokens(userId);

    const token = this.generateResetToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.TOKEN_EXPIRY_HOURS);

    await db.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt,
    });

    return token;
  }

  /**
   * Validate a password reset token
   */
  static async validateResetToken(token: string): Promise<{
    isValid: boolean;
    userId?: string;
    error?: string;
  }> {
    try {
      const resetToken = await db
        .select()
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.token, token))
        .limit(1);

      if (!resetToken[0]) {
        return { isValid: false, error: "Invalid token" };
      }

      const tokenData = resetToken[0];

      // Check if token is expired
      if (new Date() > tokenData.expiresAt) {
        return { isValid: false, error: "Token expired" };
      }

      // Check if token is already used
      if (tokenData.usedAt) {
        return { isValid: false, error: "Token already used" };
      }

      // Verify user still exists and is active
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, tokenData.userId))
        .limit(1);

      if (!user[0] || !user[0].isActive) {
        return { isValid: false, error: "User not found or inactive" };
      }

      return { isValid: true, userId: tokenData.userId };
    } catch (error) {
      console.error("Error validating reset token:", error);
      return { isValid: false, error: "Token validation failed" };
    }
  }

  /**
   * Mark a reset token as used
   */
  static async markTokenAsUsed(token: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.token, token));
  }

  /**
   * Invalidate all reset tokens for a user
   */
  static async invalidateUserTokens(userId: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.userId, userId));
  }

  /**
   * Clean up expired tokens (can be run as a cron job)
   */
  static async cleanupExpiredTokens(): Promise<number> {
    const result = await db
      .delete(passwordResetTokens)
      .where(
        eq(passwordResetTokens.expiresAt, new Date()) // This will need to be adjusted for proper date comparison
      );
    
    return result.rowCount || 0;
  }

  /**
   * Generate a password reset URL
   */
  static generateResetUrl(token: string, baseUrl: string): string {
    return `${baseUrl}/auth/reset-password?token=${token}`;
  }
}
