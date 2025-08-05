"use client";

import React, { useState } from "react";

interface FeedFiltersProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  onClose: () => void;
}

const CATEGORIES = [
  {
    id: "entertainment",
    name: "Entertainment",
    emoji: "🎭",
    color: "bg-purple-100 text-purple-800",
  },
  {
    id: "education",
    name: "Education",
    emoji: "📚",
    color: "bg-blue-100 text-blue-800",
  },
  {
    id: "lifestyle",
    name: "Lifestyle",
    emoji: "🌟",
    color: "bg-pink-100 text-pink-800",
  },
  {
    id: "gaming",
    name: "Gaming",
    emoji: "🎮",
    color: "bg-green-100 text-green-800",
  },
  {
    id: "technology",
    name: "Technology",
    emoji: "💻",
    color: "bg-indigo-100 text-indigo-800",
  },
  {
    id: "fitness",
    name: "Fitness",
    emoji: "💪",
    color: "bg-orange-100 text-orange-800",
  },
  {
    id: "cooking",
    name: "Cooking",
    emoji: "👨‍🍳",
    color: "bg-yellow-100 text-yellow-800",
  },
  { id: "music", name: "Music", emoji: "🎵", color: "bg-red-100 text-red-800" },
  { id: "art", name: "Art", emoji: "🎨", color: "bg-teal-100 text-teal-800" },
  {
    id: "business",
    name: "Business",
    emoji: "💼",
    color: "bg-gray-100 text-gray-800",
  },
];

const CONTENT_TYPES = [
  { id: "all", name: "All Content", description: "See everything" },
  {
    id: "trending",
    name: "Trending Only",
    description: "What's hot right now",
  },
  {
    id: "following",
    name: "Following",
    description: "From creators you follow",
  },
  {
    id: "recommended",
    name: "Recommended",
    description: "Personalized for you",
  },
  { id: "new", name: "New Creators", description: "Fresh voices" },
];

export default function FeedFilters({
  selectedCategory,
  onCategoryChange,
  onClose,
}: FeedFiltersProps) {
  const [contentFilter, setContentFilter] = useState("all");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleApplyFilters = () => {
    // Apply content filter logic here if needed
    onClose();
  };

  const handleClearFilters = () => {
    onCategoryChange(null);
    setContentFilter("all");
    setShowAdvanced(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Feed Filters</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Categories */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Categories</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          <button
            onClick={() => onCategoryChange(null)}
            className={`p-3 rounded-lg border-2 transition-colors text-center ${
              selectedCategory === null
                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                : "border-gray-200 hover:border-gray-300 text-gray-700"
            }`}
          >
            <div className="text-2xl mb-1">🌐</div>
            <div className="text-xs font-medium">All</div>
          </button>

          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`p-3 rounded-lg border-2 transition-colors text-center ${
                selectedCategory === category.id
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 hover:border-gray-300 text-gray-700"
              }`}
            >
              <div className="text-2xl mb-1">{category.emoji}</div>
              <div className="text-xs font-medium">{category.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Content Type */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Content Type</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {CONTENT_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setContentFilter(type.id)}
              className={`p-3 rounded-lg border-2 transition-colors text-left ${
                contentFilter === type.id
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 hover:border-gray-300 text-gray-700"
              }`}
            >
              <div className="font-medium text-sm">{type.name}</div>
              <div className="text-xs text-gray-600 mt-1">
                {type.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-2 text-sm text-indigo-600 hover:text-indigo-500 transition-colors"
        >
          <span>Advanced Filters</span>
          <svg
            className={`w-4 h-4 transition-transform ${
              showAdvanced ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Rating
              </label>
              <div className="flex items-center space-x-4">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    className="flex items-center space-x-1 text-sm text-gray-600 hover:text-yellow-500 transition-colors"
                  >
                    <svg
                      className="w-4 h-4 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>{rating}+</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Other Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Verified creators only
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Hide NSFW content
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Active in last 7 days
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Has free content
                </span>
              </label>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range (per month)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Min Price
                  </label>
                  <select className="w-full rounded-md border-gray-300 text-sm">
                    <option value="">Any</option>
                    <option value="0">Free</option>
                    <option value="5">$5+</option>
                    <option value="10">$10+</option>
                    <option value="25">$25+</option>
                    <option value="50">$50+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Max Price
                  </label>
                  <select className="w-full rounded-md border-gray-300 text-sm">
                    <option value="">Any</option>
                    <option value="10">$10</option>
                    <option value="25">$25</option>
                    <option value="50">$50</option>
                    <option value="100">$100</option>
                    <option value="200">$200+</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Filters */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Quick Filters
        </h4>
        <div className="flex flex-wrap gap-2">
          {[
            { name: "🔥 Hot Right Now", active: false },
            { name: "⭐ Highly Rated", active: false },
            { name: "🆕 New This Week", active: false },
            { name: "💎 Premium", active: false },

            { name: "✅ Verified", active: false },
          ].map((filter, index) => (
            <button
              key={index}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filter.active
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {filter.name}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          onClick={handleClearFilters}
          className="text-gray-600 hover:text-gray-800 text-sm transition-colors"
        >
          Clear all filters
        </button>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Filter Summary */}
      {(selectedCategory || contentFilter !== "all") && (
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-sm text-blue-800">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              Active filters:
              {selectedCategory &&
                ` ${CATEGORIES.find((c) => c.id === selectedCategory)?.name}`}
              {contentFilter !== "all" &&
                ` • ${CONTENT_TYPES.find((t) => t.id === contentFilter)?.name}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
