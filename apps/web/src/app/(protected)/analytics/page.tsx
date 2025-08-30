"use client";

import React, { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import AnalyticsOverview from "@/components/analytics/AnalyticsOverview";
import RevenueForecasting from "@/components/analytics/RevenueForecasting";
import SubscriberDemographics from "@/components/analytics/SubscriberDemographics";
import PerformanceBenchmarks from "@/components/analytics/PerformanceBenchmarks";
import UserBehaviorAnalytics from "@/components/analytics/UserBehaviorAnalytics";
import BusinessIntelligence from "@/components/analytics/BusinessIntelligence";

interface AnalyticsData {
  overview: any;
  forecasting: any;
  demographics: any;
  benchmarks: any;
  behavior: any;
  insights: any;
}

function AnalyticsPageContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("30d");

  // tRPC queries for real analytics data
  const {
    data: creatorAnalytics,
    isLoading: creatorLoading,
    error: creatorError,
  } = trpc.analytics.getCreatorAnalytics.useQuery(
    { timeRange: timeRange as any },
    { refetchInterval: 300000 } // Refetch every 5 minutes
  );

  const {
    data: revenueForecasting,
    isLoading: forecastingLoading,
    error: forecastingError,
  } = trpc.analytics.getRevenueForecasting.useQuery(
    { timeRange: timeRange as any },
    { refetchInterval: 300000 }
  );

  const {
    data: subscriberDemographics,
    isLoading: subscriberLoading,
    error: subscriberError,
  } = trpc.analytics.getSubscriberDemographics.useQuery(
    { timeRange: timeRange as any },
    { refetchInterval: 300000 }
  );

  const {
    data: performanceBenchmarks,
    isLoading: benchmarksLoading,
    error: benchmarksError,
  } = trpc.analytics.getPerformanceBenchmarks.useQuery(
    { timeRange: timeRange as any },
    { refetchInterval: 300000 }
  );

  const {
    data: userBehavior,
    isLoading: behaviorLoading,
    error: behaviorError,
  } = trpc.analytics.getUserBehaviorAnalytics.useQuery(
    { timeRange: timeRange as any },
    { refetchInterval: 300000 }
  );

  const {
    data: businessIntelligence,
    isLoading: insightsLoading,
    error: insightsError,
  } = trpc.analytics.getBusinessIntelligence.useQuery(
    { timeRange: timeRange as any },
    { refetchInterval: 300000 }
  );

  // Check if any data is loading
  const isDataLoading =
    creatorLoading ||
    forecastingLoading ||
    subscriberLoading ||
    benchmarksLoading ||
    behaviorLoading ||
    insightsLoading;

  // Check if there are any errors
  const hasErrors =
    creatorError ||
    forecastingError ||
    subscriberError ||
    benchmarksError ||
    behaviorError ||
    insightsError;

  const tabs = [
    { id: "overview", name: "Overview", icon: "📊" },
    { id: "revenue", name: "Revenue Forecasting", icon: "💰" },
    { id: "audience", name: "Audience Demographics", icon: "👥" },
    { id: "performance", name: "Performance Benchmarks", icon: "🎯" },
    { id: "behavior", name: "User Behavior", icon: "🔍" },
    { id: "insights", name: "Business Intelligence", icon: "🧠" },
  ];

  const timeRangeOptions = [
    { value: "7d", label: "7 Days" },
    { value: "30d", label: "30 Days" },
    { value: "90d", label: "90 Days" },
    { value: "12m", label: "12 Months" },
    { value: "all", label: "All Time" },
  ];

  if (isDataLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation provided globally by layout */}

        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold text-gray-900">
                  Advanced Analytics
                </h1>
                <div className="animate-pulse">
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-sm border animate-pulse"
              >
                <div className="p-6">
                  <div className="h-4 w-24 bg-gray-200 rounded mb-4"></div>
                  <div className="h-32 w-full bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-gray-200 rounded"></div>
                    <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state if any query failed
  if (hasErrors) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              Unable to Load Analytics
            </h3>
            <p className="text-red-600 mb-4">
              There was an error loading your analytics data. Please try
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation provided globally by layout */}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">
                Advanced Analytics
              </h1>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Time Range:</span>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {timeRangeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="text-gray-500 hover:text-gray-700 transition-colors">
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </button>

              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors text-sm">
                Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "overview" && (
          <AnalyticsOverview data={creatorAnalytics} timeRange={timeRange} />
        )}
        {activeTab === "revenue" && (
          <RevenueForecasting data={revenueForecasting} timeRange={timeRange} />
        )}
        {activeTab === "audience" && (
          <SubscriberDemographics
            data={subscriberDemographics}
            timeRange={timeRange}
          />
        )}
        {activeTab === "performance" && (
          <PerformanceBenchmarks
            data={performanceBenchmarks}
            timeRange={timeRange}
          />
        )}
        {activeTab === "behavior" && (
          <UserBehaviorAnalytics data={userBehavior} timeRange={timeRange} />
        )}
        {activeTab === "insights" && (
          <BusinessIntelligence
            data={businessIntelligence}
            timeRange={timeRange}
          />
        )}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <AuthGuard>
      <AnalyticsPageContent />
    </AuthGuard>
  );
}
