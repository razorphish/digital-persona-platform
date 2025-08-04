import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and, desc, count, sql, gte } from 'drizzle-orm';
import {
  userFollows,
  personaLikes,
  personaReviews,
  users,
  personas,
  discoveryMetrics,
  contentModerations
} from '@digital-persona/database/schema';

interface FollowResult {
  success: boolean;
  isFollowing: boolean;
  followerCount: number;
  message: string;
}

interface LikeResult {
  success: boolean;
  isLiked: boolean;
  likeCount: number;
  message: string;
}

interface ReviewSubmission {
  personaId: string;
  rating: number;
  title?: string;
  reviewText?: string;
  categories?: string[];
  pros?: string[];
  cons?: string[];
  subscriptionTier?: string;
  interactionDuration?: number;
}

interface ReviewResult {
  success: boolean;
  reviewId?: string;
  message: string;
  requiresModeration: boolean;
}

interface SocialStats {
  followers: number;
  following: number;
  totalLikes: number;
  totalReviews: number;
  averageRating: number;
}

interface PersonaEngagement {
  personaId: string;
  likes: number;
  reviews: number;
  averageRating: number;
  followers: number;
  engagementRate: number;
}

export class SocialEngagementService {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    const client = postgres(connectionString);
    this.db = drizzle(client);
  }

  /**
   * Follow or unfollow a creator
   */
  async toggleFollow(followerId: string, followingId: string, followReason?: string): Promise<FollowResult> {
    try {
      // Check if already following
      const existingFollow = await this.db
        .select()
        .from(userFollows)
        .where(and(
          eq(userFollows.followerId, followerId),
          eq(userFollows.followingId, followingId)
        ))
        .limit(1);

      if (existingFollow.length > 0) {
        // Unfollow
        await this.db
          .delete(userFollows)
          .where(and(
            eq(userFollows.followerId, followerId),
            eq(userFollows.followingId, followingId)
          ));

        const followerCount = await this.getFollowerCount(followingId);

        return {
          success: true,
          isFollowing: false,
          followerCount,
          message: 'Successfully unfollowed creator',
        };
      } else {
        // Follow
        await this.db.insert(userFollows).values({
          followerId,
          followingId,
          followReason: followReason as any,
          notifyOnNewPersona: true,
          notifyOnUpdates: false,
        });

        const followerCount = await this.getFollowerCount(followingId);

        return {
          success: true,
          isFollowing: true,
          followerCount,
          message: 'Successfully followed creator',
        };
      }

    } catch (error) {
      console.error('Error toggling follow:', error);
      return {
        success: false,
        isFollowing: false,
        followerCount: 0,
        message: 'Failed to update follow status',
      };
    }
  }

  /**
   * Like or unlike a persona
   */
  async toggleLike(
    userId: string, 
    personaId: string, 
    likeType: 'like' | 'favorite' | 'bookmark' | 'interested' = 'like',
    discoveredVia?: string
  ): Promise<LikeResult> {
    try {
      // Check if already liked
      const existingLike = await this.db
        .select()
        .from(personaLikes)
        .where(and(
          eq(personaLikes.userId, userId),
          eq(personaLikes.personaId, personaId)
        ))
        .limit(1);

      if (existingLike.length > 0) {
        // Unlike
        await this.db
          .delete(personaLikes)
          .where(and(
            eq(personaLikes.userId, userId),
            eq(personaLikes.personaId, personaId)
          ));

        // Update discovery metrics
        await this.updatePersonaEngagementMetrics(personaId, 'like_removed');

        const likeCount = await this.getLikeCount(personaId);

        return {
          success: true,
          isLiked: false,
          likeCount,
          message: 'Successfully removed like',
        };
      } else {
        // Like
        await this.db.insert(personaLikes).values({
          userId,
          personaId,
          likeType: likeType as any,
          discoveredVia: discoveredVia as any,
        });

        // Update discovery metrics
        await this.updatePersonaEngagementMetrics(personaId, 'like_added');

        const likeCount = await this.getLikeCount(personaId);

        return {
          success: true,
          isLiked: true,
          likeCount,
          message: 'Successfully liked persona',
        };
      }

    } catch (error) {
      console.error('Error toggling like:', error);
      return {
        success: false,
        isLiked: false,
        likeCount: 0,
        message: 'Failed to update like status',
      };
    }
  }

  /**
   * Submit a review for a persona
   */
  async submitReview(userId: string, reviewData: ReviewSubmission): Promise<ReviewResult> {
    try {
      // Check if user already reviewed this persona
      const existingReview = await this.db
        .select()
        .from(personaReviews)
        .where(and(
          eq(personaReviews.userId, userId),
          eq(personaReviews.personaId, reviewData.personaId)
        ))
        .limit(1);

      if (existingReview.length > 0) {
        return {
          success: false,
          message: 'You have already reviewed this persona',
          requiresModeration: false,
        };
      }

      // Check if review requires moderation (content filtering)
      const requiresModeration = await this.requiresContentModeration(reviewData);

      // Insert review
      const review = await this.db.insert(personaReviews).values({
        userId,
        personaId: reviewData.personaId,
        rating: reviewData.rating,
        title: reviewData.title,
        reviewText: reviewData.reviewText,
        categories: reviewData.categories || [],
        pros: reviewData.pros || [],
        cons: reviewData.cons || [],
        interactionDuration: reviewData.interactionDuration,
        subscriptionTier: reviewData.subscriptionTier,
        isVerifiedPurchase: await this.isVerifiedPurchase(userId, reviewData.personaId),
        isPublic: true,
        moderationStatus: requiresModeration ? 'pending' : 'approved',
      }).returning({ id: sql`${personaReviews.id}` });

      // Update persona quality metrics
      await this.updatePersonaQualityMetrics(reviewData.personaId);

      return {
        success: true,
        reviewId: review[0].id,
        message: requiresModeration 
          ? 'Review submitted successfully and is pending moderation' 
          : 'Review submitted successfully',
        requiresModeration,
      };

    } catch (error) {
      console.error('Error submitting review:', error);
      return {
        success: false,
        message: 'Failed to submit review',
        requiresModeration: false,
      };
    }
  }

  /**
   * Get user's social stats
   */
  async getUserSocialStats(userId: string): Promise<SocialStats> {
    try {
      const [
        followerCount,
        followingCount,
        likesGiven,
        reviewsCount,
        avgRatingGiven
      ] = await Promise.all([
        // Count followers
        this.db
          .select({ count: count() })
          .from(userFollows)
          .where(eq(userFollows.followingId, userId)),

        // Count following
        this.db
          .select({ count: count() })
          .from(userFollows)
          .where(eq(userFollows.followerId, userId)),

        // Count likes given
        this.db
          .select({ count: count() })
          .from(personaLikes)
          .where(eq(personaLikes.userId, userId)),

        // Count reviews given
        this.db
          .select({ count: count() })
          .from(personaReviews)
          .where(eq(personaReviews.userId, userId)),

        // Average rating given
        this.db
          .select({ avgRating: sql`AVG(${personaReviews.rating})` })
          .from(personaReviews)
          .where(eq(personaReviews.userId, userId)),
      ]);

      return {
        followers: followerCount[0]?.count || 0,
        following: followingCount[0]?.count || 0,
        totalLikes: likesGiven[0]?.count || 0,
        totalReviews: reviewsCount[0]?.count || 0,
        averageRating: parseFloat(avgRatingGiven[0]?.avgRating as string || '0'),
      };

    } catch (error) {
      console.error('Error getting user social stats:', error);
      return {
        followers: 0,
        following: 0,
        totalLikes: 0,
        totalReviews: 0,
        averageRating: 0,
      };
    }
  }

  /**
   * Get persona engagement stats
   */
  async getPersonaEngagement(personaId: string): Promise<PersonaEngagement> {
    try {
      const [
        likes,
        reviews,
        avgRating,
        metrics
      ] = await Promise.all([
        // Count likes
        this.db
          .select({ count: count() })
          .from(personaLikes)
          .where(eq(personaLikes.personaId, personaId)),

        // Count reviews
        this.db
          .select({ count: count() })
          .from(personaReviews)
          .where(and(
            eq(personaReviews.personaId, personaId),
            eq(personaReviews.moderationStatus, 'approved')
          )),

        // Average rating
        this.db
          .select({ avgRating: sql`AVG(${personaReviews.rating})` })
          .from(personaReviews)
          .where(and(
            eq(personaReviews.personaId, personaId),
            eq(personaReviews.moderationStatus, 'approved')
          )),

        // Discovery metrics
        this.db
          .select()
          .from(discoveryMetrics)
          .where(eq(discoveryMetrics.personaId, personaId))
          .limit(1),
      ]);

      const likesCount = likes[0]?.count || 0;
      const reviewsCount = reviews[0]?.count || 0;
      const averageRating = parseFloat(avgRating[0]?.avgRating as string || '0');
      const views = metrics[0]?.viewsLast7d || 0;
      
      // Calculate engagement rate
      const engagementRate = views > 0 ? (likesCount + reviewsCount) / views : 0;

      return {
        personaId,
        likes: likesCount,
        reviews: reviewsCount,
        averageRating,
        followers: 0, // This would be creator followers, not persona-specific
        engagementRate,
      };

    } catch (error) {
      console.error('Error getting persona engagement:', error);
      return {
        personaId,
        likes: 0,
        reviews: 0,
        averageRating: 0,
        followers: 0,
        engagementRate: 0,
      };
    }
  }

  /**
   * Get reviews for a persona
   */
  async getPersonaReviews(
    personaId: string,
    limit: number = 10,
    offset: number = 0,
    sortBy: 'newest' | 'oldest' | 'rating_high' | 'rating_low' | 'helpful' = 'newest'
  ) {
    try {
      let orderBy;
      switch (sortBy) {
        case 'oldest':
          orderBy = personaReviews.createdAt;
          break;
        case 'rating_high':
          orderBy = desc(personaReviews.rating);
          break;
        case 'rating_low':
          orderBy = personaReviews.rating;
          break;
        case 'helpful':
          orderBy = desc(personaReviews.isHelpful);
          break;
        default:
          orderBy = desc(personaReviews.createdAt);
      }

      const reviews = await this.db
        .select({
          review: personaReviews,
          reviewer: {
            id: users.id,
            name: users.name,
            image: users.image,
          },
        })
        .from(personaReviews)
        .leftJoin(users, eq(personaReviews.userId, users.id))
        .where(and(
          eq(personaReviews.personaId, personaId),
          eq(personaReviews.moderationStatus, 'approved'),
          eq(personaReviews.isPublic, true)
        ))
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      return reviews.map(r => ({
        ...r.review,
        reviewer: r.reviewer,
        createdAt: r.review.createdAt.toISOString(),
        updatedAt: r.review.updatedAt.toISOString(),
      }));

    } catch (error) {
      console.error('Error getting persona reviews:', error);
      return [];
    }
  }

  /**
   * Get user's following list
   */
  async getUserFollowing(userId: string, limit: number = 50, offset: number = 0) {
    try {
      const following = await this.db
        .select({
          follow: userFollows,
          creator: {
            id: users.id,
            name: users.name,
            image: users.image,
          },
        })
        .from(userFollows)
        .leftJoin(users, eq(userFollows.followingId, users.id))
        .where(eq(userFollows.followerId, userId))
        .orderBy(desc(userFollows.createdAt))
        .limit(limit)
        .offset(offset);

      return following.map(f => ({
        ...f.follow,
        creator: f.creator,
        createdAt: f.follow.createdAt.toISOString(),
      }));

    } catch (error) {
      console.error('Error getting user following:', error);
      return [];
    }
  }

  /**
   * Get user's liked personas
   */
  async getUserLikedPersonas(userId: string, limit: number = 50, offset: number = 0) {
    try {
      const liked = await this.db
        .select({
          like: personaLikes,
          persona: personas,
          creator: {
            id: users.id,
            name: users.name,
            image: users.image,
          },
        })
        .from(personaLikes)
        .leftJoin(personas, eq(personaLikes.personaId, personas.id))
        .leftJoin(users, eq(personas.userId, users.id))
        .where(eq(personaLikes.userId, userId))
        .orderBy(desc(personaLikes.createdAt))
        .limit(limit)
        .offset(offset);

      return liked.map(l => ({
        ...l.like,
        persona: l.persona,
        creator: l.creator,
        createdAt: l.like.createdAt.toISOString(),
      }));

    } catch (error) {
      console.error('Error getting user liked personas:', error);
      return [];
    }
  }

  /**
   * Mark review as helpful
   */
  async markReviewHelpful(reviewId: string, userId: string): Promise<boolean> {
    try {
      // For now, just increment the helpful count
      // In a full implementation, you'd track which users found it helpful
      await this.db
        .update(personaReviews)
        .set({
          isHelpful: sql`${personaReviews.isHelpful} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(personaReviews.id, reviewId));

      return true;

    } catch (error) {
      console.error('Error marking review helpful:', error);
      return false;
    }
  }

  /**
   * Report a review
   */
  async reportReview(reviewId: string, reporterId: string, reason: string): Promise<boolean> {
    try {
      await this.db
        .update(personaReviews)
        .set({
          isReported: true,
          moderationStatus: 'under_review',
          updatedAt: new Date(),
        })
        .where(eq(personaReviews.id, reviewId));

      // In a full implementation, you'd also create a report record
      // and potentially trigger content moderation

      return true;

    } catch (error) {
      console.error('Error reporting review:', error);
      return false;
    }
  }

  /**
   * Get social activity feed for a user
   */
  async getUserSocialActivity(userId: string, limit: number = 20) {
    try {
      // Get recent activity from followed creators
      const followedCreators = await this.db
        .select({ creatorId: userFollows.followingId })
        .from(userFollows)
        .where(eq(userFollows.followerId, userId));

      if (followedCreators.length === 0) {
        return [];
      }

      const creatorIds = followedCreators.map(f => f.creatorId);

      // Get recent personas from followed creators
      const recentActivity = await this.db
        .select({
          type: sql`'new_persona'`,
          persona: personas,
          creator: {
            id: users.id,
            name: users.name,
            image: users.image,
          },
          createdAt: personas.createdAt,
        })
        .from(personas)
        .leftJoin(users, eq(personas.userId, users.id))
        .where(and(
          eq(personas.isPublic, true),
          sql`${personas.userId} = ANY(${creatorIds})`
        ))
        .orderBy(desc(personas.createdAt))
        .limit(limit);

      return recentActivity.map(activity => ({
        ...activity,
        createdAt: activity.createdAt.toISOString(),
      }));

    } catch (error) {
      console.error('Error getting user social activity:', error);
      return [];
    }
  }

  // Helper methods
  private async getFollowerCount(userId: string): Promise<number> {
    try {
      const result = await this.db
        .select({ count: count() })
        .from(userFollows)
        .where(eq(userFollows.followingId, userId));

      return result[0]?.count || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getLikeCount(personaId: string): Promise<number> {
    try {
      const result = await this.db
        .select({ count: count() })
        .from(personaLikes)
        .where(eq(personaLikes.personaId, personaId));

      return result[0]?.count || 0;
    } catch (error) {
      return 0;
    }
  }

  private async updatePersonaEngagementMetrics(personaId: string, action: 'like_added' | 'like_removed'): Promise<void> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Update discovery metrics
      const increment = action === 'like_added' ? 1 : -1;

      await this.db
        .update(discoveryMetrics)
        .set({
          likesLast24h: sql`${discoveryMetrics.likesLast24h} + ${increment}`,
          likesLast7d: sql`${discoveryMetrics.likesLast7d} + ${increment}`,
          likesLast30d: sql`${discoveryMetrics.likesLast30d} + ${increment}`,
          updatedAt: new Date(),
        })
        .where(eq(discoveryMetrics.personaId, personaId));

    } catch (error) {
      console.error('Error updating persona engagement metrics:', error);
    }
  }

  private async updatePersonaQualityMetrics(personaId: string): Promise<void> {
    try {
      // Recalculate average rating
      const avgRating = await this.db
        .select({ avgRating: sql`AVG(${personaReviews.rating})` })
        .from(personaReviews)
        .where(and(
          eq(personaReviews.personaId, personaId),
          eq(personaReviews.moderationStatus, 'approved')
        ));

      const qualityScore = parseFloat(avgRating[0]?.avgRating as string || '0') / 5;

      await this.db
        .update(discoveryMetrics)
        .set({
          qualityScore: qualityScore.toString(),
          updatedAt: new Date(),
        })
        .where(eq(discoveryMetrics.personaId, personaId));

    } catch (error) {
      console.error('Error updating persona quality metrics:', error);
    }
  }

  private async requiresContentModeration(reviewData: ReviewSubmission): Promise<boolean> {
    // Check if review content contains potentially problematic content
    if (!reviewData.reviewText) return false;

    // Simple content checks (in production, use the content moderation service)
    const problematicWords = ['spam', 'scam', 'fake', 'terrible', 'awful'];
    const text = reviewData.reviewText.toLowerCase();
    
    return problematicWords.some(word => text.includes(word));
  }

  private async isVerifiedPurchase(userId: string, personaId: string): Promise<boolean> {
    // Check if user has an active subscription to this persona
    // This would integrate with the subscription system
    return false; // Placeholder
  }

  /**
   * Get trending hashtags and topics
   */
  async getTrendingTopics(limit: number = 10) {
    try {
      const trending = await this.db
        .select()
        .from(trendingTopics)
        .where(eq(trendingTopics.isCurrentlyTrending, true))
        .orderBy(desc(trendingTopics.trendingScore))
        .limit(limit);

      return trending.map(topic => ({
        ...topic,
        trendingScore: parseFloat(topic.trendingScore || '0'),
        velocityScore: parseFloat(topic.velocityScore || '0'),
        createdAt: topic.createdAt.toISOString(),
        updatedAt: topic.updatedAt.toISOString(),
      }));

    } catch (error) {
      console.error('Error getting trending topics:', error);
      return [];
    }
  }

  /**
   * Check if user is following a creator
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const follows = await this.db
        .select()
        .from(userFollows)
        .where(and(
          eq(userFollows.followerId, followerId),
          eq(userFollows.followingId, followingId)
        ))
        .limit(1);

      return follows.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if user has liked a persona
   */
  async isLiked(userId: string, personaId: string): Promise<boolean> {
    try {
      const likes = await this.db
        .select()
        .from(personaLikes)
        .where(and(
          eq(personaLikes.userId, userId),
          eq(personaLikes.personaId, personaId)
        ))
        .limit(1);

      return likes.length > 0;
    } catch (error) {
      return false;
    }
  }
}