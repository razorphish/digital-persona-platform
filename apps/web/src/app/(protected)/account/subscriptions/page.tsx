"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { AuthGuard } from "@/components/auth/AuthGuard";

interface Subscription {
  id: string;
  personaId: string;
  personaName: string;
  personaAvatarUrl?: string;
  subscriptionTier: string;
  amount: number;
  status: "active" | "canceled" | "past_due";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string;
}

function SubscriptionManagementContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  // tRPC queries
  // Mock subscriptions data since backend route doesn't exist yet
  const subscriptions: any[] = [];
  const isLoading = false;
  const refetch = () => {};
  // Mock payment methods data since backend route doesn't exist yet
  const paymentMethods: any[] = [];

  // Mock mutations since backend routes don't exist yet
  const cancelSubscription = {
    mutate: () => {},
    mutateAsync: async (params: any) => ({ success: true }),
    isLoading: false,
  };
  const reactivateSubscription = {
    mutate: () => {},
    mutateAsync: async (params: any) => ({ success: true }),
    isLoading: false,
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    setCancelingId(subscriptionId);
    try {
      const result = await cancelSubscription.mutateAsync({ subscriptionId });
      if (result.success) {
        refetch();
      }
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
    } finally {
      setCancelingId(null);
    }
  };

  const handleReactivateSubscription = async (subscriptionId: string) => {
    try {
      const result = await reactivateSubscription.mutateAsync({
        subscriptionId,
      });
      if (result.success) {
        refetch();
      }
    } catch (error) {
      console.error("Failed to reactivate subscription:", error);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string, cancelAtPeriodEnd: boolean) => {
    if (cancelAtPeriodEnd) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Ending Soon
        </span>
      );
    }

    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Active
          </span>
        );
      case "canceled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Canceled
          </span>
        );
      case "past_due":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Past Due
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your subscriptions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Subscription Management
              </h1>
              <p className="mt-2 text-gray-600">
                Manage your persona subscriptions and payment methods
              </p>
            </div>
            <button
              onClick={() => router.push("/personas")}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Browse Personas
            </button>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Active Subscriptions
          </h2>

          {!subscriptions || subscriptions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Active Subscriptions
              </h3>
              <p className="text-gray-600 mb-6">
                You don't have any active persona subscriptions yet. Start
                exploring and connecting with digital personas!
              </p>
              <button
                onClick={() => router.push("/personas")}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Browse Personas
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className="bg-white rounded-lg shadow-sm border p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Persona Avatar */}
                      <div className="flex-shrink-0">
                        {subscription.personaAvatarUrl ? (
                          <img
                            src={subscription.personaAvatarUrl}
                            alt={subscription.personaName}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                            <svg
                              className="h-6 w-6 text-indigo-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Subscription Details */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900">
                            {subscription.personaName}
                          </h3>
                          {getStatusBadge(
                            subscription.status,
                            subscription.cancelAtPeriodEnd
                          )}
                        </div>
                        <div className="mt-1 text-sm text-gray-600 space-y-1">
                          <p>
                            <span className="font-medium">
                              ${subscription.amount}/month
                            </span>{" "}
                            • {subscription.subscriptionTier} tier
                          </p>
                          <p>
                            Next billing:{" "}
                            {formatDate(subscription.currentPeriodEnd)}
                          </p>
                          {subscription.cancelAtPeriodEnd && (
                            <p className="text-yellow-600">
                              ⚠️ This subscription will end on{" "}
                              {formatDate(subscription.currentPeriodEnd)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 space-x-3">
                      <button
                        onClick={() =>
                          router.push(
                            `/persona-details?id=${subscription.personaId}`
                          )
                        }
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        View Profile
                      </button>

                      {subscription.status === "active" &&
                      !subscription.cancelAtPeriodEnd ? (
                        <button
                          onClick={() =>
                            handleCancelSubscription(subscription.id)
                          }
                          disabled={cancelingId === subscription.id}
                          className="border border-red-300 text-red-700 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          {cancelingId === subscription.id
                            ? "Canceling..."
                            : "Cancel"}
                        </button>
                      ) : subscription.cancelAtPeriodEnd ? (
                        <button
                          onClick={() =>
                            handleReactivateSubscription(subscription.id)
                          }
                          className="border border-green-300 text-green-700 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors"
                        >
                          Reactivate
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Payment Methods
            </h2>
            <button
              onClick={() => router.push("/account/payment-methods")}
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Manage Payment Methods →
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            {!paymentMethods || paymentMethods.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-600 mb-4">No payment methods on file</p>
                <button
                  onClick={() => router.push("/account/payment-methods")}
                  className="text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  Add Payment Method
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {paymentMethods.slice(0, 2).map((method, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-gray-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          •••• •••• •••• {method.last4}
                        </p>
                        <p className="text-xs text-gray-500">
                          {method.brand.toUpperCase()} • Expires{" "}
                          {method.expMonth}/{method.expYear}
                        </p>
                      </div>
                    </div>
                    {method.isDefault && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                  </div>
                ))}
                {paymentMethods.length > 2 && (
                  <p className="text-sm text-gray-500">
                    and {paymentMethods.length - 2} more...
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Billing History */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Billing History
            </h2>
            <button
              onClick={() => router.push("/account/billing-history")}
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              View All →
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-gray-600 text-center py-4">
              Billing history will appear here once you have active
              subscriptions.
            </p>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-gray-500 hover:text-gray-700 font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionManagementPage() {
  return (
    <AuthGuard>
      <SubscriptionManagementContent />
    </AuthGuard>
  );
}
