"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface TrendingPersona {
  personaId: string;
  name: string;
  creatorName: string;
  trendingScore: number;
  velocityScore: number;
  engagementGrowth: number;
  viewsGrowth: number;
  likesGrowth: number;
  category: string;
  thumbnailUrl?: string;
}

interface TrendingSectionProps {
  trending: TrendingPersona[];
  isLoading: boolean;
  onCategoryFilter?: (category: string | null) => void;
}

export default function TrendingSection({
  trending,
  isLoading,
  onCategoryFilter,
}: TrendingSectionProps) {
  const router = useRouter();

  const handlePersonaClick = (personaId: string) => {
    router.push(`/persona-details?id=${personaId}`);
  };

  const handleTopicClick = (topicName: string) => {
    if (onCategoryFilter) {
      // Topic names are already in lowercase to match database categories
      onCategoryFilter(topicName);
    }
  };

  const formatGrowth = (growth: number) => {
    if (growth === 0) return "+0%";
    const sign = growth > 0 ? "+" : "";
    return `${sign}${Math.round(growth * 100)}%`;
  };

  const getTrendingIcon = (score: number) => {
    if (score > 0.8) return "🔥";
    if (score > 0.6) return "📈";
    if (score > 0.4) return "⭐";
    return "✨";
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Trending</h3>
          <div className="animate-pulse">
            <div className="h-4 w-12 bg-gray-200 rounded"></div>
          </div>
        </div>

        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 w-20 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 w-16 bg-gray-200 rounded"></div>
              </div>
              <div className="h-3 w-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Trending</h3>
        <button className="text-sm text-indigo-600 hover:text-indigo-500 transition-colors">
          See all
        </button>
      </div>

      {trending.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-3 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-600">
            No trending personas right now
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {trending.slice(0, 8).map((persona, index) => (
            <button
              key={persona.personaId}
              onClick={() => handlePersonaClick(persona.personaId)}
              className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex-shrink-0">
                <div className="w-8 h-8 relative">
                  {persona.thumbnailUrl ? (
                    <img
                      src={persona.thumbnailUrl}
                      alt={persona.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {persona.name[0]?.toUpperCase() || "P"}
                    </div>
                  )}
                  <div className="absolute -top-1 -right-1 text-xs">
                    {getTrendingIcon(persona.trendingScore)}
                  </div>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1">
                  <span className="text-xs bg-gray-100 text-gray-600 px-1 py-0.5 rounded">
                    #{index + 1}
                  </span>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {persona.name}
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span className="truncate">{persona.creatorName}</span>
                  <span>•</span>
                  <span className="bg-gray-100 text-gray-600 px-1 rounded">
                    {persona.category}
                  </span>
                </div>
              </div>

              <div className="flex-shrink-0 text-right">
                <div
                  className={`text-xs font-medium ${
                    persona.engagementGrowth > 0
                      ? "text-green-600"
                      : persona.engagementGrowth < 0
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  {formatGrowth(persona.engagementGrowth)}
                </div>
                <div className="text-xs text-gray-500">
                  {Math.round(persona.trendingScore * 100)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Trending Stats */}
      {trending.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {trending.filter((p) => p.engagementGrowth > 0).length}
              </div>
              <div className="text-xs text-gray-600">Rising</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {trending.filter((p) => p.trendingScore > 0.7).length}
              </div>
              <div className="text-xs text-gray-600">Hot</div>
            </div>
          </div>
        </div>
      )}

      {/* Trending Categories */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          Popular Topics
        </h4>
        <div className="flex flex-wrap gap-1">
          {[
            { name: "entertainment", emoji: "🎭", count: 24 },
            { name: "education", emoji: "📚", count: 18 },
            { name: "lifestyle", emoji: "🌟", count: 15 },
            { name: "gaming", emoji: "🎮", count: 12 },
            { name: "technology", emoji: "💻", count: 10 },
            { name: "fitness", emoji: "💪", count: 8 },
            { name: "business", emoji: "💼", count: 6 },
            { name: "art", emoji: "🎨", count: 5 },
            { name: "music", emoji: "🎵", count: 4 },
            { name: "cooking", emoji: "👨‍🍳", count: 3 },
          ].map((topic) => (
            <button
              key={topic.name}
              onClick={() => handleTopicClick(topic.name)}
              className="inline-flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full transition-colors cursor-pointer"
            >
              <span>{topic.emoji}</span>
              <span className="capitalize">{topic.name}</span>
              <span className="text-gray-500">({topic.count})</span>
            </button>
          ))}
          <button
            onClick={() => onCategoryFilter?.(null)}
            className="inline-flex items-center space-x-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-xs px-2 py-1 rounded-full transition-colors cursor-pointer"
          >
            <span>🔄</span>
            <span>Clear Filters</span>
          </button>
        </div>
      </div>
    </div>
  );
}
