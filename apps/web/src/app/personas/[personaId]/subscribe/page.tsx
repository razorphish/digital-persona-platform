"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import StripeProvider from '@/components/providers/StripeProvider';
import SubscriptionCheckout from '@/components/payment/SubscriptionCheckout';

interface SubscriptionTier {
  id: string;
  name: 'basic' | 'average' | 'advanced';
  displayName: string;
  price: number;
  features: string[];
  messageLimit: number;
  priority: 'low' | 'medium' | 'high';
  responseTime: string;
}

interface TimeBasedPricing {
  enabled: boolean;
  pricePerHour: number;
  minimumMinutes: number;
}

export default function PersonaSubscribePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const personaId = params.personaId as string;

  // State
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [isTimeBasedSelected, setIsTimeBasedSelected] = useState(false);
  const [timeBasedMinutes, setTimeBasedMinutes] = useState(60);
  const [showCheckout, setShowCheckout] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // tRPC queries
  const { data: persona, isLoading: personaLoading } = trpc.personas.getPersonaById.useQuery(
    { personaId },
    { enabled: !!personaId }
  );

  const { data: monetization, isLoading: monetizationLoading } = trpc.personaMonetization.getPersonaMonetization.useQuery(
    { personaId },
    { enabled: !!personaId }
  );

  const { data: existingSubscription } = trpc.creatorMonetization.getUserSubscription.useQuery(
    { personaId },
    { enabled: !!personaId && !!isAuthenticated }
  );

  // Mutations
  const createPaymentIntent = trpc.creatorMonetization.createPaymentIntent.useMutation();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
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
      const result = await createPaymentIntent.mutateAsync({
        personaId,
        subscriptionTier: selectedTier || undefined,
        timeBasedMinutes: isTimeBasedSelected ? timeBasedMinutes : undefined,
        paymentType: isTimeBasedSelected ? 'time_based' : 'subscription'
      });

      if (result.success && result.clientSecret) {
        setClientSecret(result.clientSecret);
        setShowCheckout(true);
      }
    } catch (error) {
      console.error('Failed to create payment intent:', error);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading persona details...</p>
        </div>
      </div>
    );
  }

  if (!persona || !monetization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Persona Not Found</h1>
          <p className="text-gray-600 mb-6">This persona doesn't exist or isn't available for subscription.</p>
          <button
            onClick={() => router.push('/personas')}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Browse Personas
          </button>
        </div>
      </div>
    );
  }

  if (existingSubscription?.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Already Subscribed!</h2>
            <p className="text-gray-600 mb-6">
              You're already subscribed to {persona.name}. Start chatting now!
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/chat?personaId=${personaId}`)}
                className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Start Chatting
              </button>
              <button
                onClick={() => router.push('/account/subscriptions')}
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
                <svg className="h-10 w-10 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscribe to {persona.name}</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {persona.description || "Start meaningful conversations and build a connection with this digital persona."}
          </p>
        </div>

        {/* Creator Info */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                <svg className="h-6 w-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Created by {persona.creatorName || 'Anonymous Creator'}</h3>
              <p className="text-sm text-gray-500">
                ✅ Verified Creator • 97% of your payment goes directly to the creator
              </p>
            </div>
          </div>
        </div>

        {/* Subscription Tiers */}
        {monetization.subscriptionTiers && monetization.subscriptionTiers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Choose Your Subscription Tier</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {monetization.subscriptionTiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`relative bg-white border-2 rounded-lg p-6 cursor-pointer transition-all ${
                    selectedTier === tier.id
                      ? 'border-indigo-600 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleTierSelect(tier.id)}
                >
                  {tier.name === 'advanced' && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 capitalize mb-2">{tier.displayName}</h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900">${tier.price}</span>
                      <span className="text-gray-500 ml-1">/month</span>
                    </div>
                    
                    <ul className="space-y-3 mb-6">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <svg className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <div className="text-xs text-gray-500 space-y-1">
                      <p>• {tier.messageLimit === -1 ? 'Unlimited' : tier.messageLimit} messages/month</p>
                      <p>• {tier.priority.charAt(0).toUpperCase() + tier.priority.slice(1)} priority</p>
                      <p>• {tier.responseTime} response time</p>
                    </div>
                  </div>
                  
                  {selectedTier === tier.id && (
                    <div className="absolute top-4 right-4">
                      <div className="h-6 w-6 bg-indigo-600 rounded-full flex items-center justify-center">
                        <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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
        {monetization.timeBasedPricing?.enabled && (
          <div className="mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="border-t border-gray-300 flex-grow"></div>
              <span className="px-4 text-gray-500 font-medium">OR</span>
              <div className="border-t border-gray-300 flex-grow"></div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Pay Per Interaction</h2>
            
            <div
              className={`bg-white border-2 rounded-lg p-6 cursor-pointer transition-all max-w-md mx-auto ${
                isTimeBasedSelected
                  ? 'border-indigo-600 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={handleTimeBasedSelect}
            >
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Time-Based Interaction</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">
                    ${monetization.timeBasedPricing.pricePerHour}
                  </span>
                  <span className="text-gray-500 ml-1">/hour</span>
                </div>
                
                {isTimeBasedSelected && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Interaction Duration
                    </label>
                    <select
                      value={timeBasedMinutes}
                      onChange={(e) => setTimeBasedMinutes(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value={60}>1 hour - ${monetization.timeBasedPricing.pricePerHour}</option>
                      <option value={30}>30 minutes - ${(monetization.timeBasedPricing.pricePerHour / 2).toFixed(2)}</option>
                      <option value={15}>15 minutes - ${(monetization.timeBasedPricing.pricePerHour / 4).toFixed(2)}</option>
                    </select>
                  </div>
                )}
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• Pay only for what you use</p>
                  <p>• Premium 1-on-1 interaction time</p>
                  <p>• Minimum {monetization.timeBasedPricing.minimumMinutes} minutes</p>
                  <p>• No recurring charges</p>
                </div>
              </div>
              
              {isTimeBasedSelected && (
                <div className="absolute top-4 right-4">
                  <div className="h-6 w-6 bg-indigo-600 rounded-full flex items-center justify-center">
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="text-center">
          <button
            onClick={handleSubscribe}
            disabled={!selectedTier && !isTimeBasedSelected}
            className="bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {isTimeBasedSelected 
              ? `Pay $${((monetization.timeBasedPricing?.pricePerHour || 0) * (timeBasedMinutes / 60)).toFixed(2)} for ${timeBasedMinutes} minutes`
              : selectedTier 
                ? `Subscribe for $${monetization.subscriptionTiers?.find(t => t.id === selectedTier)?.price || 0}/month`
                : 'Select a Plan to Continue'
            }
          </button>
          
          <div className="text-sm text-gray-500 max-w-md mx-auto">
            <p>• Secure payment powered by Stripe</p>
            <p>• Cancel anytime with no hidden fees</p>
            <p>• 97% of your payment goes directly to the creator</p>
          </div>
          
          <button
            onClick={() => router.back()}
            className="mt-4 text-gray-500 hover:text-gray-700 font-medium"
          >
            ← Back to Persona
          </button>
        </div>
      </div>
    </div>
  );
}