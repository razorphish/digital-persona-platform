"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import CreatorSafetyControls from "@/components/creator/safety/CreatorSafetyControls";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";

function CreatorSafetyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(
    searchParams.get("personaId")
  );

  // Mock personas data since backend route doesn't exist yet
  const personas = [
    { id: "1", name: "AI Assistant", description: "Helpful AI assistant" },
    { id: "2", name: "Life Coach", description: "Personal development coach" },
  ];
  const isLoading = false;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!personas || personas.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
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
          <h2 className="mt-2 text-lg font-medium text-gray-900">
            No Personas Found
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            You need to create a persona before accessing safety controls.
          </p>
          <div className="mt-6">
            <button
              onClick={() => router.push("/personas")}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Create Persona
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedPersona =
    personas.find((p) => p.id === selectedPersonaId) || personas[0];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Creator Safety Center
            </h1>
            <p className="text-gray-600">
              Manage user interactions and safety controls for your personas
            </p>
          </div>
          <button
            onClick={() => router.push("/creator/dashboard")}
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            ← Back to Creator Dashboard
          </button>
        </div>
      </div>

      {/* Persona Selector */}
      {personas.length > 1 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Persona
            </label>
            <select
              value={selectedPersona.id}
              onChange={(e) => setSelectedPersonaId(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              {personas.map((persona) => (
                <option key={persona.id} value={persona.id}>
                  {persona.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Safety Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CreatorSafetyControls
          personaId={selectedPersona.id}
          personaName={selectedPersona.name}
        />
      </div>
    </div>
  );
}

export default function CreatorSafetyPage() {
  return (
    <AuthGuard>
      <CreatorSafetyPageContent />
    </AuthGuard>
  );
}
