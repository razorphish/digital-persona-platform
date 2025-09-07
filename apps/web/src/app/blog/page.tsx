"use client";

import React from "react";
import Link from "next/link";

export default function BlogPage() {
  const blogPosts = [
    {
      id: 1,
      title: "Getting Started with Digital Personas: A Complete Guide",
      excerpt: "Learn how to create your first digital persona and start building meaningful connections in our community.",
      date: "2024-01-15",
      author: "Digital Persona Team",
      category: "Getting Started",
      readTime: "5 min read"
    },
    {
      id: 2,
      title: "Monetizing Your Expertise: Best Practices for Creator Success",
      excerpt: "Discover proven strategies for turning your knowledge into sustainable income through digital personas.",
      date: "2024-01-10",
      author: "Sarah Chen",
      category: "Monetization",
      readTime: "8 min read"
    },
    {
      id: 3,
      title: "AI Safety and Privacy: How We Protect Your Data",
      excerpt: "An in-depth look at our security measures and privacy protections that keep your information safe.",
      date: "2024-01-05",
      author: "Security Team",
      category: "Security",
      readTime: "6 min read"
    },
    {
      id: 4,
      title: "Building Authentic Connections in the Digital Age",
      excerpt: "Explore how digital personas can create more meaningful relationships than traditional social media.",
      date: "2024-01-01",
      author: "Dr. Michael Rodriguez",
      category: "Community",
      readTime: "7 min read"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Digital Persona Blog
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Insights, tips, and stories from the world of digital personas, AI, and online communities.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Featured Post */}
        <div className="mb-16">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <div className="max-w-3xl">
              <span className="bg-white bg-opacity-20 text-white px-3 py-1 rounded-full text-sm font-semibold mb-4 inline-block">
                Featured Post
              </span>
              <h2 className="text-3xl font-bold mb-4">
                The Future of Digital Interaction: How AI Personas Are Changing Everything
              </h2>
              <p className="text-xl opacity-90 mb-6">
                Explore the revolutionary impact of AI-powered digital personas on how we connect, 
                learn, and share knowledge in the digital age.
              </p>
              <div className="flex items-center text-sm opacity-80 mb-6">
                <span>By Digital Persona Team</span>
                <span className="mx-2">•</span>
                <span>January 20, 2024</span>
                <span className="mx-2">•</span>
                <span>10 min read</span>
              </div>
              <Link 
                href="#" 
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
              >
                Read Full Article →
              </Link>
            </div>
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Latest Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <article key={post.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-semibold">
                      {post.category}
                    </span>
                    <span className="text-gray-500 text-sm">{post.readTime}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3">
                        {post.author.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{post.author}</p>
                        <p className="text-xs text-gray-500">{post.date}</p>
                      </div>
                    </div>
                    <Link 
                      href="#" 
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      Read More →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Getting Started', 'Monetization', 'Security', 'Community', 'AI Technology', 'Creator Tips', 'Platform Updates', 'Case Studies'].map((category) => (
              <Link 
                key={category}
                href="#" 
                className="bg-white rounded-lg border p-4 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <span className="text-gray-900 font-medium">{category}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-xl mb-8 opacity-90">
            Get the latest insights, tips, and updates delivered to your inbox.
          </p>
          <div className="max-w-md mx-auto flex gap-4">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Subscribe
            </button>
          </div>
          <p className="text-sm opacity-80 mt-4">
            No spam, unsubscribe at any time.
          </p>
        </div>
      </div>
    </div>
  );
}
