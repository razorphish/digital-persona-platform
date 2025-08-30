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

  // tRPC queries for real data
  const { data: personas } = trpc.personas.list.useQuery();
  const { data: mainPersona } = trpc.personas.getMain.useQuery();

  // Get monetization settings for selected persona
  const { 
    data: monetizationSettings, 
    isLoading: settingsLoading, 
    error: settingsError,
    refetch: refetchSettings 
  } = trpc.personaMonetization.getMonetizationSettings.useQuery(
    { personaId: selectedPersonaId },
    { enabled: !!selectedPersonaId }
  );

  // Get revenue metrics for selected persona
  const { 
    data: revenueMetrics, 
    isLoading: metricsLoading, 
    error: metricsError 
  } = trpc.personaMonetization.getRevenueMetrics.useQuery(
    { personaId: selectedPersonaId },
    { enabled: !!selectedPersonaId }
  );

  // Get earnings summary
  const { 
    data: earningsSummary, 
    isLoading: earningsLoading, 
    error: earningsError 
  } = trpc.personaMonetization.getEarningsSummary.useQuery(
    { personaId: selectedPersonaId },
    { enabled: !!selectedPersonaId }
  );

  // Update monetization settings mutation
  const updateSettingsMutation = trpc.personaMonetization.updateMonetizationSettings.useMutation({
    onSuccess: () => {
      refetchSettings();
      setIsDirty(false);
    },
    onError: (error) => {
      console.error("Error updating settings:", error);
    },
  });

  // Initialize with main persona
  useEffect(() => {
    if (mainPersona && !selectedPersonaId) {
      setSelectedPersonaId(mainPersona.id);
    }
  }, [mainPersona, selectedPersonaId]);

  const handlePersonaChange = (personaId: string) => {
    setSelectedPersonaId(personaId);
    setIsDirty(false);
  };

  const updateTier = (tierId: string, updates: Partial<SubscriptionTier>) => {
    if (!monetizationSettings) return;

    const updatedTiers = monetizationSettings.subscriptionTiers.map((tier) =>
      tier.id === tierId ? { ...tier, ...updates } : tier
    );

    updateSettingsMutation.mutate({
      personaId: selectedPersonaId,
      settings: {
        subscriptionTiers: updatedTiers,
      },
    });
  };

  const deleteTier = (tierId: string) => {
    if (!monetizationSettings) return;

    const updatedTiers = monetizationSettings.subscriptionTiers.filter(
      (tier) => tier.id !== tierId
    );

    updateSettingsMutation.mutate({
      personaId: selectedPersonaId,
      settings: {
        subscriptionTiers: updatedTiers,
      },
    });
  };

  const createTier = (
    tierData: Omit<SubscriptionTier, "id" | "subscriberCount">
  ) => {
    if (!monetizationSettings) return;

    const newTier: SubscriptionTier = {
      ...tierData,
      id: Date.now().toString(),
      subscriberCount: 0,
    };

    const updatedTiers = [...monetizationSettings.subscriptionTiers, newTier];

    updateSettingsMutation.mutate({
      personaId: selectedPersonaId,
      settings: {
        subscriptionTiers: updatedTiers,
      },
    });
  };

  const updatePaymentMethods = (methods: MonetizationSettings["paymentMethods"]) => {
    updateSettingsMutation.mutate({
      personaId: selectedPersonaId,
      settings: {
        paymentMethods: methods,
      },
    });
  };

  const updateTaxSettings = (taxSettings: MonetizationSettings["taxSettings"]) => {
    updateSettingsMutation.mutate({
      personaId: selectedPersonaId,
      settings: {
        taxSettings: taxSettings,
      },
    });
  };

  const updatePayoutSettings = (payoutSettings: MonetizationSettings["payoutSettings"]) => {
    updateSettingsMutation.mutate({
      personaId: selectedPersonaId,
      settings: {
        payoutSettings: payoutSettings,
      },
    });
  };

  const toggleMonetization = (enabled: boolean) => {
    updateSettingsMutation.mutate({
      personaId: selectedPersonaId,
      settings: {
        isMonetizationEnabled: enabled,
      },
    });
  };

  // Show loading state
  if (settingsLoading || metricsLoading || earningsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-32 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (settingsError || metricsError || earningsError) {
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
              Unable to Load Monetization Data
            </h3>
            <p className="text-red-600 mb-4">
              There was an error loading your monetization settings. Please try refreshing the page.
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

  // Show empty state if no persona selected
  if (!selectedPersonaId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <svg
                className="h-12 w-12 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-blue-800 mb-2">
              No Persona Selected
            </h3>
            <p className="text-blue-600 mb-4">
              Please select a persona to configure monetization settings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">
                Monetization
              </h1>
              
              {/* Persona Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Persona:</span>
                <select
                  value={selectedPersonaId}
                  onChange={(e) => handlePersonaChange(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {personas?.map((persona) => (
                    <option key={persona.id} value={persona.id}>
                      {persona.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => toggleMonetization(!monetizationSettings?.isMonetizationEnabled)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  monetizationSettings?.isMonetizationEnabled
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-600 text-white hover:bg-gray-700"
                }`}
              >
                {monetizationSettings?.isMonetizationEnabled ? "Enabled" : "Disabled"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: "overview", name: "Overview", icon: "📊" },
              { id: "tiers", name: "Subscription Tiers", icon: "💰" },
              { id: "subscribers", name: "Subscribers", icon: "👥" },
              { id: "analytics", name: "Analytics", icon: "📈" },
              { id: "settings", name: "Settings", icon: "⚙️" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Revenue Overview */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Overview</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    ${revenueMetrics?.totalRevenue?.toFixed(2) || "0.00"}
                  </div>
                  <div className="text-sm text-gray-500">Total Revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    ${revenueMetrics?.monthlyRevenue?.toFixed(2) || "0.00"}
                  </div>
                  <div className="text-sm text-gray-500">Monthly Revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {revenueMetrics?.totalSubscribers || 0}
                  </div>
                  <div className="text-sm text-gray-500">Total Subscribers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {revenueMetrics?.activeSubscribers || 0}
                  </div>
                  <div className="text-sm text-gray-500">Active Subscribers</div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500">Churn Rate</div>
                  <div className="text-lg font-medium text-gray-900">
                    {revenueMetrics?.churnRate?.toFixed(1) || "0.0"}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Avg Revenue/User</div>
                  <div className="text-lg font-medium text-gray-900">
                    ${revenueMetrics?.averageRevenuePerUser?.toFixed(2) || "0.00"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Revenue Growth</div>
                  <div className="text-lg font-medium text-gray-900">
                    {revenueMetrics?.revenueGrowth?.toFixed(1) || "0.0"}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tiers" && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Subscription Tiers</h3>
              <button
                onClick={() => setShowCreateTierModal(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create Tier
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {monetizationSettings?.subscriptionTiers?.map((tier) => (
                <div key={tier.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900">{tier.name}</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-gray-900">
                        ${tier.price}
                      </span>
                      <span className="text-sm text-gray-500">/{tier.interval}</span>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{tier.description}</p>
                  <ul className="space-y-2 mb-4">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {tier.subscriberCount} subscribers
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateTier(tier.id, { isActive: !tier.isActive })}
                        className={`px-3 py-1 rounded text-sm ${
                          tier.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {tier.isActive ? "Active" : "Inactive"}
                      </button>
                      <button
                        onClick={() => deleteTier(tier.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "subscribers" && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Subscriber Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {revenueMetrics?.totalSubscribers || 0}
                </div>
                <div className="text-sm text-gray-500">Total Subscribers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {revenueMetrics?.activeSubscribers || 0}
                </div>
                <div className="text-sm text-gray-500">Active Subscribers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {revenueMetrics?.churnRate?.toFixed(1) || "0.0"}%
                </div>
                <div className="text-sm text-gray-500">Churn Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  ${revenueMetrics?.averageRevenuePerUser?.toFixed(2) || "0.00"}
                </div>
                <div className="text-sm text-gray-500">Avg Revenue/User</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Analytics</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Revenue Trends</h4>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Revenue</span>
                    <span className="font-medium">${revenueMetrics?.totalRevenue?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Revenue</span>
                    <span className="font-medium">${revenueMetrics?.monthlyRevenue?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Revenue Growth</span>
                    <span className="font-medium">{revenueMetrics?.revenueGrowth?.toFixed(1) || "0.0"}%</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Performance Metrics</h4>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Top Tier</span>
                    <span className="font-medium">{revenueMetrics?.topTier || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Churn Rate</span>
                    <span className="font-medium">{revenueMetrics?.churnRate?.toFixed(1) || "0.0"}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Revenue/User</span>
                    <span className="font-medium">${revenueMetrics?.averageRevenuePerUser?.toFixed(2) || "0.00"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            {/* Payment Methods */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h3>
              <div className="space-y-4">
                {Object.entries(monetizationSettings?.paymentMethods || {}).map(([method, enabled]) => (
                  <div key={method} className="flex items-center justify-between">
                    <span className="text-gray-700 capitalize">{method}</span>
                    <button
                      onClick={() => updatePaymentMethods({
                        ...monetizationSettings?.paymentMethods,
                        [method]: !enabled
                      })}
                      className={`px-3 py-1 rounded text-sm ${
                        enabled
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {enabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Tax Settings */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tax Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    value={monetizationSettings?.taxSettings?.taxRate || 0}
                    onChange={(e) => updateTaxSettings({
                      ...monetizationSettings?.taxSettings,
                      taxRate: parseFloat(e.target.value)
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Region
                  </label>
                  <select
                    value={monetizationSettings?.taxSettings?.taxRegion || "US"}
                    onChange={(e) => updateTaxSettings({
                      ...monetizationSettings?.taxSettings,
                      taxRegion: e.target.value
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="US">United States</option>
                    <option value="EU">European Union</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={monetizationSettings?.taxSettings?.taxIncluded || false}
                    onChange={(e) => updateTaxSettings({
                      ...monetizationSettings?.taxSettings,
                      taxIncluded: e.target.checked
                    })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Tax included in price
                  </label>
                </div>
              </div>
            </div>

            {/* Payout Settings */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payout Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payout Method
                  </label>
                  <select
                    value={monetizationSettings?.payoutSettings?.method || "bank"}
                    onChange={(e) => updatePayoutSettings({
                      ...monetizationSettings?.payoutSettings,
                      method: e.target.value as "bank" | "paypal" | "crypto"
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="bank">Bank Transfer</option>
                    <option value="paypal">PayPal</option>
                    <option value="crypto">Cryptocurrency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payout Frequency
                  </label>
                  <select
                    value={monetizationSettings?.payoutSettings?.frequency || "monthly"}
                    onChange={(e) => updatePayoutSettings({
                      ...monetizationSettings?.payoutSettings,
                      frequency: e.target.value as "daily" | "weekly" | "monthly"
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Payout Amount
                  </label>
                  <input
                    type="number"
                    value={monetizationSettings?.payoutSettings?.minimumAmount || 50}
                    onChange={(e) => updatePayoutSettings({
                      ...monetizationSettings?.payoutSettings,
                      minimumAmount: parseFloat(e.target.value)
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
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
