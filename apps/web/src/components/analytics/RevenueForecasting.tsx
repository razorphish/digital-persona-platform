"use client";

import React, { useState } from "react";
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
  ComposedChart,
  Legend,
} from "recharts";

interface RevenueForecastingProps {
  data: any;
  timeRange: string;
}

export default function RevenueForecasting({
  data,
  timeRange,
}: RevenueForecastingProps) {
  const [forecastPeriod, setForecastPeriod] = useState(12);
  const [confidenceLevel, setConfidenceLevel] = useState(80);

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-gray-500">Loading forecasting data...</div>
        </div>
      </div>
    );
  }

  const { forecasts, trends, insights } = data;

  // Sample historical and forecast data
  const historicalData = [
    { month: "Jan", actual: 4000, subscribers: 240, confidence: null },
    { month: "Feb", actual: 3000, subscribers: 220, confidence: null },
    { month: "Mar", actual: 2000, subscribers: 250, confidence: null },
    { month: "Apr", actual: 2780, subscribers: 280, confidence: null },
    { month: "May", actual: 1890, subscribers: 300, confidence: null },
    { month: "Jun", actual: 2390, subscribers: 320, confidence: null },
    { month: "Jul", actual: 3490, subscribers: 350, confidence: null },
  ];

  const forecastData = [
    { month: "Aug", forecast: 3800, upper: 4200, lower: 3400, confidence: 85 },
    { month: "Sep", forecast: 4100, upper: 4600, lower: 3600, confidence: 82 },
    { month: "Oct", forecast: 4300, upper: 4900, lower: 3700, confidence: 78 },
    { month: "Nov", forecast: 4600, upper: 5300, lower: 3900, confidence: 75 },
    { month: "Dec", forecast: 5000, upper: 5800, lower: 4200, confidence: 72 },
    {
      month: "Jan+1",
      forecast: 5200,
      upper: 6100,
      lower: 4300,
      confidence: 68,
    },
  ];

  const combinedData = [...historicalData, ...forecastData];

  const scenarioData = [
    {
      scenario: "Conservative",
      revenue: insights?.projectedAnnualRevenue * 0.8 || 0,
      probability: 25,
    },
    {
      scenario: "Realistic",
      revenue: insights?.projectedAnnualRevenue || 0,
      probability: 50,
    },
    {
      scenario: "Optimistic",
      revenue: insights?.projectedAnnualRevenue * 1.3 || 0,
      probability: 20,
    },
    {
      scenario: "Best Case",
      revenue: insights?.projectedAnnualRevenue * 1.6 || 0,
      probability: 5,
    },
  ];

  const revenueBreakdown = [
    {
      source: "Subscriptions",
      amount: insights?.projectedAnnualRevenue * 0.7 || 0,
      color: "#8884d8",
    },
    {
      source: "Time-based",
      amount: insights?.projectedAnnualRevenue * 0.25 || 0,
      color: "#82ca9d",
    },
    {
      source: "Tips",
      amount: insights?.projectedAnnualRevenue * 0.05 || 0,
      color: "#ffc658",
    },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} style={{ color: item.color }}>
              {item.name}: {formatCurrency(item.value)}
              {item.dataKey === "forecast" && (
                <span className="text-sm text-gray-500 ml-2">
                  (±{Math.round((item.payload.upper - item.payload.lower) / 2)})
                </span>
              )}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Forecasting Controls */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Revenue Forecasting Settings
          </h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Forecast Period:</label>
              <select
                value={forecastPeriod}
                onChange={(e) => setForecastPeriod(Number(e.target.value))}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value={6}>6 Months</option>
                <option value={12}>12 Months</option>
                <option value={24}>24 Months</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Confidence Level:</label>
              <select
                value={confidenceLevel}
                onChange={(e) => setConfidenceLevel(Number(e.target.value))}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value={70}>70%</option>
                <option value={80}>80%</option>
                <option value={90}>90%</option>
                <option value={95}>95%</option>
              </select>
            </div>
          </div>
        </div>

        {/* Key Forecast Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-600">
              Projected Annual Revenue
            </h4>
            <p className="text-2xl font-bold text-indigo-600">
              {formatCurrency(insights?.projectedAnnualRevenue || 0)}
            </p>
            <p className="text-sm text-gray-500">
              {trends?.monthlyGrowthRate > 0 ? "+" : ""}
              {(trends?.monthlyGrowthRate * 100 || 0).toFixed(1)}% monthly
              growth
            </p>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-600">
              Next Month Forecast
            </h4>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(forecastData[0]?.forecast || 0)}
            </p>
            <p className="text-sm text-gray-500">
              {forecastData[0]?.confidence || 85}% confidence
            </p>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-600">Growth Trend</h4>
            <p className="text-2xl font-bold text-purple-600">
              {trends?.yearOverYearGrowth > 0 ? "+" : ""}
              {(trends?.yearOverYearGrowth * 100 || 0).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-500">Year-over-year</p>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-600">
              Forecast Accuracy
            </h4>
            <p className="text-2xl font-bold text-orange-600">87%</p>
            <p className="text-sm text-gray-500">Historical accuracy</p>
          </div>
        </div>
      </div>

      {/* Revenue Forecast Chart */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Revenue Forecast with Confidence Intervals
          </h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-600">Historical</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Forecast</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-300 rounded"></div>
              <span className="text-sm text-gray-600">Confidence Band</span>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={combinedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={formatCurrency} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* Confidence interval */}
            <Area
              type="monotone"
              dataKey="upper"
              stackId="1"
              stroke="none"
              fill="#e5e7eb"
              fillOpacity={0.3}
            />
            <Area
              type="monotone"
              dataKey="lower"
              stackId="1"
              stroke="none"
              fill="#ffffff"
              fillOpacity={1}
            />

            {/* Historical actual revenue */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
              connectNulls={false}
            />

            {/* Forecasted revenue */}
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#10b981"
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Scenario Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Revenue Scenarios
          </h3>
          <div className="space-y-4">
            {scenarioData.map((scenario, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <h4 className="font-medium text-gray-900">
                    {scenario.scenario}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {scenario.probability}% probability
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(scenario.revenue)}
                  </p>
                  <p className="text-sm text-gray-600">Annual revenue</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Revenue Sources Forecast
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenueBreakdown} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={formatCurrency} />
              <YAxis dataKey="source" type="category" width={80} />
              <Tooltip
                formatter={(value: number) => [
                  formatCurrency(value),
                  "Revenue",
                ]}
              />
              <Bar dataKey="amount" fill="#8884d8">
                {revenueBreakdown.map((entry, index) => (
                  <Bar key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Key Insights
          </h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium text-gray-900">
                  Strong Growth Trajectory
                </h4>
                <p className="text-sm text-gray-600">
                  Revenue is projected to grow by{" "}
                  {(trends?.monthlyGrowthRate * 100 || 0).toFixed(1)}% monthly,
                  indicating healthy business expansion.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium text-gray-900">Seasonal Patterns</h4>
                <p className="text-sm text-gray-600">
                  Historical data shows stronger performance in Q4, likely due
                  to holiday spending patterns.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium text-gray-900">
                  Revenue Diversification
                </h4>
                <p className="text-sm text-gray-600">
                  Subscription revenue makes up 70% of total revenue, providing
                  a stable foundation for growth.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium text-gray-900">
                  Forecast Confidence
                </h4>
                <p className="text-sm text-gray-600">
                  Near-term forecasts (1-3 months) have high confidence (85%+),
                  while longer-term projections require monitoring.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Optimization Recommendations
          </h3>
          <div className="space-y-4">
            {insights?.revenueOptimizationTips?.map(
              (tip: string, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-indigo-600">
                      {index + 1}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{tip}</p>
                </div>
              )
            ) || [
              <div key="1" className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-indigo-600">1</span>
                </div>
                <p className="text-sm text-gray-700">
                  Focus on subscriber retention to reduce churn and increase
                  lifetime value
                </p>
              </div>,
              <div key="2" className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-indigo-600">2</span>
                </div>
                <p className="text-sm text-gray-700">
                  Consider premium tier pricing optimization based on value
                  delivered
                </p>
              </div>,
              <div key="3" className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-indigo-600">3</span>
                </div>
                <p className="text-sm text-gray-700">
                  Expand content variety to attract new audience segments
                </p>
              </div>,
              <div key="4" className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-indigo-600">4</span>
                </div>
                <p className="text-sm text-gray-700">
                  Implement upselling strategies for time-based interactions
                </p>
              </div>,
            ]}
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
                <strong>Note:</strong> Forecasts are based on historical data
                and current trends. Market conditions and external factors may
                impact actual results.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
