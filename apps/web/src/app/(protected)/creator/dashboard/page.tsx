"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { trpc } from "@/lib/trpc";

interface CreatorStats {
  totalEarnings: number;
  monthlyEarnings: number;
  weeklyEarnings: number;
  activeSubscribers: number;
  totalSubscribers: number;
  nextPayoutAmount: number;
  nextPayoutDate: string;
  conversionRate: number;
  earningsGrowth: number;
  subscriberGrowth: number;
  avgRevenuePerUser: number;
}

interface RevenueDataPoint {
  date: string;
  subscriptionRevenue: number;
  timeBasedRevenue: number;
  totalRevenue: number;
  creatorRevenue: number;
  platformFee: number;
}

interface TopPersona {
  id: string;
  name: string;
  revenue: number;
  subscribers: number;
  avgRating: number;
  interactionCount: number;
  conversionRate: number;
}

function CreatorDashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    "30d" | "90d" | "12m"
  >("30d");

  // tRPC queries for real data
  const { data: verificationStatus, isLoading: verificationLoading } =
    trpc.creatorVerification.getVerificationStatus.useQuery();

  const { data: creatorAnalytics, isLoading: statsLoading } =
    trpc.analytics.getCreatorAnalytics.useQuery(
      { timeRange: selectedTimeRange },
      { refetchInterval: 300000 } // Refetch every 5 minutes
    );

  const { data: revenueForecasting, isLoading: revenueLoading } =
    trpc.analytics.getRevenueForecasting.useQuery(
      { timeRange: selectedTimeRange },
      { refetchInterval: 300000 }
    );

  // Placeholder for top personas - this endpoint doesn't exist yet
  const topPersonas: any[] = [];
  const personasLoading = false;

  // Check if any data is loading
  const isLoading =
    verificationLoading || statsLoading || revenueLoading || personasLoading;

  // Redirect if not verified
  useEffect(() => {
    if (verificationStatus && verificationStatus.status !== "approved") {
      router.push("/creator/verification");
    }
  }, [verificationStatus, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (verificationStatus?.status !== "approved") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Creator Verification Required
            </h2>
            <p className="text-gray-600 mb-6">
              You need to complete the verification process to access the
              creator dashboard.
            </p>
            <button
              onClick={() => router.push("/creator/verification")}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Start Verification
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Use real data with fallbacks
  const stats = {
    totalEarnings: creatorAnalytics?.overview?.totalRevenue || 0,
    monthlyEarnings: creatorAnalytics?.overview?.monthlyRecurringRevenue || 0,
    weeklyEarnings: 0, // Not available in current API
    activeSubscribers: creatorAnalytics?.overview?.totalSubscribers || 0,
    totalSubscribers: creatorAnalytics?.overview?.totalSubscribers || 0,
    nextPayoutAmount:
      (creatorAnalytics?.overview?.monthlyRecurringRevenue || 0) * 0.8, // 80% of monthly earnings
    nextPayoutDate: new Date().toISOString().split("T")[0],
    conversionRate: creatorAnalytics?.engagement?.viewToSubscribeRate || 0,
    earningsGrowth: creatorAnalytics?.growth?.revenueGrowthRate || 0,
    subscriberGrowth: creatorAnalytics?.growth?.subscriberGrowthRate || 0,
    avgRevenuePerUser:
      creatorAnalytics?.overview?.totalRevenue /
        Math.max(creatorAnalytics?.overview?.totalSubscribers || 1, 1) || 0,
  };

  const revenue = revenueForecasting?.forecasts || [];
  const personas = topPersonas || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-gray-900">
              Creator Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="12m">Last Year</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Earnings
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.totalEarnings.toFixed(2)}
                </p>
              </div>
              <div className="text-green-500 text-2xl">💰</div>
            </div>
            <div className="mt-2">
              <span
                className={`text-sm ${
                  stats.earningsGrowth >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {stats.earningsGrowth >= 0 ? "+" : ""}
                {stats.earningsGrowth.toFixed(1)}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last period</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Monthly Earnings
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.monthlyEarnings.toFixed(2)}
                </p>
              </div>
              <div className="text-blue-500 text-2xl">📈</div>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Next payout: ${stats.nextPayoutAmount.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Subscribers
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.activeSubscribers}
                </p>
              </div>
              <div className="text-purple-500 text-2xl">👥</div>
            </div>
            <div className="mt-2">
              <span
                className={`text-sm ${
                  stats.subscriberGrowth >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {stats.subscriberGrowth >= 0 ? "+" : ""}
                {stats.subscriberGrowth.toFixed(1)}%
              </span>
              <span className="text-sm text-gray-500 ml-1">growth</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Conversion Rate
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.conversionRate.toFixed(1)}%
                </p>
              </div>
              <div className="text-orange-500 text-2xl">🎯</div>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Avg revenue/user: ${stats.avgRevenuePerUser.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Revenue Chart and Top Personas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Chart */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Revenue Trend
            </h3>
            {revenue.length > 0 ? (
              <div className="space-y-3">
                {revenue.slice(-6).map((dataPoint, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-gray-600">
                      {dataPoint.period}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      ${dataPoint.forecastedRevenue.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📊</div>
                <p>No revenue data available</p>
              </div>
            )}
          </div>

          {/* Top Personas */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Top Performing Personas
            </h3>
            {personas.length > 0 ? (
              <div className="space-y-4">
                {personas.map((persona) => (
                  <div
                    key={persona.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {persona.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {persona.subscribers} subscribers •{" "}
                        {persona.avgRating.toFixed(1)} ⭐
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        ${persona.revenue.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {persona.conversionRate.toFixed(1)}% conversion
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🤖</div>
                <p>No personas data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreatorDashboardPage() {
  return (
    <AuthGuard>
      <CreatorDashboardContent />
    </AuthGuard>
  );
}
