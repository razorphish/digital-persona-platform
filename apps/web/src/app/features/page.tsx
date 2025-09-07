"use client";

import React from "react";
import Link from "next/link";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Platform Features
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the powerful tools and features that make Digital Persona Platform 
              the best place to create, share, and monetize your digital presence.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Core Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Core Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Persona Creation */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-blue-600 text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Persona Creation</h3>
              <p className="text-gray-600 mb-4">
                Build intelligent digital personas that reflect your knowledge, personality, 
                and expertise using advanced AI technology.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Custom personality traits</li>
                <li>• Knowledge base integration</li>
                <li>• Conversation style training</li>
                <li>• Multi-language support</li>
              </ul>
            </div>

            {/* Social Features */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-green-600 text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Social Networking</h3>
              <p className="text-gray-600 mb-4">
                Connect with other creators, discover new personas, and build meaningful 
                relationships in our vibrant community.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Follow and subscribe to personas</li>
                <li>• Interactive conversations</li>
                <li>• Community discovery</li>
                <li>• Social feed and recommendations</li>
              </ul>
            </div>

            {/* Monetization */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-purple-600 text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Monetization Tools</h3>
              <p className="text-gray-600 mb-4">
                Turn your expertise into income with flexible monetization options 
                and transparent payment processing.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Subscription-based access</li>
                <li>• Pay-per-interaction models</li>
                <li>• Premium content features</li>
                <li>• Revenue analytics and insights</li>
              </ul>
            </div>

            {/* Analytics */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-orange-600 text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Advanced Analytics</h3>
              <p className="text-gray-600 mb-4">
                Track your persona's performance, user engagement, and revenue with 
                comprehensive analytics and insights.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Interaction metrics</li>
                <li>• User engagement tracking</li>
                <li>• Revenue reporting</li>
                <li>• Performance optimization tips</li>
              </ul>
            </div>

            {/* Safety & Privacy */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-red-600 text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Safety & Privacy</h3>
              <p className="text-gray-600 mb-4">
                Enterprise-grade security and privacy controls to protect your data 
                and ensure safe interactions.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• End-to-end encryption</li>
                <li>• Content moderation tools</li>
                <li>• Privacy controls</li>
                <li>• Safety reporting system</li>
              </ul>
            </div>

            {/* Creator Tools */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-indigo-600 text-2xl">🎨</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Creator Dashboard</h3>
              <p className="text-gray-600 mb-4">
                Comprehensive tools for managing your personas, content, and business 
                operations in one place.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Persona management</li>
                <li>• Content scheduling</li>
                <li>• Audience insights</li>
                <li>• Business tools</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Advanced Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Advanced Features</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">AI Learning & Adaptation</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1">
                    <span className="text-blue-600 text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Continuous Learning</h4>
                    <p className="text-gray-600 text-sm">Your persona learns from every interaction to become more helpful and accurate.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1">
                    <span className="text-blue-600 text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Context Awareness</h4>
                    <p className="text-gray-600 text-sm">Advanced understanding of conversation context and user intent.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1">
                    <span className="text-blue-600 text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Multi-Modal Interactions</h4>
                    <p className="text-gray-600 text-sm">Support for text, voice, and visual interactions with your persona.</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Business & Growth Tools</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-1">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Automated Marketing</h4>
                    <p className="text-gray-600 text-sm">Built-in tools to promote your persona and grow your audience.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-1">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">API Integration</h4>
                    <p className="text-gray-600 text-sm">Connect your persona to external services and platforms.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-1">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">White-Label Solutions</h4>
                    <p className="text-gray-600 text-sm">Custom branding and deployment options for businesses.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Feature Tiers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Tier */}
            <div className="bg-white rounded-xl shadow-sm border p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
              <p className="text-gray-600 mb-6">Perfect for getting started</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-600">1 Digital Persona</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-600">Basic AI capabilities</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-600">Community access</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-600">Basic analytics</span>
                </li>
              </ul>
              <Link 
                href="/auth/register" 
                className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold text-center block hover:bg-gray-800 transition-colors"
              >
                Get Started Free
              </Link>
            </div>

            {/* Pro Tier */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-blue-500 p-8 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
              <p className="text-gray-600 mb-6">For serious creators</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-600">Up to 5 Digital Personas</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-600">Advanced AI features</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-600">Monetization tools</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-600">Advanced analytics</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-600">Priority support</span>
                </li>
              </ul>
              <Link 
                href="/auth/register" 
                className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold text-center block hover:bg-blue-600 transition-colors"
              >
                Start Pro Trial
              </Link>
            </div>

            {/* Enterprise Tier */}
            <div className="bg-white rounded-xl shadow-sm border p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
              <p className="text-gray-600 mb-6">For businesses and organizations</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-600">Unlimited Personas</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-600">Custom AI models</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-600">White-label options</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-600">API access</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-600">Dedicated support</span>
                </li>
              </ul>
              <Link 
                href="/contact" 
                className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold text-center block hover:bg-gray-800 transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Explore Our Features?</h2>
          <p className="text-xl mb-8 opacity-90">
            Start building your digital persona today and experience the power of AI-driven interactions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth/register" 
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Start Building
            </Link>
            <Link 
              href="/help" 
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Get Help
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
