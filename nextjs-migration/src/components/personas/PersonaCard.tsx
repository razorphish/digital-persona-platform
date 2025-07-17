"use client";

import React from "react";
import {
  Edit3,
  Trash2,
  MessageCircle,
  Brain,
  Eye,
  Mic,
  Settings,
} from "lucide-react";
import { Persona } from "@/types/personas";

interface PersonaCardProps {
  persona: Persona;
  onEdit: (persona: Persona) => void;
  onDelete: (persona: Persona) => void;
  onStartConversation: (personaId: number) => void;
}

const PersonaCard = React.memo(function PersonaCard({
  persona,
  onEdit,
  onDelete,
  onStartConversation,
}: PersonaCardProps) {
  const handleEdit = React.useCallback(() => {
    onEdit(persona);
  }, [persona, onEdit]);

  const handleDelete = React.useCallback(() => {
    onDelete(persona);
  }, [persona, onDelete]);

  const handleStartConversation = React.useCallback(() => {
    onStartConversation(persona.id);
  }, [persona.id, onStartConversation]);

  const relationIcon = React.useMemo(() => {
    const iconMap: Record<string, string> = {
      parent: "👨‍👩‍👧‍👦",
      spouse: "💑",
      child: "👶",
      sibling: "👫",
      friend: "👋",
      colleague: "💼",
    };
    return iconMap[persona.relation_type] || "👤";
  }, [persona.relation_type]);

  const aiCapabilitiesCount = React.useMemo(() => {
    let count = 0;
    if (persona.memory_enabled) count++;
    if (persona.learning_enabled) count++;
    if (persona.image_analysis_enabled) count++;
    if (persona.voice_synthesis_enabled) count++;
    return count;
  }, [
    persona.memory_enabled,
    persona.learning_enabled,
    persona.image_analysis_enabled,
    persona.voice_synthesis_enabled,
  ]);

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-4 lg:p-6 hover:bg-white/15 transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3 lg:mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl lg:text-3xl">{relationIcon}</div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg lg:text-xl font-bold text-white truncate">
              {persona.name}
            </h3>
            <p className="text-white/60 text-sm lg:text-base capitalize">
              {persona.relation_type}
            </p>
          </div>
        </div>

        {/* Action buttons - hidden on mobile, shown on desktop, always visible on mobile when parent is hovered */}
        <div className="flex items-center gap-1 lg:gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={handleEdit}
            className="p-2 lg:p-2 hover:bg-white/20 active:bg-white/30 rounded-lg transition-colors touch-manipulation"
            title="Edit persona"
          >
            <Edit3 className="h-4 w-4 text-white/70" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 lg:p-2 hover:bg-red-500/20 active:bg-red-500/30 rounded-lg transition-colors touch-manipulation"
            title="Delete persona"
          >
            <Trash2 className="h-4 w-4 text-red-400" />
          </button>
        </div>
      </div>

      {/* Description */}
      {persona.description && (
        <p className="text-white/70 text-sm lg:text-base mb-3 lg:mb-4 line-clamp-2">
          {persona.description}
        </p>
      )}

      {/* AI Capabilities */}
      <div className="flex items-center gap-2 mb-3 lg:mb-4 flex-wrap">
        <div className="flex items-center gap-1">
          <Settings className="h-4 w-4 text-white/50" />
          <span className="text-xs lg:text-sm text-white/60">
            {aiCapabilitiesCount} AI features
          </span>
        </div>

        <div className="flex items-center gap-2">
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
          {persona.image_analysis_enabled && (
            <div
              className="w-2 h-2 bg-purple-400 rounded-full"
              title="Image analysis enabled"
            />
          )}
          {persona.voice_synthesis_enabled && (
            <div
              className="w-2 h-2 bg-orange-400 rounded-full"
              title="Voice synthesis enabled"
            />
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1 lg:gap-0 text-xs lg:text-sm text-white/60 mb-3 lg:mb-4">
        <span>{persona.interaction_count || 0} interactions</span>
        <span>Created {new Date(persona.created_at).toLocaleDateString()}</span>
      </div>

      {/* Chat Button */}
      <button
        onClick={handleStartConversation}
        className="w-full px-3 lg:px-4 py-2 lg:py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 active:from-blue-700 active:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm lg:text-base touch-manipulation"
      >
        <MessageCircle className="h-4 w-4" />
        Start Conversation
      </button>
    </div>
  );
});

export default PersonaCard;
