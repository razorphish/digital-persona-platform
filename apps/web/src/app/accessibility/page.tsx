"use client";

import React from "react";

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Accessibility Statement
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our commitment to making Digital Persona Platform accessible to everyone, 
              regardless of ability or technology used.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Introduction */}
        <div className="mb-12">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Commitment</h2>
            <p className="text-gray-700 leading-relaxed">
              Digital Persona Platform is committed to ensuring digital accessibility for people with disabilities. 
              We are continually improving the user experience for everyone and applying the relevant accessibility 
              standards to make our platform inclusive and usable by all.
            </p>
          </div>
        </div>

        {/* Standards Compliance */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Accessibility Standards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 text-xl">♿</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">WCAG 2.1 AA Compliance</h3>
              </div>
              <p className="text-gray-600">
                Our platform follows the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards 
                to ensure accessibility for users with various disabilities.
              </p>
            </div>
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 text-xl">🔧</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Continuous Improvement</h3>
              </div>
              <p className="text-gray-600">
                We regularly audit our platform and implement improvements to enhance accessibility 
                and user experience for all users.
              </p>
            </div>
          </div>
        </div>

        {/* Accessibility Features */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Accessibility Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Keyboard Navigation</h3>
              <p className="text-gray-600 text-sm">
                Full keyboard accessibility with logical tab order, focus indicators, and keyboard shortcuts.
              </p>
            </div>
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Screen Reader Support</h3>
              <p className="text-gray-600 text-sm">
                Compatible with screen readers including JAWS, NVDA, and VoiceOver with proper ARIA labels.
              </p>
            </div>
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">High Contrast Mode</h3>
              <p className="text-gray-600 text-sm">
                High contrast color schemes and customizable text sizes for better visibility.
              </p>
            </div>
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Alternative Text</h3>
              <p className="text-gray-600 text-sm">
                All images include descriptive alternative text for users with visual impairments.
              </p>
            </div>
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Voice Commands</h3>
              <p className="text-gray-600 text-sm">
                Voice control support for hands-free navigation and interaction with personas.
              </p>
            </div>
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Text-to-Speech</h3>
              <p className="text-gray-600 text-sm">
                Built-in text-to-speech functionality for reading content aloud.
              </p>
            </div>
          </div>
        </div>

        {/* Assistive Technologies */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Supported Assistive Technologies</h2>
          <div className="bg-white rounded-lg border p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Screen Readers</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• JAWS (Windows)</li>
                  <li>• NVDA (Windows)</li>
                  <li>• VoiceOver (macOS/iOS)</li>
                  <li>• TalkBack (Android)</li>
                  <li>• Orca (Linux)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Other Tools</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Dragon NaturallySpeaking</li>
                  <li>• Switch Control</li>
                  <li>• Eye tracking devices</li>
                  <li>• Sip and puff devices</li>
                  <li>• Adaptive keyboards</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Known Issues */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Known Accessibility Issues</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Current Limitations</h3>
            <p className="text-gray-700 mb-4">
              We are aware of the following accessibility issues and are working to resolve them:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Some interactive elements may not be fully accessible via keyboard navigation</li>
              <li>Certain multimedia content may lack captions or transcripts</li>
              <li>Color contrast ratios may not meet WCAG standards in some areas</li>
              <li>Form validation messages may not be properly associated with form fields</li>
            </ul>
            <p className="text-gray-700 mt-4">
              We are actively working to address these issues in upcoming updates.
            </p>
          </div>
        </div>

        {/* Feedback */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Feedback & Support</h2>
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">We Want to Hear From You</h3>
            <p className="text-gray-700 mb-6">
              If you encounter any accessibility barriers or have suggestions for improvement, 
              please contact us. We value your feedback and are committed to making our platform 
              more accessible for everyone.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Accessibility Team</h4>
                <p className="text-gray-600 text-sm mb-2">Email: accessibility@digitalpersona.com</p>
                <p className="text-gray-600 text-sm">Phone: 1-800-ACCESS-01</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Response Time</h4>
                <p className="text-gray-600 text-sm">
                  We aim to respond to accessibility feedback within 2 business days 
                  and provide updates on resolution progress.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Legal */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Legal Compliance</h2>
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Americans with Disabilities Act (ADA)</h3>
            <p className="text-gray-700 mb-4">
              Digital Persona Platform is committed to compliance with the Americans with Disabilities Act (ADA) 
              and other applicable accessibility laws and regulations.
            </p>
            <p className="text-gray-700">
              This accessibility statement is reviewed and updated regularly to reflect our ongoing commitment 
              to accessibility and any changes to our platform or policies.
            </p>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-center text-gray-500 text-sm">
          <p>Last updated: January 2024</p>
          <p className="mt-2">
            This accessibility statement is reviewed quarterly and updated as needed.
          </p>
        </div>
      </div>
    </div>
  );
}
