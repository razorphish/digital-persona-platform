"use client";

import React from "react";
import Link from "next/link";

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Developer Resources
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Build powerful applications with our APIs, SDKs, and developer tools. 
              Integrate digital personas into your projects and create amazing experiences.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Quick Start */}
        <div className="mb-16">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold mb-4">Get Started in Minutes</h2>
              <p className="text-xl opacity-90 mb-6">
                Our comprehensive API and SDKs make it easy to integrate digital personas 
                into your applications. Start building today with our quick start guide.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="#quick-start" 
                  className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Quick Start Guide
                </Link>
                <Link 
                  href="#api-docs" 
                  className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                >
                  API Documentation
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* API Overview */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">API Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-blue-600 text-2xl">🔌</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">REST API</h3>
              <p className="text-gray-600 mb-4">
                Comprehensive REST API for managing personas, interactions, and user data.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Persona management</li>
                <li>• User authentication</li>
                <li>• Conversation handling</li>
                <li>• Analytics data</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-green-600 text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">WebSocket API</h3>
              <p className="text-gray-600 mb-4">
                Real-time communication for live conversations and instant updates.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Live chat integration</li>
                <li>• Real-time notifications</li>
                <li>• Streaming responses</li>
                <li>• Event subscriptions</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-purple-600 text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Mobile SDKs</h3>
              <p className="text-gray-600 mb-4">
                Native SDKs for iOS and Android to build mobile applications.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• iOS Swift SDK</li>
                <li>• Android Kotlin SDK</li>
                <li>• React Native support</li>
                <li>• Flutter integration</li>
              </ul>
            </div>
          </div>
        </div>

        {/* SDKs and Libraries */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">SDKs & Libraries</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">JavaScript/TypeScript</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">@digital-persona/sdk</span>
                  <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-sm">Latest</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">@digital-persona/react</span>
                  <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-sm">Latest</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">@digital-persona/vue</span>
                  <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-sm">Latest</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Other Languages</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">digital-persona-python</span>
                  <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-sm">Latest</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">digital-persona-go</span>
                  <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-sm">Latest</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">digital-persona-php</span>
                  <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-sm">Latest</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Code Examples */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Code Examples</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Create a Persona</h3>
              <div className="bg-gray-900 rounded-lg p-4 text-green-400 text-sm font-mono overflow-x-auto">
                <pre>{`import { DigitalPersona } from '@digital-persona/sdk';

const client = new DigitalPersona({
  apiKey: 'your-api-key'
});

const persona = await client.personas.create({
  name: 'My AI Assistant',
  description: 'Helpful AI assistant',
  personality: {
    traits: ['helpful', 'friendly', 'knowledgeable'],
    communicationStyle: 'conversational'
  }
});`}</pre>
              </div>
            </div>
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Start a Conversation</h3>
              <div className="bg-gray-900 rounded-lg p-4 text-green-400 text-sm font-mono overflow-x-auto">
                <pre>{`const conversation = await client.conversations.create({
  personaId: persona.id,
  userId: 'user-123'
});

const response = await conversation.sendMessage({
  message: 'Hello, how can you help me?',
  context: {
    userPreferences: ['technical', 'detailed']
  }
});`}</pre>
              </div>
            </div>
          </div>
        </div>

        {/* Integration Guides */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Integration Guides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Chatbot Integration</h3>
              <p className="text-gray-600 text-sm mb-4">
                Add AI personas to your existing chatbot or customer service platform.
              </p>
              <Link href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View Guide →
              </Link>
            </div>
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">E-commerce Integration</h3>
              <p className="text-gray-600 text-sm mb-4">
                Create AI shopping assistants that help customers find products.
              </p>
              <Link href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View Guide →
              </Link>
            </div>
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Educational Platform</h3>
              <p className="text-gray-600 text-sm mb-4">
                Build AI tutors and learning assistants for educational applications.
              </p>
              <Link href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View Guide →
              </Link>
            </div>
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Healthcare Applications</h3>
              <p className="text-gray-600 text-sm mb-4">
                Create AI assistants for patient support and medical information.
              </p>
              <Link href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View Guide →
              </Link>
            </div>
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Gaming Integration</h3>
              <p className="text-gray-600 text-sm mb-4">
                Add intelligent NPCs and AI companions to your games.
              </p>
              <Link href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View Guide →
              </Link>
            </div>
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Enterprise Solutions</h3>
              <p className="text-gray-600 text-sm mb-4">
                Build AI assistants for internal tools and business processes.
              </p>
              <Link href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View Guide →
              </Link>
            </div>
          </div>
        </div>

        {/* Developer Tools */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Developer Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">API Explorer</h3>
              <p className="text-gray-600 mb-4">
                Interactive API documentation with live examples and testing capabilities.
              </p>
              <Link 
                href="#" 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Open API Explorer
              </Link>
            </div>
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Sandbox Environment</h3>
              <p className="text-gray-600 mb-4">
                Test your integrations in a safe, isolated environment with sample data.
              </p>
              <Link 
                href="#" 
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Access Sandbox
              </Link>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Developer Support</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-2xl">📚</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Documentation</h3>
              <p className="text-gray-600 text-sm">
                Comprehensive guides, API references, and code examples.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 text-2xl">💬</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Community Forum</h3>
              <p className="text-gray-600 text-sm">
                Connect with other developers and get help from the community.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 text-2xl">🎧</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Direct Support</h3>
              <p className="text-gray-600 text-sm">
                Get personalized help from our developer support team.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Building?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of developers who are already building amazing applications with our platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="#" 
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Get API Key
            </Link>
            <Link 
              href="#" 
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              View Documentation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
