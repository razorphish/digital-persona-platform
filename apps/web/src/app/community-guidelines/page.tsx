"use client";

import React from "react";

export default function CommunityGuidelinesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Community Guidelines
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our shared values and expectations for creating a safe, respectful, and inclusive community.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Introduction */}
        <div className="mb-12">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Welcome to Our Community</h2>
            <p className="text-gray-700 leading-relaxed">
              The Digital Persona Platform is built on the foundation of authentic connections, 
              mutual respect, and shared learning. These guidelines help ensure that everyone 
              can participate in a safe, welcoming environment where creativity and knowledge 
              can flourish.
            </p>
          </div>
        </div>

        {/* Core Principles */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Our Core Principles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 text-xl">🤝</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Respect & Kindness</h3>
              </div>
              <p className="text-gray-600">
                Treat all community members with respect, regardless of their background, 
                beliefs, or experience level. Kindness creates a foundation for meaningful connections.
              </p>
            </div>
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 text-xl">🎯</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Authenticity</h3>
              </div>
              <p className="text-gray-600">
                Be genuine in your interactions and representations. Authentic personas 
                and honest communication build trust and meaningful relationships.
              </p>
            </div>
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 text-xl">🌱</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Growth & Learning</h3>
              </div>
              <p className="text-gray-600">
                Embrace opportunities to learn and grow. Share knowledge generously and 
                be open to new perspectives and ideas.
              </p>
            </div>
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 text-xl">🛡️</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Safety First</h3>
              </div>
              <p className="text-gray-600">
                Prioritize the safety and well-being of all community members. 
                Report harmful behavior and help maintain a secure environment.
              </p>
            </div>
          </div>
        </div>

        {/* Do's and Don'ts */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Community Standards</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Do's */}
            <div>
              <h3 className="text-2xl font-semibold text-green-600 mb-6">✅ Do</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <span className="text-gray-700">Be respectful and constructive in all interactions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <span className="text-gray-700">Share accurate, helpful information</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <span className="text-gray-700">Give credit to original creators and sources</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <span className="text-gray-700">Help newcomers learn and grow</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <span className="text-gray-700">Report inappropriate behavior or content</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <span className="text-gray-700">Respect privacy and personal boundaries</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <span className="text-gray-700">Engage in meaningful, on-topic discussions</span>
                </li>
              </ul>
            </div>

            {/* Don'ts */}
            <div>
              <h3 className="text-2xl font-semibold text-red-600 mb-6">❌ Don't</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-red-500 mr-3 mt-1">✗</span>
                  <span className="text-gray-700">Harass, bully, or intimidate others</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-3 mt-1">✗</span>
                  <span className="text-gray-700">Share false, misleading, or harmful information</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-3 mt-1">✗</span>
                  <span className="text-gray-700">Use hate speech or discriminatory language</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-3 mt-1">✗</span>
                  <span className="text-gray-700">Spam, advertise, or promote unrelated content</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-3 mt-1">✗</span>
                  <span className="text-gray-700">Impersonate others or create fake personas</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-3 mt-1">✗</span>
                  <span className="text-gray-700">Share personal information without consent</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-3 mt-1">✗</span>
                  <span className="text-gray-700">Engage in illegal activities or encourage harm</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Content Guidelines */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Content Guidelines</h2>
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Appropriate Content</h3>
            <p className="text-gray-700 mb-4">
              All content shared on our platform should be:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Relevant to the community and topic of discussion</li>
              <li>Respectful and considerate of diverse perspectives</li>
              <li>Accurate and factually correct</li>
              <li>Original or properly attributed to its source</li>
              <li>Appropriate for a general audience</li>
            </ul>
          </div>
        </div>

        {/* Enforcement */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Enforcement & Reporting</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">How We Enforce Guidelines</h3>
              <ul className="space-y-3 text-gray-700">
                <li>• <strong>Warning:</strong> First-time minor violations receive a warning</li>
                <li>• <strong>Content Removal:</strong> Inappropriate content is removed immediately</li>
                <li>• <strong>Temporary Suspension:</strong> Repeated violations result in temporary restrictions</li>
                <li>• <strong>Permanent Ban:</strong> Severe or repeated violations lead to permanent removal</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">How to Report Issues</h3>
              <ul className="space-y-3 text-gray-700">
                <li>• Use the report button on any content or profile</li>
                <li>• Contact our moderation team directly</li>
                <li>• Provide specific details about the violation</li>
                <li>• Include relevant screenshots or evidence</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Appeals Process */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Appeals Process</h2>
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-700 mb-4">
              If you believe a moderation action was taken in error, you can appeal the decision:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Submit an appeal within 30 days of the action</li>
              <li>Provide a clear explanation of why you believe the action was incorrect</li>
              <li>Include any relevant evidence or context</li>
              <li>Our team will review your appeal within 7 business days</li>
              <li>You'll receive a written response with the final decision</li>
            </ol>
          </div>
        </div>

        {/* Contact */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions or Concerns?</h2>
          <p className="text-gray-600 mb-6">
            If you have questions about these guidelines or need to report a violation, 
            please don't hesitate to contact our community team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:community@digitalpersona.com" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Contact Community Team
            </a>
            <a 
              href="/help" 
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Visit Help Center
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
