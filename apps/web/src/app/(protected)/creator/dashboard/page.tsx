"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { AuthGuard } from "@/components/auth/AuthGuard";

// Dashboard Components
import EarningsOverview from "@/components/creator/dashboard/EarningsOverview";
import RevenueChart from "@/components/creator/dashboard/RevenueChart";
import SubscriberMetrics from "@/components/creator/dashboard/SubscriberMetrics";
import PayoutManagement from "@/components/creator/dashboard/PayoutManagement";
import PerformanceInsights from "@/components/creator/dashboard/PerformanceInsights";
import QuickActions from "@/components/creator/dashboard/QuickActions";

interface CreatorStats {
  totalEarnings: number;
  monthlyEarnings: number;
  weeklyEarnings: number;
  totalSubscribers: number;
  activeSubscribers: number;
  nextPayoutAmount: number;
  nextPayoutDate: string;
  conversionRate: number;
  avgRevenuePerUser: number;
}

function CreatorDashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    "7d" | "30d" | "90d" | "1y"
  >("30d");

  // Mock data since backend routes don't exist yet
  const verificationStatus = { status: "pending" };
  const creatorStats = {
    totalEarnings: 2500,
    monthlyEarnings: 420,
    weeklyEarnings: 105,
    activeSubscribers: 150,
    totalSubscribers: 150,
    nextPayoutAmount: 420,
    nextPayoutDate: "2024-02-01",
    conversionRate: 12.5,
    avgRevenuePerUser: 16.7,
    earningsGrowth: 15.2,
    subscriberGrowth: 8.4,
  };
  const revenueData = [
    {
      date: "2024-01-01",
      subscriptionRevenue: 90,
      timeBasedRevenue: 10,
      totalRevenue: 100,
      creatorRevenue: 85,
      platformFee: 15,
    },
    {
      date: "2024-02-01",
      subscriptionRevenue: 135,
      timeBasedRevenue: 15,
      totalRevenue: 150,
      creatorRevenue: 127.5,
      platformFee: 22.5,
    },
    {
      date: "2024-03-01",
      subscriptionRevenue: 180,
      timeBasedRevenue: 20,
      totalRevenue: 200,
      creatorRevenue: 170,
      platformFee: 30,
    },
    {
      date: "2024-04-01",
      subscriptionRevenue: 270,
      timeBasedRevenue: 30,
      totalRevenue: 300,
      creatorRevenue: 255,
      platformFee: 45,
    },
    {
      date: "2024-05-01",
      subscriptionRevenue: 315,
      timeBasedRevenue: 35,
      totalRevenue: 350,
      creatorRevenue: 297.5,
      platformFee: 52.5,
    },
    {
      date: "2024-06-01",
      subscriptionRevenue: 378,
      timeBasedRevenue: 42,
      totalRevenue: 420,
      creatorRevenue: 357,
      platformFee: 63,
    },
  ];
  const statsLoading = false;
  const revenueLoading = false;
  // Mock top personas data
  const topPersonas = [
    {
      id: "1",
      name: "AI Assistant",
      revenue: 500,
      subscribers: 50,
      avgRating: 4.8,
      interactionCount: 1200,
      conversionRate: 15.2,
    },
    {
      id: "2",
      name: "Life Coach",
      revenue: 300,
      subscribers: 30,
      avgRating: 4.6,
      interactionCount: 800,
      conversionRate: 12.1,
    },
  ];

  // Redirect if not verified
  useEffect(() => {
    if (verificationStatus && verificationStatus.status !== "approved") {
      router.push("/creator/verification");
    }
  }, [verificationStatus, router]);

  if (verificationStatus?.status !== "approved") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-yellow-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Verification Required
            </h2>
            <p className="text-gray-600 mb-6">
              You need to complete creator verification before accessing the
              creator dashboard.
            </p>
            <button
              onClick={() => router.push("/creator/verification")}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Complete Verification
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Creator Dashboard
              </h1>
              <p className="text-gray-600">
                Track your earnings, manage subscribers, and grow your creator
                business
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {/* Time Range Selector */}
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>

              {/* Quick Actions */}
              <button
                onClick={() => router.push("/personas")}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
              >
                Manage Personas
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats Overview */}
        <EarningsOverview
          stats={creatorStats}
          isLoading={statsLoading}
          timeRange={selectedTimeRange}
        />

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Left Column - Charts & Analytics */}
          <div className="lg:col-span-2 space-y-8">
            {/* Revenue Chart */}
            <RevenueChart
              data={revenueData}
              isLoading={revenueLoading}
              timeRange={selectedTimeRange}
            />

            {/* Performance Insights */}
            <PerformanceInsights
              topPersonas={topPersonas}
              stats={creatorStats}
            />
          </div>

          {/* Right Column - Management */}
          <div className="space-y-8">
            {/* Subscriber Metrics */}
            <SubscriberMetrics stats={creatorStats} isLoading={statsLoading} />

            {/* Payout Management */}
            <PayoutManagement stats={creatorStats} isLoading={statsLoading} />

            {/* Quick Actions */}
            <QuickActions />
          </div>
        </div>

        {/* Revenue Breakdown Table */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Recent Earnings
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Persona
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Your Share
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Placeholder for recent earnings */}
                  <tr>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                      colSpan={6}
                    >
                      <div className="text-center py-8">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                          />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                          No earnings yet
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Start monetizing your personas to see earnings appear
                          here.
                        </p>
                        <div className="mt-6">
                          <button
                            onClick={() => router.push("/personas")}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                          >
                            Setup Monetization
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
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
