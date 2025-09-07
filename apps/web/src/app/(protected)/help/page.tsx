"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";

export default function HelpPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
          <p className="mt-2 text-gray-600">
            Get help with your digital persona platform experience
          </p>
        </div>

        {/* Quick Help Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Getting Started */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-blue-600 text-xl">🚀</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Getting Started</h2>
            </div>
            <ul className="space-y-2 text-gray-600">
              <li>• Create your first digital persona</li>
              <li>• Set up your profile and preferences</li>
              <li>• Explore the social features</li>
              <li>• Learn about monetization options</li>
            </ul>
          </div>

          {/* Account & Billing */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-green-600 text-xl">💳</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Account & Billing</h2>
            </div>
            <ul className="space-y-2 text-gray-600">
              <li>• Manage your subscription</li>
              <li>• Update payment methods</li>
              <li>• View billing history</li>
              <li>• Cancel or modify plans</li>
            </ul>
          </div>

          {/* Creator Tools */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-purple-600 text-xl">🎨</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Creator Tools</h2>
            </div>
            <ul className="space-y-2 text-gray-600">
              <li>• Creator dashboard overview</li>
              <li>• Analytics and insights</li>
              <li>• Content moderation</li>
              <li>• Safety and verification</li>
            </ul>
          </div>

          {/* Privacy & Safety */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-red-600 text-xl">🔒</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Privacy & Safety</h2>
            </div>
            <ul className="space-y-2 text-gray-600">
              <li>• Privacy settings and controls</li>
              <li>• Content filtering options</li>
              <li>• Safety guidelines</li>
              <li>• Report inappropriate content</li>
            </ul>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                How do I create my first digital persona?
              </h3>
              <p className="text-gray-600">
                Navigate to the Personas section and click "Create New Persona". Follow the guided setup process to define your persona's characteristics, personality, and capabilities.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Can I monetize my personas?
              </h3>
              <p className="text-gray-600">
                Yes! Visit the Creator Dashboard to set up monetization options, including subscription plans, pay-per-interaction models, and premium features.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                How do I manage my privacy settings?
              </h3>
              <p className="text-gray-600">
                Go to the Privacy section in your account settings to control who can interact with your personas, what information is shared, and set up content filters.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                What if I need technical support?
              </h3>
              <p className="text-gray-600">
                For technical issues, please contact our support team through the contact form below. We typically respond within 24 hours.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Support</h2>
          <p className="text-gray-600 mb-6">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 text-xl">📧</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Email Support</h3>
              <p className="text-sm text-gray-600">support@digitalpersona.com</p>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 text-xl">💬</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Live Chat</h3>
              <p className="text-sm text-gray-600">Available 9 AM - 6 PM EST</p>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 text-xl">📚</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Documentation</h3>
              <p className="text-sm text-gray-600">Comprehensive guides</p>
            </div>
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
