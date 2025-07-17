"use client";

import { useState } from "react";
import { X, Brain, Eye, Mic } from "lucide-react";
import { Persona, PersonaUpdate } from "@/types/personas";

interface EditPersonaModalProps {
  persona: Persona;
  onClose: () => void;
  onPersonaUpdated: (persona: Persona) => void;
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

export default function EditPersonaModal({
  persona,
  onClose,
  onPersonaUpdated,
}: EditPersonaModalProps) {
  const [formData, setFormData] = useState<PersonaUpdate>({
    name: persona.name,
    description: persona.description || "",
    relation_type: persona.relation_type,
  });
  const [aiFeatures, setAiFeatures] = useState({
    memory_enabled: persona.memory_enabled,
    learning_enabled: persona.learning_enabled,
    image_analysis_enabled: persona.image_analysis_enabled,
    voice_synthesis_enabled: persona.voice_synthesis_enabled,
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
      const response = await fetch(`/api/personas/${persona.id}`, {
        method: "PUT",
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
        throw new Error(errorData.error || "Failed to update persona");
      }

      const updatedPersona = await response.json();
      onPersonaUpdated(updatedPersona);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update persona");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof PersonaUpdate, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAIFeatureToggle = (feature: keyof typeof aiFeatures) => {
    setAiFeatures((prev) => ({ ...prev, [feature]: !prev[feature] }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg border border-white/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div>
            <h2 className="text-2xl font-bold text-white">Edit Persona</h2>
            <p className="text-white/70 mt-1">
              Update {persona.name}'s characteristics
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white/70" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-white font-medium mb-2">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {RELATION_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                    formData.relation_type === type.value
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-white/20 hover:border-white/40"
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
                    <div className="text-white font-medium">{type.label}</div>
                    <div className="text-white/60 text-sm">
                      {type.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-white font-medium mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe this persona's characteristics, personality, or role..."
              rows={3}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>

          {/* AI Features */}
          <div>
            <label className="block text-white font-medium mb-4">
              AI Capabilities
            </label>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-3">
                  <Brain className="h-5 w-5 text-blue-400" />
                  <div>
                    <div className="text-white font-medium">Memory System</div>
                    <div className="text-white/60 text-sm">
                      Remember past conversations and interactions
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={aiFeatures.memory_enabled}
                  onChange={() => handleAIFeatureToggle("memory_enabled")}
                  className="w-5 h-5 text-purple-600 bg-transparent border-white/30 rounded focus:ring-purple-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-3">
                  <Brain className="h-5 w-5 text-green-400" />
                  <div>
                    <div className="text-white font-medium">
                      Personality Learning
                    </div>
                    <div className="text-white/60 text-sm">
                      Adapt responses based on interactions
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={aiFeatures.learning_enabled}
                  onChange={() => handleAIFeatureToggle("learning_enabled")}
                  className="w-5 h-5 text-purple-600 bg-transparent border-white/30 rounded focus:ring-purple-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-purple-400" />
                  <div>
                    <div className="text-white font-medium">Image Analysis</div>
                    <div className="text-white/60 text-sm">
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
                  className="w-5 h-5 text-purple-600 bg-transparent border-white/30 rounded focus:ring-purple-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-3">
                  <Mic className="h-5 w-5 text-orange-400" />
                  <div>
                    <div className="text-white font-medium">
                      Voice Synthesis
                    </div>
                    <div className="text-white/60 text-sm">
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
                  className="w-5 h-5 text-purple-600 bg-transparent border-white/30 rounded focus:ring-purple-500"
                />
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update Persona"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
