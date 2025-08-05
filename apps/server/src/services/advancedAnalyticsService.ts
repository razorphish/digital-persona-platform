import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  eq,
  and,
  desc,
  count,
  sql,
  gte,
  lte,
  between,
  avg,
  sum,
  max,
  min,
} from "drizzle-orm";
import {
  userAnalytics,
  creatorAnalytics,
  revenueAnalytics,
  subscriberAnalytics,
  performanceBenchmarks,
  userSessions,
  personaAnalytics,
  users,
  personas,
  subscriptionPayments,
  personaLikes,
  userFollows,
  personaReviews,
  conversations,
  messages,
  discoveryMetrics,
} from "@digital-persona/database/schema";

interface AnalyticsPeriod {
  start: Date;
  end: Date;
  period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
}

interface UserAnalyticsData {
  demographics: {
    ageDistribution: Record<string, number>;
    genderDistribution: Record<string, number>;
    locationDistribution: Record<string, number>;
  };
  engagement: {
    totalSessions: number;
    averageSessionDuration: number;
    personasViewed: number;
    personasInteracted: number;
    conversionRate: number;
  };
  behavior: {
    preferredCategories: string[];
    mostUsedFeatures: string[];
    preferredInteractionTime: Record<string, number>;
    visitStreak: number;
  };
}

interface CreatorAnalyticsData {
  overview: {
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    totalSubscribers: number;
    totalViews: number;
    averageRating: number;
  };
  growth: {
    subscriberGrowthRate: number;
    revenueGrowthRate: number;
    viewGrowthRate: number;
  };
  engagement: {
    viewToSubscribeRate: number;
    followerToSubscriberRate: number;
    responseRate: number;
    averageResponseTime: number;
  };
  ranking: {
    categoryRank: number;
    overallRank: number;
    percentileScore: number;
  };
}

interface RevenueForecasting {
  forecasts: Array<{
    period: string;
    forecastedRevenue: number;
    confidence: number;
    method: string;
  }>;
  trends: {
    monthlyGrowthRate: number;
    yearOverYearGrowth: number;
    seasonalPatterns: Record<string, number>;
  };
  insights: {
    projectedAnnualRevenue: number;
    breakEvenAnalysis: any;
    revenueOptimizationTips: string[];
  };
}

interface PerformanceBenchmarks {
  category: string;
  userTier: "new" | "emerging" | "established" | "top_performer";
  metrics: {
    views: { userValue: number; benchmarkMedian: number; percentile: number };
    subscribers: {
      userValue: number;
      benchmarkMedian: number;
      percentile: number;
    };
    revenue: { userValue: number; benchmarkMedian: number; percentile: number };
    engagement: {
      userValue: number;
      benchmarkMedian: number;
      percentile: number;
    };
  };
  recommendations: string[];
}

interface SubscriberInsights {
  demographics: {
    ageDistribution: Record<string, number>;
    genderDistribution: Record<string, number>;
    locationDistribution: Record<string, number>;
  };
  behavior: {
    averageSessionLength: number;
    peakActivityHours: Record<string, number>;
    engagementPatterns: any;
  };
  retention: {
    churnRate: number;
    retentionRates: Record<string, number>;
    churnRiskSegments: Record<string, number>;
  };
  monetization: {
    tierDistribution: Record<string, number>;
    averageSubscriptionValue: number;
    lifetimeValue: number;
  };
}

