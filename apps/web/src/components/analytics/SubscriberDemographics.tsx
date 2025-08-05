"use client";

import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

interface SubscriberDemographicsProps {
  data: any;
  timeRange: string;
}

export default function SubscriberDemographics({
  data,
  timeRange,
}: SubscriberDemographicsProps) {
  const [activeSegment, setActiveSegment] = useState("all");

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-gray-500">
            Loading subscriber demographics...
          </div>
        </div>
      </div>
    );
  }

  const { demographics, behavior, retention, monetization } = data;

  // Sample demographic data (in production, this would come from the API)
  const ageData = Object.entries(
    demographics?.ageDistribution || {
      "18-24": 25,
      "25-34": 40,
      "35-44": 20,
      "45-54": 10,
      "55+": 5,
    }
  ).map(([age, count]) => ({
    age,
    count: count as number,
    percentage: (((count as number) / 100) * 100).toFixed(1),
  }));

  const genderData = Object.entries(
    demographics?.genderDistribution || {
      Female: 60,
      Male: 35,
      "Non-binary": 3,
      "Prefer not to say": 2,
    }
  ).map(([gender, count]) => ({
    gender,
    count: count as number,
    percentage: (((count as number) / 100) * 100).toFixed(1),
  }));

  const locationData = Object.entries(
    demographics?.locationDistribution || {
      "United States": 45,
      Canada: 15,
      "United Kingdom": 12,
      Australia: 8,
      Germany: 6,
      Other: 14,
    }
  ).map(([location, count]) => ({
    location,
    count: count as number,
    percentage: (((count as number) / 100) * 100).toFixed(1),
  }));

  const tierData = Object.entries(
    monetization?.tierDistribution || {
      Basic: 50,
      Premium: 35,
      VIP: 15,
    }
  ).map(([tier, count]) => ({
    tier,
    count: count as number,
    percentage: (((count as number) / 100) * 100).toFixed(1),
    color:
      tier === "Basic" ? "#8884d8" : tier === "Premium" ? "#82ca9d" : "#ffc658",
  }));

  const activityData = Object.entries(
    behavior?.peakActivityHours || {
      "0": 2,
      "1": 1,
      "2": 1,
      "3": 1,
      "4": 1,
      "5": 2,
      "6": 5,
      "7": 8,
      "8": 12,
      "9": 15,
      "10": 18,
      "11": 20,
      "12": 22,
      "13": 20,
      "14": 18,
      "15": 16,
      "16": 14,
      "17": 16,
      "18": 20,
      "19": 25,
      "20": 30,
      "21": 28,
      "22": 20,
      "23": 10,
    }
  ).map(([hour, activity]) => ({
    hour: `${hour}:00`,
    activity: activity as number,
    hourNum: parseInt(hour),
  }));

  const retentionData = [
    { month: "Month 1", rate: 100 },
    { month: "Month 2", rate: 85 },
    { month: "Month 3", rate: 72 },
    { month: "Month 6", rate: 65 },
    { month: "Month 12", rate: 55 },
  ];

  const engagementPatterns = [
    { metric: "Daily Active", value: 85, fullMark: 100 },
    { metric: "Messages/Session", value: 12, fullMark: 20 },
    { metric: "Session Length", value: 45, fullMark: 60 },
    { metric: "Return Rate", value: 78, fullMark: 100 },
    { metric: "Response Rate", value: 92, fullMark: 100 },
  ];

  const COLORS = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7300",
    "#8dd1e1",
    "#d084d0",
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Key Demographics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM9 16a3 3 0 01-3-3V8a3 3 0 013-3h2a3 3 0 013 3v5a3 3 0 01-3 3H9z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">
                Avg. Age Range
              </h3>
              <p className="text-2xl font-bold text-gray-900">25-34</p>
              <p className="text-sm text-purple-600">Primary demographic</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">
                Gender Split
              </h3>
              <p className="text-2xl font-bold text-gray-900">60% F</p>
              <p className="text-sm text-pink-600">Female majority</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">
                Top Location
              </h3>
              <p className="text-2xl font-bold text-gray-900">US</p>
              <p className="text-sm text-blue-600">45% of subscribers</p>
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
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Avg. LTV</h3>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(monetization?.lifetimeValue || 0)}
              </p>
              <p className="text-sm text-green-600">Per subscriber</p>
            </div>
          </div>
        </div>
      </div>

      {/* Demographic Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Age Distribution */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Age Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={ageData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ age, percentage }) => `${age} (${percentage}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {ageData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, "Subscribers"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gender Distribution */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Gender Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={genderData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="gender" />
              <YAxis />
              <Tooltip formatter={(value) => [value, "Subscribers"]} />
              <Bar dataKey="count" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Geographic Distribution
          </h3>
          <div className="space-y-3">
            {locationData.map((location, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-sm font-medium text-gray-900">
                    {location.location}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {location.count}
                  </div>
                  <div className="text-xs text-gray-500">
                    {location.percentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subscription Tiers and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Tier Distribution */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Subscription Tier Distribution
          </h3>
          <div className="space-y-4">
            {tierData.map((tier, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: tier.color }}
                  ></div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {tier.tier} Tier
                    </h4>
                    <p className="text-sm text-gray-600">
                      {tier.count} subscribers
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {tier.percentage}%
                  </p>
                  <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${tier.percentage}%`,
                        backgroundColor: tier.color,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Revenue Impact</h4>
            <p className="text-sm text-green-700">
              Average subscription value:{" "}
              <strong>
                {formatCurrency(monetization?.averageSubscriptionValue || 0)}
              </strong>
            </p>
            <p className="text-sm text-green-700">
              Total monthly recurring revenue:{" "}
              <strong>
                {formatCurrency(
                  (monetization?.averageSubscriptionValue || 0) * 100
                )}
              </strong>
            </p>
          </div>
        </div>

        {/* Activity Patterns */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Daily Activity Patterns
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" interval={3} tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip
                formatter={(value) => [`${value}%`, "Activity"]}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="activity"
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ fill: "#8884d8", strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-4 text-sm text-gray-600">
            <p>
              <strong>Peak hours:</strong> 8PM - 10PM (30% of daily activity)
            </p>
            <p>
              <strong>Average session:</strong>{" "}
              {behavior?.averageSessionLength || 0} minutes
            </p>
          </div>
        </div>
      </div>

      {/* Retention and Engagement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Retention Analysis */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Subscriber Retention
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={retentionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => [`${value}%`, "Retention Rate"]} />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {retention?.retentionRates?.["30day"]?.toFixed(1) || "85.0"}%
              </div>
              <div className="text-sm text-gray-600">30-day retention</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {retention?.churnRate?.toFixed(1) || "15.0"}%
              </div>
              <div className="text-sm text-gray-600">Monthly churn</div>
            </div>
          </div>
        </div>

        {/* Engagement Patterns */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Engagement Patterns
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={engagementPatterns}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} />
              <Radar
                name="Engagement"
                dataKey="value"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>

          <div className="mt-4 text-sm text-gray-600">
            <p>
              <strong>Most engaged:</strong> Evening users (7-10 PM)
            </p>
            <p>
              <strong>Best retention:</strong> Premium tier subscribers
            </p>
          </div>
        </div>
      </div>

      {/* Churn Risk Analysis */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">
          Churn Risk Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(
            retention?.churnRiskSegments || {
              "Low Risk": 70,
              "Medium Risk": 25,
              "High Risk": 5,
            }
          ).map(([risk, percentage], index) => (
            <div
              key={index}
              className={`p-6 rounded-lg ${
                risk === "Low Risk"
                  ? "bg-green-50"
                  : risk === "Medium Risk"
                  ? "bg-yellow-50"
                  : "bg-red-50"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h4
                  className={`font-medium ${
                    risk === "Low Risk"
                      ? "text-green-900"
                      : risk === "Medium Risk"
                      ? "text-yellow-900"
                      : "text-red-900"
                  }`}
                >
                  {risk}
                </h4>
                <div
                  className={`w-3 h-3 rounded-full ${
                    risk === "Low Risk"
                      ? "bg-green-500"
                      : risk === "Medium Risk"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                ></div>
              </div>
              <div
                className={`text-3xl font-bold mb-2 ${
                  risk === "Low Risk"
                    ? "text-green-600"
                    : risk === "Medium Risk"
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {percentage as number}%
              </div>
              <p className="text-sm text-gray-600">
                {risk === "Low Risk" && "Highly engaged, regular activity"}
                {risk === "Medium Risk" &&
                  "Decreasing engagement, needs attention"}
                {risk === "High Risk" &&
                  "At risk of churning, immediate action needed"}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">
            Retention Strategies
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>
              • Target medium-risk users with personalized content
              recommendations
            </li>
            <li>• Implement win-back campaigns for high-risk subscribers</li>
            <li>• Offer tier upgrades to highly engaged low-risk users</li>
            <li>• Create exclusive content for loyal subscribers</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
