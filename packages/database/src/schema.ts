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

// Creator Verification System
export const creatorVerifications = pgTable("creator_verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Verification status
  status: text("status", {
    enum: ["pending", "in_review", "approved", "rejected", "suspended"],
  }).default("pending"),
  verificationLevel: text("verification_level", {
    enum: ["basic", "enhanced", "premium"],
  }).default("basic"),

  // Identity verification
  legalName: text("legal_name"),
  dateOfBirth: timestamp("date_of_birth"),
  governmentIdType: text("government_id_type", {
    enum: ["drivers_license", "passport", "state_id", "national_id"],
  }),
  governmentIdNumber: text("government_id_number"), // Encrypted
  governmentIdExpiryDate: timestamp("government_id_expiry_date"),
  
  // Address verification
  addressLine1: text("address_line1"),
  addressLine2: text("address_line2"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  country: text("country").default("US"),
  
  // Facial recognition verification
  faceVerificationScore: decimal("face_verification_score", { precision: 4, scale: 3 }),
  faceVerificationProvider: text("face_verification_provider", {
    enum: ["aws_rekognition", "azure_face", "google_vision"],
  }),
  faceVerificationId: text("face_verification_id"),
  faceVerificationCompletedAt: timestamp("face_verification_completed_at"),

  // Banking information
  bankAccountVerified: boolean("bank_account_verified").default(false),
  bankName: text("bank_name"),
  bankAccountType: text("bank_account_type", {
    enum: ["checking", "savings"],
  }),
  bankAccountLast4: text("bank_account_last4"), // Only last 4 digits stored
  routingNumber: text("routing_number"), // Encrypted
  
  // Tax information
  taxIdType: text("tax_id_type", {
    enum: ["ssn", "ein", "itin"],
  }),
  taxIdLast4: text("tax_id_last4"), // Only last 4 digits stored
  taxFormsSubmitted: jsonb("tax_forms_submitted").$type<{
    w9: boolean;
    w8: boolean;
    additionalForms: string[];
  }>(),
  
  // Verification metadata
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  verificationDocumentIds: jsonb("verification_document_ids").$type<string[]>(),
  verificationNotes: text("verification_notes"),
  reviewedBy: uuid("reviewed_by"), // Admin user ID
  reviewedAt: timestamp("reviewed_at"),
  
  // Rejection/suspension details
  rejectionReason: text("rejection_reason"),
  suspensionReason: text("suspension_reason"),
  appealSubmittedAt: timestamp("appeal_submitted_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  suspendedAt: timestamp("suspended_at"),
});

// Verification Documents Storage
export const verificationDocuments = pgTable("verification_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  verificationId: uuid("verification_id")
    .notNull()
    .references(() => creatorVerifications.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Document details
  documentType: text("document_type", {
    enum: [
      "government_id_front",
      "government_id_back", 
      "selfie_with_id",
      "utility_bill",
      "bank_statement",
      "tax_document",
      "business_license",
      "proof_of_address"
    ],
  }).notNull(),
  documentName: text("document_name").notNull(),
  
  // File storage
  s3Bucket: text("s3_bucket").notNull(),
  s3Key: text("s3_key").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  
  // Processing status
  status: text("status", {
    enum: ["uploaded", "processing", "verified", "rejected"],
  }).default("uploaded"),
  
  // AI verification results
  ocrText: text("ocr_text"), // Extracted text from document
  confidenceScore: decimal("confidence_score", { precision: 4, scale: 3 }),
  processingResults: jsonb("processing_results").$type<Record<string, any>>(),
  
  // Security
  encryptionKey: text("encryption_key"), // For sensitive documents
  retentionExpiryDate: timestamp("retention_expiry_date"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  verifiedAt: timestamp("verified_at"),
});

// Stripe Connect Accounts for Creator Payouts
export const stripeAccounts = pgTable("stripe_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  verificationId: uuid("verification_id")
    .references(() => creatorVerifications.id, { onDelete: "set null" }),

  // Stripe account details
  stripeAccountId: text("stripe_account_id").unique().notNull(),
  stripeAccountType: text("stripe_account_type", {
    enum: ["standard", "express", "custom"],
  }).default("express"),
  
  // Account status
  chargesEnabled: boolean("charges_enabled").default(false),
  payoutsEnabled: boolean("payouts_enabled").default(false),
  detailsSubmitted: boolean("details_submitted").default(false),
  
  // Onboarding
  onboardingUrl: text("onboarding_url"),
  onboardingExpiresAt: timestamp("onboarding_expires_at"),
  onboardingCompletedAt: timestamp("onboarding_completed_at"),
  
  // Requirements tracking
  currentlyDue: jsonb("currently_due").$type<string[]>(),
  eventuallyDue: jsonb("eventually_due").$type<string[]>(),
  pastDue: jsonb("past_due").$type<string[]>(),
  pendingVerification: jsonb("pending_verification").$type<string[]>(),
  
  // Account capabilities
  capabilities: jsonb("capabilities").$type<Record<string, string>>(),
  requirements: jsonb("requirements").$type<Record<string, any>>(),
  
  // Payout settings
  payoutSchedule: jsonb("payout_schedule").$type<{
    interval: "daily" | "weekly" | "monthly";
    monthlyAnchor?: number;
    weeklyAnchor?: string;
    delayDays?: number;
  }>(),
  defaultCurrency: text("default_currency").default("usd"),
  
  // Status tracking
  isActive: boolean("is_active").default(true),
  lastWebhookAt: timestamp("last_webhook_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Creator Earnings and Revenue Tracking
export const creatorEarnings = pgTable("creator_earnings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeAccountId: uuid("stripe_account_id")
    .notNull()
    .references(() => stripeAccounts.id, { onDelete: "cascade" }),

  // Earnings period
  periodType: text("period_type", {
    enum: ["daily", "weekly", "monthly", "yearly"],
  }).notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Revenue breakdown
  grossRevenue: decimal("gross_revenue", { precision: 12, scale: 2 }).default("0.00"),
  platformFee: decimal("platform_fee", { precision: 12, scale: 2 }).default("0.00"), // 3%
  processingFee: decimal("processing_fee", { precision: 12, scale: 2 }).default("0.00"), // Stripe fees
  netEarnings: decimal("net_earnings", { precision: 12, scale: 2 }).default("0.00"), // 97% to creator
  
  // Subscription metrics
  totalSubscribers: integer("total_subscribers").default(0),
  newSubscribers: integer("new_subscribers").default(0),
  cancelledSubscribers: integer("cancelled_subscribers").default(0),
  
  // Interaction metrics
  totalInteractions: integer("total_interactions").default(0),
  paidInteractions: integer("paid_interactions").default(0),
  freeInteractions: integer("free_interactions").default(0),
  
  // Time-based billing
  totalBillableMinutes: integer("total_billable_minutes").default(0),
  averageSessionLength: decimal("average_session_length", { precision: 6, scale: 2 }),
  
  // Payout status
  payoutStatus: text("payout_status", {
    enum: ["pending", "processing", "paid", "failed", "cancelled"],
  }).default("pending"),
  payoutId: text("payout_id"), // Stripe payout ID
  payoutDate: timestamp("payout_date"),
  payoutAmount: decimal("payout_amount", { precision: 12, scale: 2 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Subscription Payments and Transaction History
export const subscriptionPayments = pgTable("subscription_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Payment participants
  payerId: uuid("payer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  creatorId: uuid("creator_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  personaId: uuid("persona_id")
    .notNull()
    .references(() => personas.id, { onDelete: "cascade" }),
  subscriptionPlanId: uuid("subscription_plan_id")
    .references(() => subscriptionPlans.id, { onDelete: "set null" }),
  
  // Stripe payment details
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeInvoiceId: text("stripe_invoice_id"),
  stripeCustomerId: text("stripe_customer_id"),
  
  // Payment details
  paymentType: text("payment_type", {
    enum: ["subscription", "time_based", "tip", "one_time"],
  }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  
  // Revenue split
  creatorAmount: decimal("creator_amount", { precision: 10, scale: 2 }).notNull(), // 97%
  platformAmount: decimal("platform_amount", { precision: 10, scale: 2 }).notNull(), // 3%
  processingFee: decimal("processing_fee", { precision: 10, scale: 2 }).default("0.00"),
  
  // Payment status
  status: text("status", {
    enum: ["pending", "processing", "succeeded", "failed", "cancelled", "refunded"],
  }).default("pending"),
  
  // Billing period (for subscriptions)
  billingPeriodStart: timestamp("billing_period_start"),
  billingPeriodEnd: timestamp("billing_period_end"),
  
  // Time-based billing details
  sessionMinutes: integer("session_minutes"), // For time-based payments
  hourlyRate: decimal("hourly_rate", { precision: 8, scale: 2 }),
  
  // Payment metadata
  description: text("description"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  
  // Refund information
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),
  refundReason: text("refund_reason"),
  refundedAt: timestamp("refunded_at"),
  
  // Failure details
  failureCode: text("failure_code"),
  failureMessage: text("failure_message"),
  failedAt: timestamp("failed_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  paidAt: timestamp("paid_at"),
});

// Monetization Settings per Persona
export const personaMonetization = pgTable("persona_monetization", {
  id: uuid("id").primaryKey().defaultRandom(),
  personaId: uuid("persona_id")
    .notNull()
    .references(() => personas.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Monetization status
  isMonetized: boolean("is_monetized").default(false),
  requiresVerification: boolean("requires_verification").default(true),
  
  // Pricing strategy
  pricingModel: text("pricing_model", {
    enum: ["subscription_only", "time_based_only", "hybrid", "free_with_limits"],
  }).default("hybrid"),
  
  // Subscription tiers
  basicTierPrice: decimal("basic_tier_price", { precision: 8, scale: 2 }),
  basicTierFeatures: jsonb("basic_tier_features").$type<{
    messagesPerDay: number;
    allowPhotos: boolean;
    allowVoice: boolean;
    responseTime: "instant" | "fast" | "standard";
    customFeatures: string[];
  }>(),
  
  averageTierPrice: decimal("average_tier_price", { precision: 8, scale: 2 }),
  averageTierFeatures: jsonb("average_tier_features").$type<{
    messagesPerDay: number;
    allowPhotos: boolean;
    allowVoice: boolean;
    allowVideo: boolean;
    responseTime: "instant" | "fast" | "standard";
    prioritySupport: boolean;
    customFeatures: string[];
  }>(),
  
  advancedTierPrice: decimal("advanced_tier_price", { precision: 8, scale: 2 }),
  advancedTierFeatures: jsonb("advanced_tier_features").$type<{
    messagesPerDay: number;
    allowPhotos: boolean;
    allowVoice: boolean;
    allowVideo: boolean;
    allowPersonalInfo: boolean;
    responseTime: "instant" | "fast" | "standard";
    prioritySupport: boolean;
    exclusiveContent: boolean;
    customFeatures: string[];
  }>(),
  
  // Time-based pricing
  timeBasedEnabled: boolean("time_based_enabled").default(false),
  hourlyRate: decimal("hourly_rate", { precision: 8, scale: 2 }),
  minimumSessionMinutes: integer("minimum_session_minutes").default(15),
  
  // Free interaction limits
  freeMessagesPerDay: integer("free_messages_per_day").default(3),
  freeMinutesPerDay: integer("free_minutes_per_day").default(10),
  
  // Creator controls
  autoAcceptSubscriptions: boolean("auto_accept_subscriptions").default(true),
  requireManualApproval: boolean("require_manual_approval").default(false),
  allowTips: boolean("allow_tips").default(true),
  
  // Performance metrics
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default("0.00"),
  totalSubscribers: integer("total_subscribers").default(0),
  averageSessionRevenue: decimal("average_session_revenue", { precision: 8, scale: 2 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Content Moderation & Safety Tables

// Content moderation logs for all platform content
export const contentModerations = pgTable("content_moderations", {
  id: uuid("id").primaryKey().defaultRandom(),
  contentType: text("content_type", {
    enum: ["message", "persona_description", "user_profile", "media", "conversation"],
  }).notNull(),
  contentId: text("content_id").notNull(), // References the actual content
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  personaId: uuid("persona_id").references(() => personas.id, { onDelete: "cascade" }),
  
  // Moderation results
  status: text("status", {
    enum: ["pending", "approved", "flagged", "blocked", "under_review"],
  }).default("pending").notNull(),
  
  // AI Analysis Results
  aiModerationScore: decimal("ai_moderation_score", { precision: 3, scale: 2 }), // 0.00 to 1.00
  flaggedCategories: jsonb("flagged_categories").default([]), // ["harassment", "nsfw", "violence", etc.]
  severity: text("severity", {
    enum: ["low", "medium", "high", "critical"],
  }),
  
  // Content analysis
  originalContent: text("original_content"),
  contentSummary: text("content_summary"),
  detectedLanguage: text("detected_language"),
  
  // Age and compliance
  ageRating: text("age_rating", {
    enum: ["all_ages", "teen", "mature", "adults_only"],
  }),
  complianceFlags: jsonb("compliance_flags").default([]), // ["coppa", "gdpr", "state_law", etc.]
  
  // Moderation actions
  moderatedBy: uuid("moderated_by").references(() => users.id),
  moderatorNotes: text("moderator_notes"),
  actionTaken: text("action_taken", {
    enum: ["none", "warning", "content_hidden", "user_suspended", "account_banned"],
  }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User behavior tracking and safety scores
export const userSafetyProfiles = pgTable("user_safety_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").unique().notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Safety metrics
  overallSafetyScore: decimal("overall_safety_score", { precision: 3, scale: 2 }).default("1.00"), // 0.00 to 1.00
  trustLevel: text("trust_level", {
    enum: ["new", "trusted", "verified", "flagged", "restricted"],
  }).default("new"),
  
  // Behavior tracking
  totalInteractions: integer("total_interactions").default(0),
  flaggedInteractions: integer("flagged_interactions").default(0),
  positiveRatings: integer("positive_ratings").default(0),
  negativeRatings: integer("negative_ratings").default(0),
  
  // Content violations
  contentViolations: integer("content_violations").default(0),
  severityScore: decimal("severity_score", { precision: 3, scale: 2 }).default("0.00"),
  lastViolationDate: timestamp("last_violation_date"),
  
  // Age verification
  ageVerified: boolean("age_verified").default(false),
  ageVerificationDate: timestamp("age_verification_date"),
  dateOfBirth: timestamp("date_of_birth"),
  
  // Account restrictions
  isRestricted: boolean("is_restricted").default(false),
  restrictionReason: text("restriction_reason"),
  restrictionExpiresAt: timestamp("restriction_expires_at"),
  
  // Family-friendly mode
  familyFriendlyMode: boolean("family_friendly_mode").default(false),
  parentalControls: jsonb("parental_controls").default({}),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Interaction safety ratings between users and personas
export const interactionRatings = pgTable("interaction_ratings", {
  id: uuid("id").primaryKey().defaultRandom(),
  raterId: uuid("rater_id").notNull().references(() => users.id, { onDelete: "cascade" }), // Creator rating the user
  ratedUserId: uuid("rated_user_id").notNull().references(() => users.id, { onDelete: "cascade" }), // User being rated
  personaId: uuid("persona_id").notNull().references(() => personas.id, { onDelete: "cascade" }),
  conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "cascade" }),
  
  // Rating details
  safetyRating: integer("safety_rating").notNull(), // 1-5 scale (1=unsafe, 5=very safe)
  behaviorTags: jsonb("behavior_tags").default([]), // ["respectful", "inappropriate", "threatening", etc.]
  
  // Specific concerns
  isInappropriate: boolean("is_inappropriate").default(false),
  isThreatening: boolean("is_threatening").default(false),
  isHarassing: boolean("is_harassing").default(false),
  isSpam: boolean("is_spam").default(false),
  
  // Rating context
  ratingReason: text("rating_reason"),
  ratingNotes: text("rating_notes"),
  isBlocked: boolean("is_blocked").default(false), // Creator blocked this user
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Automated safety incidents and alerts
export const safetyIncidents = pgTable("safety_incidents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  personaId: uuid("persona_id").references(() => personas.id, { onDelete: "cascade" }),
  contentModerationId: uuid("content_moderation_id").references(() => contentModerations.id),
  
  // Incident details
  incidentType: text("incident_type", {
    enum: ["content_violation", "behavior_violation", "spam", "harassment", "threats", "inappropriate_content", "age_violation"],
  }).notNull(),
  severity: text("severity", {
    enum: ["low", "medium", "high", "critical"],
  }).notNull(),
  
  // Detection method
  detectionMethod: text("detection_method", {
    enum: ["ai_detection", "user_report", "manual_review", "pattern_analysis"],
  }).notNull(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }), // 0.00 to 1.00
  
  // Incident data
  description: text("description").notNull(),
  evidence: jsonb("evidence").default({}), // Screenshots, message content, etc.
  
  // Resolution
  status: text("status", {
    enum: ["open", "under_review", "resolved", "escalated", "dismissed"],
  }).default("open"),
  resolvedBy: uuid("resolved_by").references(() => users.id),
  resolution: text("resolution"),
  actionTaken: text("action_taken"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Platform-wide content policies and rules
export const contentPolicies = pgTable("content_policies", {
  id: uuid("id").primaryKey().defaultRandom(),
  policyName: text("policy_name").notNull(),
  policyType: text("policy_type", {
    enum: ["content_guidelines", "behavior_rules", "age_restrictions", "legal_compliance"],
  }).notNull(),
  
  // Policy details
  description: text("description").notNull(),
  rules: jsonb("rules").notNull(), // Detailed policy rules
  severity: text("severity", {
    enum: ["warning", "content_removal", "account_suspension", "permanent_ban"],
  }).notNull(),
  
  // Applicability
  isActive: boolean("is_active").default(true),
  appliesTo: jsonb("applies_to").default([]), // ["creators", "users", "content", "conversations"]
  
  // Geographic and legal
  jurisdiction: text("jurisdiction").default("US"),
  legalBasis: text("legal_basis"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations for Content Moderation & Safety
export const contentModerationRelations = relations(contentModerations, ({ one }) => ({
  user: one(users, {
    fields: [contentModerations.userId],
    references: [users.id],
  }),
  persona: one(personas, {
    fields: [contentModerations.personaId],
    references: [personas.id],
  }),
  moderator: one(users, {
    fields: [contentModerations.moderatedBy],
    references: [users.id],
  }),
}));

export const userSafetyProfileRelations = relations(userSafetyProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [userSafetyProfiles.userId],
    references: [users.id],
  }),
  ratings: many(interactionRatings, {
    relationName: "userSafetyRatings",
  }),
}));

export const interactionRatingRelations = relations(interactionRatings, ({ one }) => ({
  rater: one(users, {
    fields: [interactionRatings.raterId],
    references: [users.id],
  }),
  ratedUser: one(users, {
    fields: [interactionRatings.ratedUserId],
    references: [users.id],
  }),
  persona: one(personas, {
    fields: [interactionRatings.personaId],
    references: [personas.id],
  }),
  conversation: one(conversations, {
    fields: [interactionRatings.conversationId],
    references: [conversations.id],
  }),
}));

export const safetyIncidentRelations = relations(safetyIncidents, ({ one }) => ({
  user: one(users, {
    fields: [safetyIncidents.userId],
    references: [users.id],
  }),
  persona: one(personas, {
    fields: [safetyIncidents.personaId],
    references: [personas.id],
  }),
  contentModeration: one(contentModerations, {
    fields: [safetyIncidents.contentModerationId],
    references: [contentModerations.id],
  }),
  resolver: one(users, {
    fields: [safetyIncidents.resolvedBy],
    references: [users.id],
  }),
}));

// Relations for Creator Economy tables
export const creatorVerificationsRelations = relations(creatorVerifications, ({ one, many }) => ({
  user: one(users, {
    fields: [creatorVerifications.userId],
    references: [users.id],
  }),
  documents: many(verificationDocuments),
  stripeAccount: one(stripeAccounts, {
    fields: [creatorVerifications.userId],
    references: [stripeAccounts.userId],
  }),
}));

export const verificationDocumentsRelations = relations(verificationDocuments, ({ one }) => ({
  verification: one(creatorVerifications, {
    fields: [verificationDocuments.verificationId],
    references: [creatorVerifications.id],
  }),
  user: one(users, {
    fields: [verificationDocuments.userId],
    references: [users.id],
  }),
}));

export const stripeAccountsRelations = relations(stripeAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [stripeAccounts.userId],
    references: [users.id],
  }),
  verification: one(creatorVerifications, {
    fields: [stripeAccounts.verificationId],
    references: [creatorVerifications.id],
  }),
  earnings: many(creatorEarnings),
}));

export const creatorEarningsRelations = relations(creatorEarnings, ({ one }) => ({
  user: one(users, {
    fields: [creatorEarnings.userId],
    references: [users.id],
  }),
  stripeAccount: one(stripeAccounts, {
    fields: [creatorEarnings.stripeAccountId],
    references: [stripeAccounts.id],
  }),
}));

export const subscriptionPaymentsRelations = relations(subscriptionPayments, ({ one }) => ({
  payer: one(users, {
    fields: [subscriptionPayments.payerId],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [subscriptionPayments.creatorId],
    references: [users.id],
  }),
  persona: one(personas, {
    fields: [subscriptionPayments.personaId],
    references: [personas.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [subscriptionPayments.subscriptionPlanId],
    references: [subscriptionPlans.id],
  }),
}));

export const personaMonetizationRelations = relations(personaMonetization, ({ one }) => ({
  persona: one(personas, {
    fields: [personaMonetization.personaId],
    references: [personas.id],
  }),
  user: one(users, {
    fields: [personaMonetization.userId],
    references: [users.id],
  }),
}));

// Export the database connection
export { drizzle } from "drizzle-orm/postgres-js";
