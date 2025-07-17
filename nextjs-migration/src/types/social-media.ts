// Social Media Integration Types

export interface SocialMediaIntegration {
  id: number;
  user_id: number;
  platform: "twitter" | "facebook";
  platform_user_id: string;
  platform_username: string;
  access_token: string;
  access_token_secret?: string; // For Twitter OAuth 1.0a
  refresh_token?: string;
  token_expires_at?: string;
  is_active: boolean;
  last_sync_at?: string;
  sync_frequency_hours: number;
  platform_metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SocialMediaPost {
  id: number;
  integration_id: number;
  platform_post_id: string;
  post_type: "post" | "comment" | "like" | "share";
  content?: string;
  media_urls?: string[];
  hashtags?: string[];
  mentions?: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  engagement_score: number;
  sentiment_score?: number;
  posted_at: string;
  platform_metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface IntegrationAnalytics {
  id: number;
  integration_id: number;
  date: string;
  total_posts: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  avg_engagement_rate: number;
  top_hashtags?: Array<[string, number]>;
  top_mentions?: Array<[string, number]>;
  sentiment_distribution?: {
    positive: number;
    negative: number;
    neutral: number;
  };
  peak_activity_hours?: Record<string, number>;
  created_at: string;
}

// API Request/Response Types

export interface ConnectSocialAccountRequest {
  platform: "twitter" | "facebook";
  access_token: string;
  access_token_secret?: string; // For Twitter
  refresh_token?: string;
}

export interface SyncRequest {
  force_full_sync?: boolean;
}

export interface SyncResponse {
  message: string;
  new_posts_count: number;
  total_posts_synced: number;
  learning_results?: LearningResults;
}

export interface LearningResults {
  updated_personas: number[];
  learning_count: number;
  total_posts_processed: number;
  error?: string;
}

export interface AdvancedLearningConfig {
  target_personas?: number[];
  update_self_persona?: boolean;
  include_analytics?: boolean;
  sentiment_weight?: number;
}

export interface AdvancedLearningResponse {
  message: string;
  integration_id: number;
  posts_processed: number;
  learning_results: LearningResults;
}

export interface AuthUrls {
  twitter: string;
  facebook: string;
}

export interface SentimentAnalysisResponse {
  message: string;
  posts_analyzed: number;
}

export interface IntegrationUpdateRequest {
  sync_frequency_hours?: number;
  is_active?: boolean;
}

// Platform-specific metadata types

export interface TwitterMetadata {
  name: string;
  description: string;
  followers_count: number;
  friends_count: number;
  statuses_count: number;
  profile_image_url: string;
  verified: boolean;
}

export interface FacebookMetadata {
  name: string;
  email?: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

// Helper types and constants

export const SUPPORTED_PLATFORMS = ["twitter", "facebook"] as const;
export type SupportedPlatform = (typeof SUPPORTED_PLATFORMS)[number];

export const POST_TYPES = ["post", "comment", "like", "share"] as const;
export type PostType = (typeof POST_TYPES)[number];

// Validation functions

export function isValidPlatform(
  platform: string
): platform is SupportedPlatform {
  return SUPPORTED_PLATFORMS.includes(platform as SupportedPlatform);
}

export function isValidPostType(type: string): type is PostType {
  return POST_TYPES.includes(type as PostType);
}

export function validateIntegrationData(
  data: Partial<ConnectSocialAccountRequest>
): boolean {
  if (!data.platform || !isValidPlatform(data.platform)) {
    return false;
  }
  if (!data.access_token) {
    return false;
  }
  // Twitter requires access_token_secret
  if (data.platform === "twitter" && !data.access_token_secret) {
    return false;
  }
  return true;
}

// Learning integration types (for persona system)

export interface SocialMediaLearningData {
  text: string;
  source: "social_media";
  post_count: number;
  platforms: string[];
  date_range: {
    earliest: string;
    latest: string;
  };
}

export interface PersonaLearningUpdate {
  persona_id: number;
  learning_data: SocialMediaLearningData;
  success: boolean;
  error?: string;
}
