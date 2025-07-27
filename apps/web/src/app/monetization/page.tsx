"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { trpc } from "@/lib/trpc";

// Types for monetization
interface SubscriptionTier {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: "monthly" | "yearly";
  features: string[];
  isActive: boolean;
  subscriberCount: number;
}

interface MonetizationSettings {
  personaId: string;
  isMonetizationEnabled: boolean;
  subscriptionTiers: SubscriptionTier[];
  paymentMethods: {
    stripe: boolean;
    paypal: boolean;
    crypto: boolean;
  };
  taxSettings: {
    taxRate: number;
    taxIncluded: boolean;
    taxRegion: string;
  };
  payoutSettings: {
    method: "bank" | "paypal" | "crypto";
    frequency: "daily" | "weekly" | "monthly";
    minimumAmount: number;
  };
}

interface RevenueMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  totalSubscribers: number;
  activeSubscribers: number;
  churnRate: number;
  averageRevenuePerUser: number;
  revenueGrowth: number;
  topTier: string;
}

function MonetizationPageContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<
    "overview" | "tiers" | "subscribers" | "analytics" | "settings"
  >("overview");
  const [showCreateTierModal, setShowCreateTierModal] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // tRPC queries
  const { data: personas } = trpc.personas.list.useQuery();
  const { data: mainPersona } = trpc.personas.getMain.useQuery();

  // Mock data for monetization
  const [monetizationSettings, setMonetizationSettings] =
    useState<MonetizationSettings>({
      personaId: "",
      isMonetizationEnabled: false,
      subscriptionTiers: [
        {
          id: "basic",
          name: "Basic Access",
          description: "Chat access with limited daily messages",
          price: 9.99,
          currency: "USD",
          interval: "monthly",
          features: [
            "Basic chat access",
            "10 messages per day",
            "Standard response time",
          ],
          isActive: true,
          subscriberCount: 45,
        },
        {
          id: "premium",
          name: "Premium Access",
          description: "Unlimited chat with priority support",
          price: 24.99,
          currency: "USD",
          interval: "monthly",
          features: [
            "Unlimited chat access",
            "Priority responses",
            "Custom personality training",
            "Video messages",
          ],
          isActive: true,
          subscriberCount: 28,
        },
        {
          id: "vip",
          name: "VIP Experience",
          description: "Exclusive access with personal features",
          price: 99.99,
          currency: "USD",
          interval: "monthly",
          features: [
            "Everything in Premium",
            "Voice calls",
            "Personal photo sharing",
            "Exclusive content",
            "Priority support",
          ],
          isActive: false,
          subscriberCount: 7,
        },
      ],
      paymentMethods: {
        stripe: true,
        paypal: false,
        crypto: false,
      },
      taxSettings: {
        taxRate: 8.5,
        taxIncluded: false,
        taxRegion: "US",
      },
      payoutSettings: {
        method: "bank",
        frequency: "monthly",
        minimumAmount: 50,
      },
    });

  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics>({
    totalRevenue: 2847.65,
    monthlyRevenue: 1156.23,
    totalSubscribers: 80,
    activeSubscribers: 73,
    churnRate: 8.75,
    averageRevenuePerUser: 15.84,
    revenueGrowth: 23.5,
    topTier: "Premium Access",
  });

  // Initialize with main persona
  useEffect(() => {
    if (mainPersona && !selectedPersonaId) {
      setSelectedPersonaId(mainPersona.id);
      setMonetizationSettings((prev) => ({
        ...prev,
        personaId: mainPersona.id,
      }));
    }
  }, [mainPersona, selectedPersonaId]);

  const handlePersonaChange = (personaId: string) => {
    setSelectedPersonaId(personaId);
    setMonetizationSettings((prev) => ({ ...prev, personaId }));
    setIsDirty(false);
  };

  const updateTier = (tierId: string, updates: Partial<SubscriptionTier>) => {
    setMonetizationSettings((prev) => ({
      ...prev,
      subscriptionTiers: prev.subscriptionTiers.map((tier) =>
        tier.id === tierId ? { ...tier, ...updates } : tier
      ),
    }));
    setIsDirty(true);
  };

  const deleteTier = (tierId: string) => {
    setMonetizationSettings((prev) => ({
      ...prev,
      subscriptionTiers: prev.subscriptionTiers.filter(
        (tier) => tier.id !== tierId
      ),
    }));
    setIsDirty(true);
  };

  const createTier = (
    tierData: Omit<SubscriptionTier, "id" | "subscriberCount">
  ) => {
    const newTier: SubscriptionTier = {
      ...tierData,
      id: Date.now().toString(),
      subscriberCount: 0,
    };
    setMonetizationSettings((prev) => ({
      ...prev,
      subscriptionTiers: [...prev.subscriptionTiers, newTier],
    }));
    setIsDirty(true);
    setShowCreateTierModal(false);
  };

  const toggleMonetization = () => {
    setMonetizationSettings((prev) => ({
      ...prev,
      isMonetizationEnabled: !prev.isMonetizationEnabled,
    }));
    setIsDirty(true);
  };

  const saveSettings = async () => {
    // Mock implementation - would use tRPC mutation
    console.log("Saving monetization settings:", monetizationSettings);
    setIsDirty(false);
  };

  const totalTierRevenue = monetizationSettings.subscriptionTiers.reduce(
    (total, tier) => total + tier.price * tier.subscriberCount,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/personas")}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Creator Monetization
                </h1>
                <p className="text-sm text-gray-600">
                  Manage subscriptions, pricing, and revenue
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isDirty && (
                <button
                  onClick={saveSettings}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Save Changes
                </button>
              )}
              <span className="text-gray-700">Welcome, {user?.name}!</span>
              <button
                onClick={() => logout()}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Persona Selection & Status */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">
                Monetize Persona:
              </label>
              <select
                value={selectedPersonaId}
                onChange={(e) => handlePersonaChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {(personas as any)
                  ?.filter((p: any) => p.personaType !== "main")
                  .map((persona) => (
                    <option key={persona.id} value={persona.id}>
                      {persona.name}
                    </option>
                  ))}
              </select>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Monetization:</span>
                <button
                  onClick={toggleMonetization}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    monetizationSettings.isMonetizationEnabled
                      ? "bg-purple-600"
                      : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      monetizationSettings.isMonetizationEnabled
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
                <span
                  className={`text-sm font-medium ${
                    monetizationSettings.isMonetizationEnabled
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  {monetizationSettings.isMonetizationEnabled
                    ? "Enabled"
                    : "Disabled"}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-600">
                  ${revenueMetrics.monthlyRevenue}
                </div>
                <div className="text-gray-600">Monthly Revenue</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">
                  {revenueMetrics.activeSubscribers}
                </div>
                <div className="text-gray-600">Active Subscribers</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: "overview", label: "Overview", icon: "📊" },
              { id: "tiers", label: "Subscription Tiers", icon: "💎" },
              { id: "subscribers", label: "Subscribers", icon: "👥" },
              { id: "analytics", label: "Analytics", icon: "📈" },
              { id: "settings", label: "Settings", icon: "⚙️" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Revenue Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-green-100">
                    <svg
                      className="w-6 h-6 text-green-600"
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
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Revenue
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      ${revenueMetrics.totalRevenue}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-blue-100">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Subscribers
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {revenueMetrics.activeSubscribers}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-purple-100">
                    <svg
                      className="w-6 h-6 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">ARPU</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      ${revenueMetrics.averageRevenuePerUser}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-orange-100">
                    <svg
                      className="w-6 h-6 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Growth Rate
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      +{revenueMetrics.revenueGrowth}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab("tiers")}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-left"
                >
                  <div className="text-xl mb-2">💎</div>
                  <h4 className="font-medium text-gray-900">Create New Tier</h4>
                  <p className="text-sm text-gray-600">
                    Add a new subscription option
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab("analytics")}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-left"
                >
                  <div className="text-xl mb-2">📈</div>
                  <h4 className="font-medium text-gray-900">View Analytics</h4>
                  <p className="text-sm text-gray-600">
                    Deep dive into performance
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab("settings")}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-left"
                >
                  <div className="text-xl mb-2">⚙️</div>
                  <h4 className="font-medium text-gray-900">Payment Setup</h4>
                  <p className="text-sm text-gray-600">
                    Configure payment methods
                  </p>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Activity
              </h3>
              <div className="space-y-4">
                {[
                  {
                    action: "New subscriber",
                    details: "Premium Access tier",
                    time: "2 hours ago",
                    type: "positive",
                  },
                  {
                    action: "Payment received",
                    details: "$24.99 from Premium subscriber",
                    time: "4 hours ago",
                    type: "positive",
                  },
                  {
                    action: "Subscription cancelled",
                    details: "Basic Access tier",
                    time: "1 day ago",
                    type: "negative",
                  },
                  {
                    action: "Tier updated",
                    details: "VIP Experience pricing changed",
                    time: "2 days ago",
                    type: "neutral",
                  },
                ].map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activity.type === "positive"
                          ? "bg-green-500"
                          : activity.type === "negative"
                          ? "bg-red-500"
                          : "bg-gray-500"
                      }`}
                    ></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.action}
                      </p>
                      <p className="text-sm text-gray-600">
                        {activity.details}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Subscription Tiers Tab */}
        {activeTab === "tiers" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Subscription Tiers
              </h2>
              <button
                onClick={() => setShowCreateTierModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>Create New Tier</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {monetizationSettings.subscriptionTiers.map((tier) => (
                <div
                  key={tier.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {tier.name}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {tier.description}
                      </p>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() =>
                          updateTier(tier.id, { isActive: !tier.isActive })
                        }
                        className={`p-1 rounded ${
                          tier.isActive
                            ? "text-green-600 hover:bg-green-50"
                            : "text-gray-400 hover:bg-gray-50"
                        }`}
                        title={
                          tier.isActive ? "Deactivate tier" : "Activate tier"
                        }
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteTier(tier.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete tier"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-bold text-purple-600">
                        ${tier.price}
                      </span>
                      <span className="text-gray-600">/{tier.interval}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {tier.subscriberCount} subscribers
                    </p>
                  </div>

                  <div className="space-y-2 mb-4">
                    {tier.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <svg
                          className="w-4 h-4 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Monthly Revenue</span>
                      <span className="font-semibold text-gray-900">
                        ${(tier.price * tier.subscriberCount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other tabs would be implemented similarly */}
        {activeTab === "subscribers" && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Subscriber Management
              </h3>
              <p className="text-gray-600">
                Detailed subscriber management interface coming soon
              </p>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Revenue Analytics
              </h3>
              <p className="text-gray-600">
                Advanced analytics and reporting dashboard coming soon
              </p>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Payment & Settings
              </h3>
              <p className="text-gray-600">
                Payment method configuration and advanced settings coming soon
              </p>
            </div>
          </div>
        )}

        {/* Save Button */}
        {isDirty && (
          <div className="fixed bottom-6 right-6">
            <button
              onClick={saveSettings}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Save Monetization Settings</span>
            </button>
          </div>
        )}
      </main>

      {/* Create Tier Modal */}
      {showCreateTierModal && (
        <CreateTierModal
          onClose={() => setShowCreateTierModal(false)}
          onSubmit={createTier}
        />
      )}
    </div>
  );
}

// Create Tier Modal Component
function CreateTierModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: Omit<SubscriptionTier, "id" | "subscriberCount">) => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    currency: "USD",
    interval: "monthly" as "monthly" | "yearly",
    features: [""],
    isActive: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      features: formData.features.filter((f) => f.trim() !== ""),
    });
  };

  const addFeature = () => {
    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, ""],
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.map((f, i) => (i === index ? value : f)),
    }));
  };

  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            Create Subscription Tier
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tier Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Premium Access"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Describe what this tier includes..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    price: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Billing Interval
              </label>
              <select
                value={formData.interval}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    interval: e.target.value as any,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Features
            </label>
            <div className="space-y-2">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex space-x-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter a feature..."
                  />
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addFeature}
                className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-300 hover:text-purple-600 transition-colors"
              >
                + Add Feature
              </button>
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Create Tier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MonetizationPage() {
  return (
    <AuthGuard>
      <MonetizationPageContent />
    </AuthGuard>
  );
}
