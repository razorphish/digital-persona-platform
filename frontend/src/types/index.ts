// User types
export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

// Persona types
export interface Persona {
  id: number;
  name: string;
  description?: string;
  relation_type:
    | "self"
    | "parent"
    | "spouse"
    | "child"
    | "sibling"
    | "friend"
    | "colleague"
    | "other";
  created_at: string;
  status: string;
  user_id: number;
  // AI Capabilities
  image_analysis_enabled?: boolean;
  voice_synthesis_enabled?: boolean;
  memory_enabled?: boolean;
  learning_enabled?: boolean;
  voice_settings?: string;
}

export interface CreatePersonaRequest {
  name: string;
  description?: string;
  relation_type:
    | "self"
    | "parent"
    | "spouse"
    | "child"
    | "sibling"
    | "friend"
    | "colleague"
    | "other";
  // AI Capabilities
  image_analysis_enabled?: boolean;
  voice_synthesis_enabled?: boolean;
  memory_enabled?: boolean;
  learning_enabled?: boolean;
}

// Conversation types
export interface Conversation {
  id: number;
  title: string;
  persona_id: number;
  user_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateConversationRequest {
  title: string;
  persona_id: number;
}

// Message types
export interface Message {
  id: number;
  conversation_id: number;
  role: "user" | "assistant";
  content: string;
  tokens_used?: number;
  model_used?: string;
  response_time_ms?: number;
  created_at: string;
}

export interface SendMessageRequest {
  content: string;
}

export interface ChatResponse {
  conversation: Conversation;
  user_message: Message;
  assistant_message: Message;
}

// File upload types
export interface MediaFile {
  id: number;
  filename: string;
  file_path: string;
  file_type: string;
  file_size: number;
  user_id: number;
  created_at: string;
}

// Stats types
export interface ChatStats {
  total_conversations: number;
  total_messages: number;
  total_tokens: number;
  estimated_cost_usd: number;
  user_id: number;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  username: string;
  full_name?: string;
}

// AI Capabilities types
export interface ImageAnalysisResult {
  success: boolean;
  analysis: Record<string, any>;
  media_file_id: number;
}

export interface VoiceSynthesisResult {
  success: boolean;
  synthesis: {
    audio_url: string;
    voice: string;
    engine: string;
    duration: number;
  };
  message_id: number;
}

export interface PersonaMemory {
  id: number;
  type: string;
  content: string;
  importance: number;
  created_at: string;
  last_accessed: string;
}

export interface PersonaMemoriesResponse {
  success: boolean;
  memories: PersonaMemory[];
  count: number;
}
