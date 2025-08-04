"use client";

import React, { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import PersonaFeedCard from '@/components/feed/PersonaFeedCard';
import TrendingSection from '@/components/feed/TrendingSection';
import FeedFilters from '@/components/feed/FeedFilters';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/AuthContext';

interface FeedItem {
  id: string;
  itemType: 'persona_recommendation' | 'trending_persona' | 'creator_update' | 'followed_creator_persona' | 'similar_personas' | 'review_highlight';
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
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // tRPC queries
  const { data: feed, refetch: refetchFeed, isLoading: feedLoading } = trpc.feed.getFeed.useQuery({
    limit: 50,
  });

  const { data: trending, isLoading: trendingLoading } = trpc.discovery.getTrendingPersonas.useQuery({
    timeframe: '24h',
    limit: 10,
  });

  // tRPC mutations
  const generateFeedMutation = trpc.feed.generateFeed.useMutation({
    onSuccess: () => {
      refetchFeed();
      setIsRefreshing(false);
    },
    onError: (error) => {
      console.error('Error generating feed:', error);
      setIsRefreshing(false);
    },
  });

  const trackInteractionMutation = trpc.feed.trackInteraction.useMutation();

  useEffect(() => {
    if (feed) {
      setFeedItems(feed);
      setIsLoading(false);
    } else if (!feedLoading) {
      // Generate initial feed if none exists
      handleRefreshFeed();
    }
  }, [feed, feedLoading]);

  const handleRefreshFeed = async () => {
    setIsRefreshing(true);
    generateFeedMutation.mutate({
      refreshExisting: true,
      categories: selectedCategory ? [selectedCategory] : undefined,
    });
  };

  const handleFeedInteraction = async (feedItemId: string, interactionType: 'viewed' | 'clicked' | 'liked' | 'shared' | 'dismissed') => {
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

  if (isLoading || feedLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold text-gray-900">Feed</h1>
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
                <div key={i} className="bg-white rounded-lg shadow-sm border animate-pulse">
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">Feed</h1>
              {isRefreshing && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                </svg>
              </button>
              
              <button
                onClick={handleRefreshFeed}
                disabled={isRefreshing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
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
            {feedItems.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Feed Items</h3>
                <p className="text-gray-600 mb-4">
                  Your personalized feed is empty. Try following some creators or exploring trending personas.
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
              trending={trending || []}
              isLoading={trendingLoading}
            />

            {/* Discover Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Discover</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Explore Categories</p>
                      <p className="text-sm text-gray-600">Find personas by interest</p>
                    </div>
                  </div>
                </button>

                <button className="w-full text-left p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">New Creators</p>
                      <p className="text-sm text-gray-600">Fresh voices on the platform</p>
                    </div>
                  </div>
                </button>

                <button className="w-full text-left p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Recommended for You</p>
                      <p className="text-sm text-gray-600">Based on your interests</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Footer Links */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="space-y-3 text-sm text-gray-600">
                <a href="/about" className="block hover:text-gray-900">About Hibiji</a>
                <a href="/privacy" className="block hover:text-gray-900">Privacy Policy</a>
                <a href="/terms" className="block hover:text-gray-900">Terms of Service</a>
                <a href="/support" className="block hover:text-gray-900">Support</a>
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">© 2025 Hibiji. All rights reserved.</p>
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