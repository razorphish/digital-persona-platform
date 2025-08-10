"use client";

import React, { useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";

export default function PersonaDetailsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const personaId = searchParams.get("id") || "";

  const enabled = Boolean(personaId);
  const personaQuery = trpc.personas.getPublic.useQuery(
    { id: personaId },
    { enabled }
  );
  const engagementQuery = trpc.socialEngagement.getPersonaEngagement.useQuery(
    { personaId },
    { enabled }
  );
  const reviewsQuery = trpc.socialEngagement.getPersonaReviews.useQuery(
    { personaId, limit: 5 },
    { enabled }
  );
  const isLikedQuery = trpc.socialEngagement.isLiked.useQuery(
    { personaId },
    { enabled }
  );

  const likeMutation = trpc.socialEngagement.toggleLike.useMutation();
  const followMutation = trpc.socialEngagement.toggleFollow.useMutation();

  const p = personaQuery.data as any | undefined;
  const isLiked = isLikedQuery.data?.isLiked || false;
  const engagement = (engagementQuery.data as any) || {
    likes: 0,
    reviews: 0,
    averageRating: 0,
  };

  const traitEntries = useMemo(() => {
    const t = ((p && p.traits) || {}) as Record<string, any>;
    return Object.entries(t).slice(0, 8);
  }, [p?.traits]);

  const preferenceEntries = useMemo(() => {
    const pref = ((p && p.preferences) || {}) as Record<string, any>;
    return Object.entries(pref).slice(0, 8);
  }, [p?.preferences]);

  if (!enabled) return null;

  if (personaQuery.isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (personaQuery.error || !p) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Persona not found</h1>
        <p className="text-gray-600 mb-4">This persona may be private or no longer exists.</p>
        <button onClick={() => router.back()} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
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
              {p.name?.charAt(0) || "P"}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{p.name}</h1>
              <p className="text-gray-600 mt-1 max-w-2xl">{p.description || "No description provided."}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">{p.personaType}</span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700">{p.privacyLevel}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => likeMutation.mutate({ personaId, likeType: "like", discoveredVia: "feed" })}
              className={`px-4 py-2 rounded ${isLiked ? "bg-pink-100 text-pink-700" : "bg-gray-100 text-gray-700"}`}
            >
              {isLiked ? "Liked" : "Like"} ({engagement.likes || 0})
            </button>
            <button
              onClick={() =>
                followMutation.mutate({ creatorId: p.userId, followReason: "persona_discovery" })
              }
              className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Follow Creator
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Traits</h2>
          <ul className="space-y-2">
            {traitEntries?.map(([k, v]) => (
              <li key={k} className="text-sm text-gray-700">
                <span className="font-medium">{k}:</span> {String(v)}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Preferences</h2>
          <ul className="space-y-2">
            {preferenceEntries?.map(([k, v]) => (
              <li key={k} className="text-sm text-gray-700">
                <span className="font-medium">{k}:</span> {String(v)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Reviews</h2>
        <ul className="space-y-3">
          {(reviewsQuery.data || []).map((r: any) => (
            <li key={r.id} className="text-sm text-gray-700">
              <span className="font-medium">{r.title || "Review"}</span>: {r.reviewText}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}


