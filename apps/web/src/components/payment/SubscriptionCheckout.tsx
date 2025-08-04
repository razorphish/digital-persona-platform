import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { trpc } from '@/lib/trpc';

interface SubscriptionCheckoutProps {
  persona: {
    id: string;
    name: string;
    avatarUrl?: string;
    description?: string;
  };
  selectedTier?: string | null;
  timeBasedMinutes?: number;
  isTimeBasedSelected: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function SubscriptionCheckout({
  persona,
  selectedTier,
  timeBasedMinutes,
  isTimeBasedSelected,
  onSuccess,
  onCancel
}: SubscriptionCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const confirmPayment = trpc.creatorMonetization.confirmPayment.useMutation();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required'
      });

      if (error) {
        setErrorMessage(error.message || 'Payment failed');
        setIsProcessing(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        // Confirm payment on our backend
        const result = await confirmPayment.mutateAsync({
          paymentIntentId: paymentIntent.id,
          personaId: persona.id
        });

        if (result.success) {
          onSuccess();
        } else {
          setErrorMessage('Payment confirmation failed');
        }
      }
    } catch (error) {
      setErrorMessage('Payment processing failed');
      console.error('Payment error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getSubscriptionSummary = () => {
    if (isTimeBasedSelected && timeBasedMinutes) {
      return {
        type: 'Time-based Interaction',
        duration: `${timeBasedMinutes} minutes`,
        description: 'One-time payment for premium interaction time'
      };
    } else if (selectedTier) {
      return {
        type: 'Monthly Subscription',
        duration: 'Recurring monthly',
        description: 'Full access to persona with monthly billing'
      };
    }
    return null;
  };

  const summary = getSubscriptionSummary();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Header */}
          <div className="px-6 py-8 border-b border-gray-200">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                {persona.avatarUrl ? (
                  <img
                    src={persona.avatarUrl}
                    alt={persona.name}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
                    <svg className="h-8 w-8 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Subscription</h1>
              <p className="text-gray-600">Subscribe to {persona.name}</p>
            </div>
          </div>

          {/* Subscription Summary */}
          {summary && (
            <div className="px-6 py-6 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium text-gray-900">{summary.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium text-gray-900">{summary.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Description:</span>
                  <span className="text-sm text-gray-700">{summary.description}</span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Form */}
          <div className="px-6 py-8">
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h2>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <PaymentElement />
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{errorMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Notice */}
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Secure Payment</h3>
                    <p className="mt-1 text-sm text-blue-700">
                      Your payment information is encrypted and processed securely by Stripe. 
                      We never store your payment details.
                    </p>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="mb-6 text-sm text-gray-600">
                <p>
                  By completing this purchase, you agree to our{' '}
                  <a href="/privacy" className="text-indigo-600 hover:text-indigo-500">Terms of Service</a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-indigo-600 hover:text-indigo-500">Privacy Policy</a>.
                  {!isTimeBasedSelected && ' Subscriptions can be cancelled anytime from your account settings.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isProcessing}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!stripe || isProcessing}
                  className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      Complete Payment
                      <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <div className="flex items-center justify-center text-sm text-gray-500">
              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Powered by Stripe • Industry-leading security
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}