export class AdvancedAnalyticsService {
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
   * Get comprehensive user analytics
   */
  async getUserAnalytics(userId: string): Promise<UserAnalyticsData> {
    try {
      const [userAnalyticsData, sessionData, subscriptionData] =
        await Promise.all([
          this.db
            .select()
            .from(userAnalytics)
            .where(eq(userAnalytics.userId, userId))
            .limit(1),

          this.db
            .select()
            .from(userSessions)
            .where(eq(userSessions.userId, userId))
            .orderBy(desc(userSessions.createdAt))
            .limit(30), // Last 30 sessions

          this.db
            .select()
            .from(subscriptionPayments)
            .where(eq(subscriptionPayments.payerId, userId)),
        ]);

      const analytics = userAnalyticsData[0];

      if (!analytics) {
        // Create initial analytics record
        await this.initializeUserAnalytics(userId);
        return this.getUserAnalytics(userId);
      }

      // Process session data for insights
      const sessionInsights = this.analyzeUserSessions(sessionData);

      return {
        demographics: {
          ageDistribution: { [analytics.ageRange || "unknown"]: 100 },
          genderDistribution: { [analytics.gender || "unknown"]: 100 },
          locationDistribution:
            (analytics.location as Record<string, number>) || {},
        },
        engagement: {
          totalSessions: analytics.totalSessions || 0,
          averageSessionDuration: analytics.averageSessionDuration || 0,
          personasViewed: analytics.totalPersonasViewed || 0,
          personasInteracted: analytics.totalPersonasInteracted || 0,
          conversionRate: parseFloat(analytics.conversionRate || "0"),
        },
        behavior: {
          preferredCategories:
            (analytics.preferredCategories as string[]) || [],
          mostUsedFeatures: (analytics.mostUsedFeatures as string[]) || [],
          preferredInteractionTime:
            (analytics.preferredInteractionTime as Record<string, number>) ||
            {},
          visitStreak: analytics.visitStreak || 0,
        },
      };
    } catch (error) {
      console.error("Error getting user analytics:", error);
      throw error;
    }
  }

  /**
   * Get comprehensive creator analytics
   */
  async getCreatorAnalytics(userId: string): Promise<CreatorAnalyticsData> {
    try {
      const [creatorData, revenueData, personasData] = await Promise.all([
        this.db
          .select()
          .from(creatorAnalytics)
          .where(eq(creatorAnalytics.userId, userId))
          .limit(1),

        this.db
          .select()
          .from(revenueAnalytics)
          .where(eq(revenueAnalytics.userId, userId))
          .orderBy(desc(revenueAnalytics.createdAt))
          .limit(12), // Last 12 periods

        this.db.select().from(personas).where(eq(personas.userId, userId)),
      ]);

      const analytics = creatorData[0];

      if (!analytics) {
        // Create initial analytics record
        await this.initializeCreatorAnalytics(userId);
        return this.getCreatorAnalytics(userId);
      }

      return {
        overview: {
          totalRevenue: parseFloat(analytics.totalRevenue || "0"),
          monthlyRecurringRevenue: parseFloat(
            analytics.monthlyRecurringRevenue || "0"
          ),
          totalSubscribers: analytics.totalSubscribers || 0,
          totalViews: analytics.totalViews || 0,
          averageRating: parseFloat(analytics.averageRating || "0"),
        },
        growth: {
          subscriberGrowthRate: parseFloat(
            analytics.subscriberGrowthRate || "0"
          ),
          revenueGrowthRate: parseFloat(analytics.revenueGrowthRate || "0"),
          viewGrowthRate: parseFloat(analytics.viewGrowthRate || "0"),
        },
        engagement: {
          viewToSubscribeRate: parseFloat(analytics.viewToSubscribeRate || "0"),
          followerToSubscriberRate: parseFloat(
            analytics.followerToSubscriberRate || "0"
          ),
          responseRate: parseFloat(analytics.responseRate || "0"),
          averageResponseTime: analytics.averageResponseTime || 0,
        },
        ranking: {
          categoryRank: analytics.categoryRank || 0,
          overallRank: analytics.overallRank || 0,
          percentileScore: parseFloat(analytics.percentileScore || "50"),
        },
      };
    } catch (error) {
      console.error("Error getting creator analytics:", error);
      throw error;
    }
  }

  /**
   * Generate revenue forecasting with multiple methods
   */
  async generateRevenueForecasting(
    userId: string,
    months: number = 12
  ): Promise<RevenueForecasting> {
    try {
      // Get historical revenue data
      const historicalData = await this.db
        .select()
        .from(revenueAnalytics)
        .where(eq(revenueAnalytics.userId, userId))
        .orderBy(desc(revenueAnalytics.periodStart))
        .limit(24); // 2 years of data

      if (historicalData.length < 3) {
        // Not enough data for forecasting
        return this.generateBasicForecast(userId, months);
      }

      // Apply multiple forecasting methods
      const linearForecast = this.linearRegressionForecast(
        historicalData,
        months
      );
      const seasonalForecast = this.seasonalDecompositionForecast(
        historicalData,
        months
      );
      const trendForecast = this.trendAnalysisForecast(historicalData, months);

      // Combine forecasts with weighted average
      const combinedForecasts = this.combineForecastMethods(
        linearForecast,
        seasonalForecast,
        trendForecast,
        months
      );

      // Calculate trends and insights
      const trends = this.calculateRevenueTrends(historicalData);
      const insights = await this.generateRevenueInsights(
        userId,
        combinedForecasts,
        trends
      );

      return {
        forecasts: combinedForecasts,
        trends,
        insights,
      };
    } catch (error) {
      console.error("Error generating revenue forecasting:", error);
      throw error;
    }
  }

