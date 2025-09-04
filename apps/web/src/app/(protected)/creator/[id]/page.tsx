"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";

interface CreatorProfilePageProps {}

function CreatorProfilePageContent({}: CreatorProfilePageProps) {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const creatorId = params.id as string;

  // Fetch creator's personas (this will give us the creator info through the personas)
  const {
    data: creatorPersonas,
    isLoading: personasLoading,
    error: personasError,
  } = trpc.personas.list.useQuery(
    undefined,
    { enabled: !!creatorId }
  );

  // Get creator info from the first persona (since all personas belong to the same user)
  const creator = creatorPersonas?.[0] ? {
    id: creatorPersonas[0].userId,
    name: creatorPersonas[0].userId, // We'll use userId as name for now
    email: `${creatorPersonas[0].userId}@example.com`, // Placeholder email
    bio: "Creator on Hibiji",
    location: "Unknown",
    createdAt: creatorPersonas[0].createdAt,
  } : null;

  // Check if current user is following this creator
  const { data: isFollowing, isLoading: followingLoading } =
    trpc.socialEngagement.isFollowing.useQuery(
      {
        creatorId: creatorId,
      },
      { enabled: !!user?.id && !!creatorId }
    );

  // Follow/unfollow mutation
  const toggleFollowMutation = trpc.socialEngagement.toggleFollow.useMutation({
    onSuccess: () => {
      // Refetch following status
      window.location.reload();
    },
  });

  const handleFollowToggle = () => {
    if (!user?.id) return;

    toggleFollowMutation.mutate({
      creatorId: creatorId,
      followReason: "creator_interest",
    });
  };

  if (personasLoading || followingLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading creator profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (personasError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-red-800 mb-2">
              Error Loading Creator Profile
            </h3>
            <p className="text-red-600 mb-4">
              {personasError?.message || "Failed to load creator profile"}
            </p>
            <button
              onClick={() => router.back()}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-yellow-800 mb-2">
              Creator Not Found
            </h3>
            <p className="text-yellow-600 mb-4">
              The creator you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => router.back()}
              className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Creator Profile
                </h1>
                <p className="text-gray-600">View creator and their personas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Creator Info */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="flex items-start space-x-6">
            {/* Creator Avatar */}
            <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {creator.name?.[0]?.toUpperCase() || "C"}
            </div>

            {/* Creator Details */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {creator.name}
                  </h2>
                  <p className="text-gray-600 mb-2">{creator.email}</p>
                  {creator.location && (
                    <p className="text-sm text-gray-500">
                      📍 {creator.location}
                    </p>
                  )}
                </div>

                {/* Follow Button */}
                <button
                  onClick={handleFollowToggle}
                  disabled={toggleFollowMutation.isLoading}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    isFollowing?.isFollowing
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {toggleFollowMutation.isLoading
                    ? "..."
                    : isFollowing?.isFollowing
                    ? "Following"
                    : "Follow Creator"}
                </button>
              </div>

              {/* Creator Bio */}
              {creator.bio && (
                <div className="mb-4">
                  <p className="text-gray-700">{creator.bio}</p>
                </div>
              )}

              {/* Creator Stats */}
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <span>{creatorPersonas?.length || 0} Personas</span>
                <span>•</span>
                <span>
                  Member since{" "}
                  {new Date(creator.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Creator's Personas */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            {creator.name}'s Personas ({creatorPersonas?.length || 0})
          </h3>

          {creatorPersonas && creatorPersonas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creatorPersonas.map((persona) => (
                <div
                  key={persona.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() =>
                    router.push(`/persona-details?id=${persona.id}`)
                  }
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                      {persona.name?.[0]?.toUpperCase() || "P"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {persona.name}
                      </h4>
                      <p className="text-sm text-gray-600 capitalize">
                        {persona.personaType}
                      </p>
                    </div>
                  </div>

                  {persona.description && (
                    <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                      {persona.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        persona.privacyLevel === "public"
                          ? "bg-green-100 text-green-800"
                          : persona.privacyLevel === "friends"
                          ? "bg-blue-100 text-blue-800"
                          : persona.privacyLevel === "subscribers"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {persona.privacyLevel}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/persona-details?id=${persona.id}`);
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View Persona →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
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
                No Personas Yet
              </h3>
              <p className="text-gray-600">
                This creator hasn't created any personas yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreatorProfilePage() {
  return (
    <AuthGuard>
      <CreatorProfilePageContent />
    </AuthGuard>
  );
}
