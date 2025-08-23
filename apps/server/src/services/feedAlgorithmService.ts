import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, desc, not, sql, inArray, gte } from "drizzle-orm";
import {
  feedItems,
  userFeedPreferences,
  personas,
  users,
  discoveryMetrics,
  userFollows,
  personaLikes,
  personaReviews,
} from "@digital-persona/database/schema";
import { DiscoveryService } from "./discoveryService.js";
import { SocialEngagementService } from "./socialEngagementService.js";

export interface FeedItem {
  id: string;
  itemType:
    | "persona_recommendation"
    | "trending_persona"
    | "creator_update"
    | "followed_creator_persona"
    | "similar_personas"
    | "review_highlight";
  persona?: any;
  creator?: any;
  relevanceScore: number;
  algorithmSource: string;
  isPromoted: boolean;
  isTrending: boolean;
  metadata: {
    reason: string[];
    tags: string[];
    engagementData?: any;
  };
}

interface FeedGenerationOptions {
  limit?: number;
  includePromoted?: boolean;
  refreshExisting?: boolean;
  categories?: string[];
  excludePersonaIds?: string[];
  quickMode?: boolean; // Skip complex algorithms for faster generation
}

export interface FeedMetrics {
  totalItems: number;
  algorithmBreakdown: Record<string, number>;
  engagementRate: number;
  clickThroughRate: number;
  averageRelevanceScore: number;
}

