"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import MainNavigation from "@/components/navigation/MainNavigation";
import { trpc } from "@/lib/trpc";

// Types for personas
interface Persona {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  avatar: string | null;
  personaType: "main" | "child" | "public" | "premium";
  isMainPersona: boolean;
  parentPersonaId: string | null;
  traits: any;
  preferences: any;
  memoryContext: string | null;
  personalityProfile: any;
  privacyLevel: "public" | "friends" | "subscribers" | "private";
  isPubliclyListed: boolean;
  allowConnections: boolean;
  requiresSubscription: boolean;
  subscriptionPrice: string | null;
  learningEnabled: boolean;
  interactionCount: number;
  lastInteraction: string | null;
  isDefault: boolean;
  isActive: boolean;
  isDeletable: boolean;
  createdAt: string;
  updatedAt: string;
}

function PersonasPageContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPersonaType, setSelectedPersonaType] = useState<
    "child" | "public" | "premium"
  >("child");

  // tRPC queries with type assertions for build compatibility
  const { data: personas, isLoading, refetch } = trpc.personas.list.useQuery();
  const { data: mainPersona } = trpc.personas.getMain.useQuery();

  // Type-safe persona arrays (using unknown for build compatibility)
  const typedPersonas = personas as unknown as Persona[] | undefined;
  const typedMainPersona = mainPersona as unknown as Persona | undefined;

  // tRPC mutations
  const createPersonaMutation = trpc.personas.create.useMutation();
  const deletePersonaMutation = trpc.personas.delete.useMutation();

  const handleLogout = () => {
    logout();
  };

  const handleCreatePersona = async (formData: any) => {
    try {
      await createPersonaMutation.mutateAsync({
        name: formData.name,
        description: formData.description,
        personaType: selectedPersonaType,
        privacyLevel: formData.privacyLevel || "friends",
        isPubliclyListed: formData.isPubliclyListed || false,
        requiresSubscription: formData.requiresSubscription || false,
        subscriptionPrice: formData.subscriptionPrice || null,
      });
    } catch (error) {
      console.error("Failed to create persona:", error);
    }
  };

  const handleDeletePersona = async (personaId: string) => {
    if (confirm("Are you sure you want to delete this persona?")) {
      try {
        await deletePersonaMutation.mutateAsync({ id: personaId });
      } catch (error) {
        console.error("Failed to delete persona:", error);
      }
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your personas...</p>
        </div>
      </div>
    );
  }

  const childPersonas =
    personas?.filter((p) => p.personaType !== "main" && !p.isDefault) || [];
  const totalInteractions =
    personas?.reduce((sum, p) => sum + (p.interactionCount || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <MainNavigation />

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Your Personas [[memory:2424662]]
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Manage your digital personalities and AI personas
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Personas
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {personas?.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <svg
                  className="w-6 h-6 text-green-600"
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
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Interactions
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {totalInteractions}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-orange-100">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monetized</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {personas?.filter((p) => p.requiresSubscription).length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Persona Section */}
        {mainPersona && (
          <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Your Main Persona
              </h2>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Primary Brain
              </span>
            </div>

            <div className="flex items-start space-x-6">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-2xl text-white font-bold">
                {mainPersona.name?.charAt(0) || "M"}
              </div>

              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {mainPersona.name}
                </h3>
                <p className="text-gray-600 mb-4">{mainPersona.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-indigo-600">
                      {mainPersona.interactionCount || 0}
                    </p>
                    <p className="text-sm text-gray-600">Interactions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">Active</p>
                    <p className="text-sm text-gray-600">Status</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      Private
                    </p>
                    <p className="text-sm text-gray-600">Privacy</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">Active</p>
                    <p className="text-sm text-gray-600">Status</p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => router.push("/personas")}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Manage Personas
                  </button>
                  <button
                    onClick={() => router.push("/privacy")}
                    className="px-4 py-2 bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 transition-colors"
                  >
                    Privacy Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Child Personas Section */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Child Personas
              </h2>
              <p className="text-gray-600">
                Specialized personas derived from your main persona
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Create Persona</span>
            </button>
          </div>

          {childPersonas.length === 0 ? (
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No child personas yet
              </h3>
              <p className="text-gray-600 mb-4">
                Create specialized personas for different contexts and audiences
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create Your First Persona
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {childPersonas.map((persona) => (
                <div
                  key={persona.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-lg font-semibold">
                        {getPersonaTypeIcon(persona.personaType)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {persona.name}
                        </h3>
                        <p className="text-sm text-gray-600 capitalize">
                          {persona.personaType}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() =>
                          router.push(`/personas/${persona.id}/edit`)
                        }
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Edit persona"
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      {persona.isDeletable && (
                        <button
                          onClick={() => handleDeletePersona(persona.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete persona"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">
                    {persona.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Privacy</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getPrivacyColor(
                          persona.privacyLevel
                        )}`}
                      >
                        {persona.privacyLevel}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Interactions
                      </span>
                      <span className="text-sm font-semibold">
                        {persona.interactionCount || 0}
                      </span>
                    </div>
                    {persona.requiresSubscription && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Price</span>
                        <span className="text-sm font-semibold text-green-600">
                          ${persona.subscriptionPrice || "0"}/month
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => router.push(`/personas/${persona.id}`)}
                      className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      View Profile
                    </button>
                    {persona.requiresSubscription ? (
                      <button
                        onClick={() =>
                          router.push(`/personas/${persona.id}/subscribe`)
                        }
                        className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Subscribe
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          router.push(`/personas/${persona.id}/analytics`)
                        }
                        className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Analytics
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
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
              <h3 className="text-lg font-semibold text-gray-900 ml-3">
                Social Network
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Connect with other personas and discover new friends
            </p>
            <button
              onClick={() => router.push("/social")}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Explore Network
            </button>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">
                Subscriptions
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Manage your persona subscriptions and monetization settings
            </p>
            <div className="space-y-2">
              <button
                onClick={() => router.push("/creator/dashboard")}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Creator Dashboard
              </button>
              <button
                onClick={() => router.push("/account/subscriptions")}
                className="w-full px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
              >
                My Subscriptions
              </button>
              <button
                onClick={() => router.push("/creator/verification")}
                className="w-full px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm"
              >
                Creator Verification
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Create Persona Modal */}
      {showCreateModal && (
        <CreatePersonaModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePersona}
          selectedType={selectedPersonaType}
          onTypeChange={setSelectedPersonaType}
          isLoading={createPersonaMutation.isLoading}
        />
      )}
    </div>
  );
}

// Create Persona Modal Component
function CreatePersonaModal({
  onClose,
  onSubmit,
  selectedType,
  onTypeChange,
  isLoading,
}: {
  onClose: () => void;
  onSubmit: (data: any) => void;
  selectedType: "child" | "public" | "premium";
  onTypeChange: (type: "child" | "public" | "premium") => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    privacyLevel: "friends" as "public" | "friends" | "subscribers" | "private",
    isPubliclyListed: false,
    requiresSubscription: false,
    subscriptionPrice: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            Create New Persona
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Persona Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Persona Type
            </label>
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  type: "child" as const,
                  label: "Child Persona",
                  desc: "Private, inherits from main",
                  icon: "👶",
                },
                {
                  type: "public" as const,
                  label: "Public Persona",
                  desc: "Discoverable by others",
                  icon: "🌍",
                },
                {
                  type: "premium" as const,
                  label: "Premium Persona",
                  desc: "Monetized with subscriptions",
                  icon: "💎",
                },
              ].map((option) => (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => onTypeChange(option.type)}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    selectedType === option.type
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-2xl mb-2">{option.icon}</div>
                  <div className="font-medium text-gray-900">
                    {option.label}
                  </div>
                  <div className="text-sm text-gray-600">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Basic Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Persona Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="e.g., Professional Assistant, Creative Writer, Social Butterfly"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Describe this persona's purpose and personality..."
            />
          </div>

          {/* Privacy Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Privacy Level
            </label>
            <select
              value={formData.privacyLevel}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  privacyLevel: e.target.value as any,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="private">Private - Only you can access</option>
              <option value="friends">
                Friends - Connected users can access
              </option>
              <option value="subscribers">
                Subscribers - Paid subscribers can access
              </option>
              <option value="public">Public - Anyone can access</option>
            </select>
          </div>

          {/* Public Listing */}
          {selectedType === "public" && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPubliclyListed"
                checked={formData.isPubliclyListed}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isPubliclyListed: e.target.checked,
                  }))
                }
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="isPubliclyListed"
                className="ml-2 block text-sm text-gray-900"
              >
                List in persona directory for discovery
              </label>
            </div>
          )}

          {/* Monetization */}
          {selectedType === "premium" && (
            <>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requiresSubscription"
                  checked={formData.requiresSubscription}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      requiresSubscription: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="requiresSubscription"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Require subscription for access
                </label>
              </div>

              {formData.requiresSubscription && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Subscription Price ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.subscriptionPrice}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        subscriptionPrice: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="9.99"
                  />
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating..." : "Create Persona"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PersonasPage() {
  return (
    <AuthGuard>
      <PersonasPageContent />
    </AuthGuard>
  );
}
