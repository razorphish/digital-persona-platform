// Persona type definitions for the Next.js migration

export interface PersonaCreate {
  name: string;
  description?: string;
  relation_type: string;
}

export interface PersonaUpdate extends PersonaCreate {}

export interface PersonaLearningData {
  text: string;
}

export interface Persona {
  id: number;
  name: string;
  description?: string;
  relation_type: string;
  created_at: string;
  updated_at: string;
  status: string;
  user_id: number;

  // AI & Learning Features
  personality_traits?: Record<string, any>;
  voice_settings?: Record<string, any>;
  memory_enabled: boolean;
  learning_enabled: boolean;
  image_analysis_enabled: boolean;
  voice_synthesis_enabled: boolean;
  learned_preferences?: Record<string, any>;
  conversation_patterns?: Record<string, any>;
  emotional_responses?: Record<string, any>;
  memory_context?: string;
  last_interaction?: string;
  interaction_count: number;
}

export interface PersonaResponse extends Persona {}

export interface PersonaSummary {
  persona_id: number;
  summary: string;
  created_at: string;
  age_days: number;
  interaction_count: number;
}

// Valid relation types
export const VALID_RELATION_TYPES = [
  "self",
  "parent",
  "spouse",
  "child",
  "sibling",
  "friend",
  "colleague",
  "other",
] as const;

export type RelationType = (typeof VALID_RELATION_TYPES)[number];

// Validation functions
export function validatePersonaCreate(data: any): PersonaCreate {
  if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
    throw new Error("Name is required and cannot be empty");
  }

  if (
    !data.relation_type ||
    !VALID_RELATION_TYPES.includes(data.relation_type.toLowerCase())
  ) {
    throw new Error(
      `Relation type must be one of: ${VALID_RELATION_TYPES.join(", ")}`
    );
  }

  return {
    name: data.name.trim(),
    description: data.description?.trim() || undefined,
    relation_type: data.relation_type.toLowerCase(),
  };
}
