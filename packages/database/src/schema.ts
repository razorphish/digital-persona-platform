import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  uuid,
  jsonb,
  serial,
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

// User personas
export const personas = pgTable("personas", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  traits: jsonb("traits").$type<Record<string, any>>(),
  preferences: jsonb("preferences").$type<Record<string, any>>(),
  isDefault: boolean("is_default").default(false),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  title: text("title"),
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
  metadata: jsonb("metadata").$type<Record<string, any>>(),
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
});

// Persona learning data (extracted from social posts)
export const personaLearningData = pgTable("persona_learning_data", {
  id: uuid("id").primaryKey().defaultRandom(),
  personaId: uuid("persona_id")
    .notNull()
    .references(() => personas.id, { onDelete: "cascade" }),
  sourceType: text("source_type", {
    enum: ["social_post", "chat_message", "manual_input", "media_file"],
  }).notNull(),
  sourceId: text("source_id"), // reference to the source (post id, message id, etc.)
  content: text("content").notNull(),
  insights: jsonb("insights").$type<Record<string, any>>(), // AI-extracted insights
  confidence: integer("confidence").default(50), // 0-100 confidence score
  processed: boolean("processed").default(false),
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

  // Metadata
  description: text("description"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),

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
  conversations: many(conversations),
  learningData: many(personaLearningData),
  mediaFiles: many(mediaFiles),
}));

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
