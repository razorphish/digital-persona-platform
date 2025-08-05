"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import StripeProvider from "@/components/providers/StripeProvider";
import SubscriptionCheckout from "@/components/payment/SubscriptionCheckout";

interface SubscriptionTier {
  id: string;
  name: "basic" | "average" | "advanced";
  displayName: string;
  price: number;
  features: string[];
  messageLimit: number;
  priority: "low" | "medium" | "high";
  responseTime: string;
}

interface TimeBasedPricing {
  enabled: boolean;
  pricePerHour: number;
  minimumMinutes: number;
}

interface SubscribePageClientProps {
  personaId: string;
}

export default function SubscribePageClient({ personaId }: SubscribePageClientProps) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  // State
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [isTimeBasedSelected, setIsTimeBasedSelected] = useState(false);
  const [timeBasedMinutes, setTimeBasedMinutes] = useState(60);
  const [showCheckout, setShowCheckout] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Mock persona data since backend route doesn't exist yet
  const persona = {
    id: personaId,
    name: "Sample Persona",
    description: "This is a sample persona description",
    creatorName: "Creator Name",
    avatarUrl: null,
  };
  const personaLoading = false;

  const { data: monetization, isLoading: monetizationLoading } =
    trpc.personaMonetization.getMonetizationSettings.useQuery(
      { personaId },
      { enabled: !!personaId }
    );

  const { data: existingSubscription } =
    trpc.creatorMonetization.getUserSubscription.useQuery(
      { personaId },
      { enabled: !!personaId && !!isAuthenticated }
    );

  // Mutations
  const createPaymentIntent =
    trpc.creatorMonetization.createPaymentIntent.useMutation();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
  }, [isAuthenticated, router]);

  const handleTierSelect = (tierId: string) => {
    setSelectedTier(tierId);
    setIsTimeBasedSelected(false);
  };

  const handleTimeBasedSelect = () => {
    setIsTimeBasedSelected(true);
    setSelectedTier(null);
  };

  const handleSubscribe = async () => {
    if (!selectedTier && !isTimeBasedSelected) return;

    try {
      // Find the tier name from the selected tier ID
      const selectedTierName = selectedTier
        ? monetization.subscriptionTiers?.find((t) => t.id === selectedTier)
            ?.name
        : undefined;

      const result = await createPaymentIntent.mutateAsync({
        personaId,
        subscriptionTier: selectedTierName,
        timeBasedMinutes: isTimeBasedSelected ? timeBasedMinutes : undefined,
        paymentType: isTimeBasedSelected ? "time_based" : "subscription",
      });

      if (result.success && result.clientSecret) {
        setClientSecret(result.clientSecret);
        setShowCheckout(true);
      }
    } catch (error) {
      console.error("Failed to create payment intent:", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (personaLoading || monetizationLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading persona details...</p>
        </div>
      </div>
    );
  }

  if (!persona) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Persona Not Found
          </h1>
          <p className="text-gray-600 mb-8">
            The persona you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push("/personas")}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Browse Personas
          </button>
        </div>
      </div>
    );
  }

  // Check if user already has an active subscription
  if (existingSubscription && existingSubscription.isActive) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="h-8 w-8 text-green-600"
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
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              You're Already Subscribed!
            </h1>
            <p className="text-gray-600 mb-8">
              You have an active {existingSubscription.subscriptionTier}{" "}
              subscription to {persona.name}.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/chat?personaId=${personaId}`)}
                className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Start Chatting
              </button>
              <button
                onClick={() => router.push("/account/subscriptions")}
                className="w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Manage Subscriptions
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showCheckout && clientSecret) {
    return (
      <StripeProvider clientSecret={clientSecret}>
        <SubscriptionCheckout
          persona={persona}
          selectedTier={selectedTier}
          timeBasedMinutes={isTimeBasedSelected ? timeBasedMinutes : undefined}
          isTimeBasedSelected={isTimeBasedSelected}
          onSuccess={() => {
            router.push(`/chat?personaId=${personaId}`);
          }}
          onCancel={() => {
            setShowCheckout(false);
            setClientSecret(null);
          }}
        />
      </StripeProvider>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            {persona.avatarUrl ? (
              <img
                src={persona.avatarUrl}
                alt={persona.name}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-indigo-600">
                  {persona.name.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Subscribe to {persona.name}
          </h1>
          <p className="mt-2 text-gray-600">{persona.description}</p>
          <p className="mt-1 text-sm text-gray-500">
            by {persona.creatorName}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Subscription Tiers */}
          {monetization?.subscriptionTiers &&
            monetization.subscriptionTiers.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  Choose Your Subscription Tier
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {monetization.subscriptionTiers.map((tier) => (
                    <div
                      key={tier.id}
                      className={`relative bg-white border-2 rounded-lg p-6 cursor-pointer transition-all ${
                        selectedTier === tier.id
                          ? "border-indigo-600 shadow-lg"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handleTierSelect(tier.id)}
                    >
                      {tier.name === "advanced" && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Most Popular
                          </span>
                        </div>
                      )}
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {tier.displayName}
                        </h3>
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-gray-900">
                            ${tier.price}
                          </span>
                          <span className="text-gray-600">/month</span>
                        </div>
                        <ul className="space-y-2 text-sm text-gray-600">
                          {tier.features.map((feature, index) => (
                            <li key={index} className="flex items-center">
                              <svg
                                className="h-4 w-4 text-green-500 mr-2"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {selectedTier === tier.id && (
                        <div className="absolute inset-0 bg-indigo-50 bg-opacity-50 rounded-lg flex items-center justify-center">
                          <div className="bg-indigo-600 text-white rounded-full p-2">
                            <svg
                              className="h-6 w-6"
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
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Time-Based Pricing */}
          {monetization?.timeBasedPricing?.enabled && (
            <div className="mb-8">
              <div className="flex items-center justify-center mb-6">
                <div className="border-t border-gray-300 flex-grow"></div>
                <span className="bg-gray-50 px-4 text-sm text-gray-500 font-medium">
                  OR
                </span>
                <div className="border-t border-gray-300 flex-grow"></div>
              </div>

              <div
                className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                  isTimeBasedSelected
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={handleTimeBasedSelect}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Pay Per Session
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Perfect for one-time conversations or trying out the
                      persona
                    </p>
                    <div className="mb-4">
                      <span className="text-2xl font-bold text-gray-900">
                        ${monetization.timeBasedPricing.pricePerHour}
                      </span>
                      <span className="text-gray-600">/hour</span>
                    </div>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Premium 1-on-1 interaction time</li>
                      <li>
                        • Minimum {monetization.timeBasedPricing.minimumMinutes}{" "}
                        minutes
                      </li>
                      <li>• No recurring charges</li>
                      <li>• Perfect for specific conversations</li>
                    </ul>
                  </div>
                  {isTimeBasedSelected && (
                    <div className="ml-4">
                      <div className="bg-indigo-600 text-white rounded-full p-2">
                        <svg
                          className="h-6 w-6"
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
                    </div>
                  )}
                </div>

                {isTimeBasedSelected && (
                  <div className="mt-6 pt-6 border-t border-indigo-200">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Session Duration
                    </label>
                    <div className="flex items-center space-x-4">
                      <select
                        value={timeBasedMinutes}
                        onChange={(e) =>
                          setTimeBasedMinutes(parseInt(e.target.value))
                        }
                        className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={120}>2 hours</option>
                        <option value={180}>3 hours</option>
                      </select>
                      <span className="text-sm text-gray-600">
                        Total:{" "}
                        <span className="font-semibold">
                          $
                          {(
                            (monetization.timeBasedPricing.pricePerHour / 60) *
                            timeBasedMinutes
                          ).toFixed(2)}
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Subscribe Button */}
          <div className="text-center">
            <button
              onClick={handleSubscribe}
              disabled={!selectedTier && !isTimeBasedSelected}
              className={`w-full max-w-md px-8 py-4 rounded-lg font-semibold text-lg transition-colors ${
                selectedTier || isTimeBasedSelected
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isTimeBasedSelected
                ? `Pay $${(
                    (monetization?.timeBasedPricing?.pricePerHour || 0) *
                    (timeBasedMinutes / 60)
                  ).toFixed(2)} for ${timeBasedMinutes} minutes`
                : selectedTier
                ? `Subscribe for $${
                    monetization?.subscriptionTiers?.find(
                      (t) => t.id === selectedTier
                    )?.price || 0
                  }/month`
                : "Select a Plan to Continue"}
            </button>

            <div className="text-sm text-gray-500 max-w-md mx-auto mt-4">
              <p>• Secure payment powered by Stripe</p>
              <p>• Cancel anytime with no hidden fees</p>
              <p>• 97% of your payment goes directly to the creator</p>
            </div>

            <button
              onClick={() => router.push("/personas")}
              className="mt-6 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
            >
              ← Back to Browse Personas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}