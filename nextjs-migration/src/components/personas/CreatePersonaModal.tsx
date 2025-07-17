"use client";

import { useState } from "react";
import { X, User, Brain, Eye, Mic } from "lucide-react";
import { Persona, PersonaCreate } from "@/types/personas";

interface CreatePersonaModalProps {
  onClose: () => void;
  onPersonaCreated: (persona: Persona) => void;
}

const RELATION_TYPES = [
  { value: "parent", label: "Parent", description: "A parental figure" },
  {
    value: "spouse",
    label: "Spouse/Partner",
    description: "Life partner or spouse",
  },
  { value: "child", label: "Child", description: "Son or daughter" },
  { value: "sibling", label: "Sibling", description: "Brother or sister" },
  { value: "friend", label: "Friend", description: "Close personal friend" },
  {
    value: "colleague",
    label: "Colleague",
    description: "Work colleague or professional contact",
  },
];

export default function CreatePersonaModal({
  onClose,
  onPersonaCreated,
}: CreatePersonaModalProps) {
  const [formData, setFormData] = useState<PersonaCreate>({
    name: "",
    description: "",
    relation_type: "friend",
  });
  const [aiFeatures, setAiFeatures] = useState({
    memory_enabled: true,
    learning_enabled: true,
    image_analysis_enabled: false,
    voice_synthesis_enabled: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/personas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          ...aiFeatures,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create persona");
      }

      const newPersona = await response.json();
      onPersonaCreated(newPersona);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create persona");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof PersonaCreate, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAIFeatureToggle = (feature: keyof typeof aiFeatures) => {
    setAiFeatures((prev) => ({ ...prev, [feature]: !prev[feature] }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 lg:p-4 z-50">
      <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg border border-white/20 w-full max-w-2xl max-h-[95vh] lg:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 lg:p-6 border-b border-white/20">
          <div className="min-w-0 flex-1 mr-4">
            <h2 className="text-lg lg:text-2xl font-bold text-white">
              Create New Persona
            </h2>
            <p className="text-white/70 mt-1 text-sm lg:text-base">
              Define your digital persona's characteristics
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 active:bg-white/20 rounded-lg transition-colors touch-manipulation flex-shrink-0"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-white/70" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-4 lg:p-6 space-y-4 lg:space-y-6"
        >
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 lg:p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-white font-medium mb-2 text-sm lg:text-base">
              Persona Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter persona name..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          {/* Relation Type */}
          <div>
            <label className="block text-white font-medium mb-2">
              Relationship Type
            </label>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-3">
              {RELATION_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-center p-3 lg:p-4 border rounded-lg cursor-pointer transition-all touch-manipulation ${
                    formData.relation_type === type.value
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-white/20 hover:border-white/40 active:border-white/60"
                  }`}
                >
                  <input
                    type="radio"
                    value={type.value}
                    checked={formData.relation_type === type.value}
                    onChange={(e) =>
                      handleInputChange("relation_type", e.target.value)
                    }
                    className="sr-only"
                  />
                  <div>
                    <div className="text-white font-medium text-sm lg:text-base">
                      {type.label}
                    </div>
                    <div className="text-white/60 text-xs lg:text-sm">
                      {type.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-white font-medium mb-2 text-sm lg:text-base">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe this persona's characteristics, personality, or role..."
              rows={3}
              className="w-full px-3 lg:px-4 py-2 lg:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm lg:text-base"
            />
          </div>

          {/* AI Features */}
          <div>
            <label className="block text-white font-medium mb-3 lg:mb-4 text-sm lg:text-base">
              AI Capabilities
            </label>
            <div className="space-y-2 lg:space-y-3">
              <label className="flex items-center justify-between p-3 lg:p-4 bg-white/5 rounded-lg border border-white/10 touch-manipulation">
                <div className="flex items-center gap-2 lg:gap-3 flex-1 min-w-0">
                  <Brain className="h-4 lg:h-5 w-4 lg:w-5 text-blue-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-white font-medium text-sm lg:text-base">
                      Memory System
                    </div>
                    <div className="text-white/60 text-xs lg:text-sm">
                      Remember past conversations and interactions
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={aiFeatures.memory_enabled}
                  onChange={() => handleAIFeatureToggle("memory_enabled")}
                  className="w-4 lg:w-5 h-4 lg:h-5 text-purple-600 bg-transparent border-white/30 rounded focus:ring-purple-500 flex-shrink-0"
                />
              </label>

              <label className="flex items-center justify-between p-3 lg:p-4 bg-white/5 rounded-lg border border-white/10 touch-manipulation">
                <div className="flex items-center gap-2 lg:gap-3 flex-1 min-w-0">
                  <Brain className="h-4 lg:h-5 w-4 lg:w-5 text-green-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-white font-medium text-sm lg:text-base">
                      Personality Learning
                    </div>
                    <div className="text-white/60 text-xs lg:text-sm">
                      Adapt responses based on interactions
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={aiFeatures.learning_enabled}
                  onChange={() => handleAIFeatureToggle("learning_enabled")}
                  className="w-4 lg:w-5 h-4 lg:h-5 text-purple-600 bg-transparent border-white/30 rounded focus:ring-purple-500 flex-shrink-0"
                />
              </label>

              <label className="flex items-center justify-between p-3 lg:p-4 bg-white/5 rounded-lg border border-white/10 touch-manipulation">
                <div className="flex items-center gap-2 lg:gap-3 flex-1 min-w-0">
                  <Eye className="h-4 lg:h-5 w-4 lg:w-5 text-purple-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-white font-medium text-sm lg:text-base">
                      Image Analysis
                    </div>
                    <div className="text-white/60 text-xs lg:text-sm">
                      Analyze and understand shared images
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={aiFeatures.image_analysis_enabled}
                  onChange={() =>
                    handleAIFeatureToggle("image_analysis_enabled")
                  }
                  className="w-4 lg:w-5 h-4 lg:h-5 text-purple-600 bg-transparent border-white/30 rounded focus:ring-purple-500 flex-shrink-0"
                />
              </label>

              <label className="flex items-center justify-between p-3 lg:p-4 bg-white/5 rounded-lg border border-white/10 touch-manipulation">
                <div className="flex items-center gap-2 lg:gap-3 flex-1 min-w-0">
                  <Mic className="h-4 lg:h-5 w-4 lg:w-5 text-orange-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-white font-medium text-sm lg:text-base">
                      Voice Synthesis
                    </div>
                    <div className="text-white/60 text-xs lg:text-sm">
                      Generate spoken responses
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={aiFeatures.voice_synthesis_enabled}
                  onChange={() =>
                    handleAIFeatureToggle("voice_synthesis_enabled")
                  }
                  className="w-4 lg:w-5 h-4 lg:h-5 text-purple-600 bg-transparent border-white/30 rounded focus:ring-purple-500 flex-shrink-0"
                />
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col lg:flex-row items-center gap-2 lg:gap-4 pt-3 lg:pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full lg:flex-1 px-4 lg:px-6 py-2 lg:py-3 border border-white/20 text-white rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors text-sm lg:text-base touch-manipulation"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full lg:flex-1 px-4 lg:px-6 py-2 lg:py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 active:from-purple-800 active:to-pink-800 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base touch-manipulation"
            >
              {loading ? "Creating..." : "Create Persona"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
