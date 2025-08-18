"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Metadata } from "next";

export default function SubscribePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [personaId, setPersonaId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get('personaId');
    setPersonaId(id);
    setIsLoading(false);
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subscription page...</p>
        </div>
      </div>
    );
  }

  if (!personaId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md w-full text-center bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Request</h1>
          <p className="text-gray-600 mb-6">
            No persona ID was provided. Please select a persona to subscribe to.
          </p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Subscribe to Persona
          </h1>
          
          <div className="mb-6">
            <p className="text-gray-600">
              Persona ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{personaId}</span>
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Basic Plan</h3>
              <div className="text-3xl font-bold text-indigo-600 mb-4">$9.99/month</div>
              <ul className="space-y-2 text-gray-600">
                <li>✓ 100 messages per month</li>
                <li>✓ Basic persona interactions</li>
                <li>✓ Email support</li>
              </ul>
              <button className="w-full mt-6 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
                Subscribe to Basic
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-6 border-indigo-500">
              <h3 className="text-xl font-semibold mb-4">Premium Plan</h3>
              <div className="text-3xl font-bold text-indigo-600 mb-4">$19.99/month</div>
              <ul className="space-y-2 text-gray-600">
                <li>✓ Unlimited messages</li>
                <li>✓ Advanced persona features</li>
                <li>✓ Priority support</li>
                <li>✓ Custom persona training</li>
              </ul>
              <button className="w-full mt-6 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
                Subscribe to Premium
              </button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => router.back()}
              className="text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              ← Back to Persona
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}