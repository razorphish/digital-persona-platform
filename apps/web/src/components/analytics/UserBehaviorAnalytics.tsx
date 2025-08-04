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
  PieChart,
  Pie,
  Cell,
  FunnelChart,
  Funnel,
  LabelList,
} from "recharts";

interface UserBehaviorAnalyticsProps {
  data: any;
  timeRange: string;
}

export default function UserBehaviorAnalytics({
  data,
  timeRange,
}: UserBehaviorAnalyticsProps) {
  const [selectedMetric, setSelectedMetric] = useState("sessions");
  const [cohortPeriod, setCohortPeriod] = useState("weekly");

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-gray-500">Loading user behavior data...</div>
        </div>
      </div>
    );
  }

  // Sample behavior data (in production, this would come from the API)
  const sessionData = [
    { date: "2024-01-01", sessions: 45, avgDuration: 28, bounceRate: 15 },
    { date: "2024-01-02", sessions: 52, avgDuration: 32, bounceRate: 12 },
    { date: "2024-01-03", sessions: 38, avgDuration: 25, bounceRate: 18 },
    { date: "2024-01-04", sessions: 67, avgDuration: 35, bounceRate: 10 },
    { date: "2024-01-05", sessions: 71, avgDuration: 38, bounceRate: 8 },
    { date: "2024-01-06", sessions: 83, avgDuration: 42, bounceRate: 7 },
    { date: "2024-01-07", sessions: 95, avgDuration: 45, bounceRate: 6 },
  ];

  const funnelData = [
    { name: "Visitors", value: 1000, fill: "#8884d8" },
    { name: "Viewed Profile", value: 750, fill: "#82ca9d" },
    { name: "Started Chat", value: 400, fill: "#ffc658" },
    { name: "Engaged (5+ messages)", value: 200, fill: "#ff7300" },
    { name: "Subscribed", value: 50, fill: "#8dd1e1" },
  ];

  const deviceData = [
    { device: "Mobile", users: 65, sessions: 180, avgDuration: 32 },
    { device: "Desktop", users: 28, sessions: 95, avgDuration: 45 },
    { device: "Tablet", users: 7, sessions: 25, avgDuration: 38 },
  ];

  const pageFlowData = [
    { page: "Landing", visitors: 1000, avgTime: 45, exitRate: 25 },
    { page: "Profile", visitors: 750, avgTime: 120, exitRate: 35 },
    { page: "Chat", visitors: 400, avgTime: 300, exitRate: 45 },
    { page: "Subscribe", visitors: 200, avgTime: 180, exitRate: 75 },
  ];

  const timeOfDayData = [
    { hour: "00", activity: 5 },
    { hour: "01", activity: 3 },
    { hour: "02", activity: 2 },
    { hour: "03", activity: 1 },
    { hour: "04", activity: 1 },
    { hour: "05", activity: 3 },
    { hour: "06", activity: 8 },
    { hour: "07", activity: 15 },
    { hour: "08", activity: 25 },
    { hour: "09", activity: 35 },
    { hour: "10", activity: 45 },
    { hour: "11", activity: 50 },
    { hour: "12", activity: 55 },
    { hour: "13", activity: 48 },
    { hour: "14", activity: 42 },
    { hour: "15", activity: 38 },
    { hour: "16", activity: 35 },
    { hour: "17", activity: 40 },
    { hour: "18", activity: 50 },
    { hour: "19", activity: 65 },
    { hour: "20", activity: 75 },
    { hour: "21", activity: 70 },
    { hour: "22", activity: 45 },
    { hour: "23", activity: 25 },
  ];

  const cohortData = [
    {
      cohort: "Week 1",
      week0: 100,
      week1: 85,
      week2: 72,
      week3: 65,
      week4: 58,
    },
    {
      cohort: "Week 2",
      week0: 100,
      week1: 88,
      week2: 75,
      week3: 68,
      week4: 62,
    },
    {
      cohort: "Week 3",
      week0: 100,
      week1: 82,
      week2: 70,
      week3: 63,
      week4: 55,
    },
    {
      cohort: "Week 4",
      week0: 100,
      week1: 90,
      week2: 78,
      week3: 71,
      week4: 65,
    },
  ];

  const featuresUsage = [
    { feature: "Chat", usage: 95, satisfaction: 4.8 },
    { feature: "Voice Messages", usage: 72, satisfaction: 4.6 },
    { feature: "File Sharing", usage: 45, satisfaction: 4.2 },
    { feature: "Video Calls", usage: 38, satisfaction: 4.9 },
    { feature: "Tips", usage: 25, satisfaction: 4.1 },
    { feature: "Scheduling", usage: 18, satisfaction: 3.9 },
  ];

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#8dd1e1"];

  const metricOptions = [
    { value: "sessions", label: "Sessions" },
    { value: "duration", label: "Session Duration" },
    { value: "bounceRate", label: "Bounce Rate" },
  ];

  return (
    <div className="space-y-6">
      {/* Behavior Overview */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            User Behavior Overview
          </h3>
          <div className="flex items-center space-x-4">
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              {metricOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900">
              Avg. Session Duration
            </h4>
            <p className="text-2xl font-bold text-blue-600">
              {Math.round(
                sessionData.reduce((sum, d) => sum + d.avgDuration, 0) /
                  sessionData.length
              )}
              min
            </p>
            <p className="text-sm text-blue-700">+12% from last week</p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-900">
              Daily Active Users
            </h4>
            <p className="text-2xl font-bold text-green-600">
              {Math.round(
                sessionData.reduce((sum, d) => sum + d.sessions, 0) /
                  sessionData.length
              )}
            </p>
            <p className="text-sm text-green-700">+8% from last week</p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-purple-900">Bounce Rate</h4>
            <p className="text-2xl font-bold text-purple-600">
              {Math.round(
                sessionData.reduce((sum, d) => sum + d.bounceRate, 0) /
                  sessionData.length
              )}
              %
            </p>
            <p className="text-sm text-purple-700">-3% from last week</p>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-orange-900">
              Conversion Rate
            </h4>
            <p className="text-2xl font-bold text-orange-600">5.2%</p>
            <p className="text-sm text-orange-700">+0.8% from last week</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={sessionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => new Date(date).toLocaleDateString()}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(date) => new Date(date).toLocaleDateString()}
              formatter={(value, name) => [
                name === "avgDuration"
                  ? `${value} min`
                  : name === "bounceRate"
                  ? `${value}%`
                  : value,
                name === "sessions"
                  ? "Sessions"
                  : name === "avgDuration"
                  ? "Avg Duration"
                  : "Bounce Rate",
              ]}
            />
            <Line
              type="monotone"
              dataKey="sessions"
              stroke="#8884d8"
              strokeWidth={2}
            />
            {selectedMetric === "duration" && (
              <Line
                type="monotone"
                dataKey="avgDuration"
                stroke="#82ca9d"
                strokeWidth={2}
              />
            )}
            {selectedMetric === "bounceRate" && (
              <Line
                type="monotone"
                dataKey="bounceRate"
                stroke="#ff7300"
                strokeWidth={2}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Conversion Funnel and Device Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            User Journey Funnel
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <FunnelChart>
              <Tooltip />
              <Funnel dataKey="value" data={funnelData} isAnimationActive>
                <LabelList position="center" fill="#fff" stroke="none" />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>

          <div className="mt-4 space-y-2">
            {funnelData.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-600">{item.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">
                    {item.value.toLocaleString()}
                  </span>
                  {index > 0 && (
                    <span className="text-gray-500">
                      (
                      {(
                        (item.value / funnelData[index - 1].value) *
                        100
                      ).toFixed(1)}
                      %)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Analytics */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Device & Platform Analytics
          </h3>

          <div className="space-y-4">
            {deviceData.map((device, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{device.device}</h4>
                  <span
                    className="text-lg font-bold"
                    style={{ color: COLORS[index] }}
                  >
                    {device.users}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Sessions</div>
                    <div className="font-medium">{device.sessions}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Avg Duration</div>
                    <div className="font-medium">{device.avgDuration}min</div>
                  </div>
                </div>

                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${device.users}%`,
                      backgroundColor: COLORS[index],
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Time-based Activity and Page Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time of Day Activity */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Activity by Time of Day
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timeOfDayData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" interval={3} />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}%`, "Activity"]} />
              <Area
                type="monotone"
                dataKey="activity"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>

          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium text-gray-900">Peak Hour</div>
              <div className="text-blue-600">8:00 PM</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900">Least Active</div>
              <div className="text-gray-600">3:00 AM</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900">Prime Time</div>
              <div className="text-green-600">7-10 PM</div>
            </div>
          </div>
        </div>

        {/* Page Flow Analysis */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            User Flow Analysis
          </h3>

          <div className="space-y-4">
            {pageFlowData.map((page, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-indigo-600">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{page.page}</h4>
                    <p className="text-sm text-gray-600">
                      {page.visitors.toLocaleString()} visitors • {page.avgTime}
                      s avg time
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {page.exitRate}%
                  </div>
                  <div className="text-sm text-gray-600">exit rate</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Flow Insights</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Highest drop-off occurs at subscription page (75%)</li>
              <li>• Chat engagement is strong with 5min average time</li>
              <li>• Profile view-to-chat conversion: 53%</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Feature Usage and Cohort Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Usage */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Feature Usage & Satisfaction
          </h3>

          <div className="space-y-4">
            {featuresUsage.map((feature, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {feature.feature}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {feature.usage}%
                    </span>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${
                            i < feature.satisfaction
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-1 text-sm text-gray-600">
                        {feature.satisfaction}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${feature.usage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cohort Retention */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Cohort Retention Analysis
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="pb-2">Cohort</th>
                  <th className="pb-2 text-center">Week 0</th>
                  <th className="pb-2 text-center">Week 1</th>
                  <th className="pb-2 text-center">Week 2</th>
                  <th className="pb-2 text-center">Week 3</th>
                  <th className="pb-2 text-center">Week 4</th>
                </tr>
              </thead>
              <tbody>
                {cohortData.map((cohort, index) => (
                  <tr key={index} className="border-t">
                    <td className="py-2 font-medium text-gray-900">
                      {cohort.cohort}
                    </td>
                    <td className="py-2 text-center">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                        {cohort.week0}%
                      </span>
                    </td>
                    <td className="py-2 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          cohort.week1 >= 80
                            ? "bg-green-100 text-green-800"
                            : cohort.week1 >= 60
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {cohort.week1}%
                      </span>
                    </td>
                    <td className="py-2 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          cohort.week2 >= 70
                            ? "bg-green-100 text-green-800"
                            : cohort.week2 >= 50
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {cohort.week2}%
                      </span>
                    </td>
                    <td className="py-2 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          cohort.week3 >= 60
                            ? "bg-green-100 text-green-800"
                            : cohort.week3 >= 40
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {cohort.week3}%
                      </span>
                    </td>
                    <td className="py-2 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          cohort.week4 >= 55
                            ? "bg-green-100 text-green-800"
                            : cohort.week4 >= 35
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {cohort.week4}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p>
              <strong>Average 4-week retention:</strong> 60%
            </p>
            <p>
              <strong>Best performing cohort:</strong> Week 4 (65% retention)
            </p>
          </div>
        </div>
      </div>

      {/* Behavioral Insights */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">
          Behavioral Insights & Recommendations
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-4">
              Key Behavioral Patterns
            </h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <h5 className="font-medium text-gray-900">
                    High Evening Engagement
                  </h5>
                  <p className="text-sm text-gray-600">
                    Peak activity between 7-10 PM suggests users prefer evening
                    interactions
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <h5 className="font-medium text-gray-900">
                    Mobile-First Audience
                  </h5>
                  <p className="text-sm text-gray-600">
                    65% of users access via mobile, with longer session
                    durations on desktop
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <h5 className="font-medium text-gray-900">
                    Strong Chat Engagement
                  </h5>
                  <p className="text-sm text-gray-600">
                    Users who start chatting show 5x higher conversion to
                    subscription
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-4">
              Optimization Opportunities
            </h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-yellow-600">1</span>
                </div>
                <p className="text-sm text-gray-700">
                  Reduce subscription page exit rate (75%) with clearer value
                  proposition
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-yellow-600">2</span>
                </div>
                <p className="text-sm text-gray-700">
                  Optimize mobile experience to leverage 65% mobile user base
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-yellow-600">3</span>
                </div>
                <p className="text-sm text-gray-700">
                  Send engagement notifications during peak hours (7-10 PM)
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-yellow-600">4</span>
                </div>
                <p className="text-sm text-gray-700">
                  Promote underutilized features like video calls (38% usage,
                  4.9 satisfaction)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
