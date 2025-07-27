import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  uuid,
  jsonb,
  serial,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  name: text("name").notNull(),
  passwordHash: text("password_hash"),
  emailVerified: timestamp("email_verified"),
  image: text("image"),

  // Enhanced user profile for persona system
  dateOfBirth: timestamp("date_of_birth"),
  location: text("location"),
  bio: text("bio"),

  // Account settings
  isActive: boolean("is_active").default(true),
  allowSocialConnections: boolean("allow_social_connections").default(true),
  defaultPrivacyLevel: text("default_privacy_level", {
    enum: ["public", "friends", "subscribers", "private"],
  }).default("friends"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Auth sessions (for better-auth)
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Auth accounts (for social login)
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Enhanced User personas with main/child relationship support
export const personas = pgTable("personas", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Basic persona info
  name: text("name").notNull(),
  description: text("description"),
  avatar: text("avatar"),

  // Persona type and hierarchy
  personaType: text("persona_type", {
    enum: ["main", "child", "public", "premium"],
  })
    .notNull()
    .default("child"),
  isMainPersona: boolean("is_main_persona").default(false), // Only one main persona per user
  parentPersonaId: uuid("parent_persona_id"),

  // Core personality data
  traits: jsonb("traits").$type<Record<string, any>>(),
  preferences: jsonb("preferences").$type<Record<string, any>>(),
  memoryContext: text("memory_context"), // Long-form learned information
  personalityProfile: jsonb("personality_profile").$type<Record<string, any>>(),

  // Guard rails and privacy
  privacyLevel: text("privacy_level", {
    enum: ["public", "friends", "subscribers", "private"],
  }).default("friends"),
  contentFilter: jsonb("content_filter").$type<{
    allowExplicit: boolean;
    allowPersonalInfo: boolean;
    allowSecrets: boolean;
    allowPhotos: boolean;
    allowVideos: boolean;
    customRules: string[];
  }>(),
  guardRails: jsonb("guard_rails").$type<{
    allowedUsers: string[];
    blockedUsers: string[];
    allowedTopics: string[];
    blockedTopics: string[];
    maxInteractionDepth: number;
  }>(),

  // Social and monetization
  isPubliclyListed: boolean("is_publicly_listed").default(false),
  allowConnections: boolean("allow_connections").default(true),
  requiresSubscription: boolean("requires_subscription").default(false),
  subscriptionPrice: decimal("subscription_price", { precision: 10, scale: 2 }),

  // Learning and interaction settings
  learningEnabled: boolean("learning_enabled").default(true),
  interactionCount: integer("interaction_count").default(0),
  lastInteraction: timestamp("last_interaction"),

  // Flags and status
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  isDeletable: boolean("is_deletable").default(true), // Main personas are not deletable

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User connections (friending, following, subscribing)
export const userConnections = pgTable("user_connections", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Connection participants
  requesterId: uuid("requester_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  targetPersonaId: uuid("target_persona_id")
    .notNull()
    .references(() => personas.id, { onDelete: "cascade" }),
  targetUserId: uuid("target_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Connection type and status
  connectionType: text("connection_type", {
    enum: ["friend", "follower", "subscriber", "blocked"],
  }).notNull(),
  status: text("status", {
    enum: ["pending", "accepted", "declined", "blocked"],
  }).default("pending"),

  // Subscription details
  subscriptionTier: text("subscription_tier", {
    enum: ["basic", "premium", "vip"],
  }),
  subscriptionPrice: decimal("subscription_price", { precision: 10, scale: 2 }),
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  isSubscriptionActive: boolean("is_subscription_active").default(false),

  // Permission overrides
  customPermissions:
    jsonb("custom_permissions").$type<Record<string, boolean>>(),
  accessLevel: text("access_level", {
    enum: ["basic", "standard", "premium", "vip"],
  }).default("basic"),

  // Historical data handling
  retainHistoricalData: boolean("retain_historical_data").default(true),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Subscription plans for personas
export const subscriptionPlans = pgTable("subscription_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  personaId: uuid("persona_id")
    .notNull()
    .references(() => personas.id, { onDelete: "cascade" }),

  // Plan details
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  billingPeriod: text("billing_period", {
    enum: ["daily", "weekly", "monthly", "yearly"],
  }).default("monthly"),

  // Access controls
  accessLevel: text("access_level", {
    enum: ["basic", "standard", "premium", "vip"],
  }).notNull(),
  features: jsonb("features").$type<{
    allowPhotos: boolean;
    allowVideos: boolean;
    allowPersonalInfo: boolean;
    allowExplicitContent: boolean;
    messageLimit: number;
    prioritySupport: boolean;
    customFeatures: string[];
  }>(),

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// AI Learning sessions for building main personas
export const learningInterviews = pgTable("learning_interviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  personaId: uuid("persona_id")
    .notNull()
    .references(() => personas.id, { onDelete: "cascade" }),

  // Interview session details
  sessionType: text("session_type", {
    enum: [
      "initial",
      "simple_questions",
      "complex_questions",
      "scenario_questions",
      "social_integration",
    ],
  }).notNull(),
  status: text("status", {
    enum: ["pending", "in_progress", "completed", "paused"],
  }).default("pending"),

  // Question and response tracking
  currentQuestionIndex: integer("current_question_index").default(0),
  totalQuestions: integer("total_questions"),
  questionsData: jsonb("questions_data").$type<{
    questions: Array<{
      id: string;
      question: string;
      type: "simple" | "complex" | "scenario" | "media_upload";
      category: string;
      answered: boolean;
      response?: string;
      mediaFiles?: string[];
      confidence?: number;
    }>;
  }>(),

  // Learning outcomes
  insights: jsonb("insights").$type<Record<string, any>>(),
  personalityUpdates: jsonb("personality_updates").$type<Record<string, any>>(),
  completionPercentage: integer("completion_percentage").default(0),

  // Scheduling
  nextSessionDate: timestamp("next_session_date"),
  remindersSent: integer("reminders_sent").default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Chat conversations
export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  personaId: uuid("persona_id").references(() => personas.id, {
    onDelete: "set null",
  }),

  // Enhanced conversation metadata
  title: text("title"),
  conversationType: text("conversation_type", {
    enum: ["chat", "learning_interview", "social_interaction"],
  }).default("chat"),

  // Privacy and access
  privacyLevel: text("privacy_level", {
    enum: ["private", "friends", "public"],
  }).default("private"),
  allowedUsers: jsonb("allowed_users").$type<string[]>(),

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Chat messages
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
  content: text("content").notNull(),

  // Enhanced message metadata
  messageType: text("message_type", {
    enum: ["text", "media", "learning_response", "system_notification"],
  }).default("text"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),

  // Learning and analysis
  personalityInsights: jsonb("personality_insights").$type<
    Record<string, any>
  >(),
  isLearningData: boolean("is_learning_data").default(false),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Social media connections
export const socialConnections = pgTable("social_connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  platform: text("platform", {
    enum: ["twitter", "instagram", "facebook", "linkedin", "tiktok"],
  }).notNull(),
  platformUserId: text("platform_user_id").notNull(),
  platformUsername: text("platform_username"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiry: timestamp("token_expiry"),
  isActive: boolean("is_active").default(true),
  lastSync: timestamp("last_sync"),

  // Learning preferences
  allowLearning: boolean("allow_learning").default(true),
  learningFrequency: text("learning_frequency", {
    enum: ["real_time", "daily", "weekly", "manual"],
  }).default("daily"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Social media posts (imported from platforms)
export const socialPosts = pgTable("social_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  connectionId: uuid("connection_id")
    .notNull()
    .references(() => socialConnections.id, { onDelete: "cascade" }),
  platformPostId: text("platform_post_id").notNull(),
  content: text("content"),
  postType: text("post_type"), // tweet, story, post, etc.
  mediaUrls: jsonb("media_urls").$type<string[]>(),
  likes: integer("likes").default(0),
  shares: integer("shares").default(0),
  comments: integer("comments").default(0),
  publishedAt: timestamp("published_at"),
  importedAt: timestamp("imported_at").defaultNow().notNull(),

  // Learning integration
  processedForLearning: boolean("processed_for_learning").default(false),
  learningInsights: jsonb("learning_insights").$type<Record<string, any>>(),
});

// Persona learning data (extracted from social posts)
export const personaLearningData = pgTable("persona_learning_data", {
  id: uuid("id").primaryKey().defaultRandom(),
  personaId: uuid("persona_id")
    .notNull()
    .references(() => personas.id, { onDelete: "cascade" }),
  sourceType: text("source_type", {
    enum: [
      "social_post",
      "chat_message",
      "manual_input",
      "media_file",
      "learning_interview",
    ],
  }).notNull(),
  sourceId: text("source_id"), // reference to the source (post id, message id, etc.)
  content: text("content").notNull(),
  insights: jsonb("insights").$type<Record<string, any>>(), // AI-extracted insights
  confidence: integer("confidence").default(50), // 0-100 confidence score
  processed: boolean("processed").default(false),

  // Learning categorization
  category: text("category", {
    enum: [
      "personality",
      "preferences",
      "memories",
      "relationships",
      "skills",
      "interests",
    ],
  }),
  importance: integer("importance").default(50), // 0-100 importance score

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Media files (for file uploads with S3 integration)
export const mediaFiles = pgTable("media_files", {
  id: serial("id").primaryKey(),
  fileId: text("file_id").unique().notNull(), // UUID for file identification
  filename: text("filename").notNull(),
  originalFilename: text("original_filename").notNull(),
  filePath: text("file_path"),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  mediaType: text("media_type").notNull(), // image, video, document, etc.

  // S3 Integration
  s3Key: text("s3_key"),
  s3Bucket: text("s3_bucket"),
  s3Url: text("s3_url"),
  presignedUrl: text("presigned_url"), // For direct S3 uploads
  isS3Stored: boolean("is_s3_stored").default(false),
  uploadMethod: text("upload_method").default("direct"), // direct, multipart, etc.

  // Upload Status Management
  uploadStatus: text("upload_status", {
    enum: ["pending", "completed", "deleted", "failure", "archived"],
  })
    .default("pending")
    .notNull(),

  // User/Persona Relations
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  personaId: uuid("persona_id").references(() => personas.id, {
    onDelete: "set null",
  }),
  conversationId: uuid("conversation_id").references(() => conversations.id, {
    onDelete: "set null",
  }),

  // Enhanced privacy and access controls
  privacyLevel: text("privacy_level", {
    enum: ["public", "friends", "subscribers", "private"],
  }).default("private"),
  allowedUsers: jsonb("allowed_users").$type<string[]>(),
  requiresSubscription: boolean("requires_subscription").default(false),

  // Metadata
  description: text("description"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),

  // Learning integration
  isLearningData: boolean("is_learning_data").default(false),
  aiAnalysis: jsonb("ai_analysis").$type<Record<string, any>>(),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  uploadedAt: timestamp("uploaded_at"), // When file was successfully uploaded to S3
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  personas: many(personas),
  conversations: many(conversations),
  socialConnections: many(socialConnections),
  mediaFiles: many(mediaFiles),
  learningInterviews: many(learningInterviews),
  outgoingConnections: many(userConnections, {
    relationName: "requesterConnections",
  }),
  incomingConnections: many(userConnections, {
    relationName: "targetConnections",
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const personasRelations = relations(personas, ({ one, many }) => ({
  user: one(users, {
    fields: [personas.userId],
    references: [users.id],
  }),
  parentPersona: one(personas, {
    fields: [personas.parentPersonaId],
    references: [personas.id],
    relationName: "parentChild",
  }),
  childPersonas: many(personas, {
    relationName: "parentChild",
  }),
  conversations: many(conversations),
  learningData: many(personaLearningData),
  mediaFiles: many(mediaFiles),
  learningInterviews: many(learningInterviews),
  subscriptionPlans: many(subscriptionPlans),
  connections: many(userConnections),
}));

export const userConnectionsRelations = relations(
  userConnections,
  ({ one }) => ({
    requester: one(users, {
      fields: [userConnections.requesterId],
      references: [users.id],
      relationName: "requesterConnections",
    }),
    targetUser: one(users, {
      fields: [userConnections.targetUserId],
      references: [users.id],
      relationName: "targetConnections",
    }),
    targetPersona: one(personas, {
      fields: [userConnections.targetPersonaId],
      references: [personas.id],
    }),
  })
);

export const subscriptionPlansRelations = relations(
  subscriptionPlans,
  ({ one }) => ({
    persona: one(personas, {
      fields: [subscriptionPlans.personaId],
      references: [personas.id],
    }),
  })
);

export const learningInterviewsRelations = relations(
  learningInterviews,
  ({ one }) => ({
    user: one(users, {
      fields: [learningInterviews.userId],
      references: [users.id],
    }),
    persona: one(personas, {
      fields: [learningInterviews.personaId],
      references: [personas.id],
    }),
  })
);

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    user: one(users, {
      fields: [conversations.userId],
      references: [users.id],
    }),
    persona: one(personas, {
      fields: [conversations.personaId],
      references: [personas.id],
    }),
    messages: many(messages),
    mediaFiles: many(mediaFiles),
  })
);

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const socialConnectionsRelations = relations(
  socialConnections,
  ({ one, many }) => ({
    user: one(users, {
      fields: [socialConnections.userId],
      references: [users.id],
    }),
    posts: many(socialPosts),
  })
);

export const socialPostsRelations = relations(socialPosts, ({ one }) => ({
  connection: one(socialConnections, {
    fields: [socialPosts.connectionId],
    references: [socialConnections.id],
  }),
}));

export const personaLearningDataRelations = relations(
  personaLearningData,
  ({ one }) => ({
    persona: one(personas, {
      fields: [personaLearningData.personaId],
      references: [personas.id],
    }),
  })
);

export const mediaFilesRelations = relations(mediaFiles, ({ one }) => ({
  user: one(users, {
    fields: [mediaFiles.userId],
    references: [users.id],
  }),
  persona: one(personas, {
    fields: [mediaFiles.personaId],
    references: [personas.id],
  }),
  conversation: one(conversations, {
    fields: [mediaFiles.conversationId],
    references: [conversations.id],
  }),
}));

// Export the database connection
export { drizzle } from "drizzle-orm/postgres-js";
