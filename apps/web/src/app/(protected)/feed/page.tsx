"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import PersonaFeedCard from "@/components/feed/PersonaFeedCard";
import TrendingSection from "@/components/feed/TrendingSection";
import FeedFilters from "@/components/feed/FeedFilters";
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

  // Initialize state for feed data
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // tRPC queries for real data - OPTIMIZED for performance
  const feedQuery = trpc.feed.getFeed.useQuery(
    {
      limit: 10, // Reduced from 50 to 10 for faster loading
    },
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      retry: 1, // Only retry once on failure
      retryDelay: 1000, // 1 second retry delay
    }
  );

  const trendingQuery = trpc.discovery.getTrendingPersonas.useQuery(
    {
      timeframe: "24h" as const,
      limit: 5, // Reduced from 10 to 5
    },
    {
      staleTime: 10 * 60 * 1000, // Cache for 10 minutes
      retry: 1,
      retryDelay: 1000,
    }
  );

  // Extract data
  const feed = feedQuery?.data || null;
  const feedLoading = feedQuery?.isLoading || false;
  const feedError = feedQuery?.error || null;

  const trending = trendingQuery?.data || null;
  const trendingLoading = trendingQuery?.isLoading || false;
  const trendingError = trendingQuery?.error || null;

  // tRPC mutations
  const generateFeedMutation = trpc.feed.generateFeed.useMutation({
    onSuccess: (newFeed) => {
      console.log("✅ Feed generated successfully:", newFeed?.length, "items");
      feedQuery.refetch();
      setIsRefreshing(false);
    },
    onError: (error) => {
      console.error("❌ Error generating feed:", error);
      setIsRefreshing(false);
    },
  });

  const trackInteractionMutation = trpc.feed.trackInteraction.useMutation();

  const handleRefreshFeed = useCallback(async () => {
    console.log("🔄 Refreshing feed...");
    setIsRefreshing(true);

    try {
      generateFeedMutation.mutate({
        refreshExisting: true,
        categories: selectedCategory ? [selectedCategory] : undefined,
      });
    } catch (error) {
      console.error("❌ Failed to refresh feed:", error);
      setIsRefreshing(false);
    }
  }, [generateFeedMutation, selectedCategory]);

  // Handle data loading with better error recovery
  useEffect(() => {
    if (feed && feed.length > 0) {
      console.log("📰 Using real feed data:", feed.length, "items");
      setFeedItems(feed);
      setIsLoading(false);
    } else if (!feedLoading && feedError) {
      console.error("❌ Feed API error:", feedError);
      setIsLoading(false);

      // Show error but don't auto-refresh to prevent loops
      console.log(
        "🚫 Not auto-refreshing due to API error - user can manually refresh"
      );
    } else if (!feedLoading && (!feed || feed.length === 0)) {
      console.log("🔄 No feed data found, will show empty state");
      setIsLoading(false);
      // Don't auto-generate to prevent timeout loops
    }
  }, [feed, feedLoading, feedError]);

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
    generateFeedMutation.mutate({
      refreshExisting: true,
      categories: category ? [category] : undefined,
    });
  };

  // Show error state when API fails
  if (feedError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <svg
                className="h-12 w-12 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800 mb-2">
              Unable to Load Feed
            </h3>
            <p className="text-red-600 mb-4">
              There was an error loading your personalized feed. Please try
              refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state when no feed items and not loading
  if (
    !feedLoading &&
    !isLoading &&
    (!feedItems || feedItems.length === 0) &&
    !feedError
  ) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <svg
                className="h-12 w-12 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3v8m0 0V9a2 2 0 012-2h2M9 7v10"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-blue-800 mb-2">
              Your Feed is Empty
            </h3>
            <p className="text-blue-600 mb-4">
              Let's get you started with some personalized content!
            </p>
            <button
              onClick={handleRefreshFeed}
              disabled={isRefreshing}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isRefreshing ? "Generating..." : "Generate My Feed"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading || feedLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Feed Skeleton */}
            <div className="lg:col-span-3 space-y-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-200 rounded"></div>
                      <div className="h-3 w-24 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar Skeleton */}
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
                <div className="h-5 w-20 bg-gray-200 rounded mb-4"></div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-3 py-2">
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    <div className="space-y-1">
                      <div className="h-3 w-20 bg-gray-200 rounded"></div>
                      <div className="h-2 w-16 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">Your Feed</h1>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                {feedItems.length} Items
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                  />
                </svg>
                Filters
              </button>

              <button
                onClick={handleRefreshFeed}
                disabled={isRefreshing}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className={`h-4 w-4 mr-2 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Feed Items */}
          <div className="lg:col-span-3">
            {feedItems.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <div className="flex justify-center mb-4">
                  <svg
                    className="h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No feed items yet
                </h3>
                <p className="text-gray-600 mb-4">
                  We're generating your personalized feed. This may take a
                  moment.
                </p>
                <button
                  onClick={handleRefreshFeed}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
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
              </div>
            )}
          </div>

          {/* Trending Sidebar */}
          <div className="space-y-6">
            <TrendingSection
              trending={trending || []}
              isLoading={trendingLoading}
              onCategoryFilter={handleCategoryFilter}
            />
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
