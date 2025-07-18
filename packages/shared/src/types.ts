import { z } from "zod";

// User schemas
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  image: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1, "Name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

// Persona schemas
export const personaSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  traits: z.record(z.any()).optional(),
  preferences: z.record(z.any()).optional(),
  isDefault: z.boolean().default(false),
  avatar: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createPersonaSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  traits: z.record(z.any()).optional(),
  preferences: z.record(z.any()).optional(),
  isDefault: z.boolean().default(false),
  avatar: z.string().optional(),
});

// Chat schemas
export const messageSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
});

export const conversationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  personaId: z.string().uuid().optional(),
  title: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
  messages: z.array(messageSchema).optional(),
});

export const createMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1, "Message content is required"),
  role: z.enum(["user", "assistant", "system"]).default("user"),
});

// Social media schemas
export const socialConnectionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  platform: z.enum(["twitter", "instagram", "facebook", "linkedin", "tiktok"]),
  platformUserId: z.string(),
  username: z.string().optional(),
  isActive: z.boolean().default(true),
  lastSync: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const socialPostSchema = z.object({
  id: z.string().uuid(),
  connectionId: z.string().uuid(),
  platformPostId: z.string(),
  content: z.string().optional(),
  postType: z.string().optional(),
  mediaUrls: z.array(z.string()).optional(),
  likes: z.number().default(0),
  shares: z.number().default(0),
  comments: z.number().default(0),
  publishedAt: z.date().optional(),
  importedAt: z.date(),
});

// Type exports
export type User = z.infer<typeof userSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type Login = z.infer<typeof loginSchema>;

export type Persona = z.infer<typeof personaSchema>;
export type CreatePersona = z.infer<typeof createPersonaSchema>;

export type Message = z.infer<typeof messageSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
export type CreateMessage = z.infer<typeof createMessageSchema>;

export type SocialConnection = z.infer<typeof socialConnectionSchema>;
export type SocialPost = z.infer<typeof socialPostSchema>;