  /**
   * Get performance benchmarks against category peers
   */
  async getPerformanceBenchmarks(
    userId: string
  ): Promise<PerformanceBenchmarks> {
    try {
      // Get user's category and current metrics
      const [userPersonas, userAnalytics] = await Promise.all([
        this.db.select().from(personas).where(eq(personas.userId, userId)),

        this.db
          .select()
          .from(creatorAnalytics)
          .where(eq(creatorAnalytics.userId, userId))
          .limit(1),
      ]);

      const primaryCategory = userPersonas[0]?.category || "general";
      const userMetrics = userAnalytics[0];

      if (!userMetrics) {
        throw new Error("User analytics not found");
      }

      // Determine user tier
      const userTier = this.determineUserTier(userMetrics);

      // Get benchmark data for category and tier
      const benchmarkData = await this.db
        .select()
        .from(performanceBenchmarks)
        .where(
          and(
            eq(performanceBenchmarks.category, primaryCategory),
            eq(performanceBenchmarks.tier, userTier)
          )
        )
        .orderBy(desc(performanceBenchmarks.benchmarkDate))
        .limit(1);

      const benchmark = benchmarkData[0];

      if (!benchmark) {
        // Generate benchmarks if none exist
        await this.generateCategoryBenchmarks(primaryCategory, userTier);
        return this.getPerformanceBenchmarks(userId);
      }

      // Calculate user percentiles
      const metrics = {
        views: {
          userValue: userMetrics.totalViews,
          benchmarkMedian: benchmark.averageViews,
          percentile: this.calculatePercentile(
            userMetrics.totalViews || 0,
            benchmark.percentileData as any,
            "views"
          ),
        },
        subscribers: {
          userValue: userMetrics.totalSubscribers,
          benchmarkMedian: benchmark.averageSubscribers,
          percentile: this.calculatePercentile(
            userMetrics.totalSubscribers || 0,
            benchmark.percentileData as any,
            "subscribers"
          ),
        },
        revenue: {
          userValue: parseFloat(userMetrics.monthlyRecurringRevenue || "0"),
          benchmarkMedian: parseFloat(benchmark.medianMonthlyRevenue || "0"),
          percentile: this.calculatePercentile(
            parseFloat(userMetrics.monthlyRecurringRevenue || "0"),
            benchmark.percentileData as any,
            "revenue"
          ),
        },
        engagement: {
          userValue: parseFloat(userMetrics.viewToSubscribeRate || "0"),
          benchmarkMedian: parseFloat(
            benchmark.medianViewToSubscribeRate || "0"
          ),
          percentile: this.calculatePercentile(
            parseFloat(userMetrics.viewToSubscribeRate || "0"),
            benchmark.percentileData as any,
            "engagement"
          ),
        },
      };

      // Generate recommendations
      const recommendations = this.generatePerformanceRecommendations(
        metrics,
        userTier
      );

      return {
        category: primaryCategory,
        userTier,
        metrics,
        recommendations,
      };
    } catch (error) {
      console.error("Error getting performance benchmarks:", error);
      throw error;
    }
  }

