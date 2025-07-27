import { z } from "zod";

// User schemas
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  image: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),

  // Enhanced user profile
  dateOfBirth: z.date().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  isActive: z.boolean().default(true),
  allowSocialConnections: z.boolean().default(true),
  defaultPrivacyLevel: z
    .enum(["public", "friends", "subscribers", "private"])
    .default("friends"),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

// Enhanced Persona schemas
export const personaSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  avatar: z.string().optional(),

  // Persona type and hierarchy
  personaType: z.enum(["main", "child", "public", "premium"]).default("child"),
  isMainPersona: z.boolean().default(false),
  parentPersonaId: z.string().uuid().optional(),

  // Core personality data
  traits: z.record(z.any()).optional(),
  preferences: z.record(z.any()).optional(),
  memoryContext: z.string().optional(),
  personalityProfile: z.record(z.any()).optional(),

  // Guard rails and privacy
  privacyLevel: z
    .enum(["public", "friends", "subscribers", "private"])
    .default("friends"),
  contentFilter: z
    .object({
      allowExplicit: z.boolean().default(false),
      allowPersonalInfo: z.boolean().default(true),
      allowSecrets: z.boolean().default(false),
      allowPhotos: z.boolean().default(true),
      allowVideos: z.boolean().default(true),
      customRules: z.array(z.string()).default([]),
    })
    .optional(),
  guardRails: z
    .object({
      allowedUsers: z.array(z.string()).default([]),
      blockedUsers: z.array(z.string()).default([]),
      allowedTopics: z.array(z.string()).default([]),
      blockedTopics: z.array(z.string()).default([]),
      maxInteractionDepth: z.number().default(10),
    })
    .optional(),

  // Social and monetization
  isPubliclyListed: z.boolean().default(false),
  allowConnections: z.boolean().default(true),
  requiresSubscription: z.boolean().default(false),
  subscriptionPrice: z.number().optional(),

  // Learning and interaction settings
  learningEnabled: z.boolean().default(true),
  interactionCount: z.number().default(0),
  lastInteraction: z.date().optional(),

  // Flags and status
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  isDeletable: z.boolean().default(true),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createPersonaSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  personaType: z.enum(["main", "child", "public", "premium"]).default("child"),
  parentPersonaId: z.string().uuid().optional(),
  traits: z.record(z.any()).optional(),
  preferences: z.record(z.any()).optional(),
  avatar: z.string().optional(),
  privacyLevel: z
    .enum(["public", "friends", "subscribers", "private"])
    .default("friends"),
  isPubliclyListed: z.boolean().default(false),
  allowConnections: z.boolean().default(true),
  requiresSubscription: z.boolean().default(false),
  subscriptionPrice: z.number().optional(),
  contentFilter: z
    .object({
      allowExplicit: z.boolean().default(false),
      allowPersonalInfo: z.boolean().default(true),
      allowSecrets: z.boolean().default(false),
      allowPhotos: z.boolean().default(true),
      allowVideos: z.boolean().default(true),
      customRules: z.array(z.string()).default([]),
    })
    .optional(),
});

export const updatePersonaSchema = createPersonaSchema.partial();

// User Connection schemas
export const userConnectionSchema = z.object({
  id: z.string().uuid(),
  requesterId: z.string().uuid(),
  targetPersonaId: z.string().uuid(),
  targetUserId: z.string().uuid(),
  connectionType: z.enum(["friend", "follower", "subscriber", "blocked"]),
  status: z
    .enum(["pending", "accepted", "declined", "blocked"])
    .default("pending"),
  subscriptionTier: z.enum(["basic", "premium", "vip"]).optional(),
  subscriptionPrice: z.number().optional(),
  subscriptionStartDate: z.date().optional(),
  subscriptionEndDate: z.date().optional(),
  isSubscriptionActive: z.boolean().default(false),
  customPermissions: z.record(z.boolean()).optional(),
  accessLevel: z.enum(["basic", "standard", "premium", "vip"]).default("basic"),
  retainHistoricalData: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createConnectionSchema = z.object({
  targetPersonaId: z.string().uuid(),
  connectionType: z.enum(["friend", "follower", "subscriber"]),
  subscriptionTier: z.enum(["basic", "premium", "vip"]).optional(),
  message: z.string().optional(),
});

export const updateConnectionSchema = z.object({
  status: z.enum(["accepted", "declined", "blocked"]),
  customPermissions: z.record(z.boolean()).optional(),
});

// Subscription Plan schemas
export const subscriptionPlanSchema = z.object({
  id: z.string().uuid(),
  personaId: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
  currency: z.string().default("USD"),
  billingPeriod: z
    .enum(["daily", "weekly", "monthly", "yearly"])
    .default("monthly"),
  accessLevel: z.enum(["basic", "standard", "premium", "vip"]),
  features: z.object({
    allowPhotos: z.boolean().default(true),
    allowVideos: z.boolean().default(true),
    allowPersonalInfo: z.boolean().default(false),
    allowExplicitContent: z.boolean().default(false),
    messageLimit: z.number().default(100),
    prioritySupport: z.boolean().default(false),
    customFeatures: z.array(z.string()).default([]),
  }),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createSubscriptionPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be non-negative"),
  currency: z.string().default("USD"),
  billingPeriod: z
    .enum(["daily", "weekly", "monthly", "yearly"])
    .default("monthly"),
  accessLevel: z.enum(["basic", "standard", "premium", "vip"]),
  features: z.object({
    allowPhotos: z.boolean().default(true),
    allowVideos: z.boolean().default(true),
    allowPersonalInfo: z.boolean().default(false),
    allowExplicitContent: z.boolean().default(false),
    messageLimit: z.number().default(100),
    prioritySupport: z.boolean().default(false),
    customFeatures: z.array(z.string()).default([]),
  }),
});

// Learning Interview schemas
export const learningInterviewSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  personaId: z.string().uuid(),
  sessionType: z.enum([
    "initial",
    "simple_questions",
    "complex_questions",
    "scenario_questions",
    "social_integration",
  ]),
  status: z
    .enum(["pending", "in_progress", "completed", "paused"])
    .default("pending"),
  currentQuestionIndex: z.number().default(0),
  totalQuestions: z.number().optional(),
  questionsData: z
    .object({
      questions: z.array(
        z.object({
          id: z.string(),
          question: z.string(),
          type: z.enum(["simple", "complex", "scenario", "media_upload"]),
          category: z.string(),
          answered: z.boolean().default(false),
          response: z.string().optional(),
          mediaFiles: z.array(z.string()).optional(),
          confidence: z.number().optional(),
        })
      ),
    })
    .optional(),
  insights: z.record(z.any()).optional(),
  personalityUpdates: z.record(z.any()).optional(),
  completionPercentage: z.number().default(0),
  nextSessionDate: z.date().optional(),
  remindersSent: z.number().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().optional(),
});

