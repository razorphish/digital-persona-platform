"use client";

import React from "react";

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Cookie Policy
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Learn about how Digital Persona Platform uses cookies and similar technologies 
              to enhance your experience and provide our services.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Last Updated */}
        <div className="mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">
              <strong>Last Updated:</strong> January 1, 2024
            </p>
          </div>
        </div>

        {/* Introduction */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are Cookies?</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Cookies are small text files that are placed on your computer or mobile device when you visit 
            our website. They are widely used to make websites work more efficiently and to provide 
            information to website owners.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Digital Persona Platform uses cookies and similar technologies to enhance your experience, 
            analyze usage patterns, and provide personalized content and services.
          </p>
        </div>

        {/* Types of Cookies */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Types of Cookies We Use</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 text-xl">🔧</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Essential Cookies</h3>
              </div>
              <p className="text-gray-600 mb-4">
                These cookies are necessary for the website to function properly and cannot be disabled.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Authentication and login status</li>
                <li>• Security and fraud prevention</li>
                <li>• Basic website functionality</li>
                <li>• User preferences and settings</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 text-xl">📊</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Analytics Cookies</h3>
              </div>
              <p className="text-gray-600 mb-4">
                These cookies help us understand how visitors interact with our website.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Page views and user behavior</li>
                <li>• Performance monitoring</li>
                <li>• Error tracking and debugging</li>
                <li>• Usage statistics</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 text-xl">🎯</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Functional Cookies</h3>
              </div>
              <p className="text-gray-600 mb-4">
                These cookies enable enhanced functionality and personalization.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Language preferences</li>
                <li>• Theme and display settings</li>
                <li>• Personalized content</li>
                <li>• User interface preferences</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 text-xl">📢</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Marketing Cookies</h3>
              </div>
              <p className="text-gray-600 mb-4">
                These cookies are used to deliver relevant advertisements and marketing content.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Ad targeting and personalization</li>
                <li>• Campaign performance tracking</li>
                <li>• Social media integration</li>
                <li>• Remarketing activities</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Cookie Details */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Specific Cookies We Use</h2>
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cookie Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">auth_token</td>
                    <td className="px-6 py-4 text-sm text-gray-500">User authentication and session management</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">30 days</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Essential</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">user_preferences</td>
                    <td className="px-6 py-4 text-sm text-gray-500">Store user interface preferences and settings</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1 year</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Functional</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">analytics_id</td>
                    <td className="px-6 py-4 text-sm text-gray-500">Track user behavior and website performance</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2 years</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Analytics</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">marketing_consent</td>
                    <td className="px-6 py-4 text-sm text-gray-500">Remember marketing preferences and consent</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1 year</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Marketing</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Third-Party Cookies */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Third-Party Cookies</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            We may also use third-party services that set their own cookies. These services help us provide 
            better functionality and analyze our website performance:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Google Analytics</h3>
              <p className="text-gray-600 text-sm mb-3">
                Helps us understand how visitors use our website and improve user experience.
              </p>
              <p className="text-xs text-gray-500">
                <strong>Privacy Policy:</strong> <a href="https://policies.google.com/privacy" className="text-blue-600 hover:underline">Google Privacy Policy</a>
              </p>
            </div>
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Stripe</h3>
              <p className="text-gray-600 text-sm mb-3">
                Processes payments securely and provides fraud protection.
              </p>
              <p className="text-xs text-gray-500">
                <strong>Privacy Policy:</strong> <a href="https://stripe.com/privacy" className="text-blue-600 hover:underline">Stripe Privacy Policy</a>
              </p>
            </div>
          </div>
        </div>

        {/* Managing Cookies */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Managing Your Cookie Preferences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Browser Settings</h3>
              <p className="text-gray-700 mb-4">
                You can control and delete cookies through your browser settings. Most browsers allow you to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>View and delete existing cookies</li>
                <li>Block cookies from specific websites</li>
                <li>Block third-party cookies</li>
                <li>Clear all cookies when you close your browser</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Cookie Consent</h3>
              <p className="text-gray-700 mb-4">
                When you first visit our website, you'll see a cookie consent banner where you can:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Accept all cookies</li>
                <li>Reject non-essential cookies</li>
                <li>Customize your preferences</li>
                <li>Change your settings at any time</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Impact of Disabling Cookies */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Impact of Disabling Cookies</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Important Notice</h3>
            <p className="text-gray-700 mb-4">
              If you choose to disable cookies, some features of our website may not function properly:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>You may need to log in repeatedly</li>
              <li>Your preferences and settings may not be saved</li>
              <li>Some personalized content may not be available</li>
              <li>Website performance may be affected</li>
            </ul>
          </div>
        </div>

        {/* Updates to Policy */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Updates to This Policy</h2>
          <p className="text-gray-700 leading-relaxed">
            We may update this Cookie Policy from time to time to reflect changes in our practices or 
            for other operational, legal, or regulatory reasons. We will notify you of any material 
            changes by posting the updated policy on our website and updating the "Last Updated" date.
          </p>
        </div>

        {/* Contact Information */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            If you have any questions about our use of cookies or this Cookie Policy, please contact us:
          </p>
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-700">
              <strong>Email:</strong> privacy@digitalpersona.com<br/>
              <strong>Address:</strong> Digital Persona Platform, 123 Innovation Drive, Tech City, TC 12345<br/>
              <strong>Phone:</strong> 1-800-DIGITAL-1
            </p>
          </div>
        </div>

        {/* Effective Date */}
        <div className="text-center text-gray-500 text-sm">
          <p>This Cookie Policy is effective as of January 1, 2024.</p>
        </div>
      </div>
    </div>
  );
}
