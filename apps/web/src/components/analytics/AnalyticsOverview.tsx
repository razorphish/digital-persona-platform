"use client";

import React from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AnalyticsOverviewProps {
  data: any;
  timeRange: string;
}

export default function AnalyticsOverview({
  data,
  timeRange,
}: AnalyticsOverviewProps) {
  if (!data) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-gray-500">Loading analytics data...</div>
        </div>
      </div>
    );
  }

  const { overview, growth, engagement, ranking } = data;

  // Sample data for charts (in production, this would come from the API)
  const revenueData = [
    { month: "Jan", revenue: 4000, subscribers: 240 },
    { month: "Feb", revenue: 3000, subscribers: 220 },
    { month: "Mar", revenue: 2000, subscribers: 250 },
    { month: "Apr", revenue: 2780, subscribers: 280 },
    { month: "May", revenue: 1890, subscribers: 300 },
    { month: "Jun", revenue: 2390, subscribers: 320 },
    { month: "Jul", revenue: 3490, subscribers: 350 },
  ];

  const engagementData = [
    { name: "Views", value: overview?.totalViews || 0, color: "#8884d8" },
    {
      name: "Likes",
      value: (overview?.totalViews || 0) * 0.15,
      color: "#82ca9d",
    },
    {
      name: "Shares",
      value: (overview?.totalViews || 0) * 0.05,
      color: "#ffc658",
    },
    {
      name: "Subscriptions",
      value: overview?.totalSubscribers || 0,
      color: "#ff7300",
    },
  ];

  const performanceMetrics = [
    {
      title: "Revenue Growth",
      value: `${(growth?.revenueGrowthRate * 100 || 0).toFixed(1)}%`,
      trend: growth?.revenueGrowthRate > 0 ? "up" : "down",
      color: growth?.revenueGrowthRate > 0 ? "text-green-600" : "text-red-600",
      bgColor: growth?.revenueGrowthRate > 0 ? "bg-green-50" : "bg-red-50",
    },
    {
      title: "Subscriber Growth",
      value: `${(growth?.subscriberGrowthRate * 100 || 0).toFixed(1)}%`,
      trend: growth?.subscriberGrowthRate > 0 ? "up" : "down",
      color:
        growth?.subscriberGrowthRate > 0 ? "text-green-600" : "text-red-600",
      bgColor: growth?.subscriberGrowthRate > 0 ? "bg-green-50" : "bg-red-50",
    },
    {
      title: "Engagement Rate",
      value: `${(engagement?.viewToSubscribeRate * 100 || 0).toFixed(2)}%`,
      trend: "up",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Response Time",
      value: `${engagement?.averageResponseTime || 0}min`,
      trend: "down",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">
                Total Revenue
              </h3>
              <p className="text-2xl font-bold text-gray-900">
                ${overview?.totalRevenue?.toLocaleString() || "0"}
              </p>
              <p className="text-sm text-gray-600">
                MRR: $
                {overview?.monthlyRecurringRevenue?.toLocaleString() || "0"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Subscribers</h3>
              <p className="text-2xl font-bold text-gray-900">
                {overview?.totalSubscribers?.toLocaleString() || "0"}
              </p>
              <p className="text-sm text-green-600">
                +{(growth?.subscriberGrowthRate * 100 || 0).toFixed(1)}% this
                week
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    fillRule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Total Views</h3>
              <p className="text-2xl font-bold text-gray-900">
                {overview?.totalViews?.toLocaleString() || "0"}
              </p>
              <p className="text-sm text-purple-600">
                +{(growth?.viewGrowthRate * 100 || 0).toFixed(1)}% this week
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">
                Average Rating
              </h3>
              <p className="text-2xl font-bold text-gray-900">
                {overview?.averageRating?.toFixed(1) || "0.0"}
              </p>
              <p className="text-sm text-yellow-600">
                Based on {data?.totalReviews || 0} reviews
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceMetrics.map((metric, index) => (
          <div key={index} className={`rounded-lg p-6 ${metric.bgColor}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {metric.title}
                </p>
                <p className={`text-2xl font-bold ${metric.color}`}>
                  {metric.value}
                </p>
              </div>
              <div className={`${metric.color}`}>
                {metric.trend === "up" ? (
                  <svg
                    className="w-8 h-8"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-8 h-8"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Revenue Trend</h3>
            <div className="text-sm text-gray-500">Last 7 months</div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [
                  `$${value}`,
                  name === "revenue" ? "Revenue" : "Subscribers",
                ]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Subscriber Growth */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Subscriber Growth
            </h3>
            <div className="text-sm text-gray-500">Last 7 months</div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [value, "Subscribers"]} />
              <Line
                type="monotone"
                dataKey="subscribers"
                stroke="#82ca9d"
                strokeWidth={3}
                dot={{ fill: "#82ca9d" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Engagement Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Engagement Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={engagementData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {engagementData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [value.toLocaleString(), "Count"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Ranking */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Performance Ranking
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">
                Category Rank
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-indigo-600">
                  #{ranking?.categoryRank?.toLocaleString() || "N/A"}
                </span>
                <span className="text-xs text-gray-500">in category</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">
                Overall Rank
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-purple-600">
                  #{ranking?.overallRank?.toLocaleString() || "N/A"}
                </span>
                <span className="text-xs text-gray-500">globally</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">
                Percentile Score
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-green-600">
                  {ranking?.percentileScore?.toFixed(0) || "50"}th
                </span>
                <span className="text-xs text-gray-500">percentile</span>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-3 mt-6">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Revenue Performance</span>
                  <span>{ranking?.percentileScore?.toFixed(0) || "50"}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${ranking?.percentileScore || 50}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Engagement Rate</span>
                  <span>
                    {((engagement?.viewToSubscribeRate || 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        (engagement?.viewToSubscribeRate || 0) * 1000,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Response Rate</span>
                  <span>
                    {((engagement?.responseRate || 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{
                      width: `${(engagement?.responseRate || 0) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">
          Recent Activity Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600 mb-2">
              {((growth?.viewGrowthRate || 0) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">View Growth (Weekly)</div>
            <div className="text-xs text-gray-500 mt-1">
              {growth?.viewGrowthRate > 0
                ? "Trending upward"
                : "Needs improvement"}
            </div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {((growth?.revenueGrowthRate || 0) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">
              Revenue Growth (Monthly)
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {growth?.revenueGrowthRate > 0
                ? "Excellent progress"
                : "Focus on monetization"}
            </div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {engagement?.averageResponseTime || 0}min
            </div>
            <div className="text-sm text-gray-600">Avg Response Time</div>
            <div className="text-xs text-gray-500 mt-1">
              {(engagement?.averageResponseTime || 0) < 30
                ? "Very responsive"
                : "Room for improvement"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
