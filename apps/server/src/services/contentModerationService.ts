import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, desc, gte, lte, count, sql } from "drizzle-orm";
import { OpenAI } from "openai";
import {
  contentModerations,
  userSafetyProfiles,
  interactionRatings,
  safetyIncidents,
  contentPolicies,
  users,
  personas,
  conversations,
  messages,
} from "@digital-persona/database/schema";

interface ContentModerationRequest {
  contentType:
    | "message"
    | "persona_description"
    | "user_profile"
    | "media"
    | "conversation";
  contentId: string;
  userId?: string;
  personaId?: string;
  content: string;
  metadata?: any;
}

export interface ModerationResult {
  id: string;
  status: "pending" | "approved" | "flagged" | "blocked" | "under_review";
  aiModerationScore: number;
  flaggedCategories: string[];
  severity: "low" | "medium" | "high" | "critical";
  ageRating: "all_ages" | "teen" | "mature" | "adults_only";
  complianceFlags: string[];
  actionRequired: boolean;
  recommendations: string[];
}

export interface SafetyProfile {
  userId: string;
  overallSafetyScore: number;
  trustLevel: "new" | "trusted" | "verified" | "flagged" | "restricted";
  totalInteractions: number;
  flaggedInteractions: number;
  contentViolations: number;
  isRestricted: boolean;
  familyFriendlyMode: boolean;
}