export class FeedAlgorithmService {
  private db: ReturnType<typeof drizzle>;
  private discoveryService: DiscoveryService;
  private socialService: SocialEngagementService;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is required");
    }

    const client = postgres(connectionString);
    this.db = drizzle(client);
    this.discoveryService = new DiscoveryService();
    this.socialService = new SocialEngagementService();
  }

  /**
   * Generate personalized feed for a user
   */
  async generatePersonalizedFeed(
    userId: string,
    options: FeedGenerationOptions = {}
  ): Promise<FeedItem[]> {
    try {
      const {
        limit = 50,
        includePromoted = true,
        refreshExisting = false,
        categories,
        excludePersonaIds = [],
        quickMode = false,
      } = options;

      // Get user preferences
      const preferences = await this.getUserFeedPreferences(userId);

      // Clear existing feed if refreshing
      if (refreshExisting) {
        await this.clearUserFeed(userId);
      }

      // Quick mode: Generate basic feed items fast
      if (quickMode) {
        console.log("🚀 Quick mode: Generating basic feed items");
        const quickItems = await this.getBasicFeedItems(userId, Math.min(limit, 10));
        await this.storeFeedItems(userId, quickItems);
        return quickItems;
      }

      // Generate feed items from different sources
      const feedSources = await Promise.all([
        this.getFollowedCreatorItems(userId, preferences),
        this.getTrendingItems(userId, preferences),
        this.getPersonalizedRecommendations(userId, preferences),
        this.getSimilarPersonaItems(userId, preferences),
        this.getNewCreatorItems(userId, preferences),
      ]);

      // Combine and deduplicate items
      let combinedItems = this.combineAndDeduplicateItems(
        feedSources,
        excludePersonaIds
      );

      // Apply category filters
      if (categories && categories.length > 0) {
        combinedItems = combinedItems.filter(
          (item) => item.persona && categories.includes(item.persona.category)
        );
      }

      // Score and rank items
      const rankedItems = await this.rankFeedItems(
        combinedItems,
        userId,
        preferences
      );

      // Add promoted content if enabled
      if (includePromoted) {
        const promotedItems = await this.getPromotedItems(userId, preferences);
        rankedItems.splice(2, 0, ...promotedItems); // Insert promoted items at positions 3, 6, etc.
      }

      // Limit results
      const finalItems = rankedItems.slice(0, limit);

      // Store feed items in database
      await this.storeFeedItems(userId, finalItems);

      return finalItems;
    } catch (error) {
      console.error("Error generating personalized feed:", error);
      return [];
    }
  }

  /**
   * Get user's current feed from database
   */
  async getUserFeed(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<FeedItem[]> {
    try {
      console.log(`🔍 Getting feed for user ${userId}, limit ${limit}, offset ${offset}`);
      const startTime = Date.now();
      
      // Cap limit to prevent timeout
      const safeLimit = Math.min(limit, 20);
      
      // First check if user has any feed items
      const feedCount = await this.db
        .select({ count: sql`count(*)` })
        .from(feedItems)
        .where(eq(feedItems.userId, userId));
      
      const currentCount = Number(feedCount[0]?.count || 0);
      console.log(`📊 User has ${currentCount} existing feed items`);
      
      // If no feed items exist, generate them quickly
      if (currentCount === 0) {
        console.log("🚀 No feed items found, generating quick feed...");
        await this.generatePersonalizedFeed(userId, { 
          limit: 10,
          quickMode: true 
        });
      }
      
      const feedData = await this.db
        .select({
          feedItem: feedItems,
          persona: personas,
          creator: users,
        })
        .from(feedItems)
        .leftJoin(personas, eq(feedItems.personaId, personas.id))
        .leftJoin(users, eq(feedItems.creatorId, users.id))
        .where(eq(feedItems.userId, userId))
        .orderBy(feedItems.feedPosition)
        .limit(safeLimit)
        .offset(offset);
      
      const queryTime = Date.now() - startTime;
      console.log(`⏱️ Feed query took ${queryTime}ms, returned ${feedData.length} items`);

      return feedData.map((item) => ({
        id: item.feedItem.id,
        itemType: item.feedItem.itemType as any,
        persona: item.persona,
        creator: item.creator,
        relevanceScore: parseFloat(item.feedItem.relevanceScore || "0.5"),
        algorithmSource: item.feedItem.algorithmSource,
        isPromoted: item.feedItem.isPromoted || false,
        isTrending: item.feedItem.isTrending || false,
        metadata: {
          reason: ["personalized"],
          tags: [],
          engagementData: null,
        },
      }));
    } catch (error) {
      console.error("Error getting user feed:", error);
      return [];
    }
  }

  /**
   * Track user interaction with feed item
   */
  async trackFeedInteraction(
    userId: string,
    feedItemId: string,
    interactionType: "viewed" | "clicked" | "liked" | "shared" | "dismissed"
  ): Promise<boolean> {
    try {
      const updates: any = {
        updatedAt: new Date(),
      };

      switch (interactionType) {
        case "viewed":
          updates.wasViewed = true;
          updates.viewedAt = new Date();
          break;
        case "clicked":
          updates.wasClicked = true;
          updates.clickedAt = new Date();
          break;
        case "liked":
          updates.wasLiked = true;
          break;
        case "shared":
          updates.wasShared = true;
          break;
        case "dismissed":
          updates.wasDismissed = true;
          updates.dismissedAt = new Date();
          break;
      }

      await this.db
        .update(feedItems)
        .set(updates)
        .where(and(eq(feedItems.id, feedItemId), eq(feedItems.userId, userId)));

      // Update user preferences based on interaction
      await this.updateUserPreferencesFromInteraction(
        userId,
        feedItemId,
        interactionType
      );

      return true;
    } catch (error) {
      console.error("Error tracking feed interaction:", error);
      return false;
    }
  }

  /**
   * Get feed analytics for user
   */
  async getFeedMetrics(
    userId: string,
    timeframe: "24h" | "7d" | "30d" = "7d"
  ): Promise<FeedMetrics> {
    try {
      const timeframeDays =
        timeframe === "24h" ? 1 : timeframe === "7d" ? 7 : 30;
      const startDate = new Date(
        Date.now() - timeframeDays * 24 * 60 * 60 * 1000
      );

      const metrics = await this.db
        .select({
          totalItems: sql`COUNT(*)`,
          viewedItems: sql`COUNT(CASE WHEN ${feedItems.wasViewed} THEN 1 END)`,
          clickedItems: sql`COUNT(CASE WHEN ${feedItems.wasClicked} THEN 1 END)`,
          algorithmSource: feedItems.algorithmSource,
          avgRelevanceScore: sql`AVG(${feedItems.relevanceScore})`,
        })
        .from(feedItems)
        .where(
          and(eq(feedItems.userId, userId), gte(feedItems.createdAt, startDate))
        )
        .groupBy(feedItems.algorithmSource);

      const totalItems = metrics.reduce(
        (sum, m) => sum + Number(m.totalItems),
        0
      );
      const totalViewed = metrics.reduce(
        (sum, m) => sum + Number(m.viewedItems),
        0
      );
      const totalClicked = metrics.reduce(
        (sum, m) => sum + Number(m.clickedItems),
        0
      );

      const algorithmBreakdown: Record<string, number> = {};
      metrics.forEach((m) => {
        algorithmBreakdown[m.algorithmSource] = Number(m.totalItems);
      });

      return {
        totalItems,
        algorithmBreakdown,
        engagementRate: totalItems > 0 ? totalViewed / totalItems : 0,
        clickThroughRate: totalViewed > 0 ? totalClicked / totalViewed : 0,
        averageRelevanceScore:
          metrics.length > 0
            ? metrics.reduce((sum, m) => sum + Number(m.avgRelevanceScore), 0) /
              metrics.length
            : 0,
      };
    } catch (error) {
      console.error("Error getting feed metrics:", error);
      return {
        totalItems: 0,
        algorithmBreakdown: {},
        engagementRate: 0,
        clickThroughRate: 0,
        averageRelevanceScore: 0,
      };
    }
  }

  /**
   * Update user feed preferences
   */
  async updateFeedPreferences(
    userId: string,
    preferences: Partial<any>
  ): Promise<boolean> {
    try {
      await this.db
        .update(userFeedPreferences)
        .set({
          ...preferences,
          updatedAt: new Date(),
        })
        .where(eq(userFeedPreferences.userId, userId));

      // Regenerate feed with new preferences
      await this.generatePersonalizedFeed(userId, { refreshExisting: true });

      return true;
    } catch (error) {
      console.error("Error updating feed preferences:", error);
      return false;
    }
  }

  // Private methods for feed generation

  private async getUserFeedPreferences(userId: string) {
    try {
      const prefs = await this.db
        .select()
        .from(userFeedPreferences)
        .where(eq(userFeedPreferences.userId, userId))
        .limit(1);

      return prefs[0] || (await this.createDefaultPreferences(userId));
    } catch (error) {
      return await this.createDefaultPreferences(userId);
    }
  }

  private async createDefaultPreferences(userId: string) {
    const defaultPrefs = {
      userId,
      preferredCategories: [],
      blockedCategories: [],
      showTrending: true,
      showRecommendations: true,
      showFollowedCreators: true,
      showSimilarPersonas: true,
      trendingWeight: "0.3",
      personalizedWeight: "0.4",
      socialWeight: "0.2",
      newCreatorWeight: "0.1",
      minRating: "3.0",
      hideNSFW: true,
      onlyVerifiedCreators: false,
    };

    await this.db.insert(userFeedPreferences).values(defaultPrefs);
    return defaultPrefs;
  }

  private async getFollowedCreatorItems(
    userId: string,
    preferences: any
  ): Promise<FeedItem[]> {
    if (!preferences.showFollowedCreators) return [];

    try {
      // Get creators user follows
      const followedCreators = await this.db
        .select({ creatorId: userFollows.followingId })
        .from(userFollows)
        .where(eq(userFollows.followerId, userId));

      if (followedCreators.length === 0) return [];

      // Get recent personas from followed creators
      const recentPersonas = await this.db
        .select({
          persona: personas,
          creator: users,
          metrics: discoveryMetrics,
        })
        .from(personas)
        .leftJoin(users, eq(personas.userId, users.id))
        .leftJoin(discoveryMetrics, eq(personas.id, discoveryMetrics.personaId))
        .where(
          and(
            eq(personas.privacyLevel, "public"),
            inArray(
              personas.userId,
              followedCreators.map((f) => f.creatorId)
            )
          )
        )
        .orderBy(desc(personas.createdAt))
        .limit(10);

      return recentPersonas.map((item) => ({
        id: `followed_${item.persona.id}`,
        itemType: "followed_creator_persona" as const,
        persona: item.persona,
        creator: item.creator,
        relevanceScore: 0.9, // High relevance for followed creators
        algorithmSource: "social_graph",
        isPromoted: false,
        isTrending: false,
        metadata: {
          reason: ["from_followed_creator"],
          tags: [item.persona.category || "general"],
        },
      }));
    } catch (error) {
      console.error("Error getting followed creator items:", error);
      return [];
    }
  }

  private async getTrendingItems(
    userId: string,
    preferences: any
  ): Promise<FeedItem[]> {
    if (!preferences.showTrending) return [];

    try {
      const trending = await this.discoveryService.getTrendingPersonas(
        "24h",
        15
      );

      return trending.map((item) => ({
        id: `trending_${item.personaId}`,
        itemType: "trending_persona" as const,
        persona: {
          id: item.personaId,
          name: item.name,
          category: item.category,
        },
        creator: { name: item.creatorName },
        relevanceScore: item.trendingScore,
        algorithmSource: "trending",
        isPromoted: false,
        isTrending: true,
        metadata: {
          reason: ["trending_now"],
          tags: [item.category],
          engagementData: {
            trendingScore: item.trendingScore,
            velocityScore: item.velocityScore,
          },
        },
      }));
    } catch (error) {
      console.error("Error getting trending items:", error);
      return [];
    }
  }

  private async getPersonalizedRecommendations(
    userId: string,
    preferences: any
  ): Promise<FeedItem[]> {
    if (!preferences.showRecommendations) return [];

    try {
      const recommendations =
        await this.discoveryService.getPersonalizedRecommendations(userId, 20, {
          categories: preferences.preferredCategories,
          minRating: preferences.minRating,
          hideNSFW: preferences.hideNSFW,
          onlyVerifiedCreators: preferences.onlyVerifiedCreators,
        });

      return recommendations.map((item) => ({
        id: `rec_${item.persona.id}`,
        itemType: "persona_recommendation" as const,
        persona: item.persona,
        creator: null, // Would be populated from the recommendation data
        relevanceScore: item.discoveryScore,
        algorithmSource: "personalized",
        isPromoted: false,
        isTrending: false,
        metadata: {
          reason: item.recommendationReason,
          tags: item.tags,
          engagementData: {
            averageRating: item.averageRating,
            totalReviews: item.totalReviews,
          },
        },
      }));
    } catch (error) {
      console.error("Error getting personalized recommendations:", error);
      return [];
    }
  }

  private async getSimilarPersonaItems(
    userId: string,
    preferences: any
  ): Promise<FeedItem[]> {
    if (!preferences.showSimilarPersonas) return [];

    try {
      // Get user's recently liked personas
      const recentLikes = await this.db
        .select({ personaId: personaLikes.personaId })
        .from(personaLikes)
        .where(eq(personaLikes.userId, userId))
        .orderBy(desc(personaLikes.createdAt))
        .limit(3);

      if (recentLikes.length === 0) return [];

      // Get similar personas for each liked persona
      const similarItems: FeedItem[] = [];
      for (const like of recentLikes) {
        const similar = await this.discoveryService.getSimilarPersonas(
          like.personaId,
          userId,
          3
        );

        similar.forEach((item) => {
          similarItems.push({
            id: `similar_${item.persona.id}`,
            itemType: "similar_personas" as const,
            persona: item.persona,
            creator: null,
            relevanceScore: item.discoveryScore,
            algorithmSource: "content_based",
            isPromoted: false,
            isTrending: false,
            metadata: {
              reason: ["similar_to_liked_persona"],
              tags: item.tags,
            },
          });
        });
      }

      return similarItems.slice(0, 10); // Limit similar items
    } catch (error) {
      console.error("Error getting similar persona items:", error);
      return [];
    }
  }

  private async getNewCreatorItems(
    userId: string,
    preferences: any
  ): Promise<FeedItem[]> {
    try {
      // Get personas from creators who joined recently
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const newCreatorPersonas = await this.db
        .select({
          persona: personas,
          creator: users,
          metrics: discoveryMetrics,
        })
        .from(personas)
        .leftJoin(users, eq(personas.userId, users.id))
        .leftJoin(discoveryMetrics, eq(personas.id, discoveryMetrics.personaId))
        .where(
          and(eq(personas.isPublic, true), gte(users.createdAt, thirtyDaysAgo))
        )
        .orderBy(desc(users.createdAt))
        .limit(8);

      return newCreatorPersonas.map((item) => ({
        id: `new_creator_${item.persona.id}`,
        itemType: "creator_update" as const,
        persona: item.persona,
        creator: item.creator,
        relevanceScore: 0.6,
        algorithmSource: "new_creator",
        isPromoted: false,
        isTrending: false,
        metadata: {
          reason: ["new_creator"],
          tags: ["new", item.persona.category || "general"],
        },
      }));
    } catch (error) {
      console.error("Error getting new creator items:", error);
      return [];
    }
  }

  private async getPromotedItems(
    userId: string,
    preferences: any
  ): Promise<FeedItem[]> {
    // Implementation for promoted/sponsored content
    // This would integrate with advertising system
    return [];
  }

  private combineAndDeduplicateItems(
    feedSources: FeedItem[][],
    excludeIds: string[]
  ): FeedItem[] {
    const allItems = feedSources.flat();
    const seenPersonaIds = new Set(excludeIds);
    const uniqueItems: FeedItem[] = [];

    for (const item of allItems) {
      if (item.persona && !seenPersonaIds.has(item.persona.id)) {
        seenPersonaIds.add(item.persona.id);
        uniqueItems.push(item);
      }
    }

    return uniqueItems;
  }

  private async rankFeedItems(
    items: FeedItem[],
    userId: string,
    preferences: any
  ): Promise<FeedItem[]> {
    // Apply algorithm weights to relevance scores
    const weightedItems = items.map((item) => {
      let weightedScore = item.relevanceScore;

      switch (item.algorithmSource) {
        case "trending":
          weightedScore *= preferences.trendingWeight || 0.3;
          break;
        case "personalized":
          weightedScore *= preferences.personalizedWeight || 0.4;
          break;
        case "social_graph":
          weightedScore *= preferences.socialWeight || 0.2;
          break;
        case "new_creator":
          weightedScore *= preferences.newCreatorWeight || 0.1;
          break;
      }

      return { ...item, relevanceScore: weightedScore };
    });

    // Sort by weighted relevance score
    return weightedItems.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private async storeFeedItems(
    userId: string,
    items: FeedItem[]
  ): Promise<void> {
    try {
      // Clear existing feed
      await this.clearUserFeed(userId);

      // Insert new feed items
      const feedItemsData = items.map((item, index) => ({
        userId,
        itemType: item.itemType,
        personaId: item.persona?.id,
        creatorId: item.creator?.id,
        algorithmSource: item.algorithmSource as
          | "trending"
          | "personalized"
          | "collaborative_filtering"
          | "content_based"
          | "social_graph"
          | "new_creator",
        relevanceScore: item.relevanceScore.toString(),
        feedPosition: index + 1,
        isPromoted: item.isPromoted,
        isTrending: item.isTrending,
      }));

      if (feedItemsData.length > 0) {
        await this.db.insert(feedItems).values(feedItemsData);
      }
    } catch (error) {
      console.error("Error storing feed items:", error);
    }
  }

  private async clearUserFeed(userId: string): Promise<void> {
    try {
      await this.db.delete(feedItems).where(eq(feedItems.userId, userId));
    } catch (error) {
      console.error("Error clearing user feed:", error);
    }
  }

  private async updateUserPreferencesFromInteraction(
    userId: string,
    feedItemId: string,
    interactionType: string
  ): Promise<void> {
    // Implementation for learning from user interactions
    // This would update user preferences based on what they interact with
    try {
      const feedItem = await this.db
        .select()
        .from(feedItems)
        .where(eq(feedItems.id, feedItemId))
        .limit(1);

      if (feedItem.length > 0) {
        const item = feedItem[0];

        // Update algorithm weights based on positive interactions
        if (interactionType === "clicked" || interactionType === "liked") {
          const currentPrefs = await this.getUserFeedPreferences(userId);
          const algorithmSource = item.algorithmSource;

          // Slightly increase weight for algorithm that produced clicked content
          const updates: any = {};
          switch (algorithmSource) {
            case "trending":
              updates.trendingWeight = Math.min(
                parseFloat(currentPrefs.trendingWeight || "0.3") + 0.01,
                0.5
              ).toString();
              break;
            case "personalized":
              updates.personalizedWeight = Math.min(
                parseFloat(currentPrefs.personalizedWeight || "0.4") + 0.01,
                0.6
              ).toString();
              break;
            case "social_graph":
              updates.socialWeight = Math.min(
                parseFloat(currentPrefs.socialWeight || "0.2") + 0.01,
                0.4
              ).toString();
              break;
            case "new_creator":
              updates.newCreatorWeight = Math.min(
                parseFloat(currentPrefs.newCreatorWeight || "0.1") + 0.01,
                0.3
              ).toString();
              break;
          }

          if (Object.keys(updates).length > 0) {
            await this.db
              .update(userFeedPreferences)
              .set(updates)
              .where(eq(userFeedPreferences.userId, userId));
          }
        }
      }
    } catch (error) {
      console.error("Error updating preferences from interaction:", error);
    }
  }

  /**
   * Get basic feed items quickly (for timeout prevention)
   */
  private async getBasicFeedItems(userId: string, limit: number): Promise<FeedItem[]> {
    try {
      console.log(`🔥 Generating ${limit} basic feed items for user ${userId}`);
      
      // Get some public personas quickly  
      const personaResults = await this.db
        .select({
          id: personas.id,
          name: personas.name,
          category: personas.category,
          isPublic: personas.isPublic,
          creator: {
            id: users.id,
            name: users.name,
            email: users.email,
          }
        })
        .from(personas)
        .leftJoin(users, eq(personas.userId, users.id))
        .where(eq(personas.isPublic, true))
        .limit(limit)
        .orderBy(sql`RANDOM()`);

      return personaResults.map((p, index) => ({
        id: `basic-${userId}-${index}`,
        itemType: "persona_recommendation" as any,
        persona: {
          id: p.id,
          name: p.name,
          category: p.category,
          isPublic: p.isPublic,
        },
        creator: p.creator,
        relevanceScore: 0.5,
        algorithmSource: "basic_generation",
        isPromoted: false,
        isTrending: false,
        metadata: {
          reason: ["basic_feed_item"],
          tags: [],
        }
      }));
    } catch (error) {
      console.error("Error generating basic feed items:", error);
      return [];
    }
  }
}
