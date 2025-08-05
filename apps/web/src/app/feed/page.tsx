"use client";

import React, { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import PersonaFeedCard from "@/components/feed/PersonaFeedCard";
import TrendingSection from "@/components/feed/TrendingSection";
import FeedFilters from "@/components/feed/FeedFilters";
import MainNavigation from "@/components/navigation/MainNavigation";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";

interface FeedItem {
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

function FeedPageContent() {
  const { user } = useAuth();

  // Check if backend is available before making any tRPC calls
  const backendAvailable = Boolean(
    trpc.feed &&
      trpc.discovery &&
      typeof trpc.feed.getFeed === "function" &&
      typeof trpc.discovery.getTrendingPersonas === "function"
  );

  // Mock data defined at the top for immediate access
  const mockFeedItems: FeedItem[] = [
    {
      id: "1",
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
      id: "2",
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
      id: "3",
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

  const mockTrendingPersonas = [
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

  // Always start with mock data to ensure immediate rendering
  const [feedItems, setFeedItems] = useState<FeedItem[]>(mockFeedItems);
  const [isLoading, setIsLoading] = useState(false); // Start with false since we have mock data
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [mockDataLoaded, setMockDataLoaded] = useState(true); // Already loaded since we start with it

  // Only use tRPC queries if backend is available, otherwise use null data
  const feedQuery = backendAvailable
    ? trpc.feed.getFeed.useQuery({
        limit: 50,
      })
    : null;

  const trendingQuery = backendAvailable
    ? trpc.discovery.getTrendingPersonas.useQuery({
        timeframe: "24h" as const,
        limit: 10,
      })
    : null;

  // Extract data with fallbacks
  const feed = feedQuery?.data || null;
  const refetchFeed = feedQuery?.refetch || (() => {});
  const feedLoading = feedQuery?.isLoading || false;
  const feedError =
    feedQuery?.error ||
    (!backendAvailable ? new Error("Backend disabled") : null);

  const trending = trendingQuery?.data || null;
  const trendingLoading = trendingQuery?.isLoading || false;
  const trendingError =
    trendingQuery?.error ||
    (!backendAvailable ? new Error("Backend disabled") : null);

  // tRPC mutations - only create if backend is available
  const generateFeedMutation = backendAvailable
    ? trpc.feed.generateFeed.useMutation({
        onSuccess: () => {
          refetchFeed();
          setIsRefreshing(false);
        },
        onError: (error) => {
          console.error("Error generating feed:", error);
          setIsRefreshing(false);
        },
      })
    : {
        mutate: () => {
          console.log("Generate feed endpoint disabled - using mock data");
          setTimeout(() => {
            setFeedItems([...mockFeedItems]);
            setIsRefreshing(false);
          }, 500);
        },
        isLoading: false,
      };

  const loadMockData = () => {
    setFeedItems([...mockFeedItems]); // Create new array to trigger re-render
    setIsLoading(false);
    setIsRefreshing(false);
  };

  const trackInteractionMutation = backendAvailable
    ? trpc.feed.trackInteraction.useMutation()
    : {
        mutate: (data: any) =>
          console.log("Track interaction endpoint disabled:", data),
        isLoading: false,
      };

  // Debug logging in useEffect to avoid render warnings
  useEffect(() => {
    console.log("Feed Debug:", {
      backendAvailable,
      feedItemsLength: feedItems.length,
      isLoading,
      mockDataLoaded,
      trendingLength: (trending || mockTrendingPersonas).length,
    });
  }, [backendAvailable, feedItems.length, isLoading, mockDataLoaded, trending, mockTrendingPersonas]);

  // Only try to load real data if backend is available
  useEffect(() => {
    if (backendAvailable && feed) {
      // Backend available and has data, replace mock data
      setFeedItems(feed);
      setIsLoading(false);
    } else if (backendAvailable && !feedLoading && !feed) {
      // Backend available but no data yet, try to generate feed
      setIsLoading(true);
      handleRefreshFeed();
    }
    // If backend not available, we already have mock data loaded
  }, [backendAvailable, feed, feedLoading, handleRefreshFeed]);

  const handleRefreshFeed = async () => {
    setIsRefreshing(true);

    if (backendAvailable) {
      generateFeedMutation.mutate({
        refreshExisting: true,
        categories: selectedCategory ? [selectedCategory] : undefined,
      });
    } else {
      // Just reload mock data
      setTimeout(() => {
        setFeedItems([...mockFeedItems]); // Create new array to trigger re-render
        setIsRefreshing(false);
      }, 500);
    }
  };

  const handleFeedInteraction = async (
    feedItemId: string,
    interactionType: "viewed" | "clicked" | "liked" | "shared" | "dismissed"
  ) => {
    trackInteractionMutation.mutate({
      feedItemId,
      interactionType,
    });
  };

  const handleCategoryFilter = (category: string | null) => {
    setSelectedCategory(category);
    // Regenerate feed with category filter
    generateFeedMutation.mutate({
      refreshExisting: true,
      categories: category ? [category] : undefined,
    });
  };

  // Only show loading if backend is available and actually loading
  if (backendAvailable && (isLoading || feedLoading)) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <MainNavigation />

        {/* Loading Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold text-gray-900">Your Feed</h1>
                <div className="animate-pulse">
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-6">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg shadow-sm border animate-pulse"
                >
                  <div className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-4 w-24 bg-gray-200 rounded"></div>
                        <div className="h-3 w-16 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 w-full bg-gray-200 rounded"></div>
                      <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                      <div className="h-32 w-full bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
                <div className="h-6 w-20 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="h-4 w-20 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <MainNavigation />

      {/* Feed Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">Your Feed</h1>
              {isRefreshing && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"
                  />
                </svg>
              </button>

              <button
                onClick={handleRefreshFeed}
                disabled={isRefreshing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="pb-4">
              <FeedFilters
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryFilter}
                onClose={() => setShowFilters(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Feed Column */}
          <div className="lg:col-span-3">
            {!feedItems || feedItems.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Feed Items
                </h3>
                <p className="text-gray-600 mb-4">
                  Your personalized feed is empty. Try following some creators
                  or exploring trending personas.
                </p>
                <button
                  onClick={handleRefreshFeed}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Generate Feed
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {feedItems.map((item, index) => (
                  <PersonaFeedCard
                    key={item.id}
                    feedItem={item}
                    onInteraction={handleFeedInteraction}
                    viewportIndex={index}
                  />
                ))}

                {/* Load More */}
                <div className="text-center pt-8">
                  <button
                    onClick={handleRefreshFeed}
                    className="text-indigo-600 hover:text-indigo-500 font-medium"
                  >
                    Load More
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Section */}
            <TrendingSection
              trending={trending || mockTrendingPersonas}
              isLoading={trendingLoading && !trendingError}
            />

            {/* Discover Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Discover
              </h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Explore Categories
                      </p>
                      <p className="text-sm text-gray-600">
                        Find personas by interest
                      </p>
                    </div>
                  </div>
                </button>

                <button className="w-full text-left p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">New Creators</p>
                      <p className="text-sm text-gray-600">
                        Fresh voices on the platform
                      </p>
                    </div>
                  </div>
                </button>

                <button className="w-full text-left p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Recommended for You
                      </p>
                      <p className="text-sm text-gray-600">
                        Based on your interests
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Footer Links */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="space-y-3 text-sm text-gray-600">
                <a href="/about" className="block hover:text-gray-900">
                  About Hibiji
                </a>
                <a href="/privacy" className="block hover:text-gray-900">
                  Privacy Policy
                </a>
                <a href="/terms" className="block hover:text-gray-900">
                  Terms of Service
                </a>
                <a href="/support" className="block hover:text-gray-900">
                  Support
                </a>
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    © 2025 Hibiji. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FeedPage() {
  return (
    <AuthGuard>
      <FeedPageContent />
    </AuthGuard>
  );
}
