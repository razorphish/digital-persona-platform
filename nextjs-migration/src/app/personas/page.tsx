"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Users,
  Settings,
  Trash2,
  Edit3,
  MessageCircle,
  Brain,
  Eye,
  Mic,
} from "lucide-react";
import { Persona } from "@/types/personas";
import CreatePersonaModal from "@/components/personas/CreatePersonaModal";
import EditPersonaModal from "@/components/personas/EditPersonaModal";
import DeletePersonaModal from "@/components/personas/DeletePersonaModal";
import PersonaCard from "@/components/personas/PersonaCard";
import LayoutWrapper from "@/components/LayoutWrapper";

function PersonasPageContent() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [deletingPersona, setDeletingPersona] = useState<Persona | null>(null);

  useEffect(() => {
    fetchPersonas();
  }, []);

  const fetchPersonas = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/personas");
      if (!response.ok) throw new Error("Failed to fetch personas");
      const data = await response.json();
      setPersonas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load personas");
    } finally {
      setLoading(false);
    }
  };

  const handlePersonaCreated = useCallback((newPersona: Persona) => {
    setPersonas((prev) => [...prev, newPersona]);
    setShowCreateModal(false);
  }, []);

  const handlePersonaUpdated = useCallback((updatedPersona: Persona) => {
    setPersonas((prev) =>
      prev.map((p) => (p.id === updatedPersona.id ? updatedPersona : p))
    );
    setEditingPersona(null);
  }, []);

  const handlePersonaDeleted = useCallback((deletedId: number) => {
    setPersonas((prev) => prev.filter((p) => p.id !== deletedId));
    setDeletingPersona(null);
  }, []);

  const handleEditPersona = useCallback((persona: Persona) => {
    setEditingPersona(persona);
  }, []);

  const handleDeletePersona = useCallback((persona: Persona) => {
    setDeletingPersona(persona);
  }, []);

  const handleStartConversation = useCallback((personaId: number) => {
    window.location.href = `/chat?persona=${personaId}`;
  }, []);

  const getRelationIcon = (relationType: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      parent: <Users className="h-5 w-5 text-blue-500" />,
      spouse: <Users className="h-5 w-5 text-pink-500" />,
      child: <Users className="h-5 w-5 text-green-500" />,
      sibling: <Users className="h-5 w-5 text-purple-500" />,
      friend: <Users className="h-5 w-5 text-yellow-500" />,
      colleague: <Users className="h-5 w-5 text-indigo-500" />,
    };
    return iconMap[relationType] || <Users className="h-5 w-5 text-gray-500" />;
  };

  const getAIFeatureBadges = (persona: Persona) => {
    const features = [];
    if (persona.memory_enabled)
      features.push({
        icon: Brain,
        label: "Memory",
        color: "bg-blue-100 text-blue-700",
      });
    if (persona.learning_enabled)
      features.push({
        icon: Brain,
        label: "Learning",
        color: "bg-green-100 text-green-700",
      });
    if (persona.image_analysis_enabled)
      features.push({
        icon: Eye,
        label: "Vision",
        color: "bg-purple-100 text-purple-700",
      });
    if (persona.voice_synthesis_enabled)
      features.push({
        icon: Mic,
        label: "Voice",
        color: "bg-orange-100 text-orange-700",
      });
    return features;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
            <h3 className="text-xl font-semibold text-red-400 mb-2">
              Error Loading Personas
            </h3>
            <p className="text-red-300">{error}</p>
            <button
              onClick={fetchPersonas}
              className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-3 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-0 mb-6 lg:mb-8">
          <div>
            <h1 className="text-2xl lg:text-4xl font-bold text-white mb-2">
              Your Personas
            </h1>
            <p className="text-white/70 text-sm lg:text-base">
              Manage your digital personas and their AI capabilities
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-4 lg:px-6 py-2 lg:py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg text-sm lg:text-base"
          >
            <Plus className="h-4 lg:h-5 w-4 lg:w-5" />
            Create Persona
          </button>
        </div>

        {/* Stats */}
        {personas.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6 mb-6 lg:mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 lg:p-6 border border-white/20">
              <div className="flex items-center gap-3">
                <Users className="h-6 lg:h-8 w-6 lg:w-8 text-blue-400" />
                <div>
                  <p className="text-white/70 text-xs lg:text-sm">
                    Total Personas
                  </p>
                  <p className="text-xl lg:text-2xl font-bold text-white">
                    {personas.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 lg:p-6 border border-white/20">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-6 lg:h-8 w-6 lg:w-8 text-green-400" />
                <div>
                  <p className="text-white/70 text-xs lg:text-sm">
                    Total Interactions
                  </p>
                  <p className="text-xl lg:text-2xl font-bold text-white">
                    {personas.reduce(
                      (sum, p) => sum + (p.interaction_count || 0),
                      0
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 lg:p-6 border border-white/20 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3">
                <Brain className="h-6 lg:h-8 w-6 lg:w-8 text-purple-400" />
                <div>
                  <p className="text-white/70 text-xs lg:text-sm">AI-Enabled</p>
                  <p className="text-xl lg:text-2xl font-bold text-white">
                    {
                      personas.filter(
                        (p) => p.learning_enabled || p.memory_enabled
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Personas Grid */}
        {personas.length === 0 ? (
          <div className="text-center py-12 lg:py-16 px-4">
            <Users className="h-12 lg:h-16 w-12 lg:w-16 text-white/30 mx-auto mb-4" />
            <h3 className="text-lg lg:text-xl font-semibold text-white mb-2">
              No Personas Yet
            </h3>
            <p className="text-white/70 mb-6 text-sm lg:text-base">
              Create your first digital persona to get started
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 lg:px-6 py-2 lg:py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all duration-200 text-sm lg:text-base"
            >
              Create Your First Persona
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {personas.map((persona) => (
              <PersonaCard
                key={persona.id}
                persona={persona}
                onEdit={handleEditPersona}
                onDelete={handleDeletePersona}
                onStartConversation={handleStartConversation}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreatePersonaModal
          onClose={() => setShowCreateModal(false)}
          onPersonaCreated={handlePersonaCreated}
        />
      )}

      {editingPersona && (
        <EditPersonaModal
          persona={editingPersona}
          onClose={() => setEditingPersona(null)}
          onPersonaUpdated={handlePersonaUpdated}
        />
      )}

      {deletingPersona && (
        <DeletePersonaModal
          persona={deletingPersona}
          onClose={() => setDeletingPersona(null)}
          onPersonaDeleted={handlePersonaDeleted}
        />
      )}
    </div>
  );
}

export default function PersonasPage() {
  return (
    <LayoutWrapper>
      <PersonasPageContent />
    </LayoutWrapper>
  );
}
