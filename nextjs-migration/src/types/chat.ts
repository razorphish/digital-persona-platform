// Chat System Types for Next.js Migration

export interface Conversation {
  id: number;
  title: string;
  persona_id: number;
  user_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant';
  content: string;
  tokens_used?: number;
  model_used?: string;
  response_time_ms?: number;
  created_at: string;
}

// Request Types
export interface ConversationCreateRequest {
  title: string;
  persona_id: number;
}

export interface MessageCreateRequest {
  content: string;
}

// Response Types
export interface ConversationResponse {
  id: number;
  title: string;
  persona_id: number;
  user_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MessageResponse {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant';
  content: string;
  tokens_used?: number;
  model_used?: string;
  response_time_ms?: number;
  created_at: string;
}

export interface ChatResponse {
  conversation: ConversationResponse;
  user_message: MessageResponse;
  assistant_message: MessageResponse;
}

export interface OpenAIModel {
  id: string;
  created: number;
  owned_by: string;
}

export interface ModelsResponse {
  models: OpenAIModel[];
  default_model: string;
  total_models: number;
}

// Error Types
export interface ChatError {
  error: string;
  details?: string;
  status_code?: number;
}

// Database Types (for internal use)
export interface ConversationDB {
  id: number;
  title: string;
  persona_id: number;
  user_id: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ChatMessageDB {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant';
  content: string;
  tokens_used?: number;
  model_used?: string;
  response_time_ms?: number;
  created_at: Date;
}

// Validation Types
export interface ConversationCreateData {
  title: string;
  persona_id: number;
}

export interface MessageCreateData {
  content: string;
} 