  /**
   * Get detailed subscriber insights and demographics
   */
  async getSubscriberInsights(creatorId: string): Promise<SubscriberInsights> {
    try {
      // Get subscriber analytics data
      const subscriberData = await this.db
        .select()
        .from(subscriberAnalytics)
        .where(eq(subscriberAnalytics.creatorId, creatorId))
        .orderBy(desc(subscriberAnalytics.analysisDate))
        .limit(1);

      const analytics = subscriberData[0];

      if (!analytics) {
        // Generate initial subscriber analytics
        await this.generateSubscriberAnalytics(creatorId);
        return this.getSubscriberInsights(creatorId);
      }

      return {
        demographics: {
          ageDistribution:
            (analytics.ageDistribution as Record<string, number>) || {},
          genderDistribution:
            (analytics.genderDistribution as Record<string, number>) || {},
          locationDistribution:
            (analytics.locationDistribution as Record<string, number>) || {},
        },
        behavior: {
          averageSessionLength: analytics.averageSessionLength,
          peakActivityHours:
            (analytics.peakActivityHours as Record<string, number>) || {},
          engagementPatterns: {
            messagesPerSession: parseFloat(
              analytics.averageMessagesPerSession || "0"
            ),
            mostPopularFeatures:
              (analytics.mostPopularFeatures as string[]) || [],
          },
        },
        retention: {
          churnRate: 100 - parseFloat(analytics.retentionRate30Day || "0"),
          retentionRates: {
            "30day": parseFloat(analytics.retentionRate30Day || "0"),
            "90day": parseFloat(analytics.retentionRate90Day || "0"),
          },
          churnRiskSegments:
            (analytics.churnRiskSegments as Record<string, number>) || {},
        },
        monetization: {
          tierDistribution:
            (analytics.tierDistribution as Record<string, number>) || {},
          averageSubscriptionValue: parseFloat(
            analytics.averageSubscriptionValue || "0"
          ),
          lifetimeValue: this.calculateLifetimeValue(analytics),
        },
      };
    } catch (error) {
      console.error("Error getting subscriber insights:", error);
      throw error;
    }
  }

  /**
   * Update analytics data for a user (called periodically)
   */
  async updateUserAnalytics(userId: string): Promise<void> {
    try {
      // Calculate updated metrics
      const metrics = await this.calculateUserMetrics(userId);

      // Update or create analytics record
      await this.db
        .insert(userAnalytics)
        .values({
          userId,
          ...metrics,
          lastCalculated: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: userAnalytics.userId,
          set: {
            ...metrics,
            lastCalculated: new Date(),
            updatedAt: new Date(),
          },
        });
    } catch (error) {
      console.error("Error updating user analytics:", error);
      throw error;
    }
  }

  /**
   * Update creator analytics data (called periodically)
   */
  async updateCreatorAnalytics(userId: string): Promise<void> {
    try {
      // Calculate updated metrics
      const metrics = await this.calculateCreatorMetrics(userId);

      // Update or create analytics record
      await this.db
        .insert(creatorAnalytics)
        .values({
          userId,
          ...metrics,
          lastCalculated: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: creatorAnalytics.userId,
          set: {
            ...metrics,
            lastCalculated: new Date(),
            updatedAt: new Date(),
          },
        });
    } catch (error) {
      console.error("Error updating creator analytics:", error);
      throw error;
    }
  }

