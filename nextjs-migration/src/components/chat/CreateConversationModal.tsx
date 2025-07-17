"use client";

import { useState } from "react";
import { X, MessageCircle, Users } from "lucide-react";
import { Conversation } from "@/types/chat";
import { Persona } from "@/types/personas";

interface CreateConversationModalProps {
  personas: Persona[];
  onClose: () => void;
  onConversationCreated: (conversation: Conversation) => void;
}

export default function CreateConversationModal({
  personas,
  onClose,
  onConversationCreated,
}: CreateConversationModalProps) {
  const [title, setTitle] = useState("");
  const [selectedPersonaId, setSelectedPersonaId] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !selectedPersonaId) {
      setError("Please provide a title and select a persona");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          persona_id: selectedPersonaId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create conversation");
      }

      const newConversation = await response.json();
      onConversationCreated(newConversation);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create conversation"
      );
    } finally {
      setLoading(false);
    }
  };

  const getRelationIcon = (relationType: string) => {
    const iconMap: Record<string, string> = {
      parent: "👨‍👩‍👧‍👦",
      spouse: "💑",
      child: "👶",
      sibling: "👫",
      friend: "👋",
      colleague: "💼",
    };
    return iconMap[relationType] || "👤";
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg border border-white/20 w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-6 w-6 text-purple-400" />
            <div>
              <h2 className="text-xl font-bold text-white">New Conversation</h2>
              <p className="text-white/70 text-sm">
                Start chatting with one of your personas
              </p>
            </div>
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

          {/* Title */}
          <div>
            <label className="block text-white font-medium mb-2">
              Conversation Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Daily Check-in, Planning Session, Casual Chat..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          {/* Persona Selection */}
          <div>
            <label className="block text-white font-medium mb-3">
              Choose Persona *
            </label>
            {personas.length === 0 ? (
              <div className="text-center py-8 bg-white/5 rounded-lg border border-white/10">
                <Users className="h-12 w-12 text-white/30 mx-auto mb-3" />
                <p className="text-white/70 mb-4">No personas available</p>
                <p className="text-white/50 text-sm">
                  Create a persona first to start conversations
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {personas.map((persona) => (
                  <label
                    key={persona.id}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedPersonaId === persona.id
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-white/20 hover:border-white/40 hover:bg-white/5"
                    }`}
                  >
                    <input
                      type="radio"
                      value={persona.id}
                      checked={selectedPersonaId === persona.id}
                      onChange={() => setSelectedPersonaId(persona.id)}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3 w-full">
                      <div className="text-2xl">
                        {getRelationIcon(persona.relation_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">
                          {persona.name}
                        </div>
                        <div className="text-white/60 text-sm capitalize">
                          {persona.relation_type}
                        </div>
                        {persona.description && (
                          <div className="text-white/50 text-xs mt-1 truncate">
                            {persona.description}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        {persona.memory_enabled && (
                          <div
                            className="w-2 h-2 bg-blue-400 rounded-full"
                            title="Memory enabled"
                          />
                        )}
                        {persona.learning_enabled && (
                          <div
                            className="w-2 h-2 bg-green-400 rounded-full"
                            title="Learning enabled"
                          />
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
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
              disabled={
                loading ||
                !title.trim() ||
                !selectedPersonaId ||
                personas.length === 0
              }
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              {loading ? "Creating..." : "Start Conversation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