export const startLearningInterviewSchema = z.object({
  personaId: z.string().uuid(),
  sessionType: z.enum([
    "initial",
    "simple_questions",
    "complex_questions",
    "scenario_questions",
    "social_integration",
  ]),
});

export const answerInterviewQuestionSchema = z.object({
  interviewId: z.string().uuid(),
  questionId: z.string(),
  response: z.string().optional(),
  mediaFiles: z.array(z.string()).optional(),
  skipQuestion: z.boolean().default(false),
});

// Chat conversation schemas
export const conversationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  personaId: z.string().uuid().optional(),
  title: z.string().optional(),
  conversationType: z
    .enum(["chat", "learning_interview", "social_interaction"])
    .default("chat"),
  privacyLevel: z.enum(["private", "friends", "public"]).default("private"),
  allowedUsers: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createConversationSchema = z.object({
  personaId: z.string().uuid(),
  title: z.string().optional(),
  conversationType: z
    .enum(["chat", "learning_interview", "social_interaction"])
    .default("chat"),
  privacyLevel: z.enum(["private", "friends", "public"]).default("private"),
});

// Message schemas
export const messageSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  messageType: z
    .enum(["text", "media", "learning_response", "system_notification"])
    .default("text"),
  metadata: z.record(z.any()).optional(),
  personalityInsights: z.record(z.any()).optional(),
  isLearningData: z.boolean().default(false),
  createdAt: z.date(),
});

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1, "Message content is required"),
  mediaFiles: z.array(z.string()).optional(),
});

// File upload schemas
export const requestPresignedUrlSchema = z.object({
  fileName: z.string(),
  fileType: z.string(),
  fileSize: z.number(),
  personaId: z.string().uuid().optional(),
  conversationId: z.string().uuid().optional(),
});

export const updateFileStatusSchema = z.object({
  fileId: z.string(),
  status: z.enum(["pending", "completed", "deleted", "failure"]),
  uploadedAt: z.date().optional(),
});

// Type exports
export type User = z.infer<typeof userSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type Login = z.infer<typeof loginSchema>;
export type Persona = z.infer<typeof personaSchema>;
export type CreatePersona = z.infer<typeof createPersonaSchema>;
export type UpdatePersona = z.infer<typeof updatePersonaSchema>;
export type UserConnection = z.infer<typeof userConnectionSchema>;
export type CreateConnection = z.infer<typeof createConnectionSchema>;
export type UpdateConnection = z.infer<typeof updateConnectionSchema>;
export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;
export type CreateSubscriptionPlan = z.infer<
  typeof createSubscriptionPlanSchema
>;
export type LearningInterview = z.infer<typeof learningInterviewSchema>;
export type StartLearningInterview = z.infer<
  typeof startLearningInterviewSchema
>;
export type AnswerInterviewQuestion = z.infer<
  typeof answerInterviewQuestionSchema
>;
export type Conversation = z.infer<typeof conversationSchema>;
export type CreateConversation = z.infer<typeof createConversationSchema>;
export type Message = z.infer<typeof messageSchema>;
export type SendMessage = z.infer<typeof sendMessageSchema>;

// AI Learning Question Types
export interface LearningQuestion {
  id: string;
  question: string;
  type: "simple" | "complex" | "scenario" | "media_upload";
  category: string;
  expectedResponseType?: "text" | "video" | "image" | "audio";
  followUpQuestions?: string[];
  personalityInsights?: string[];
}

// Guard Rail Types
export interface GuardRail {
  allowExplicit: boolean;
  allowPersonalInfo: boolean;
  allowSecrets: boolean;
  allowPhotos: boolean;
  allowVideos: boolean;
  allowedUsers: string[];
  blockedUsers: string[];
  allowedTopics: string[];
  blockedTopics: string[];
  maxInteractionDepth: number;
  customRules: string[];
}

// Social Connection Types
export interface SocialConnectionRequest {
  fromUserId: string;
  fromUserName: string;
  targetPersonaId: string;
  targetPersonaName: string;
  connectionType: "friend" | "follower" | "subscriber";
  message?: string;
  subscriptionTier?: "basic" | "premium" | "vip";
}

// Persona Discovery Types
export interface PersonaDiscovery {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  ownerName: string;
  privacyLevel: "public" | "friends" | "subscribers" | "private";
  requiresSubscription: boolean;
  subscriptionPrice?: number;
  connectionCount: number;
  isConnected: boolean;
  connectionStatus?: "pending" | "accepted" | "blocked";
}
