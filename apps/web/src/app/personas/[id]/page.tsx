"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { AuthGuard } from "@/components/auth/AuthGuard";

function PersonaDetails() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const personaId = params?.id as string;

  const personaQuery = trpc.personas.getPublic.useQuery(
    { id: personaId },
    { enabled: Boolean(personaId) }
  );

  const engagementQuery = trpc.socialEngagement.getPersonaEngagement.useQuery(
    { personaId: personaId || "" },
    { enabled: Boolean(personaId) }
  );

  const reviewsQuery = trpc.socialEngagement.getPersonaReviews.useQuery(
    { personaId: personaId || "", limit: 5 },
    { enabled: Boolean(personaId) }
  );

  const isLikedQuery = trpc.socialEngagement.isLiked.useQuery(
    { personaId: personaId || "" },
    { enabled: Boolean(personaId) }
  );

  const likeMutation = trpc.socialEngagement.toggleLike.useMutation();
  const followMutation = trpc.socialEngagement.toggleFollow.useMutation();

  const p = personaQuery.data;
  const isLiked = isLikedQuery.data?.isLiked || false;
  const engagement = (engagementQuery.data as any) || {
    likes: 0,
    reviews: 0,
    averageRating: 0,
  };

  const traitEntries = useMemo(() => {
    const t = ((p && (p as any).traits) || {}) as Record<string, any>;
    return Object.entries(t).slice(0, 8);
  }, [p?.traits]);

  const preferenceEntries = useMemo(() => {
    const pref = ((p && (p as any).preferences) || {}) as Record<string, any>;
    return Object.entries(pref).slice(0, 8);
  }, [p?.preferences]);

  const onToggleLike = () => {
    likeMutation.mutate({ personaId, likeType: "like", discoveredVia: "feed" });
  };

  const onFollowCreator = () => {
    followMutation.mutate({
      creatorId: p.userId,
      followReason: "persona_discovery",
    });
  };

  if (!personaId) return null;

  if (personaQuery.isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (personaQuery.error || !personaQuery.data) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Persona not found
        </h1>
        <p className="text-gray-600 mb-4">
          This persona may be private or no longer exists.
        </p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-2xl font-semibold">
              {p.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{p.name}</h1>
              <p className="text-gray-600 mt-1 max-w-2xl">
                {p.description || "No description provided."}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                  {p.personaType}
                </span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700">
                  {p.privacyLevel}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onFollowCreator}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Follow Creator
            </button>
            <button
              onClick={onToggleLike}
              className={`px-4 py-2 rounded ${
                isLiked
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              {isLiked ? "Liked" : "Like"}
            </button>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
          <div>⭐ Rating: {engagement.averageRating?.toFixed?.(1) || 0}</div>
          <div>👍 Likes: {engagement.likes || 0}</div>
          <div>📝 Reviews: {engagement.reviews || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
            {traitEntries.length === 0 ? (
              <p className="text-gray-600 text-sm">
                No additional details yet.
              </p>
            ) : (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {traitEntries.map(([key, val]) => (
                  <div key={key}>
                    <dt className="text-xs text-gray-500 uppercase tracking-wide">
                      {key}
                    </dt>
                    <dd className="text-gray-800 text-sm break-words">
                      {typeof val === "object"
                        ? JSON.stringify(val)
                        : String(val)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Preferences
            </h2>
            {preferenceEntries.length === 0 ? (
              <p className="text-gray-600 text-sm">No preferences set.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {preferenceEntries.map(([key, val]) => (
                  <span
                    key={key}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                    title={`${key}: ${
                      typeof val === "object"
                        ? JSON.stringify(val)
                        : String(val)
                    }`}
                  >
                    {key}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Reviews
            </h2>
            {reviewsQuery.isLoading ? (
              <p className="text-gray-500 text-sm">Loading reviews...</p>
            ) : reviewsQuery.data && reviewsQuery.data.length > 0 ? (
              <ul className="space-y-4">
                {reviewsQuery.data.map((r: any) => (
                  <li
                    key={r.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-gray-900">
                        {r.title || "Review"}
                      </div>
                      <div className="text-sm text-yellow-600">
                        {r.rating} / 5
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{r.reviewText}</p>
                    <div className="text-xs text-gray-500 mt-2">
                      by {r.reviewer?.name || "User"} ·{" "}
                      {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 text-sm">No reviews yet.</p>
            )}
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-md font-semibold text-gray-900 mb-3">
              Quick Actions
            </h3>
            <button
              onClick={onFollowCreator}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Follow Creator
            </button>
            <button
              onClick={onToggleLike}
              className={`w-full mt-2 px-4 py-2 rounded ${
                isLiked
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              {isLiked ? "Liked" : "Like Persona"}
            </button>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-md font-semibold text-gray-900 mb-3">
              Metadata
            </h3>
            <div className="text-sm text-gray-700 space-y-1">
              <div>ID: {p.id}</div>
              <div>Creator ID: {p.userId}</div>
              <div>Created: {new Date(p.createdAt).toLocaleString()}</div>
              <div>Updated: {new Date(p.updatedAt).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PersonaDetailsPage() {
  return (
    <AuthGuard>
      <PersonaDetails />
    </AuthGuard>
  );
}
