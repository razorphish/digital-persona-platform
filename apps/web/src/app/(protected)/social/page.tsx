"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { trpc } from "@/lib/trpc";

// Types for social connections
interface PublicPersona {
  id: string;
  name: string;
  description: string | null;
  avatar: string | null;
  userId: string;
  personaType: "main" | "child" | "public" | "premium";
  privacyLevel: "public" | "friends" | "subscribers" | "private";
  isPubliclyListed: boolean;
  requiresSubscription: boolean;
  subscriptionPrice: string | null;
  interactionCount: number;
  tags?: string[];
  isConnected?: boolean;
  connectionStatus?: "none" | "pending" | "connected" | "blocked";
}

interface Connection {
  id: string;
  requesterId: string;
  targetPersonaId: string;
  targetUserId: string;
  connectionType: "friend" | "follower" | "subscriber" | "blocked";
  status: "pending" | "accepted" | "declined" | "blocked";
  subscriptionTier?: string;
  isSubscriptionActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

function SocialPageContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "discover" | "friends" | "requests"
  >("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<{
    personaType: string[];
    privacyLevel: string[];
    priceRange: string;
  }>({
    personaType: [],
    privacyLevel: [],
    priceRange: "all",
  });

  // Mock data for now - would be replaced with actual tRPC queries
  const [discoveredPersonas, setDiscoveredPersonas] = useState<PublicPersona[]>(
    [
      {
        id: "1",
        name: "Creative Artist Sarah",
        description:
          "Digital artist and creative consultant, love helping with design projects",
        avatar: null,
        userId: "user1",
        personaType: "public",
        privacyLevel: "public",
        isPubliclyListed: true,
        requiresSubscription: false,
        subscriptionPrice: null,
        interactionCount: 156,
        tags: ["art", "design", "creativity"],
        connectionStatus: "none",
      },
      {
        id: "2",
        name: "Business Mentor Alex",
        description:
          "Entrepreneur and business strategist with 15+ years experience",
        avatar: null,
        userId: "user2",
        personaType: "premium",
        privacyLevel: "subscribers",
        isPubliclyListed: true,
        requiresSubscription: true,
        subscriptionPrice: "29.99",
        interactionCount: 89,
        tags: ["business", "strategy", "mentoring"],
        connectionStatus: "none",
      },
      {
        id: "3",
        name: "Fitness Coach Maria",
        description:
          "Personal trainer focused on holistic wellness and nutrition",
        avatar: null,
        userId: "user3",
        personaType: "public",
        privacyLevel: "friends",
        isPubliclyListed: true,
        requiresSubscription: false,
        subscriptionPrice: null,
        interactionCount: 203,
        tags: ["fitness", "wellness", "nutrition"],
        connectionStatus: "pending",
      },
    ]
  );

  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);

  // Filter personas based on search and filters
  const filteredPersonas = discoveredPersonas.filter((persona) => {
    const matchesSearch =
      persona.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      persona.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      persona.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesType =
      selectedFilters.personaType.length === 0 ||
      selectedFilters.personaType.includes(persona.personaType);

    const matchesPrivacy =
      selectedFilters.privacyLevel.length === 0 ||
      selectedFilters.privacyLevel.includes(persona.privacyLevel);

    let matchesPrice = true;
    if (selectedFilters.priceRange !== "all") {
      if (selectedFilters.priceRange === "free") {
        matchesPrice = !persona.requiresSubscription;
      } else if (selectedFilters.priceRange === "paid") {
        matchesPrice = persona.requiresSubscription;
      }
    }

    return matchesSearch && matchesType && matchesPrivacy && matchesPrice;
  });

  const handleConnect = async (
    personaId: string,
    connectionType: "friend" | "follower" | "subscriber"
  ) => {
    // Mock implementation - would use tRPC mutation
    setDiscoveredPersonas((prev) =>
      prev.map((p) =>
        p.id === personaId ? { ...p, connectionStatus: "pending" } : p
      )
    );
    console.log(`Sending ${connectionType} request to persona ${personaId}`);
  };

  const handleAcceptRequest = async (requestId: string) => {
    // Mock implementation
    console.log(`Accepting request ${requestId}`);
  };

  const handleDeclineRequest = async (requestId: string) => {
    // Mock implementation
    console.log(`Declining request ${requestId}`);
  };

  const getPersonaTypeIcon = (type: string) => {
    switch (type) {
      case "main":
        return "👤";
      case "child":
        return "👶";
      case "public":
        return "🌍";
      case "premium":
        return "💎";
      default:
        return "🤖";
    }
  };

  const getPrivacyColor = (level: string) => {
    switch (level) {
      case "public":
        return "bg-green-100 text-green-800";
      case "friends":
        return "bg-blue-100 text-blue-800";
      case "subscribers":
        return "bg-purple-100 text-purple-800";
      case "private":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Social Network</h1>
            <p className="mt-2 text-gray-600">
              Connect with personas and build your network
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              {
                id: "discover",
                label: "Discover",
                icon: "🔍",
                count: filteredPersonas.length,
              },
              {
                id: "friends",
                label: "Friends",
                icon: "👥",
                count: connections.length,
              },
              {
                id: "requests",
                label: "Requests",
                icon: "📨",
                count: pendingRequests.length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        activeTab === tab.id
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Discover Tab */}
        {activeTab === "discover" && (
          <div>
            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                {/* Search */}
                <div className="flex-1 max-w-lg">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Search personas by name, description, or tags..."
                    />
                  </div>
                </div>

                {/* Filter Toggle */}
                <button
                  onClick={() => {
                    /* Toggle filters visibility */
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.121A1 1 0 013 6.414V4z"
                    />
                  </svg>
                  <span>Filters</span>
                </button>
              </div>

              {/* Quick Filters */}
              <div className="mt-4 flex flex-wrap gap-2">
                {["All", "Public", "Premium", "Free", "Subscriptions"].map(
                  (filter) => (
                    <button
                      key={filter}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                    >
                      {filter}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Persona Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPersonas.map((persona) => (
                <div
                  key={persona.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  {/* Persona Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-lg font-semibold">
                        {getPersonaTypeIcon(persona.personaType)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {persona.name}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPrivacyColor(
                              persona.privacyLevel
                            )}`}
                          >
                            {persona.privacyLevel}
                          </span>
                          {persona.requiresSubscription && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Premium
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {persona.description}
                  </p>

                  {/* Tags */}
                  {persona.tags && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {persona.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                      {persona.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          +{persona.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                        <span>{persona.interactionCount}</span>
                      </div>
                    </div>
                    {persona.requiresSubscription && (
                      <div className="font-medium text-green-600">
                        ${persona.subscriptionPrice}/month
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    {persona.connectionStatus === "none" && (
                      <>
                        <button
                          onClick={() =>
                            handleConnect(
                              persona.id,
                              persona.requiresSubscription
                                ? "subscriber"
                                : "friend"
                            )
                          }
                          className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                        >
                          {persona.requiresSubscription
                            ? "Subscribe"
                            : "Connect"}
                        </button>
                        <button
                          onClick={() =>
                            router.push(`/personas/${persona.id}/preview`)
                          }
                          className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Preview
                        </button>
                      </>
                    )}
                    {persona.connectionStatus === "pending" && (
                      <button
                        disabled
                        className="flex-1 px-3 py-2 bg-yellow-100 text-yellow-800 text-sm rounded-lg cursor-not-allowed"
                      >
                        Request Sent
                      </button>
                    )}
                    {persona.connectionStatus === "connected" && (
                      <button
                        onClick={() =>
                          router.push(`/persona-details?id=${persona.id}`)
                        }
                        className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        View Profile
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredPersonas.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No personas found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your search or filters to find more personas.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Friends Tab */}
        {activeTab === "friends" && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No friends yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start connecting with personas to build your network
              </p>
              <button
                onClick={() => setActiveTab("discover")}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Discover Personas
              </button>
            </div>
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === "requests" && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 7.89a2 2 0 002.83 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No pending requests
              </h3>
              <p className="text-gray-600">
                Connection requests will appear here when you receive them
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SocialPage() {
  return (
    <AuthGuard>
      <SocialPageContent />
    </AuthGuard>
  );
}