  /**
   * Track user session for analytics
   */
  async trackUserSession(sessionData: {
    userId: string;
    sessionStart: Date;
    sessionEnd?: Date;
    duration?: number;
    userAgent?: string;
    ipAddress?: string;
    country?: string;
    city?: string;
    deviceType?: string;
    pagesVisited?: string[];
    personasViewed?: string[];
    personasInteracted?: string[];
    messagesExchanged?: number;
    subscriptionsCreated?: string[];
    paymentsCompleted?: any[];
    exitPage?: string;
    referrerSource?: string;
  }): Promise<void> {
    try {
      await this.db.insert(userSessions).values({
        ...sessionData,
        bounceRate: (sessionData.pagesVisited?.length || 0) <= 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Update user analytics asynchronously
      setImmediate(() => this.updateUserAnalytics(sessionData.userId));
    } catch (error) {
      console.error("Error tracking user session:", error);
      throw error;
    }
  }

  // Private helper methods

  private async initializeUserAnalytics(userId: string): Promise<void> {
    await this.db.insert(userAnalytics).values({
      userId,
      lastCalculated: new Date(),
    });
  }

  private async initializeCreatorAnalytics(userId: string): Promise<void> {
    await this.db.insert(creatorAnalytics).values({
      userId,
      lastCalculated: new Date(),
    });
  }

  private analyzeUserSessions(sessions: any[]): any {
    // Analyze session patterns, peak times, etc.
    return {
      averageDuration:
        sessions.reduce((sum, s) => sum + (s.duration || 0), 0) /
        sessions.length,
      totalPages: sessions.reduce(
        (sum, s) => sum + (s.pagesVisited?.length || 0),
        0
      ),
    };
  }

  private linearRegressionForecast(data: any[], months: number): any[] {
    // Implement linear regression forecasting
    const revenues = data.map((d) => parseFloat(d.totalRevenue || "0"));
    const trend = this.calculateLinearTrend(revenues);

    return Array.from({ length: months }, (_, i) => ({
      period: `Month ${i + 1}`,
      forecastedRevenue: Math.max(0, revenues[0] + trend * (i + 1)),
      confidence: Math.max(0.5, 0.9 - i * 0.05), // Decrease confidence over time
      method: "linear_regression",
    }));
  }

  private seasonalDecompositionForecast(data: any[], months: number): any[] {
    // Implement seasonal decomposition
    return this.linearRegressionForecast(data, months); // Placeholder
  }

  private trendAnalysisForecast(data: any[], months: number): any[] {
    // Implement trend analysis
    return this.linearRegressionForecast(data, months); // Placeholder
  }

  private combineForecastMethods(
    linear: any[],
    seasonal: any[],
    trend: any[],
    months: number
  ): any[] {
    // Combine multiple forecasting methods with weighted average
    return Array.from({ length: months }, (_, i) => ({
      period: `Month ${i + 1}`,
      forecastedRevenue:
        linear[i]?.forecastedRevenue * 0.4 +
          seasonal[i]?.forecastedRevenue * 0.3 +
          trend[i]?.forecastedRevenue * 0.3 || 0,
      confidence: Math.min(
        linear[i]?.confidence || 0,
        seasonal[i]?.confidence || 0,
        trend[i]?.confidence || 0
      ),
      method: "ensemble",
    }));
  }

  private calculateLinearTrend(values: number[]): number {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const xMean = x.reduce((sum, val) => sum + val, 0) / n;
    const yMean = values.reduce((sum, val) => sum + val, 0) / n;

    const numerator = x.reduce(
      (sum, xi, i) => sum + (xi - xMean) * (values[i] - yMean),
      0
    );
    const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0);

    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateRevenueTrends(data: any[]): any {
    if (data.length < 2)
      return {
        monthlyGrowthRate: 0,
        yearOverYearGrowth: 0,
        seasonalPatterns: {},
      };

    const revenues = data.map((d) => parseFloat(d.totalRevenue || "0"));
    const monthlyGrowthRate =
      revenues.length > 1 ? (revenues[0] - revenues[1]) / revenues[1] : 0;

    return {
      monthlyGrowthRate,
      yearOverYearGrowth:
        revenues.length > 12 ? (revenues[0] - revenues[12]) / revenues[12] : 0,
      seasonalPatterns: {}, // Placeholder for seasonal analysis
    };
  }

  private async generateRevenueInsights(
    userId: string,
    forecasts: any[],
    trends: any
  ): Promise<any> {
    const projectedAnnualRevenue = forecasts.reduce(
      (sum, f) => sum + f.forecastedRevenue,
      0
    );

    return {
      projectedAnnualRevenue,
      breakEvenAnalysis: null, // Placeholder
      revenueOptimizationTips: [
        "Focus on subscriber retention to reduce churn",
        "Consider premium tier pricing optimization",
        "Expand content variety to attract new audiences",
      ],
    };
  }

  private generateBasicForecast(
    userId: string,
    months: number
  ): RevenueForecasting {
    // Basic forecast for users with limited data
    return {
      forecasts: Array.from({ length: months }, (_, i) => ({
        period: `Month ${i + 1}`,
        forecastedRevenue: 0,
        confidence: 0.3,
        method: "insufficient_data",
      })),
      trends: {
        monthlyGrowthRate: 0,
        yearOverYearGrowth: 0,
        seasonalPatterns: {},
      },
      insights: {
        projectedAnnualRevenue: 0,
        breakEvenAnalysis: null,
        revenueOptimizationTips: ["Gather more data for accurate forecasting"],
      },
    };
  }

  private determineUserTier(
    metrics: any
  ): "new" | "emerging" | "established" | "top_performer" {
    const subscribers = metrics.totalSubscribers;
    const revenue = parseFloat(metrics.monthlyRecurringRevenue || "0");

    if (subscribers < 10 || revenue < 100) return "new";
    if (subscribers < 100 || revenue < 1000) return "emerging";
    if (subscribers < 1000 || revenue < 10000) return "established";
    return "top_performer";
  }

  private calculatePercentile(
    value: number,
    percentileData: any,
    metric: string
  ): number {
    // Calculate user's percentile based on benchmark data
    if (!percentileData || !percentileData[metric]) return 50;

    const percentiles = percentileData[metric];
    if (value <= percentiles.p25) return 25;
    if (value <= percentiles.p50) return 50;
    if (value <= percentiles.p75) return 75;
    if (value <= percentiles.p90) return 90;
    return 95;
  }

  private generatePerformanceRecommendations(
    metrics: any,
    tier: string
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.engagement.percentile < 50) {
      recommendations.push(
        "Focus on improving engagement rates through better content quality"
      );
    }

    if (metrics.subscribers.percentile < 75) {
      recommendations.push(
        "Invest in growth strategies like social media marketing"
      );
    }

    if (metrics.revenue.percentile < 50) {
      recommendations.push(
        "Consider optimizing pricing strategy and subscription tiers"
      );
    }

    return recommendations;
  }

  private async generateCategoryBenchmarks(
    category: string,
    tier: string
  ): Promise<void> {
    // Generate benchmark data for category/tier if none exists
    // This would typically involve calculating medians from existing user data
    await this.db.insert(performanceBenchmarks).values({
      category,
      tier: tier as "new" | "emerging" | "established" | "top_performer",
      benchmarkDate: new Date(),
      sampleSize: 1,
      // Default benchmark values
    });
  }

  private async generateSubscriberAnalytics(creatorId: string): Promise<void> {
    // Generate initial subscriber analytics
    await this.db.insert(subscriberAnalytics).values({
      creatorId,
      analysisDate: new Date(),
    });
  }

  private calculateLifetimeValue(analytics: any): number {
    const avgValue = parseFloat(analytics.averageSubscriptionValue || "0");
    const retention = parseFloat(analytics.retentionRate30Day || "0") / 100;

    // Simple LTV calculation
    return avgValue * (retention / (1 - retention)) * 12;
  }

  private async calculateUserMetrics(userId: string): Promise<any> {
    // Calculate comprehensive user metrics from various tables
    const [sessions, subscriptions, interactions] = await Promise.all([
      this.db
        .select()
        .from(userSessions)
        .where(eq(userSessions.userId, userId)),
      this.db
        .select()
        .from(subscriptionPayments)
        .where(eq(subscriptionPayments.payerId, userId)),
      this.db
        .select()
        .from(personaLikes)
        .where(eq(personaLikes.userId, userId)),
    ]);

    return {
      totalSessions: sessions.length,
      totalSessionDuration: sessions.reduce(
        (sum, s) => sum + (s.duration || 0),
        0
      ),
      averageSessionDuration:
        sessions.length > 0
          ? sessions.reduce((sum, s) => sum + (s.duration || 0), 0) /
            sessions.length
          : 0,
      totalSubscriptions: subscriptions.length,
      totalPersonasViewed: sessions.reduce(
        (sum, s) => sum + (Array.isArray(s.personasViewed) ? s.personasViewed.length : 0),
        0
      ),
      totalPersonasInteracted: sessions.reduce(
        (sum, s) => sum + (Array.isArray(s.personasInteracted) ? s.personasInteracted.length : 0),
        0
      ),
      lastActiveDate:
        sessions.length > 0 ? sessions[0].sessionStart : new Date(),
    };
  }

  private async calculateCreatorMetrics(userId: string): Promise<any> {
    // Calculate comprehensive creator metrics
    const [personasData, revenue, subscribers, reviews] = await Promise.all([
      this.db.select().from(personas).where(eq(personas.userId, userId)),
      this.db
        .select()
        .from(subscriptionPayments)
        .where(eq(subscriptionPayments.creatorId, userId)),
      this.db
        .select({ count: count() })
        .from(subscriptionPayments)
        .where(eq(subscriptionPayments.creatorId, userId)),
      this.db
        .select()
        .from(personaReviews)
        .innerJoin(personas, eq(personaReviews.personaId, personas.id))
        .where(eq(personas.userId, userId)),
    ]);

    const totalRevenue = revenue.reduce(
      (sum, r) => sum + parseFloat(r.amount || "0"),
      0
    );
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.persona_reviews.rating, 0) /
          reviews.length
        : 0;

    return {
      totalPersonas: personasData.length,
      activePersonas: personasData.filter((p) => p.isPublic).length,
      totalRevenue: totalRevenue.toString(),
      monthlyRecurringRevenue: (totalRevenue / 12).toString(), // Simplified calculation
      totalSubscribers: subscribers[0]?.count || 0,
      averageRating: avgRating.toString(),
      totalReviews: reviews.length,
    };
  }
}
