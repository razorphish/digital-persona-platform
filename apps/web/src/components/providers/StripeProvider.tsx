"use client";

import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Initialize Stripe with public key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface StripeProviderProps {
  children: React.ReactNode;
  clientSecret?: string;
}

export default function StripeProvider({ children, clientSecret }: StripeProviderProps) {
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#4f46e5', // indigo-600
        colorBackground: '#ffffff',
        colorText: '#1f2937', // gray-800
        colorDanger: '#ef4444', // red-500
        fontFamily: '"Inter", system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px'
      },
      rules: {
        '.Input': {
          borderColor: '#d1d5db', // gray-300
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
        },
        '.Input:focus': {
          borderColor: '#4f46e5', // indigo-600
          boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.1)'
        },
        '.Label': {
          color: '#374151', // gray-700
          fontWeight: '500'
        }
      }
    }
  };

  return (
    <Elements stripe={stripePromise} options={clientSecret ? options : undefined}>
      {children}
    </Elements>
  );
}