export class ContentModerationService {
  private openai: OpenAI;
  private db: ReturnType<typeof drizzle>;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn(
        "OPENAI_API_KEY not configured. Content moderation will use basic filtering only."
      );
      this.openai = null as any;
    } else {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
    }

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is required");
    }

    const client = postgres(connectionString);
    this.db = drizzle(client);
  }

  /**
   * Main content moderation function - analyzes content and creates moderation record
   */
  async moderateContent(
    request: ContentModerationRequest
  ): Promise<ModerationResult> {
    try {
      // Get AI moderation results
      const aiResults = await this.getAIModerationResults(request.content);

      // Analyze content for age rating and compliance
      const contentAnalysis = await this.analyzeContentCompliance(
        request.content,
        request.contentType
      );

      // Get user safety profile if available
      let userSafetyProfile = null;
      if (request.userId) {
        userSafetyProfile = await this.getUserSafetyProfile(request.userId);
      }

      // Determine overall moderation status
      const moderationStatus = this.calculateModerationStatus(
        aiResults,
        contentAnalysis,
        userSafetyProfile
      );

      // Create moderation record
      const moderationRecord = await this.db
        .insert(contentModerations)
        .values({
          contentType: request.contentType,
          contentId: request.contentId,
          userId: request.userId,
          personaId: request.personaId,
          status: moderationStatus.status,
          aiModerationScore: aiResults.score.toString(),
          flaggedCategories: aiResults.categories,
          severity: moderationStatus.severity,
          originalContent: request.content,
          contentSummary: contentAnalysis.summary,
          detectedLanguage: contentAnalysis.language,
          ageRating: contentAnalysis.ageRating,
          complianceFlags: contentAnalysis.complianceFlags,
        })
        .returning({ id: sql`${contentModerations.id}` });

      // Update user safety profile if needed
      if (request.userId) {
        await this.updateUserSafetyMetrics(request.userId, moderationStatus);
      }

      // Create safety incident if flagged
      if (
        moderationStatus.status === "flagged" ||
        moderationStatus.status === "blocked"
      ) {
        await this.createSafetyIncident(
          request,
          moderationRecord[0].id as string,
          moderationStatus
        );
      }

      return {
        id: moderationRecord[0].id as string,
        status: moderationStatus.status,
        aiModerationScore: aiResults.score,
        flaggedCategories: aiResults.categories,
        severity: moderationStatus.severity,
        ageRating: contentAnalysis.ageRating,
        complianceFlags: contentAnalysis.complianceFlags,
        actionRequired: moderationStatus.status !== "approved",
        recommendations: this.generateRecommendations(moderationStatus),
      };
    } catch (error) {
      console.error("Content moderation error:", error);

      // Create a pending moderation record for manual review
      const fallbackRecord = await this.db
        .insert(contentModerations)
        .values({
          contentType: request.contentType,
          contentId: request.contentId,
          userId: request.userId,
          personaId: request.personaId,
          status: "under_review",
          originalContent: request.content,
          severity: "medium",
        })
        .returning({ id: sql`${contentModerations.id}` });

      return {
        id: fallbackRecord[0].id as string,
        status: "under_review",
        aiModerationScore: 0.5,
        flaggedCategories: ["technical_error"],
        severity: "medium",
        ageRating: "mature",
        complianceFlags: ["manual_review_required"],
        actionRequired: true,
        recommendations: ["Manual review required due to technical error"],
      };
    }
  }

  /**
   * Get AI moderation results from OpenAI
   */
  private async getAIModerationResults(
    content: string
  ): Promise<{ score: number; categories: string[]; details: any }> {
    if (!this.openai) {
      // Return basic moderation result when OpenAI is not available
      return {
        score: 0.1, // Low risk score
        categories: [],
        details: { reason: "OpenAI not configured, using basic filtering" },
      };
    }

    try {
      const moderation = await this.openai.moderations.create({
        input: content,
      });

      const result = moderation.results[0];
      const flaggedCategories: string[] = [];
      let maxScore = 0;

      // Extract flagged categories and calculate overall score
      Object.entries(result.categories).forEach(([category, flagged]) => {
        if (flagged) {
          flaggedCategories.push(category);
        }
      });

      // Get the highest category score as overall score
      Object.entries(result.category_scores).forEach(([category, score]) => {
        maxScore = Math.max(maxScore, score as number);
      });

      return {
        score: maxScore,
        categories: flaggedCategories,
        details: result,
      };
    } catch (error) {
      console.error("OpenAI moderation error:", error);
      return {
        score: 0.5, // Default moderate score for errors
        categories: ["moderation_error"],
        details: { error: "Failed to analyze content" },
      };
    }
  }

  /**
   * Analyze content for age rating and compliance
   */
  private async analyzeContentCompliance(
    content: string,
    contentType: string
  ): Promise<{
    summary: string;
    language: string;
    ageRating: "all_ages" | "teen" | "mature" | "adults_only";
    complianceFlags: string[];
  }> {
    if (!this.openai) {
      // Return basic compliance analysis when OpenAI is not available
      return {
        summary: content.substring(0, 100),
        language: "en",
        ageRating: "all_ages",
        complianceFlags: [],
      };
    }

    try {
      // Use OpenAI to analyze content for age rating and compliance
      const prompt = `Analyze the following ${contentType} content for:
1. Age appropriateness (all_ages, teen, mature, adults_only)
2. Legal compliance concerns (COPPA, state laws, etc.)
3. Language detection
4. Brief content summary (max 100 chars)

Content: "${content}"

Respond in JSON format:
{
  "ageRating": "all_ages|teen|mature|adults_only",
  "complianceFlags": ["array", "of", "flags"],
  "language": "detected_language",
  "summary": "brief content summary"
}`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 200,
      });

      const response = completion.choices[0]?.message?.content;
      if (response) {
        const analysis = JSON.parse(response);
        return {
          summary: analysis.summary || content.substring(0, 100),
          language: analysis.language || "en",
          ageRating: analysis.ageRating || "mature",
          complianceFlags: analysis.complianceFlags || [],
        };
      }

      throw new Error("No response from OpenAI");
    } catch (error) {
      console.error("Content compliance analysis error:", error);

      // Fallback analysis
      const hasAdultKeywords =
        /\b(sex|sexual|nude|naked|porn|explicit)\b/i.test(content);
      const hasViolence = /\b(kill|murder|violence|weapon|gun|knife)\b/i.test(
        content
      );
      const hasSwearing = /\b(fuck|shit|damn|ass|bitch)\b/i.test(content);

      return {
        summary: content.substring(0, 100),
        language: "en",
        ageRating: hasAdultKeywords
          ? "adults_only"
          : hasViolence || hasSwearing
          ? "mature"
          : "teen",
        complianceFlags: hasAdultKeywords ? ["adult_content"] : [],
      };
    }
  }

  /**
   * Get or create user safety profile
   */
  async getUserSafetyProfile(userId: string): Promise<SafetyProfile | null> {
    try {
      let profile = await this.db
        .select()
        .from(userSafetyProfiles)
        .where(eq(userSafetyProfiles.userId, userId))
        .limit(1);

      if (profile.length === 0) {
        // Create new safety profile
        const newProfile = await this.db
          .insert(userSafetyProfiles)
          .values({
            userId: userId,
            overallSafetyScore: "1.0",
            trustLevel: "new",
            totalInteractions: 0,
            flaggedInteractions: 0,
            contentViolations: 0,
            isRestricted: false,
            familyFriendlyMode: false,
          })
          .returning();

        profile = newProfile;
      }

      const p = profile[0];
      return {
        userId: p.userId,
        overallSafetyScore: parseFloat(p.overallSafetyScore || "1.0"),
        trustLevel: p.trustLevel as any,
        totalInteractions: p.totalInteractions || 0,
        flaggedInteractions: p.flaggedInteractions || 0,
        contentViolations: p.contentViolations || 0,
        isRestricted: p.isRestricted || false,
        familyFriendlyMode: p.familyFriendlyMode || false,
      };
    } catch (error) {
      console.error("Error getting user safety profile:", error);
      return null;
    }
  }

  /**
   * Calculate moderation status based on AI results and user profile
   */
  private calculateModerationStatus(
    aiResults: any,
    contentAnalysis: any,
    userProfile: SafetyProfile | null
  ): { status: any; severity: any } {
    let severity: "low" | "medium" | "high" | "critical" = "low";
    let status:
      | "pending"
      | "approved"
      | "flagged"
      | "blocked"
      | "under_review" = "approved";

    // Determine severity based on AI score
    if (aiResults.score >= 0.8) {
      severity = "critical";
      status = "blocked";
    } else if (aiResults.score >= 0.6) {
      severity = "high";
      status = "flagged";
    } else if (aiResults.score >= 0.3) {
      severity = "medium";
      status = "under_review";
    } else if (aiResults.score >= 0.1) {
      severity = "low";
      status = "flagged";
    }

    // Adjust based on flagged categories
    const criticalCategories = ["sexual", "violence", "harassment"];
    const hasCriticalContent = aiResults.categories.some((cat: string) =>
      criticalCategories.includes(cat)
    );

    if (hasCriticalContent) {
      severity = "critical";
      status = "blocked";
    }

    // Adjust based on user safety profile
    if (userProfile) {
      if (userProfile.isRestricted) {
        severity = severity === "low" ? "medium" : severity;
        status = status === "approved" ? "under_review" : status;
      }

      if (userProfile.overallSafetyScore < 0.3) {
        severity = severity === "low" ? "high" : severity;
        status = status === "approved" ? "flagged" : status;
      }

      if (userProfile.contentViolations > 5) {
        status = "blocked";
        severity = "critical";
      }
    }

    // Age rating adjustments
    if (contentAnalysis.ageRating === "adults_only") {
      severity = severity === "low" ? "medium" : severity;
    }

    return { status, severity };
  }

  /**
   * Update user safety metrics after moderation
   */
  private async updateUserSafetyMetrics(
    userId: string,
    moderationStatus: any
  ): Promise<void> {
    try {
      const profile = await this.getUserSafetyProfile(userId);
      if (!profile) return;

      const updates: any = {
        totalInteractions: profile.totalInteractions + 1,
        updatedAt: new Date(),
      };

      // Update based on moderation result
      if (
        moderationStatus.status === "flagged" ||
        moderationStatus.status === "blocked"
      ) {
        updates.flaggedInteractions = profile.flaggedInteractions + 1;
        updates.contentViolations = profile.contentViolations + 1;
        updates.lastViolationDate = new Date();

        // Recalculate safety score
        const violationRate =
          (profile.contentViolations + 1) / (profile.totalInteractions + 1);
        updates.overallSafetyScore = Math.max(0, 1 - violationRate * 2);

        // Update trust level
        if (updates.overallSafetyScore < 0.3) {
          updates.trustLevel = "restricted";
          updates.isRestricted = true;
        } else if (updates.overallSafetyScore < 0.6) {
          updates.trustLevel = "flagged";
        }
      } else if (moderationStatus.status === "approved") {
        // Gradually improve safety score for good behavior
        updates.overallSafetyScore = Math.min(
          1,
          profile.overallSafetyScore + 0.001
        );

        // Upgrade trust level if score improves
        if (
          updates.overallSafetyScore > 0.8 &&
          profile.totalInteractions > 50
        ) {
          updates.trustLevel = "trusted";
        }
      }

      await this.db
        .update(userSafetyProfiles)
        .set(updates)
        .where(eq(userSafetyProfiles.userId, userId));
    } catch (error) {
      console.error("Error updating user safety metrics:", error);
    }
  }

  /**
   * Create safety incident record
   */
  private async createSafetyIncident(
    request: ContentModerationRequest,
    moderationId: string,
    status: any
  ): Promise<void> {
    try {
      const incidentType = this.determineIncidentType(status);

      await this.db.insert(safetyIncidents).values({
        userId: request.userId,
        personaId: request.personaId,
        contentModerationId: moderationId,
        incidentType: incidentType as
          | "content_violation"
          | "behavior_violation"
          | "spam"
          | "harassment"
          | "threats"
          | "inappropriate_content"
          | "age_violation",
        severity: status.severity,
        detectionMethod: "ai_detection",
        confidence: (status.aiModerationScore || 0.5).toString(),
        description: `Content ${status.status} due to ${
          status.flaggedCategories?.join(", ") || "policy violation"
        }`,
        evidence: {
          content: request.content,
          contentType: request.contentType,
          flaggedCategories: status.flaggedCategories,
        },
        status: "open",
      });
    } catch (error) {
      console.error("Error creating safety incident:", error);
    }
  }

  /**
   * Determine incident type from moderation status
   */
  private determineIncidentType(status: any): string {
    const categories = status.flaggedCategories || [];

    if (categories.includes("harassment")) return "harassment";
    if (categories.includes("threats")) return "threats";
    if (categories.includes("sexual")) return "inappropriate_content";
    if (categories.includes("violence")) return "content_violation";
    if (categories.includes("spam")) return "spam";

    return "content_violation";
  }

  /**
   * Generate moderation recommendations
   */
  private generateRecommendations(status: any): string[] {
    const recommendations: string[] = [];

    if (status.status === "blocked") {
      recommendations.push("Content blocked - immediate action required");
      recommendations.push("Review community guidelines with user");
    } else if (status.status === "flagged") {
      recommendations.push("Content flagged for review");
      recommendations.push("Consider warning user about content policy");
    } else if (status.status === "under_review") {
      recommendations.push("Manual review recommended");
    }

    if (status.severity === "critical") {
      recommendations.push("Consider account suspension");
    }

    return recommendations;
  }

  /**
   * Get moderation history for content
   */
  async getModerationHistory(contentId: string, contentType: string) {
    return await this.db
      .select()
      .from(contentModerations)
      .where(
        and(
          eq(contentModerations.contentId, contentId),
          eq(
            contentModerations.contentType,
            contentType as
              | "media"
              | "message"
              | "persona_description"
              | "user_profile"
              | "conversation"
          )
        )
      )
      .orderBy(desc(contentModerations.createdAt));
  }

  /**
   * Rate user interaction (called by creators)
   */
  async rateUserInteraction(
    raterId: string,
    ratedUserId: string,
    personaId: string,
    conversationId: string,
    rating: {
      safetyRating: number;
      behaviorTags: string[];
      isInappropriate?: boolean;
      isThreatening?: boolean;
      isHarassing?: boolean;
      isSpam?: boolean;
      ratingReason?: string;
      ratingNotes?: string;
      isBlocked?: boolean;
    }
  ) {
    try {
      // Create interaction rating
      const ratingRecord = await this.db
        .insert(interactionRatings)
        .values({
          raterId,
          ratedUserId,
          personaId,
          conversationId,
          ...rating,
        })
        .returning();

      // Update user safety profile based on rating
      const profile = await this.getUserSafetyProfile(ratedUserId);
      if (profile) {
        const updates: any = {};

        if (rating.safetyRating <= 2) {
          updates.negativeRatings = (profile as any).negativeRatings + 1;
          updates.overallSafetyScore = Math.max(
            0,
            profile.overallSafetyScore - 0.1
          );
        } else if (rating.safetyRating >= 4) {
          updates.positiveRatings = (profile as any).positiveRatings + 1;
          updates.overallSafetyScore = Math.min(
            1,
            profile.overallSafetyScore + 0.05
          );
        }

        if (Object.keys(updates).length > 0) {
          updates.updatedAt = new Date();
          await this.db
            .update(userSafetyProfiles)
            .set(updates)
            .where(eq(userSafetyProfiles.userId, ratedUserId));
        }
      }

      // Create safety incident if serious issues reported
      if (
        rating.isThreatening ||
        rating.isHarassing ||
        rating.safetyRating <= 1
      ) {
        await this.db.insert(safetyIncidents).values({
          userId: ratedUserId,
          personaId: personaId,
          incidentType: rating.isThreatening
            ? "threats"
            : rating.isHarassing
            ? "harassment"
            : "behavior_violation",
          severity: rating.safetyRating <= 1 ? "critical" : "high",
          detectionMethod: "user_report",
          confidence: "0.9",
          description: `User reported by creator: ${
            rating.ratingReason || "Inappropriate behavior"
          }`,
          evidence: {
            rating: rating,
            conversationId: conversationId,
          },
          status: "open",
        });
      }

      return ratingRecord[0];
    } catch (error) {
      console.error("Error rating user interaction:", error);
      throw error;
    }
  }

  /**
   * Get user interaction ratings (for creators to view)
   */
  async getUserInteractionRatings(userId: string, personaId?: string) {
    const conditions = [eq(interactionRatings.ratedUserId, userId)];
    if (personaId) {
      conditions.push(eq(interactionRatings.personaId, personaId));
    }

    return await this.db
      .select()
      .from(interactionRatings)
      .where(and(...conditions))
      .orderBy(desc(interactionRatings.createdAt));
  }

  /**
   * Block/unblock user for a specific persona
   */
  async blockUser(
    creatorId: string,
    userId: string,
    personaId: string,
    isBlocked: boolean
  ) {
    try {
      // Update existing ratings to blocked status
      await this.db
        .update(interactionRatings)
        .set({
          isBlocked,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(interactionRatings.raterId, creatorId),
            eq(interactionRatings.ratedUserId, userId),
            eq(interactionRatings.personaId, personaId)
          )
        );

      // Create safety incident for blocking
      if (isBlocked) {
        await this.db.insert(safetyIncidents).values({
          userId: userId,
          personaId: personaId,
          incidentType: "behavior_violation",
          severity: "medium",
          detectionMethod: "manual_review",
          confidence: "1.0",
          description: `User blocked by creator`,
          evidence: {
            action: "creator_block",
            creatorId: creatorId,
          },
          status: "resolved",
          actionTaken: "user_blocked",
        });
      }

      return {
        success: true,
        message: isBlocked ? "User blocked" : "User unblocked",
      };
    } catch (error) {
      console.error("Error blocking/unblocking user:", error);
      throw error;
    }
  }
}
