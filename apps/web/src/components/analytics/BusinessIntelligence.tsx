"use client";

import React, { useState } from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
  Treemap,
  PieChart,
  Pie,
} from "recharts";

interface BusinessIntelligenceProps {
  data: any;
  timeRange: string;
}

export default function BusinessIntelligence({
  data,
  timeRange,
}: BusinessIntelligenceProps) {
  const [selectedInsight, setSelectedInsight] = useState("growth");
  const [forecastPeriod, setForecastPeriod] = useState(6);

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-gray-500">
            Loading business intelligence data...
          </div>
        </div>
      </div>
    );
  }

  // Sample business intelligence data
  const kpiTrends = [
    { month: "Jan", revenue: 4000, users: 240, ltv: 180, cac: 45 },
    { month: "Feb", revenue: 4500, users: 280, ltv: 185, cac: 42 },
    { month: "Mar", revenue: 5200, users: 320, ltv: 190, cac: 38 },
    { month: "Apr", revenue: 5800, users: 365, ltv: 195, cac: 35 },
    { month: "May", revenue: 6500, users: 410, ltv: 200, cac: 32 },
    { month: "Jun", revenue: 7200, users: 455, ltv: 205, cac: 30 },
  ];

  const growthMetrics = [
    {
      metric: "Revenue Growth",
      current: 15.2,
      target: 20,
      benchmark: 12.5,
      status: "good",
    },
    {
      metric: "User Acquisition",
      current: 8.5,
      target: 10,
      benchmark: 7.2,
      status: "good",
    },
    {
      metric: "Retention Rate",
      current: 85,
      target: 90,
      benchmark: 78,
      status: "excellent",
    },
    {
      metric: "Conversion Rate",
      current: 5.2,
      target: 7,
      benchmark: 4.8,
      status: "good",
    },
    {
      metric: "Churn Rate",
      current: 15,
      target: 10,
      benchmark: 18,
      status: "warning",
    },
  ];

  const revenueSegments = [
    { segment: "Basic Tier", revenue: 25000, users: 450, avgSpend: 55 },
    { segment: "Premium Tier", revenue: 45000, users: 280, avgSpend: 160 },
    { segment: "VIP Tier", revenue: 30000, users: 85, avgSpend: 350 },
    { segment: "Time-based", revenue: 18000, users: 320, avgSpend: 56 },
  ];

  const competitiveAnalysis = [
    {
      competitor: "Platform A",
      marketShare: 25,
      avgPrice: 120,
      userRating: 4.2,
    },
    {
      competitor: "Platform B",
      marketShare: 18,
      avgPrice: 95,
      userRating: 3.8,
    },
    {
      competitor: "Platform C",
      marketShare: 15,
      avgPrice: 140,
      userRating: 4.5,
    },
    {
      competitor: "Your Platform",
      marketShare: 8,
      avgPrice: 105,
      userRating: 4.6,
    },
    { competitor: "Others", marketShare: 34, avgPrice: 85, userRating: 3.5 },
  ];

  const userSegments = [
    {
      segment: "High Value",
      users: 150,
      revenue: 45000,
      engagement: 95,
      churn: 5,
    },
    {
      segment: "Regular Users",
      users: 600,
      revenue: 72000,
      engagement: 75,
      churn: 12,
    },
    {
      segment: "Casual Users",
      users: 350,
      revenue: 21000,
      engagement: 45,
      churn: 28,
    },
    {
      segment: "At Risk",
      users: 120,
      revenue: 8400,
      engagement: 25,
      churn: 65,
    },
  ];

  const aiInsights = [
    {
      type: "opportunity",
      title: "Premium Tier Optimization",
      description:
        "Analysis shows 35% of basic users exhibit premium-level engagement patterns",
      impact: "High",
      effort: "Medium",
      recommendation:
        "Launch targeted upgrade campaigns for high-engagement basic users",
      metrics: { potentialRevenue: 15000, confidence: 85 },
    },
    {
      type: "risk",
      title: "Churn Risk in Casual Segment",
      description:
        "120 users showing declining engagement patterns typical of churn precursors",
      impact: "Medium",
      effort: "Low",
      recommendation:
        "Implement re-engagement email sequence with personalized content",
      metrics: { usersAtRisk: 120, retentionPotential: 60 },
    },
    {
      type: "growth",
      title: "Evening Engagement Window",
      description:
        "Peak activity 7-10 PM represents untapped monetization opportunity",
      impact: "Medium",
      effort: "Low",
      recommendation: "Launch evening-exclusive content and promotions",
      metrics: { engagementBoost: 25, revenueUpside: 8000 },
    },
  ];

  const marketTrends = [
    {
      trend: "AI-Personalized Content",
      growth: 45,
      relevance: "High",
      timeline: "Q2 2024",
    },
    {
      trend: "Voice Interaction",
      growth: 38,
      relevance: "Medium",
      timeline: "Q3 2024",
    },
    {
      trend: "AR/VR Integration",
      growth: 28,
      relevance: "Low",
      timeline: "Q1 2025",
    },
    {
      trend: "Social Commerce",
      growth: 52,
      relevance: "High",
      timeline: "Q2 2024",
    },
  ];

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#8dd1e1"];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "text-green-600 bg-green-50";
      case "good":
        return "text-blue-600 bg-blue-50";
      case "warning":
        return "text-yellow-600 bg-yellow-50";
      case "danger":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "High":
        return "text-red-600 bg-red-50";
      case "Medium":
        return "text-yellow-600 bg-yellow-50";
      case "Low":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-white p-6">
        <h3 className="text-xl font-bold mb-4">
          Business Intelligence Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="text-2xl font-bold">$7.2K</div>
            <div className="text-indigo-100">Monthly Revenue</div>
            <div className="text-sm text-indigo-200">+15.2% growth</div>
          </div>
          <div>
            <div className="text-2xl font-bold">455</div>
            <div className="text-indigo-100">Active Users</div>
            <div className="text-sm text-indigo-200">+8.5% growth</div>
          </div>
          <div>
            <div className="text-2xl font-bold">$205</div>
            <div className="text-indigo-100">Avg LTV</div>
            <div className="text-sm text-indigo-200">+2.4% growth</div>
          </div>
          <div>
            <div className="text-2xl font-bold">85%</div>
            <div className="text-indigo-100">Retention</div>
            <div className="text-sm text-indigo-200">Above benchmark</div>
          </div>
        </div>
      </div>

      {/* AI-Powered Insights */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            AI-Powered Business Insights
          </h3>
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1 rounded-full">
            <span className="text-sm font-medium text-purple-700">
              🤖 AI Analysis
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {aiInsights.map((insight, index) => (
            <div
              key={index}
              className="border rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">{insight.title}</h4>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(
                      insight.impact
                    )}`}
                  >
                    {insight.impact} Impact
                  </span>
                  <span className="text-2xl">
                    {insight.type === "opportunity"
                      ? "🚀"
                      : insight.type === "risk"
                      ? "⚠️"
                      : "📈"}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                {insight.description}
              </p>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <h5 className="font-medium text-gray-900 mb-2">
                  Recommendation
                </h5>
                <p className="text-sm text-gray-700">
                  {insight.recommendation}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {Object.entries(insight.metrics).map(([key, value]) => (
                  <div key={key}>
                    <div className="text-gray-600 capitalize">
                      {key.replace(/([A-Z])/g, " $1")}
                    </div>
                    <div className="font-medium text-gray-900">
                      {(typeof value === "number" && key.includes("revenue")) ||
                      key.includes("Revenue")
                        ? formatCurrency(value)
                        : typeof value === "number" &&
                          (key.includes("confidence") ||
                            key.includes("Potential") ||
                            key.includes("Boost"))
                        ? `${value}%`
                        : value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KPI Trends */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Key Performance Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={kpiTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                formatter={(value, name) => [
                  name === "revenue"
                    ? formatCurrency(value as number)
                    : name === "ltv"
                    ? formatCurrency(value as number)
                    : name === "cac"
                    ? formatCurrency(value as number)
                    : value,
                  name === "revenue"
                    ? "Revenue"
                    : name === "users"
                    ? "Users"
                    : name === "ltv"
                    ? "LTV"
                    : "CAC",
                ]}
              />
              <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="users"
                stroke="#82ca9d"
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="ltv"
                stroke="#ff7300"
                strokeWidth={2}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Growth Metrics */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Growth Metrics vs Targets
          </h3>
          <div className="space-y-4">
            {growthMetrics.map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {metric.metric}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        metric.status
                      )}`}
                    >
                      {metric.current}%
                    </span>
                  </div>
                </div>

                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          (metric.current / metric.target) * 100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <div
                    className="absolute top-0 w-0.5 h-2 bg-red-500"
                    style={{
                      left: `${
                        (metric.target /
                          Math.max(
                            metric.target,
                            metric.current,
                            metric.benchmark
                          )) *
                        100
                      }%`,
                    }}
                  ></div>
                  <div
                    className="absolute top-0 w-0.5 h-2 bg-yellow-500"
                    style={{
                      left: `${
                        (metric.benchmark /
                          Math.max(
                            metric.target,
                            metric.current,
                            metric.benchmark
                          )) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>

                <div className="flex justify-between text-xs text-gray-500">
                  <span>Current: {metric.current}%</span>
                  <span>Target: {metric.target}%</span>
                  <span>Benchmark: {metric.benchmark}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Segmentation and Revenue Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Segments */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            User Segment Analysis
          </h3>
          <div className="space-y-4">
            {userSegments.map((segment, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">
                    {segment.segment}
                  </h4>
                  <span
                    className="text-lg font-bold"
                    style={{ color: COLORS[index] }}
                  >
                    {segment.users}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-gray-600">Revenue</div>
                    <div className="font-medium">
                      {formatCurrency(segment.revenue)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Engagement</div>
                    <div className="font-medium">{segment.engagement}%</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Churn</div>
                    <div className="font-medium">{segment.churn}%</div>
                  </div>
                </div>

                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${
                        (segment.users /
                          userSegments.reduce((sum, s) => sum + s.users, 0)) *
                        100
                      }%`,
                      backgroundColor: COLORS[index],
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Segments */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Revenue Segment Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={revenueSegments}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ segment, revenue }) =>
                  `${segment}: ${formatCurrency(revenue)}`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="revenue"
              >
                {revenueSegments.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [
                  formatCurrency(value as number),
                  "Revenue",
                ]}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-4 text-sm text-gray-600">
            <p>
              <strong>Total Revenue:</strong>{" "}
              {formatCurrency(
                revenueSegments.reduce((sum, s) => sum + s.revenue, 0)
              )}
            </p>
            <p>
              <strong>Highest ARPU:</strong> VIP Tier ({formatCurrency(350)})
            </p>
          </div>
        </div>
      </div>

      {/* Competitive Analysis */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">
          Competitive Market Position
        </h3>

        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart>
            <CartesianGrid />
            <XAxis
              type="number"
              dataKey="avgPrice"
              name="Average Price"
              unit="$"
            />
            <YAxis
              type="number"
              dataKey="marketShare"
              name="Market Share"
              unit="%"
            />
            <Tooltip
              formatter={(value, name) => [
                name === "avgPrice"
                  ? formatCurrency(value as number)
                  : `${value}%`,
                name === "avgPrice" ? "Avg Price" : "Market Share",
              ]}
            />
            <Scatter
              name="Competitors"
              data={competitiveAnalysis}
              fill="#8884d8"
            >
              {competitiveAnalysis.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.competitor === "Your Platform" ? "#ff7300" : "#8884d8"
                  }
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
          {competitiveAnalysis.map((competitor, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                competitor.competitor === "Your Platform"
                  ? "bg-orange-50 border-2 border-orange-200"
                  : "bg-gray-50"
              }`}
            >
              <h4
                className={`font-medium mb-2 ${
                  competitor.competitor === "Your Platform"
                    ? "text-orange-900"
                    : "text-gray-900"
                }`}
              >
                {competitor.competitor}
              </h4>
              <div className="text-sm space-y-1">
                <div>Share: {competitor.marketShare}%</div>
                <div>Price: {formatCurrency(competitor.avgPrice)}</div>
                <div>Rating: {competitor.userRating} ⭐</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market Trends & Opportunities */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">
          Market Trends & Strategic Opportunities
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {marketTrends.map((trend, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{trend.trend}</h4>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    trend.relevance === "High"
                      ? "bg-green-100 text-green-800"
                      : trend.relevance === "Medium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {trend.relevance}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <div className="text-gray-600">Growth Rate</div>
                  <div className="font-medium text-green-600">
                    +{trend.growth}%
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Timeline</div>
                  <div className="font-medium">{trend.timeline}</div>
                </div>
              </div>

              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${Math.min(trend.growth, 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-blue-50 rounded-lg p-6">
          <h4 className="font-medium text-blue-900 mb-4">
            Strategic Recommendations
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-blue-800 mb-2">
                Short Term (Q2 2024)
              </h5>
              <ul className="text-blue-700 space-y-1">
                <li>• Implement AI-personalized content recommendations</li>
                <li>• Launch social commerce features</li>
                <li>• Optimize premium tier conversion funnel</li>
                <li>• Expand evening engagement programs</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-blue-800 mb-2">
                Long Term (2024-2025)
              </h5>
              <ul className="text-blue-700 space-y-1">
                <li>• Develop voice interaction capabilities</li>
                <li>• Explore AR/VR integration opportunities</li>
                <li>• Build competitive moat through platform effects</li>
                <li>
                  • Consider strategic partnerships or acquisition targets
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">
          Priority Action Items
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-l-4 border-red-500 pl-4">
            <h4 className="font-medium text-red-900 mb-2">
              Critical (Next 30 Days)
            </h4>
            <ul className="space-y-2 text-sm text-red-700">
              <li>• Address 120 at-risk users with re-engagement campaign</li>
              <li>• Reduce subscription page exit rate from 75%</li>
              <li>
                • Launch premium upgrade campaign for high-engagement basic
                users
              </li>
            </ul>
          </div>

          <div className="border-l-4 border-yellow-500 pl-4">
            <h4 className="font-medium text-yellow-900 mb-2">
              Important (Next 90 Days)
            </h4>
            <ul className="space-y-2 text-sm text-yellow-700">
              <li>• Optimize mobile user experience (65% of traffic)</li>
              <li>• Implement evening-exclusive content strategy</li>
              <li>• Develop AI-powered content personalization</li>
            </ul>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="font-medium text-green-900 mb-2">
              Strategic (Next 6 Months)
            </h4>
            <ul className="space-y-2 text-sm text-green-700">
              <li>• Build voice interaction capabilities</li>
              <li>• Expand into social commerce features</li>
              <li>• Develop competitive partnerships</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-purple-600 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <p className="text-sm text-purple-800">
              <strong>AI Recommendation:</strong> Focus on the premium tier
              optimization opportunity first - it has the highest
              impact-to-effort ratio with potential for $15K additional monthly
              revenue.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
