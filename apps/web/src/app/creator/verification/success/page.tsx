"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function VerificationSuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-6">
            <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🎉 Verification Submitted!
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-8">
            Your creator verification has been successfully submitted for review. 
            Our team will review your application and get back to you within 1-3 business days.
          </p>

          {/* What happens next */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">What happens next?</h2>
            <div className="text-left space-y-3 text-sm text-blue-800">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-200 flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-bold text-blue-700">1</span>
                </div>
                <p>Our verification team will review all your documents and information</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-200 flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-bold text-blue-700">2</span>
                </div>
                <p>We'll run facial recognition checks and verify your identity</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-200 flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-bold text-blue-700">3</span>
                </div>
                <p>You'll receive an email once verification is complete</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-200 flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-bold text-blue-700">4</span>
                </div>
                <p>Start monetizing your personas and earning 97% revenue share!</p>
              </div>
            </div>
          </div>

          {/* Revenue Information */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-green-900 mb-2">💰 Your Creator Benefits</h3>
            <div className="text-sm text-green-800 space-y-1">
              <p>• <strong>97% Revenue Share</strong> - You keep nearly all subscription income</p>
              <p>• <strong>Weekly Payouts</strong> - Receive payments every Friday</p>
              <p>• <strong>Multiple Pricing Tiers</strong> - Set your own subscription prices</p>
              <p>• <strong>Time-Based Billing</strong> - Charge premium rates for extended interactions</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Link
              href="/dashboard"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
            >
              Return to Dashboard
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </Link>

            <Link
              href="/personas"
              className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
            >
              Prepare Your Personas
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>

            <button
              onClick={() => router.push('/creator/verification')}
              className="w-full text-gray-500 hover:text-gray-700 font-medium py-2 transition-colors"
            >
              Check Verification Status
            </button>
          </div>

          {/* Contact Information */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Questions about verification? Contact our support team at{' '}
              <a href="mailto:support@hibiji.com" className="text-indigo-600 hover:text-indigo-500">
                support@hibiji.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}