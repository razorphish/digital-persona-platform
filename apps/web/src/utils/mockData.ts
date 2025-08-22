// Mock Data for Testing
// This file contains mock data that should ONLY be used in tests
// DO NOT import this into production code

export interface MockFeedItem {
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

export const mockFeedItems: MockFeedItem[] = [
  {
    id: "test-1",
    itemType: "trending_persona",
    persona: {
      id: "persona-1",
      name: "Emma Chen",
      description:
        "AI startup founder sharing insights about entrepreneurship and tech innovation",
      avatar: null,
      category: "business",
      isPublic: true,
      subscriptionPrice: "9.99",
    },
    creator: {
      id: "creator-1",
      name: "Emma Chen",
      avatar: null,
    },
    relevanceScore: 0.95,
    algorithmSource: "trending",
    isPromoted: false,
    isTrending: true,
    metadata: {
      reason: ["High engagement", "Trending in Business"],
      tags: ["business", "startups", "ai"],
      engagementData: { likes: 1250, views: 8900, subscribers: 890 },
    },
  },
  {
    id: "test-2",
    itemType: "persona_recommendation",
    persona: {
      id: "persona-2",
      name: "Marcus Rodriguez",
      description:
        "Fitness coach and nutritionist helping people build healthy habits that last",
      avatar: null,
      category: "fitness",
      isPublic: true,
      subscriptionPrice: "14.99",
    },
    creator: {
      id: "creator-2",
      name: "Marcus Rodriguez",
      avatar: null,
    },
    relevanceScore: 0.87,
    algorithmSource: "personalized",
    isPromoted: false,
    isTrending: false,
    metadata: {
      reason: ["Matches your interests", "Highly rated"],
      tags: ["fitness", "nutrition", "wellness"],
      engagementData: { likes: 750, views: 4200, subscribers: 456 },
    },
  },
  {
    id: "test-3",
    itemType: "creator_update",
    persona: {
      id: "persona-3",
      name: "Luna Park",
      description:
        "Digital artist creating stunning visual experiences and teaching creative techniques",
      avatar: null,
      category: "art",
      isPublic: true,
      subscriptionPrice: "12.99",
    },
    creator: {
      id: "creator-3",
      name: "Luna Park",
      avatar: null,
    },
    relevanceScore: 0.82,
    algorithmSource: "social_graph",
    isPromoted: false,
    isTrending: false,
    metadata: {
      reason: ["Following this creator", "New content available"],
      tags: ["art", "digital", "creative"],
      engagementData: { likes: 2100, views: 12500, subscribers: 1200 },
    },
  },
];

export const mockTrendingPersonas = [
  {
    personaId: "persona-1",
    name: "Emma Chen",
    creatorName: "Emma Chen",
    category: "business",
    trendingScore: 95,
    velocityScore: 88,
    engagementGrowth: 45,
    viewsGrowth: 67,
    likesGrowth: 52,
    thumbnailUrl: null,
  },
  {
    personaId: "persona-4",
    name: "Chef Alberto",
    creatorName: "Alberto Santos",
    category: "cooking",
    trendingScore: 89,
    velocityScore: 92,
    engagementGrowth: 38,
    viewsGrowth: 55,
    likesGrowth: 41,
    thumbnailUrl: null,
  },
  {
    personaId: "persona-5",
    name: "Dr. Sarah Kim",
    creatorName: "Dr. Sarah Kim",
    category: "education",
    trendingScore: 84,
    velocityScore: 76,
    engagementGrowth: 29,
    viewsGrowth: 43,
    likesGrowth: 35,
    thumbnailUrl: null,
  },
];

export const mockPersonaEngagement = {
  likes: 1250,
  views: 8900,
  subscribers: 890,
  isLiked: false,
  isFollowing: false,
};

// Mock tRPC responses for testing
export const mockTRPCResponses = {
  'feed.getFeed': { data: mockFeedItems },
  'discovery.getTrendingPersonas': { data: mockTrendingPersonas },
  'socialEngagement.getPersonaEngagement': { data: mockPersonaEngagement },
  'socialEngagement.isLiked': { data: { isLiked: false } },
  'socialEngagement.isFollowing': { data: { isFollowing: false } },
};
