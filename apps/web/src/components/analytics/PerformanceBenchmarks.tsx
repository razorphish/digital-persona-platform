"use client";

import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  ComposedChart,
  Area,
} from "recharts";

interface PerformanceBenchmarksProps {
  data: any;
  timeRange: string;
}

export default function PerformanceBenchmarks({
  data,
  timeRange,
}: PerformanceBenchmarksProps) {
  const [selectedCategory, setSelectedCategory] = useState("current");
  const [comparisonPeriod, setComparisonPeriod] = useState("monthly");

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-gray-500">Loading benchmark data...</div>
        </div>
      </div>
    );
  }

  const { category, userTier, metrics, recommendations } = data;

  // Sample benchmark data
  const performanceMetrics = [
    {
      metric: "Revenue",
      userValue: metrics?.revenue?.userValue || 0,
      benchmarkMedian: metrics?.revenue?.benchmarkMedian || 0,
      percentile: metrics?.revenue?.percentile || 50,
      unit: "$",
      target: "higher",
    },
    {
      metric: "Subscribers",
      userValue: metrics?.subscribers?.userValue || 0,
      benchmarkMedian: metrics?.subscribers?.benchmarkMedian || 0,
      percentile: metrics?.subscribers?.percentile || 50,
      unit: "",
      target: "higher",
    },
    {
      metric: "Views",
      userValue: metrics?.views?.userValue || 0,
      benchmarkMedian: metrics?.views?.benchmarkMedian || 0,
      percentile: metrics?.views?.percentile || 50,
      unit: "",
      target: "higher",
    },
    {
      metric: "Engagement Rate",
      userValue: (metrics?.engagement?.userValue || 0) * 100,
      benchmarkMedian: (metrics?.engagement?.benchmarkMedian || 0) * 100,
      percentile: metrics?.engagement?.percentile || 50,
      unit: "%",
      target: "higher",
    },
  ];

  const radarData = [
    {
      subject: "Revenue",
      A: metrics?.revenue?.percentile || 50,
      fullMark: 100,
    },
    {
      subject: "Subscribers",
      A: metrics?.subscribers?.percentile || 50,
      fullMark: 100,
    },
    { subject: "Views", A: metrics?.views?.percentile || 50, fullMark: 100 },
    {
      subject: "Engagement",
      A: metrics?.engagement?.percentile || 50,
      fullMark: 100,
    },
    { subject: "Growth", A: Math.random() * 40 + 30, fullMark: 100 },
    { subject: "Quality", A: Math.random() * 20 + 60, fullMark: 100 },
  ];

  const categoryComparison = [
    {
      category: "Entertainment",
      avgRevenue: 3500,
      avgSubs: 450,
      avgEngagement: 8.5,
    },
    {
      category: "Education",
      avgRevenue: 2800,
      avgSubs: 380,
      avgEngagement: 12.2,
    },
    {
      category: "Lifestyle",
      avgRevenue: 4200,
      avgSubs: 520,
      avgEngagement: 6.8,
    },
    { category: "Gaming", avgRevenue: 3900, avgSubs: 490, avgEngagement: 9.1 },
    {
      category: "Your Category",
      avgRevenue: metrics?.revenue?.userValue || 0,
      avgSubs: metrics?.subscribers?.userValue || 0,
      avgEngagement: (metrics?.engagement?.userValue || 0) * 100,
    },
  ];

  const tierProgression = [
    { tier: "New", minRevenue: 0, minSubs: 0, avgRevenue: 500, avgSubs: 50 },
    {
      tier: "Emerging",
      minRevenue: 1000,
      minSubs: 100,
      avgRevenue: 2500,
      avgSubs: 250,
    },
    {
      tier: "Established",
      minRevenue: 5000,
      minSubs: 500,
      avgRevenue: 8000,
      avgSubs: 800,
    },
    {
      tier: "Top Performer",
      minRevenue: 15000,
      minSubs: 1500,
      avgRevenue: 25000,
      avgSubs: 2500,
    },
  ];

  const currentTierIndex = tierProgression.findIndex(
    (t) => t.tier.toLowerCase().replace(" ", "_") === userTier
  );
  const nextTier = tierProgression[currentTierIndex + 1];

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 90) return "text-green-600 bg-green-50";
    if (percentile >= 75) return "text-blue-600 bg-blue-50";
    if (percentile >= 50) return "text-yellow-600 bg-yellow-50";
    if (percentile >= 25) return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  };

  const getPerformanceIcon = (percentile: number) => {
    if (percentile >= 90) return "🏆";
    if (percentile >= 75) return "🥈";
    if (percentile >= 50) return "📊";
    return "📈";
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === "$") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
      }).format(value);
    }
    if (unit === "%") {
      return `${value.toFixed(1)}%`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Benchmark Controls */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Performance Benchmarks
          </h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="current">Current Category ({category})</option>
                <option value="all">All Categories</option>
                <option value="entertainment">Entertainment</option>
                <option value="education">Education</option>
                <option value="lifestyle">Lifestyle</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Tier:</label>
              <span className="text-sm font-medium text-indigo-600 capitalize">
                {userTier?.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>

        {/* Current Tier Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Current Tier</div>
            <div className="text-2xl font-bold text-indigo-600 capitalize mb-2">
              {userTier?.replace("_", " ")}
            </div>
            <div className="text-sm text-gray-500">
              {currentTierIndex + 1} of {tierProgression.length}
            </div>
          </div>

          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Overall Percentile</div>
            <div className="text-2xl font-bold text-purple-600 mb-2">
              {Math.round(
                radarData.reduce((sum, item) => sum + item.A, 0) /
                  radarData.length
              )}
              th
            </div>
            <div className="text-sm text-gray-500">Across all metrics</div>
          </div>

          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Category Rank</div>
            <div className="text-2xl font-bold text-green-600 mb-2">
              #{Math.floor(Math.random() * 100) + 1}
            </div>
            <div className="text-sm text-gray-500">In {category}</div>
          </div>
        </div>
      </div>

      {/* Performance Metrics Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {performanceMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">
                {metric.metric}
              </h4>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${getPercentileColor(
                  metric.percentile
                )}`}
              >
                {getPerformanceIcon(metric.percentile)} {metric.percentile}th
                percentile
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Your Performance</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatValue(metric.userValue, metric.unit)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Category Median</span>
                <span className="text-lg font-medium text-gray-600">
                  {formatValue(metric.benchmarkMedian, metric.unit)}
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-indigo-600 h-3 rounded-full relative"
                  style={{ width: `${Math.min(metric.percentile, 100)}%` }}
                >
                  <div className="absolute -top-6 right-0 text-xs text-indigo-600 font-medium">
                    {metric.percentile}%
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-xs text-gray-500">
                <span>0th percentile</span>
                <span>50th percentile</span>
                <span>100th percentile</span>
              </div>

              {metric.userValue > metric.benchmarkMedian ? (
                <div className="flex items-center text-sm text-green-600">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {Math.round(
                    ((metric.userValue - metric.benchmarkMedian) /
                      metric.benchmarkMedian) *
                      100
                  )}
                  % above median
                </div>
              ) : (
                <div className="flex items-center text-sm text-orange-600">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {Math.round(
                    ((metric.benchmarkMedian - metric.userValue) /
                      metric.benchmarkMedian) *
                      100
                  )}
                  % below median
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Performance Radar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Performance Overview
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} />
              <Radar
                name="Your Performance"
                dataKey="A"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
          <div className="text-center text-sm text-gray-600 mt-4">
            Higher values indicate better performance relative to peers
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Category Comparison
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryComparison} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="category" type="category" width={80} />
              <Tooltip
                formatter={(value, name) => [
                  name === "avgRevenue"
                    ? `$${value.toLocaleString()}`
                    : name === "avgSubs"
                    ? value.toLocaleString()
                    : `${value}%`,
                  name === "avgRevenue"
                    ? "Revenue"
                    : name === "avgSubs"
                    ? "Subscribers"
                    : "Engagement",
                ]}
              />
              <Bar dataKey="avgRevenue" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tier Progression */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">
          Tier Progression Path
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {tierProgression.map((tier, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 ${
                tier.tier.toLowerCase().replace(" ", "_") === userTier
                  ? "border-indigo-500 bg-indigo-50"
                  : index < currentTierIndex
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="text-center">
                <h4
                  className={`font-medium mb-2 ${
                    tier.tier.toLowerCase().replace(" ", "_") === userTier
                      ? "text-indigo-600"
                      : index < currentTierIndex
                      ? "text-green-600"
                      : "text-gray-600"
                  }`}
                >
                  {tier.tier}
                  {tier.tier.toLowerCase().replace(" ", "_") === userTier &&
                    " (Current)"}
                </h4>

                <div className="space-y-1 text-sm">
                  <div>Min Revenue: {formatValue(tier.minRevenue, "$")}</div>
                  <div>Min Subs: {tier.minSubs.toLocaleString()}</div>
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  Avg: {formatValue(tier.avgRevenue, "$")} / {tier.avgSubs} subs
                </div>
              </div>
            </div>
          ))}
        </div>

        {nextTier && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
            <h4 className="font-medium text-indigo-900 mb-4">
              Next Tier: {nextTier.tier}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">
                  Revenue Progress
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        ((metrics?.revenue?.userValue || 0) /
                          nextTier.minRevenue) *
                          100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">
                  {formatValue(metrics?.revenue?.userValue || 0, "$")} /{" "}
                  {formatValue(nextTier.minRevenue, "$")}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-1">
                  Subscriber Progress
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        ((metrics?.subscribers?.userValue || 0) /
                          nextTier.minSubs) *
                          100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">
                  {(metrics?.subscribers?.userValue || 0).toLocaleString()} /{" "}
                  {nextTier.minSubs.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">
          Performance Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Priority Actions</h4>
            <div className="space-y-3">
              {recommendations
                ?.slice(0, 3)
                .map((rec: string, index: number) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-red-600">
                        {index + 1}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{rec}</p>
                  </div>
                )) || [
                <div key="1" className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-red-600">1</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Focus on improving engagement rates through better content
                    quality
                  </p>
                </div>,
                <div key="2" className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-red-600">2</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Invest in growth strategies like social media marketing
                  </p>
                </div>,
                <div key="3" className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-red-600">3</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Consider optimizing pricing strategy and subscription tiers
                  </p>
                </div>,
              ]}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-4">
              Growth Opportunities
            </h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-sm text-gray-700">
                  Your engagement rate is above median - leverage this for
                  growth
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-700">
                  Consider content collaboration with top performers in your
                  category
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-purple-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-sm text-gray-700">
                  Expand to adjacent categories to diversify your audience
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-yellow-400 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-yellow-800">
              <strong>Benchmark Update:</strong> Performance benchmarks are
              recalculated weekly based on the latest creator data in your
              category and tier.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
