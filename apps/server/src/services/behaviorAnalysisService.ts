import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, desc, gte, lte, count, sql, between } from "drizzle-orm";
import {
  userSafetyProfiles,
  interactionRatings,
  safetyIncidents,
  contentModerations,
  messages,
  conversations,
  users,
  personas,
} from "@digital-persona/database/schema";

export interface BehaviorPattern {
  userId: string;
  patternType:
    | "spam"
    | "harassment"
    | "escalation"
    | "inappropriate_content"
    | "normal";
  confidence: number;
  indicators: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
  recommendedAction:
    | "none"
    | "warning"
    | "rate_limit"
    | "temporary_restriction"
    | "account_suspension";
}

interface BehaviorMetrics {
  userId: string;
  timeframe: string;
  messageFrequency: number;
  averageMessageLength: number;
  sentimentScore: number;
  interactionCount: number;
  violationCount: number;
  reportCount: number;
  escalationCount: number;
}

interface ThreatIndicator {
  type:
    | "language_threat"
    | "behavior_escalation"
    | "spam_pattern"
    | "harassment_pattern";
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  description: string;
  evidence: any;
}

export class BehaviorAnalysisService {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is required");
    }

    const client = postgres(connectionString);
    this.db = drizzle(client);
  }

  /**
   * Analyze user behavior patterns in real-time
   */
  async analyzeUserBehavior(
    userId: string,
    timeframeHours: number = 24
  ): Promise<BehaviorPattern> {
    try {
      const timeframe = new Date(Date.now() - timeframeHours * 60 * 60 * 1000);

      // Gather behavior metrics
      const metrics = await this.gatherBehaviorMetrics(userId, timeframe);

      // Detect specific threat patterns
      const threatIndicators = await this.detectThreatIndicators(
        userId,
        timeframe
      );

      // Calculate overall behavior pattern
      const pattern = this.calculateBehaviorPattern(metrics, threatIndicators);

      // Store analysis results if concerning
      if (pattern.riskLevel !== "low") {
        await this.recordBehaviorAnalysis(
          userId,
          pattern,
          metrics,
          threatIndicators
        );
      }

      return pattern;
    } catch (error) {
      console.error("Behavior analysis error:", error);
      return {
        userId,
        patternType: "normal",
        confidence: 0.5,
        indicators: ["analysis_error"],
        riskLevel: "low",
        recommendedAction: "none",
      };
    }
  }

  /**
   * Gather comprehensive behavior metrics for a user
   */
  private async gatherBehaviorMetrics(
    userId: string,
    timeframe: Date
  ): Promise<BehaviorMetrics> {
    const [messageStats, interactionStats, violationStats, reportStats] =
      await Promise.all([
        this.getMessageStats(userId, timeframe),
        this.getInteractionStats(userId, timeframe),
        this.getViolationStats(userId, timeframe),
        this.getReportStats(userId, timeframe),
      ]);

    return {
      userId,
      timeframe: timeframe.toISOString(),
      messageFrequency: messageStats.frequency,
      averageMessageLength: messageStats.avgLength,
      sentimentScore: messageStats.sentiment,
      interactionCount: interactionStats.count,
      violationCount: violationStats.count,
      reportCount: reportStats.count,
      escalationCount: reportStats.escalations,
    };
  }

  /**
   * Get message statistics for behavior analysis
   */
  private async getMessageStats(
    userId: string,
    timeframe: Date
  ): Promise<{
    frequency: number;
    avgLength: number;
    sentiment: number;
  }> {
    try {
      // Get messages from conversations where user participated
      const messageCount = await this.db
        .select({ count: count() })
        .from(messages)
        .leftJoin(conversations, eq(messages.conversationId, conversations.id))
        .where(
          and(
            eq(conversations.userId, userId),
            gte(messages.createdAt, timeframe)
          )
        );

      const messageDetails = await this.db
        .select({
          content: messages.content,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .leftJoin(conversations, eq(messages.conversationId, conversations.id))
        .where(
          and(
            eq(conversations.userId, userId),
            gte(messages.createdAt, timeframe)
          )
        )
        .limit(100); // Analyze recent messages

      const frequency = messageCount[0]?.count || 0;
      const avgLength =
        messageDetails.length > 0
          ? messageDetails.reduce(
              (sum, msg) => sum + (msg.content?.length || 0),
              0
            ) / messageDetails.length
          : 0;

      // Basic sentiment analysis (simplified)
      const sentiment = this.calculateSentimentScore(
        messageDetails.map((m) => m.content || "")
      );

      return { frequency, avgLength, sentiment };
    } catch (error) {
      console.error("Error getting message stats:", error);
      return { frequency: 0, avgLength: 0, sentiment: 0.5 };
    }
  }

  /**
   * Get interaction statistics
   */
  private async getInteractionStats(
    userId: string,
    timeframe: Date
  ): Promise<{ count: number }> {
    try {
      const interactions = await this.db
        .select({ count: count() })
        .from(interactionRatings)
        .where(
          and(
            eq(interactionRatings.ratedUserId, userId),
            gte(interactionRatings.createdAt, timeframe)
          )
        );

      return { count: interactions[0]?.count || 0 };
    } catch (error) {
      console.error("Error getting interaction stats:", error);
      return { count: 0 };
    }
  }

  /**
   * Get violation statistics
   */
  private async getViolationStats(
    userId: string,
    timeframe: Date
  ): Promise<{ count: number }> {
    try {
      const violations = await this.db
        .select({ count: count() })
        .from(contentModerations)
        .where(
          and(
            eq(contentModerations.userId, userId),
            gte(contentModerations.createdAt, timeframe),
            sql`${contentModerations.status} IN ('flagged', 'blocked')`
          )
        );

      return { count: violations[0]?.count || 0 };
    } catch (error) {
      console.error("Error getting violation stats:", error);
      return { count: 0 };
    }
  }

  /**
   * Get report statistics
   */
  private async getReportStats(
    userId: string,
    timeframe: Date
  ): Promise<{ count: number; escalations: number }> {
    try {
      const [reports, escalations] = await Promise.all([
        this.db
          .select({ count: count() })
          .from(safetyIncidents)
          .where(
            and(
              eq(safetyIncidents.userId, userId),
              gte(safetyIncidents.createdAt, timeframe)
            )
          ),
        this.db
          .select({ count: count() })
          .from(safetyIncidents)
          .where(
            and(
              eq(safetyIncidents.userId, userId),
              gte(safetyIncidents.createdAt, timeframe),
              sql`${safetyIncidents.severity} IN ('high', 'critical')`
            )
          ),
      ]);

      return {
        count: reports[0]?.count || 0,
        escalations: escalations[0]?.count || 0,
      };
    } catch (error) {
      console.error("Error getting report stats:", error);
      return { count: 0, escalations: 0 };
    }
  }

  /**
   * Detect specific threat indicators in user behavior
   */
  private async detectThreatIndicators(
    userId: string,
    timeframe: Date
  ): Promise<ThreatIndicator[]> {
    const indicators: ThreatIndicator[] = [];

    // Check for spam patterns
    const spamIndicator = await this.detectSpamPattern(userId, timeframe);
    if (spamIndicator) indicators.push(spamIndicator);

    // Check for harassment patterns
    const harassmentIndicator = await this.detectHarassmentPattern(
      userId,
      timeframe
    );
    if (harassmentIndicator) indicators.push(harassmentIndicator);

    // Check for behavior escalation
    const escalationIndicator = await this.detectBehaviorEscalation(
      userId,
      timeframe
    );
    if (escalationIndicator) indicators.push(escalationIndicator);

    // Check for threatening language
    const threatIndicator = await this.detectThreateningLanguage(
      userId,
      timeframe
    );
    if (threatIndicator) indicators.push(threatIndicator);

    return indicators;
  }

  /**
   * Detect spam behavior patterns
   */
  private async detectSpamPattern(
    userId: string,
    timeframe: Date
  ): Promise<ThreatIndicator | null> {
    try {
      // Get message frequency and repetition patterns
      const messagesData = await this.db
        .select({
          content: messages.content,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .leftJoin(conversations, eq(messages.conversationId, conversations.id))
        .where(
          and(
            eq(conversations.userId, userId),
            gte(messages.createdAt, timeframe)
          )
        )
        .orderBy(desc(messages.createdAt));

      if (messagesData.length < 5) return null;

      // Check for rapid-fire messaging
      const rapidMessages = this.checkRapidMessaging(messagesData);

      // Check for repetitive content
      const repetitiveContent = this.checkRepetitiveContent(messagesData);

      // Check for link spam
      const linkSpam = this.checkLinkSpam(messagesData);

      if (rapidMessages || repetitiveContent || linkSpam) {
        const severity = rapidMessages && repetitiveContent ? "high" : "medium";
        return {
          type: "spam_pattern",
          severity: severity as any,
          confidence: 0.8,
          description: "Spam behavior detected",
          evidence: {
            rapidMessages,
            repetitiveContent,
            linkSpam,
            messageCount: messagesData.length,
          },
        };
      }

      return null;
    } catch (error) {
      console.error("Error detecting spam pattern:", error);
      return null;
    }
  }

  /**
   * Detect harassment patterns
   */
  private async detectHarassmentPattern(
    userId: string,
    timeframe: Date
  ): Promise<ThreatIndicator | null> {
    try {
      // Get recent interaction ratings for this user
      const ratings = await this.db
        .select()
        .from(interactionRatings)
        .where(
          and(
            eq(interactionRatings.ratedUserId, userId),
            gte(interactionRatings.createdAt, timeframe)
          )
        );

      if (ratings.length === 0) return null;

      // Calculate harassment indicators
      const harassmentReports = ratings.filter((r) => r.isHarassing).length;
      const lowRatings = ratings.filter((r) => r.safetyRating <= 2).length;
      const avgRating =
        ratings.reduce((sum, r) => sum + r.safetyRating, 0) / ratings.length;

      if (harassmentReports > 0 || (lowRatings > 1 && avgRating < 2.5)) {
        return {
          type: "harassment_pattern",
          severity: harassmentReports > 1 ? "high" : "medium",
          confidence: 0.7,
          description: "Harassment pattern detected from user ratings",
          evidence: {
            harassmentReports,
            lowRatings,
            averageRating: avgRating,
            totalRatings: ratings.length,
          },
        };
      }

      return null;
    } catch (error) {
      console.error("Error detecting harassment pattern:", error);
      return null;
    }
  }

  /**
   * Detect behavior escalation patterns
   */
  private async detectBehaviorEscalation(
    userId: string,
    timeframe: Date
  ): Promise<ThreatIndicator | null> {
    try {
      // Get safety incidents over time to detect escalation
      const incidents = await this.db
        .select()
        .from(safetyIncidents)
        .where(
          and(
            eq(safetyIncidents.userId, userId),
            gte(
              safetyIncidents.createdAt,
              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            ) // Last 7 days
          )
        )
        .orderBy(desc(safetyIncidents.createdAt));

      if (incidents.length < 2) return null;

      // Check for increasing severity over time
      let escalating = false;
      const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };

      for (let i = 1; i < incidents.length; i++) {
        const current =
          severityLevels[
            incidents[i - 1].severity as keyof typeof severityLevels
          ];
        const previous =
          severityLevels[incidents[i].severity as keyof typeof severityLevels];

        if (current > previous) {
          escalating = true;
          break;
        }
      }

      if (escalating || incidents.length > 3) {
        return {
          type: "behavior_escalation",
          severity: incidents.length > 5 ? "critical" : "high",
          confidence: 0.8,
          description: "Escalating behavior pattern detected",
          evidence: {
            incidentCount: incidents.length,
            escalating,
            recentSeverity: incidents[0]?.severity,
          },
        };
      }

      return null;
    } catch (error) {
      console.error("Error detecting behavior escalation:", error);
      return null;
    }
  }

  /**
   * Detect threatening language patterns
   */
  private async detectThreateningLanguage(
    userId: string,
    timeframe: Date
  ): Promise<ThreatIndicator | null> {
    try {
      // Get recent content moderation results for threatening language
      const moderations = await this.db
        .select()
        .from(contentModerations)
        .where(
          and(
            eq(contentModerations.userId, userId),
            gte(contentModerations.createdAt, timeframe),
            sql`${contentModerations.flaggedCategories}::text LIKE '%threat%'`
          )
        );

      if (moderations.length > 0) {
        const severity = moderations.some((m) => m.severity === "critical")
          ? "critical"
          : "high";

        return {
          type: "language_threat",
          severity: severity as any,
          confidence: 0.9,
          description: "Threatening language detected in content",
          evidence: {
            flaggedContent: moderations.length,
            categories: moderations.map((m) => m.flaggedCategories).flat(),
          },
        };
      }

      return null;
    } catch (error) {
      console.error("Error detecting threatening language:", error);
      return null;
    }
  }

  /**
   * Calculate overall behavior pattern from metrics and indicators
   */
  private calculateBehaviorPattern(
    metrics: BehaviorMetrics,
    indicators: ThreatIndicator[]
  ): BehaviorPattern {
    let riskLevel: "low" | "medium" | "high" | "critical" = "low";
    let patternType:
      | "spam"
      | "harassment"
      | "escalation"
      | "inappropriate_content"
      | "normal" = "normal";
    let confidence = 0.5;
    let recommendedAction:
      | "none"
      | "warning"
      | "rate_limit"
      | "temporary_restriction"
      | "account_suspension" = "none";

    // Analyze threat indicators
    const criticalIndicators = indicators.filter(
      (i) => i.severity === "critical"
    );
    const highIndicators = indicators.filter((i) => i.severity === "high");
    const mediumIndicators = indicators.filter((i) => i.severity === "medium");

    if (criticalIndicators.length > 0) {
      riskLevel = "critical";
      confidence = 0.9;
      recommendedAction = "account_suspension";
      patternType = this.getPrimaryThreatType(criticalIndicators);
    } else if (highIndicators.length > 0) {
      riskLevel = "high";
      confidence = 0.8;
      recommendedAction = "temporary_restriction";
      patternType = this.getPrimaryThreatType(highIndicators);
    } else if (mediumIndicators.length > 1) {
      riskLevel = "medium";
      confidence = 0.7;
      recommendedAction = "rate_limit";
      patternType = this.getPrimaryThreatType(mediumIndicators);
    } else if (mediumIndicators.length === 1) {
      riskLevel = "medium";
      confidence = 0.6;
      recommendedAction = "warning";
      patternType = this.getPrimaryThreatType(mediumIndicators);
    }

    // Adjust based on metrics
    if (metrics.violationCount > 3) {
      riskLevel = riskLevel === "low" ? "medium" : riskLevel;
      confidence = Math.min(1, confidence + 0.1);
    }

    if (metrics.escalationCount > 0) {
      riskLevel = riskLevel === "low" ? "high" : riskLevel;
      confidence = Math.min(1, confidence + 0.2);
    }

    return {
      userId: metrics.userId,
      patternType,
      confidence,
      indicators: indicators.map((i) => i.type),
      riskLevel,
      recommendedAction,
    };
  }

  /**
   * Get primary threat type from indicators
   */
  private getPrimaryThreatType(
    indicators: ThreatIndicator[]
  ): "spam" | "harassment" | "escalation" | "inappropriate_content" {
    const types = indicators.map((i) => i.type);

    if (types.includes("language_threat")) return "inappropriate_content";
    if (types.includes("harassment_pattern")) return "harassment";
    if (types.includes("behavior_escalation")) return "escalation";
    if (types.includes("spam_pattern")) return "spam";

    return "inappropriate_content";
  }

  /**
   * Record behavior analysis results
   */
  private async recordBehaviorAnalysis(
    userId: string,
    pattern: BehaviorPattern,
    metrics: BehaviorMetrics,
    indicators: ThreatIndicator[]
  ): Promise<void> {
    try {
      // Create safety incident for concerning behavior
      await this.db.insert(safetyIncidents).values({
        userId: userId,
        incidentType: "behavior_violation",
        severity: pattern.riskLevel as "low" | "medium" | "high" | "critical",
        detectionMethod: "pattern_analysis",
        description: `Behavior pattern analysis: ${pattern.patternType} detected`,
        evidence: {
          pattern,
          metrics,
          indicators,
        },
        status: "open",
      });

      // Update user safety profile
      const profile = await this.db
        .select()
        .from(userSafetyProfiles)
        .where(eq(userSafetyProfiles.userId, userId))
        .limit(1);

      if (profile.length > 0) {
        const updates: any = {
          severityScore: Math.min(
            1,
            parseFloat(profile[0].severityScore || "0") +
              pattern.confidence * 0.1
          ),
          updatedAt: new Date(),
        };

        if (pattern.riskLevel === "critical") {
          updates.trustLevel = "restricted";
          updates.isRestricted = true;
          updates.restrictionReason = `Behavior analysis: ${pattern.patternType}`;
        } else if (pattern.riskLevel === "high") {
          updates.trustLevel = "flagged";
        }

        await this.db
          .update(userSafetyProfiles)
          .set(updates)
          .where(eq(userSafetyProfiles.userId, userId));
      }
    } catch (error) {
      console.error("Error recording behavior analysis:", error);
    }
  }

  /**
   * Helper methods for pattern detection
   */
  private checkRapidMessaging(messages: any[]): boolean {
    if (messages.length < 5) return false;

    // Check if more than 10 messages in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentMessages = messages.filter(
      (m) => new Date(m.createdAt) > oneHourAgo
    );

    return recentMessages.length > 10;
  }

  private checkRepetitiveContent(messages: any[]): boolean {
    if (messages.length < 3) return false;

    const contents = messages.map((m) => m.content?.toLowerCase().trim());
    const duplicates = contents.filter(
      (content, index) => contents.indexOf(content) !== index
    );

    return duplicates.length > contents.length * 0.5;
  }

  private checkLinkSpam(messages: any[]): boolean {
    const linkPattern = /https?:\/\/[^\s]+/g;
    const messagesWithLinks = messages.filter((m) =>
      linkPattern.test(m.content || "")
    );

    return messagesWithLinks.length > messages.length * 0.7;
  }

  private calculateSentimentScore(contents: string[]): number {
    if (contents.length === 0) return 0.5;

    // Simple sentiment analysis based on keywords
    const positiveWords = [
      "good",
      "great",
      "awesome",
      "love",
      "like",
      "happy",
      "thanks",
    ];
    const negativeWords = [
      "bad",
      "hate",
      "angry",
      "stupid",
      "idiot",
      "fuck",
      "shit",
    ];

    let score = 0.5;

    contents.forEach((content) => {
      const words = content.toLowerCase().split(/\s+/);
      const positive = words.filter((w) => positiveWords.includes(w)).length;
      const negative = words.filter((w) => negativeWords.includes(w)).length;

      score += (positive - negative) * 0.1;
    });

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Get behavior analysis summary for a user
   */
  async getBehaviorSummary(userId: string): Promise<{
    currentRiskLevel: string;
    recentIncidents: number;
    safetyScore: number;
    recommendations: string[];
  }> {
    try {
      const [profile, recentIncidents] = await Promise.all([
        this.db
          .select()
          .from(userSafetyProfiles)
          .where(eq(userSafetyProfiles.userId, userId))
          .limit(1),
        this.db
          .select({ count: count() })
          .from(safetyIncidents)
          .where(
            and(
              eq(safetyIncidents.userId, userId),
              gte(
                safetyIncidents.createdAt,
                new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              )
            )
          ),
      ]);

      const userProfile = profile[0];
      const incidentCount = recentIncidents[0]?.count || 0;

      let currentRiskLevel = "low";
      if (userProfile?.isRestricted) {
        currentRiskLevel = "critical";
      } else if (userProfile?.trustLevel === "flagged") {
        currentRiskLevel = "high";
      } else if (incidentCount > 0) {
        currentRiskLevel = "medium";
      }

      const recommendations: string[] = [];
      if (currentRiskLevel === "critical") {
        recommendations.push("Account restrictions in place");
        recommendations.push("Manual review required");
      } else if (currentRiskLevel === "high") {
        recommendations.push("Monitor user activity closely");
        recommendations.push("Consider content pre-moderation");
      } else if (currentRiskLevel === "medium") {
        recommendations.push("Increased monitoring recommended");
      }

      return {
        currentRiskLevel,
        recentIncidents: incidentCount,
        safetyScore: parseFloat(userProfile?.overallSafetyScore || "1.0"),
        recommendations,
      };
    } catch (error) {
      console.error("Error getting behavior summary:", error);
      return {
        currentRiskLevel: "unknown",
        recentIncidents: 0,
        safetyScore: 0.5,
        recommendations: ["Error analyzing behavior"],
      };
    }
  }
}
