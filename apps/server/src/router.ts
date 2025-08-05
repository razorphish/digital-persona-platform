import { initTRPC, TRPCError } from "@trpc/server";
// Load environment variables first
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve("../../.env") });

import { z } from "zod";
import superjson from "superjson";

// Add logger
const logger = console;
import { db } from "@digital-persona/database";
import {
  users,
  personas,
  conversations,
  messages,
  socialConnections,
  personaMonetization,
  userConnections,
  subscriptionPayments,
} from "@digital-persona/database";
import { eq, and, desc, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  generatePresignedUrl,
  validateFileUpload,
  getMediaType,
} from "./utils/s3.js";

// Import persona service
import { PersonaService } from "./services/personaService.js";

// Import Airica intelligence services
import { ConversationIntelligenceService } from "./services/conversationIntelligence.js";

// Import creator economy services
import {
  CreatorVerificationService,
  IdentityVerificationData,
  AddressVerificationData,
  BankingVerificationData,
  TaxVerificationData,
} from "./services/creatorVerificationService.js";
import { StripeService } from "./services/stripeService.js";

// Import content moderation services
import { ContentModerationService } from "./services/contentModerationService.js";
import { BehaviorAnalysisService } from "./services/behaviorAnalysisService.js";

// Import social features services
import { DiscoveryService } from "./services/discoveryService.js";
import { SocialEngagementService } from "./services/socialEngagementService.js";
import { FeedAlgorithmService } from "./services/feedAlgorithmService.js";

// Import advanced analytics services
import { AdvancedAnalyticsService } from "./services/advancedAnalyticsService.js";

// Import enhanced types
import {
  createUserSchema,
  loginSchema,
  createPersonaSchema,
} from "@digital-persona/shared";

// Define additional schemas locally until shared types are updated
const updatePersonaSchema = createPersonaSchema.partial();

const startLearningInterviewSchema = z.object({
  personaId: z.string().uuid(),
  sessionType: z.enum([
    "initial",
    "simple_questions",
    "complex_questions",
    "scenario_questions",
    "social_integration",
    "interactive_discussion",
  ]),
});

const answerInterviewQuestionSchema = z.object({
  interviewId: z.string().uuid(),
  questionId: z.string(),
  response: z.string().optional(),
  mediaFiles: z.array(z.string()).optional(),
  skipQuestion: z.boolean().default(false),
});

const createConversationSchema = z.object({
  personaId: z.string().uuid(),
  title: z.string().optional(),
});

const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1, "Message content is required"),
  mediaFiles: z.array(z.string()).optional(),
});

const requestPresignedUrlSchema = z.object({
  fileName: z.string(),
  fileType: z.string(),
  fileSize: z.number(),
  personaId: z.string().uuid().optional(),
  conversationId: z.string().uuid().optional(),
});

const updateFileStatusSchema = z.object({
  fileId: z.string(),
  status: z.enum(["pending", "completed", "deleted", "failure"]),
  uploadedAt: z.date().optional(),
});

// Helper function to get or create default persona for user
async function getOrCreateDefaultPersona(userId: string) {
  // Use PersonaService instead of manual creation
  return await PersonaService.getOrCreateMainPersona(userId);
}

const t = initTRPC.create({
  transformer: superjson,
});

const router = t.router;
const publicProcedure = t.procedure;

// Auth middleware
const isAuthed = t.middleware(async ({ ctx, next }) => {
  const token = (ctx as any)?.req?.headers?.authorization?.replace(
    "Bearer ",
    ""
  );

  if (!token) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No token provided",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default-secret"
    ) as { userId: string };

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user[0]) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid token",
      });
    }

    return next({
      ctx: {
        user: user[0],
      },
    });
  } catch (error) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid token",
    });
  }
});

const protectedProcedure = publicProcedure.use(isAuthed);

// Queue file for AI processing
async function queueFileForAIProcessing(
  fileId: string,
  personaId: string,
  mediaType: string
) {
  logger.info(
    `File ${fileId} queued for AI processing for persona ${personaId} (${mediaType})`
  );
  // TODO: Implement actual AI processing queue
  return true;
}

// Auth router
const authRouter = router({
  register: publicProcedure
    .input(createUserSchema)
    .mutation(async ({ input }) => {
      // Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existingUser[0]) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User with this email already exists",
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, 12);

      // Create user
      const newUser = await db
        .insert(users)
        .values({
          email: input.email,
          name: input.name,
          passwordHash: hashedPassword,
        })
        .returning();

      // Generate JWT token with essential user information
      const token = jwt.sign(
        {
          userId: newUser[0].id,
          id: newUser[0].id, // Alternative field name for compatibility
          email: newUser[0].email,
          name: newUser[0].name,
          createdAt: newUser[0].createdAt.toISOString(),
        },
        process.env.JWT_SECRET || "default-secret",
        { expiresIn: "7d" }
      );

      // Create main persona automatically
      try {
        await PersonaService.createMainPersona(newUser[0].id, newUser[0].name);
      } catch (error) {
        console.error("Failed to create main persona:", error);
        // Don't fail registration if persona creation fails
      }

      return {
        user: {
          id: newUser[0].id,
          email: newUser[0].email,
          name: newUser[0].name,
          createdAt: newUser[0].createdAt.toISOString(),
        },
        token,
      };
    }),

  login: publicProcedure.input(loginSchema).mutation(async ({ input }) => {
    // Find user by email
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (!user[0]) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid credentials",
      });
    }

    // Verify password
    if (!user[0].passwordHash) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid credentials",
      });
    }

    const isValidPassword = await bcrypt.compare(
      input.password,
      user[0].passwordHash
    );

    if (!isValidPassword) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid credentials",
      });
    }

    // Generate JWT token with essential user information
    const token = jwt.sign(
      {
        userId: user[0].id,
        id: user[0].id, // Alternative field name for compatibility
        email: user[0].email,
        name: user[0].name,
        createdAt: user[0].createdAt.toISOString(),
      },
      process.env.JWT_SECRET || "default-secret",
      { expiresIn: "7d" }
    );

    // Ensure main persona exists
    try {
      await PersonaService.getOrCreateMainPersona(user[0].id);
    } catch (error) {
      console.error("Failed to ensure main persona exists:", error);
    }

    return {
      user: {
        id: user[0].id,
        email: user[0].email,
        name: user[0].name,
        createdAt: user[0].createdAt.toISOString(),
      },
      token,
    };
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    return {
      id: ctx.user.id,
      email: ctx.user.email,
      name: ctx.user.name,
      createdAt: ctx.user.createdAt.toISOString(),
    };
  }),

  // Industry-standard logout endpoint for server-side token invalidation
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // In a production system, you would:
      // 1. Add the token to a blacklist/revoked tokens table
      // 2. Clear any server-side sessions
      // 3. Log the logout event for security auditing

      console.log(
        `🔒 User ${ctx.user.id} (${
          ctx.user.email
        }) logged out at ${new Date().toISOString()}`
      );

      // For now, we'll just log the logout event
      // In the future, implement token blacklisting:
      // await db.insert(revokedTokens).values({
      //   tokenHash: hashToken(token),
      //   userId: ctx.user.id,
      //   revokedAt: new Date(),
      //   reason: 'user_logout'
      // });

      return {
        success: true,
        message: "Successfully logged out",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Logout error:", error);
      // Even if server logout fails, return success to allow client logout
      return {
        success: true,
        message: "Logout completed (client-side)",
        timestamp: new Date().toISOString(),
      };
    }
  }),
});

// Enhanced Personas router with new functionality
const personasRouter = router({
  // Get all personas for user
  list: protectedProcedure.query(async ({ ctx }) => {
    const userPersonas = await db
      .select({
        id: personas.id,
        userId: personas.userId,
        name: personas.name,
        description: personas.description,
        avatar: personas.avatar,
        category: sql<string>`'general'`.as("category"), // Fallback since category column doesn't exist yet
        personaType: personas.personaType,
        isMainPersona: personas.isMainPersona,
        parentPersonaId: personas.parentPersonaId,
        traits: personas.traits,
        preferences: personas.preferences,
        memoryContext: personas.memoryContext,
        personalityProfile: personas.personalityProfile,
        privacyLevel: personas.privacyLevel,
        isPubliclyListed: personas.isPubliclyListed,
        allowConnections: personas.allowConnections,
        requiresSubscription: personas.requiresSubscription,
        subscriptionPrice: personas.subscriptionPrice,
        learningEnabled: personas.learningEnabled,
        interactionCount: personas.interactionCount,
        lastInteraction: personas.lastInteraction,
        isDefault: personas.isDefault,
        isActive: personas.isActive,
        isDeletable: personas.isDeletable,
        createdAt: personas.createdAt,
        updatedAt: personas.updatedAt,
      })
      .from(personas)
      .where(eq(personas.userId, ctx.user.id))
      .orderBy(desc(personas.createdAt));

    return userPersonas.map((persona) => ({
      ...persona,
      createdAt: persona.createdAt.toISOString(),
      updatedAt: persona.updatedAt.toISOString(),
    }));
  }),

  // Get specific persona
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const [persona] = await db
        .select({
          id: personas.id,
          userId: personas.userId,
          name: personas.name,
          description: personas.description,
          avatar: personas.avatar,
          category: sql<string>`'general'`.as("category"), // Fallback since category column doesn't exist yet
          personaType: personas.personaType,
          isMainPersona: personas.isMainPersona,
          parentPersonaId: personas.parentPersonaId,
          traits: personas.traits,
          preferences: personas.preferences,
          memoryContext: personas.memoryContext,
          personalityProfile: personas.personalityProfile,
          privacyLevel: personas.privacyLevel,
          isPubliclyListed: personas.isPubliclyListed,
          allowConnections: personas.allowConnections,
          requiresSubscription: personas.requiresSubscription,
          subscriptionPrice: personas.subscriptionPrice,
          learningEnabled: personas.learningEnabled,
          interactionCount: personas.interactionCount,
          lastInteraction: personas.lastInteraction,
          isDefault: personas.isDefault,
          isActive: personas.isActive,
          isDeletable: personas.isDeletable,
          createdAt: personas.createdAt,
          updatedAt: personas.updatedAt,
        })
        .from(personas)
        .where(and(eq(personas.id, input.id), eq(personas.userId, ctx.user.id)))
        .limit(1);

      if (!persona) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Persona not found",
        });
      }

      return {
        ...persona,
        createdAt: persona.createdAt.toISOString(),
        updatedAt: persona.updatedAt.toISOString(),
      };
    }),

  // Create new persona (standard personas only - main persona auto-created)
  create: protectedProcedure
    .input(createPersonaSchema)
    .mutation(async ({ input, ctx }) => {
      // Prevent creation of main personas through this endpoint
      // Main personas are created automatically, so we don't allow manual creation

      // Get main persona as parent
      const mainPersona = await PersonaService.getOrCreateMainPersona(
        ctx.user.id
      );

      // Create child persona
      const childPersona = await PersonaService.createChildPersona(
        ctx.user.id,
        mainPersona.id,
        {
          name: input.name,
          description: input.description,
          personaType: (input as any).personaType || "child",
          privacyLevel: (input as any).privacyLevel || "friends",
          requiresSubscription: (input as any).requiresSubscription,
          subscriptionPrice: (input as any).subscriptionPrice,
          contentFilter: (input as any).contentFilter,
        }
      );

      return {
        ...childPersona,
        createdAt: childPersona.createdAt.toISOString(),
        updatedAt: childPersona.updatedAt.toISOString(),
      };
    }),

  // Update persona
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: updatePersonaSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if persona exists and belongs to user
      const [existingPersona] = await db
        .select()
        .from(personas)
        .where(and(eq(personas.id, input.id), eq(personas.userId, ctx.user.id)))
        .limit(1);

      if (!existingPersona) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Persona not found",
        });
      }

      // Check if it's a main persona - limited updates allowed
      const traits = existingPersona.traits as any;
      if (traits?.isMainPersona || existingPersona.isDefault) {
        // Only allow name and description updates for main personas
        const allowedUpdates = {
          name: (input.data as any).name,
          description: (input.data as any).description,
        };

        const [updatedPersona] = await db
          .update(personas)
          .set(allowedUpdates)
          .where(eq(personas.id, input.id))
          .returning();

        return {
          ...updatedPersona,
          createdAt: updatedPersona.createdAt.toISOString(),
          updatedAt: updatedPersona.updatedAt.toISOString(),
        };
      }

      // For child personas, allow more comprehensive updates
      const inputData = input.data as any;
      const updatedTraits = {
        ...traits,
        contentFilter: inputData.contentFilter || traits?.contentFilter,
        guardRails: inputData.guardRails || traits?.guardRails,
      };

      const updatedPreferences = {
        ...existingPersona.preferences,
        privacyLevel:
          inputData.privacyLevel || existingPersona.preferences?.privacyLevel,
        isPubliclyListed: inputData.isPubliclyListed,
        requiresSubscription: inputData.requiresSubscription,
        subscriptionPrice: inputData.subscriptionPrice,
      };

      const [updatedPersona] = await db
        .update(personas)
        .set({
          name: (input.data as any).name || existingPersona.name,
          description:
            (input.data as any).description || existingPersona.description,
          traits: updatedTraits,
          preferences: updatedPreferences,
        })
        .where(eq(personas.id, input.id))
        .returning();

      return {
        ...updatedPersona,
        createdAt: updatedPersona.createdAt.toISOString(),
        updatedAt: updatedPersona.updatedAt.toISOString(),
      };
    }),

  // Delete persona (with protection for main personas)
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Check if persona can be deleted
      const canDelete = await PersonaService.canDeletePersona(
        ctx.user.id,
        input.id
      );

      if (!canDelete) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "This persona cannot be deleted. Main personas are protected.",
        });
      }

      const [deletedPersona] = await db
        .delete(personas)
        .where(and(eq(personas.id, input.id), eq(personas.userId, ctx.user.id)))
        .returning();

      if (!deletedPersona) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Persona not found",
        });
      }

      return { success: true, deletedId: input.id };
    }),

  // Get main persona
  getMain: protectedProcedure.query(async ({ ctx }) => {
    const mainPersona = await PersonaService.getOrCreateMainPersona(
      ctx.user.id
    );
    return {
      ...mainPersona,
      createdAt: mainPersona.createdAt.toISOString(),
      updatedAt: mainPersona.updatedAt.toISOString(),
    };
  }),
});

// Learning interview router
const learningRouter = router({
  // Start a learning interview
  startInterview: protectedProcedure
    .input(startLearningInterviewSchema)
    .mutation(async ({ input, ctx }) => {
      const interview = await PersonaService.startLearningInterview(
        ctx.user.id,
        input.personaId,
        input.sessionType
      );

      return interview;
    }),

  // Get current interview for persona
  getCurrentInterview: protectedProcedure
    .input(z.object({ personaId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const interview = await PersonaService.getCurrentInterview(
        ctx.user.id,
        input.personaId
      );

      return interview;
    }),

  // Answer interview question
  answerQuestion: protectedProcedure
    .input(answerInterviewQuestionSchema)
    .mutation(async ({ input, ctx }) => {
      const updatedInterview = await PersonaService.answerInterviewQuestion(
        ctx.user.id,
        input.interviewId,
        input.questionId,
        input.response,
        input.mediaFiles,
        input.skipQuestion
      );

      return updatedInterview;
    }),

  // Get learning questions (for frontend reference)
  getQuestions: protectedProcedure
    .input(
      z.object({
        sessionType: z.enum([
          "initial",
          "simple_questions",
          "complex_questions",
          "scenario_questions",
          "social_integration",
        ]),
      })
    )
    .query(({ input }) => {
      const LEARNING_QUESTIONS = {
        simple: [
          {
            id: "color-pref",
            question:
              "What's your favorite color and why does it resonate with you?",
            type: "simple" as const,
            category: "preferences",
          },
          {
            id: "car-pref",
            question: "What's your ideal car? What draws you to it?",
            type: "simple" as const,
            category: "preferences",
          },
          {
            id: "food-pref",
            question:
              "What's your favorite cuisine or dish? What memories does it bring?",
            type: "simple" as const,
            category: "preferences",
          },
        ],
        complex: [
          {
            id: "friend-conflict",
            question:
              "Tell me about a time you had a disagreement with a close friend. How did you handle it?",
            type: "complex" as const,
            category: "relationships",
          },
        ],
        scenario: [
          {
            id: "workplace-ethics",
            question:
              "You discover a colleague is taking credit for your work. What would you do and why?",
            type: "scenario" as const,
            category: "personality",
          },
        ],
      };

      switch (input.sessionType) {
        case "initial":
          return [
            ...LEARNING_QUESTIONS.simple.slice(0, 3),
            LEARNING_QUESTIONS.complex[0],
          ];
        case "simple_questions":
          return LEARNING_QUESTIONS.simple;
        case "complex_questions":
          return LEARNING_QUESTIONS.complex;
        case "scenario_questions":
          return LEARNING_QUESTIONS.scenario;
        case "social_integration":
          return [
            {
              id: "social-connect",
              question:
                "Would you like to connect your social media accounts to help me learn more about you?",
              type: "simple",
              category: "social",
            },
          ];
        default:
          return [];
      }
    }),
});

// Initialize conversation intelligence service
const conversationIntelligence = new ConversationIntelligenceService();

// Enhanced Chat router with Airica intelligence
const chatRouter = router({
  // List conversations
  list: protectedProcedure.query(async ({ ctx }) => {
    const userConversations = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, ctx.user.id))
      .orderBy(desc(conversations.updatedAt));

    return userConversations.map((conv: typeof conversations.$inferSelect) => ({
      ...conv,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
    }));
  }),

  // Create conversation
  create: protectedProcedure
    .input(createConversationSchema)
    .mutation(async ({ input, ctx }) => {
      const [newConversation] = await db
        .insert(conversations)
        .values({
          userId: ctx.user.id,
          personaId: input.personaId,
          title: input.title || "New Conversation",
        })
        .returning();

      return {
        ...newConversation,
        createdAt: newConversation.createdAt.toISOString(),
        updatedAt: newConversation.updatedAt.toISOString(),
      };
    }),

  // Get conversation with messages
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const [conversation] = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, input.id),
            eq(conversations.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      const conversationMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, input.id))
        .orderBy(messages.createdAt);

      return {
        ...conversation,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
        messages: conversationMessages.map(
          (msg: typeof messages.$inferSelect) => ({
            ...msg,
            createdAt: msg.createdAt.toISOString(),
          })
        ),
      };
    }),

  // Initialize Airica session with dynamic greeting
  initializeSession: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const greeting = await conversationIntelligence.initializeSession(
          ctx.user.id,
          input.conversationId
        );

        return {
          success: true,
          greeting,
          relationshipStage:
            await conversationIntelligence.determineRelationshipStage(
              ctx.user.id
            ),
        };
      } catch (error) {
        logger.error("Failed to initialize Airica session:", error);
        return {
          success: false,
          greeting:
            "Hello! I'm Airica, your AI companion. How are you doing today?",
          relationshipStage: null,
        };
      }
    }),

  // Enhanced send message with Airica intelligence
  sendMessage: protectedProcedure
    .input(sendMessageSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Create user message
        const [userMessage] = await db
          .insert(messages)
          .values({
            conversationId: input.conversationId,
            role: "user",
            content: input.content,
            messageType: "text",
            isLearningData: true, // Mark as potential learning data
          })
          .returning();

        // Process user response with conversation intelligence
        const { followUpQuestion, insights } =
          await conversationIntelligence.processUserResponse(
            ctx.user.id,
            input.conversationId,
            input.content
          );

        // Generate Airica's response
        let airicaResponse = "Thank you for sharing that with me!";

        if (followUpQuestion) {
          airicaResponse = followUpQuestion;
        } else {
          // Generate a contextual acknowledgment
          const responses = [
            "That's really interesting! I'm getting to know you better.",
            "I appreciate you sharing that with me.",
            "That gives me great insight into who you are.",
            "Thanks for opening up about that!",
            "I'm learning so much about what makes you unique.",
          ];
          airicaResponse =
            responses[Math.floor(Math.random() * responses.length)];
        }

        // Create Airica's message
        const [aiMessage] = await db
          .insert(messages)
          .values({
            conversationId: input.conversationId,
            role: "assistant",
            content: airicaResponse,
            messageType: followUpQuestion ? "learning_response" : "text",
            personalityInsights: insights.length > 0 ? insights : undefined,
          })
          .returning();

        // Update conversation timestamp
        await db
          .update(conversations)
          .set({ updatedAt: new Date() })
          .where(eq(conversations.id, input.conversationId));

        return {
          success: true,
          userMessage: {
            ...userMessage,
            createdAt: userMessage.createdAt.toISOString(),
          },
          aiMessage: {
            ...aiMessage,
            createdAt: aiMessage.createdAt.toISOString(),
          },
          insights: insights.length,
          isLearningQuestion: !!followUpQuestion,
        };
      } catch (error) {
        logger.error("Error in enhanced sendMessage:", error);

        // Fallback to simple message creation
        const [userMessage] = await db
          .insert(messages)
          .values({
            conversationId: input.conversationId,
            role: "user",
            content: input.content,
          })
          .returning();

        const [aiMessage] = await db
          .insert(messages)
          .values({
            conversationId: input.conversationId,
            role: "assistant",
            content:
              "Thank you for sharing that with me. I'm here to listen and learn about you!",
          })
          .returning();

        return {
          success: false,
          userMessage: {
            ...userMessage,
            createdAt: userMessage.createdAt.toISOString(),
          },
          aiMessage: {
            ...aiMessage,
            createdAt: aiMessage.createdAt.toISOString(),
          },
          insights: 0,
          isLearningQuestion: false,
        };
      }
    }),

  // Get Airica's relationship assessment
  getRelationshipStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      const stage = await conversationIntelligence.determineRelationshipStage(
        ctx.user.id
      );
      return {
        success: true,
        stage: stage.stage,
        name: stage.name,
        description: stage.description,
        messageThreshold: stage.messageThreshold,
        intimacyLevel: stage.intimacyLevel,
      };
    } catch (error) {
      logger.error("Error getting relationship status:", error);
      return {
        success: false,
        stage: "stranger",
        name: "Getting to Know You",
        description: "Learning the basics about who you are",
        messageThreshold: 0,
        intimacyLevel: 2,
      };
    }
  }),

  // Generate a random learning question (for testing/manual triggers)
  getLearningQuestion: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid().optional(),
        category: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const stage = await conversationIntelligence.determineRelationshipStage(
          ctx.user.id
        );

        // Try to get AI-generated question first
        const greeting = await conversationIntelligence.initializeSession(
          ctx.user.id,
          input.conversationId
        );

        return {
          success: true,
          question: greeting,
          stage: stage.stage,
          source: "ai-generated",
        };
      } catch (error) {
        logger.error("Error generating learning question:", error);
        return {
          success: false,
          question: "What's something that's been on your mind lately?",
          stage: "stranger",
          source: "fallback",
        };
      }
    }),
});

// Media router (existing functionality)
const mediaRouter = router({
  requestPresignedUrl: protectedProcedure
    .input(requestPresignedUrlSchema)
    .mutation(async ({ input, ctx }) => {
      // Validate file
      const validation = validateFileUpload({
        size: input.fileSize,
        type: input.fileType,
        name: input.fileName,
      });

      if (!validation.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: validation.error || "Invalid file",
        });
      }

      // Get or assign persona for the file
      let assignedPersonaId = input.personaId;
      if (!assignedPersonaId) {
        const defaultPersona = await getOrCreateDefaultPersona(ctx.user.id);
        assignedPersonaId = (defaultPersona as any).id;
      }

      // Generate presigned URL
      const presignedData = await generatePresignedUrl({
        fileName: input.fileName,
        fileType: input.fileType,
        fileSize: input.fileSize,
        userId: ctx.user.id,
        conversationId: input.conversationId,
        personaId: assignedPersonaId,
      });

      // Create file metadata record in database
      const mediaType = getMediaType(input.fileType);

      // Create file record
      await db.execute(sql`
        INSERT INTO media_files (
          file_id, filename, original_filename, file_size, mime_type, media_type,
          s3_key, s3_bucket, presigned_url, user_id, conversation_id, persona_id,
          upload_status, upload_method
        ) VALUES (
          ${presignedData.fileId}, ${input.fileName}, ${input.fileName}, 
          ${input.fileSize}, ${input.fileType}, ${mediaType},
          ${presignedData.s3Key}, ${
        process.env.S3_BUCKET || "dev-dev01-dpp-uploads"
      }, 
          ${presignedData.presignedUrl}, ${ctx.user.id}, 
          ${input.conversationId || null}, 
          ${assignedPersonaId}, 'pending', 'direct'
        )
      `);

      // Queue file for AI processing if it's an image or video
      if (
        (mediaType === "image" || mediaType === "video") &&
        assignedPersonaId
      ) {
        await queueFileForAIProcessing(
          presignedData.fileId,
          assignedPersonaId,
          mediaType
        );
      }

      return {
        fileId: presignedData.fileId,
        presignedUrl: presignedData.presignedUrl,
        s3Key: presignedData.s3Key,
        expiresIn: presignedData.expiresIn,
      };
    }),

  updateFileStatus: protectedProcedure
    .input(updateFileStatusSchema)
    .mutation(async ({ input, ctx }) => {
      const updateData: any = {
        upload_status: input.status,
        updated_at: new Date(),
      };

      if (input.uploadedAt) {
        updateData.uploaded_at = input.uploadedAt;
      }

      if (input.status === "completed") {
        updateData.is_s3_stored = true;
        updateData.uploaded_at = new Date();
        // Generate final S3 URL
        const s3Url = `https://${
          process.env.S3_BUCKET || "dev-dev01-dpp-uploads"
        }.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/`;
        await db.execute(sql`
          UPDATE media_files 
          SET upload_status = ${
            input.status
          }, is_s3_stored = ${true}, uploaded_at = ${new Date()}
          WHERE file_id = ${input.fileId} AND user_id = ${ctx.user.id}
        `);
      } else {
        await db.execute(sql`
          UPDATE media_files 
          SET upload_status = ${input.status}, updated_at = ${new Date()}
          WHERE file_id = ${input.fileId} AND user_id = ${ctx.user.id}
        `);
      }

      return { success: true };
    }),

  // List user's media files
  list: protectedProcedure.query(async ({ ctx }) => {
    const files = await db.execute(sql`
      SELECT * FROM media_files 
      WHERE user_id = ${ctx.user.id} 
      ORDER BY created_at DESC
    `);

    return files.rows.map((file: any) => ({
      ...file,
      created_at: new Date(file.created_at).toISOString(),
      updated_at: new Date(file.updated_at).toISOString(),
      uploaded_at: file.uploaded_at
        ? new Date(file.uploaded_at).toISOString()
        : null,
    }));
  }),

  // Delete media file
  delete: protectedProcedure
    .input(z.object({ fileId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await db.execute(sql`
        UPDATE media_files 
        SET upload_status = 'deleted', updated_at = ${new Date()}
        WHERE file_id = ${input.fileId} AND user_id = ${ctx.user.id}
      `);

      return { success: true };
    }),
});

// Social connections router (placeholder for future implementation)
const socialRouter = router({
  // List connections
  list: protectedProcedure.query(async ({ ctx }) => {
    const connections = await db
      .select()
      .from(socialConnections)
      .where(eq(socialConnections.userId, ctx.user.id));

    return connections.map((conn: typeof socialConnections.$inferSelect) => ({
      ...conn,
      createdAt: conn.createdAt.toISOString(),
      updatedAt: conn.updatedAt.toISOString(),
      lastSync: conn.lastSync?.toISOString(),
    }));
  }),
});

// Initialize creator economy services
const creatorVerificationService = new CreatorVerificationService();
const stripeService = new StripeService();

// Initialize content moderation services
const contentModerationService = new ContentModerationService();
const behaviorAnalysisService = new BehaviorAnalysisService();

// Initialize social features services
const discoveryService = new DiscoveryService();
const socialEngagementService = new SocialEngagementService();
const feedAlgorithmService = new FeedAlgorithmService();

// Initialize advanced analytics services
const advancedAnalyticsService = new AdvancedAnalyticsService();

// Creator Verification Router
const creatorVerificationRouter = router({
  // Start verification process
  startVerification: protectedProcedure
    .input(
      z.object({
        ipAddress: z.string(),
        userAgent: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await creatorVerificationService.startVerification(
          ctx.user.id,
          input.ipAddress,
          input.userAgent
        );
      } catch (error) {
        logger.error("Error starting creator verification:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to start verification process",
        });
      }
    }),

  // Submit identity verification
  submitIdentityVerification: protectedProcedure
    .input(
      z.object({
        verificationId: z.string().uuid(),
        legalName: z.string().min(2).max(100),
        dateOfBirth: z.date(),
        governmentIdType: z.enum([
          "drivers_license",
          "passport",
          "state_id",
          "national_id",
        ]),
        governmentIdNumber: z.string().min(6).max(20),
        governmentIdExpiryDate: z.date(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { verificationId, ...identityData } = input;
        // Ensure the identityData matches the required type
        const verificationData: IdentityVerificationData = {
          legalName: identityData.legalName,
          dateOfBirth: identityData.dateOfBirth,
          governmentIdType: identityData.governmentIdType,
          governmentIdNumber: identityData.governmentIdNumber,
          governmentIdExpiryDate: identityData.governmentIdExpiryDate,
        };
        return await creatorVerificationService.submitIdentityVerification(
          ctx.user.id,
          verificationId,
          verificationData
        );
      } catch (error) {
        logger.error("Error submitting identity verification:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit identity verification",
        });
      }
    }),

  // Submit address verification
  submitAddressVerification: protectedProcedure
    .input(
      z.object({
        verificationId: z.string().uuid(),
        addressLine1: z.string().min(5).max(100),
        addressLine2: z.string().max(100).optional(),
        city: z.string().min(2).max(50),
        state: z.string().min(2).max(50),
        postalCode: z.string().min(5).max(10),
        country: z.string().default("US"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { verificationId, ...addressData } = input;
        // Ensure the addressData matches the required type
        const verificationData: AddressVerificationData = {
          addressLine1: addressData.addressLine1,
          addressLine2: addressData.addressLine2,
          city: addressData.city,
          state: addressData.state,
          postalCode: addressData.postalCode,
          country: addressData.country,
        };
        return await creatorVerificationService.submitAddressVerification(
          ctx.user.id,
          verificationId,
          verificationData
        );
      } catch (error) {
        logger.error("Error submitting address verification:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit address verification",
        });
      }
    }),

  // Submit banking verification
  submitBankingVerification: protectedProcedure
    .input(
      z.object({
        verificationId: z.string().uuid(),
        bankName: z.string().min(2).max(100),
        bankAccountType: z.enum(["checking", "savings"]),
        routingNumber: z.string().length(9),
        accountNumber: z.string().min(4).max(20),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { verificationId, ...bankingData } = input;
        // Ensure the bankingData matches the required type
        const verificationData: BankingVerificationData = {
          bankName: bankingData.bankName,
          bankAccountType: bankingData.bankAccountType,
          routingNumber: bankingData.routingNumber,
          accountNumber: bankingData.accountNumber,
        };
        return await creatorVerificationService.submitBankingVerification(
          ctx.user.id,
          verificationId,
          verificationData
        );
      } catch (error) {
        logger.error("Error submitting banking verification:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit banking verification",
        });
      }
    }),

  // Submit tax verification
  submitTaxVerification: protectedProcedure
    .input(
      z.object({
        verificationId: z.string().uuid(),
        taxIdType: z.enum(["ssn", "ein", "itin"]),
        taxId: z.string().min(9).max(11),
        w9FormSubmitted: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { verificationId, ...taxData } = input;
        // Ensure the taxData matches the required type
        const verificationData: TaxVerificationData = {
          taxIdType: taxData.taxIdType,
          taxId: taxData.taxId,
          w9FormSubmitted: taxData.w9FormSubmitted,
        };
        return await creatorVerificationService.submitTaxVerification(
          ctx.user.id,
          verificationId,
          verificationData
        );
      } catch (error) {
        logger.error("Error submitting tax verification:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit tax verification",
        });
      }
    }),

  // Submit verification for review
  submitForReview: protectedProcedure
    .input(
      z.object({
        verificationId: z.string().uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await creatorVerificationService.submitForReview(
          ctx.user.id,
          input.verificationId
        );
      } catch (error) {
        logger.error("Error submitting verification for review:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit verification for review",
        });
      }
    }),

  // Get verification status
  getVerificationStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await creatorVerificationService.getVerificationStatus(
        ctx.user.id
      );
    } catch (error) {
      logger.error("Error getting verification status:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get verification status",
      });
    }
  }),

  // Finalize verification process
  finalizeVerification: protectedProcedure
    .input(
      z.object({
        verificationId: z.string().uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await creatorVerificationService.submitForReview(
          ctx.user.id,
          input.verificationId
        );
      } catch (error) {
        logger.error("Error finalizing verification:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to finalize verification",
        });
      }
    }),
});

// Creator Monetization Router
const creatorMonetizationRouter = router({
  // Create Stripe Connect account
  createStripeAccount: protectedProcedure
    .input(
      z.object({
        verificationId: z.string().uuid(),
        email: z.string().email(),
        country: z.string().default("US"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await stripeService.createConnectAccount(
          ctx.user.id,
          input.verificationId,
          input.email,
          input.country
        );
      } catch (error) {
        logger.error("Error creating Stripe Connect account:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create payment account",
        });
      }
    }),

  // Create subscription for persona
  createSubscription: protectedProcedure
    .input(
      z.object({
        creatorId: z.string().uuid(),
        personaId: z.string().uuid(),
        priceId: z.string(),
        tierType: z.enum(["basic", "average", "advanced"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await stripeService.createSubscription(
          ctx.user.id, // payerId
          input.creatorId,
          input.personaId,
          input.priceId,
          input.tierType
        );
      } catch (error) {
        logger.error("Error creating subscription:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create subscription",
        });
      }
    }),

  // Create time-based payment
  createTimeBasedPayment: protectedProcedure
    .input(
      z.object({
        creatorId: z.string().uuid(),
        personaId: z.string().uuid(),
        sessionMinutes: z.number().min(1).max(1440), // Max 24 hours
        hourlyRate: z.number().min(0.01).max(1000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await stripeService.createTimeBasedPayment(
          ctx.user.id, // payerId
          input.creatorId,
          input.personaId,
          input.sessionMinutes,
          input.hourlyRate
        );
      } catch (error) {
        logger.error("Error creating time-based payment:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create payment",
        });
      }
    }),

  // Get creator earnings summary
  getEarningsSummary: protectedProcedure.query(async ({ ctx }) => {
    try {
      // TODO: Implement earnings summary calculation
      return {
        totalEarnings: 0,
        monthlyEarnings: 0,
        pendingPayouts: 0,
        totalSubscribers: 0,
        activeSubscriptions: 0,
      };
    } catch (error) {
      logger.error("Error getting earnings summary:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get earnings summary",
      });
    }
  }),

  // Create payment intent for subscription or time-based payment
  createPaymentIntent: protectedProcedure
    .input(
      z.object({
        personaId: z.string().uuid(),
        paymentType: z.enum(["subscription", "time_based"]),
        subscriptionTier: z.enum(["basic", "average", "advanced"]).optional(),
        timeBasedMinutes: z.number().min(1).max(1440).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Get the persona to find the creator
        const persona = await db
          .select()
          .from(personas)
          .where(eq(personas.id, input.personaId))
          .limit(1);

        if (persona.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Persona not found",
          });
        }

        const creatorId = persona[0].userId;

        if (input.paymentType === "subscription") {
          if (!input.subscriptionTier) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "Subscription tier is required for subscription payments",
            });
          }

          // Get persona monetization settings to determine pricing
          const monetizationSettings = await db
            .select()
            .from(personaMonetization)
            .where(eq(personaMonetization.personaId, input.personaId))
            .limit(1);

          if (monetizationSettings.length === 0) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Monetization settings not found for this persona",
            });
          }

          const settings = monetizationSettings[0];
          let priceId = "";

          // Map tier to price - this would normally come from Stripe price IDs
          // For now, we'll use placeholder logic
          switch (input.subscriptionTier) {
            case "basic":
              priceId = `price_basic_${input.personaId}`;
              break;
            case "average":
              priceId = `price_average_${input.personaId}`;
              break;
            case "advanced":
              priceId = `price_advanced_${input.personaId}`;
              break;
          }

          return await stripeService.createSubscription(
            ctx.user.id,
            creatorId,
            input.personaId,
            priceId,
            input.subscriptionTier
          );
        } else {
          // Time-based payment
          if (!input.timeBasedMinutes) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Time-based minutes is required for time-based payments",
            });
          }

          // Get persona monetization settings for hourly rate
          const monetizationSettings = await db
            .select()
            .from(personaMonetization)
            .where(eq(personaMonetization.personaId, input.personaId))
            .limit(1);

          if (monetizationSettings.length === 0) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Monetization settings not found for this persona",
            });
          }

          const settings = monetizationSettings[0];
          const hourlyRate = settings.hourlyRate
            ? parseFloat(settings.hourlyRate)
            : 50; // Default rate

          return await stripeService.createTimeBasedPayment(
            ctx.user.id,
            creatorId,
            input.personaId,
            input.timeBasedMinutes,
            hourlyRate
          );
        }
      } catch (error) {
        logger.error("Error creating payment intent:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create payment intent",
        });
      }
    }),

  // Get user's subscription to a persona
  getUserSubscription: protectedProcedure
    .input(
      z.object({
        personaId: z.string().uuid(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Check for active subscription in userConnections
        const connection = await db
          .select()
          .from(userConnections)
          .where(
            and(
              eq(userConnections.requesterId, ctx.user.id),
              eq(userConnections.targetPersonaId, input.personaId),
              eq(userConnections.connectionType, "subscriber"),
              eq(userConnections.isSubscriptionActive, true)
            )
          )
          .limit(1);

        if (connection.length === 0) {
          return null; // No active subscription
        }

        const subscription = connection[0];

        // Get the latest payment for this subscription
        const latestPayment = await db
          .select()
          .from(subscriptionPayments)
          .where(
            and(
              eq(subscriptionPayments.payerId, ctx.user.id),
              eq(subscriptionPayments.personaId, input.personaId),
              eq(subscriptionPayments.paymentType, "subscription"),
              eq(subscriptionPayments.status, "succeeded")
            )
          )
          .orderBy(desc(subscriptionPayments.createdAt))
          .limit(1);

        return {
          id: subscription.id,
          subscriptionTier: subscription.subscriptionTier,
          subscriptionPrice: subscription.subscriptionPrice
            ? parseFloat(subscription.subscriptionPrice)
            : null,
          subscriptionStartDate:
            subscription.subscriptionStartDate?.toISOString(),
          subscriptionEndDate: subscription.subscriptionEndDate?.toISOString(),
          isActive: subscription.isSubscriptionActive,
          accessLevel: subscription.accessLevel,
          latestPayment:
            latestPayment.length > 0
              ? {
                  id: latestPayment[0].id,
                  amount: parseFloat(latestPayment[0].amount),
                  currency: latestPayment[0].currency,
                  paidAt: latestPayment[0].paidAt?.toISOString(),
                  billingPeriodStart:
                    latestPayment[0].billingPeriodStart?.toISOString(),
                  billingPeriodEnd:
                    latestPayment[0].billingPeriodEnd?.toISOString(),
                }
              : null,
          createdAt: subscription.createdAt.toISOString(),
          updatedAt: subscription.updatedAt.toISOString(),
        };
      } catch (error) {
        logger.error("Error getting user subscription:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get subscription",
        });
      }
    }),

  // Confirm payment after client-side processing
  confirmPayment: protectedProcedure
    .input(
      z.object({
        paymentIntentId: z.string(),
        personaId: z.string().uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // In a real implementation, this would confirm the payment with Stripe
        // and update the subscription/payment records in the database

        // For now, we'll return a success response
        return {
          success: true,
          paymentIntentId: input.paymentIntentId,
          subscriptionId: `sub_${Date.now()}`, // Mock subscription ID
          status: "succeeded",
        };
      } catch (error) {
        logger.error("Error confirming payment:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to confirm payment",
        });
      }
    }),

  // Stripe webhook endpoint (handled via raw HTTP)
  processWebhook: protectedProcedure
    .input(
      z.object({
        body: z.string(),
        signature: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await stripeService.processWebhook(input.body, input.signature);
        return { success: true };
      } catch (error) {
        logger.error("Error processing Stripe webhook:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process webhook",
        });
      }
    }),
});

// Persona Monetization Settings Router
const personaMonetizationRouter = router({
  // Configure persona monetization
  configureMonetization: protectedProcedure
    .input(
      z.object({
        personaId: z.string().uuid(),
        isMonetized: z.boolean(),
        pricingModel: z.enum([
          "subscription_only",
          "time_based_only",
          "hybrid",
          "free_with_limits",
        ]),
        basicTierPrice: z.number().min(0).optional(),
        averageTierPrice: z.number().min(0).optional(),
        advancedTierPrice: z.number().min(0).optional(),
        timeBasedEnabled: z.boolean().optional(),
        hourlyRate: z.number().min(0).optional(),
        freeMessagesPerDay: z.number().min(0).default(3),
        freeMinutesPerDay: z.number().min(0).default(10),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Update persona monetization settings
        await db
          .insert(personaMonetization)
          .values({
            personaId: input.personaId,
            userId: ctx.user.id,
            isMonetized: input.isMonetized,
            pricingModel: input.pricingModel,
            basicTierPrice: input.basicTierPrice?.toString(),
            averageTierPrice: input.averageTierPrice?.toString(),
            advancedTierPrice: input.advancedTierPrice?.toString(),
            timeBasedEnabled: input.timeBasedEnabled || false,
            hourlyRate: input.hourlyRate?.toString(),
            freeMessagesPerDay: input.freeMessagesPerDay,
            freeMinutesPerDay: input.freeMinutesPerDay,
          })
          .onConflictDoUpdate({
            target: personaMonetization.personaId,
            set: {
              isMonetized: input.isMonetized,
              pricingModel: input.pricingModel,
              basicTierPrice: input.basicTierPrice?.toString(),
              averageTierPrice: input.averageTierPrice?.toString(),
              advancedTierPrice: input.advancedTierPrice?.toString(),
              timeBasedEnabled: input.timeBasedEnabled || false,
              hourlyRate: input.hourlyRate?.toString(),
              freeMessagesPerDay: input.freeMessagesPerDay,
              freeMinutesPerDay: input.freeMinutesPerDay,
              updatedAt: new Date(),
            },
          });

        return { success: true };
      } catch (error) {
        logger.error("Error configuring persona monetization:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to configure monetization",
        });
      }
    }),

  // Get persona monetization settings
  getMonetizationSettings: protectedProcedure
    .input(
      z.object({
        personaId: z.string().uuid(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const settings = await db
          .select()
          .from(personaMonetization)
          .where(
            and(
              eq(personaMonetization.personaId, input.personaId),
              eq(personaMonetization.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (settings.length === 0) {
          return {
            isMonetized: false,
            pricingModel: "free_with_limits",
            freeMessagesPerDay: 3,
            freeMinutesPerDay: 10,
            subscriptionTiers: [],
            timeBasedPricing: {
              enabled: false,
              pricePerHour: 50,
              minimumMinutes: 15,
            },
          };
        }

        const setting = settings[0];

        // Build subscription tiers array from individual price fields
        const subscriptionTiers = [];

        if (setting.basicTierPrice) {
          subscriptionTiers.push({
            id: `basic_${input.personaId}`,
            name: "basic" as const,
            displayName: "Basic",
            price: parseFloat(setting.basicTierPrice),
            features: ["Basic messaging", "Limited interactions"],
          });
        }

        if (setting.averageTierPrice) {
          subscriptionTiers.push({
            id: `average_${input.personaId}`,
            name: "average" as const,
            displayName: "Average",
            price: parseFloat(setting.averageTierPrice),
            features: [
              "Enhanced messaging",
              "More interactions",
              "Priority responses",
            ],
          });
        }

        if (setting.advancedTierPrice) {
          subscriptionTiers.push({
            id: `advanced_${input.personaId}`,
            name: "advanced" as const,
            displayName: "Advanced",
            price: parseFloat(setting.advancedTierPrice),
            features: [
              "Unlimited messaging",
              "Exclusive content",
              "Personal sessions",
              "Priority support",
            ],
          });
        }

        return {
          ...setting,
          basicTierPrice: setting.basicTierPrice
            ? parseFloat(setting.basicTierPrice)
            : undefined,
          averageTierPrice: setting.averageTierPrice
            ? parseFloat(setting.averageTierPrice)
            : undefined,
          advancedTierPrice: setting.advancedTierPrice
            ? parseFloat(setting.advancedTierPrice)
            : undefined,
          hourlyRate: setting.hourlyRate
            ? parseFloat(setting.hourlyRate)
            : undefined,
          subscriptionTiers,
          timeBasedPricing: {
            enabled: setting.timeBasedEnabled || false,
            pricePerHour: setting.hourlyRate
              ? parseFloat(setting.hourlyRate)
              : 50,
            minimumMinutes: 15, // Default minimum session time
          },
          createdAt: setting.createdAt.toISOString(),
          updatedAt: setting.updatedAt.toISOString(),
        };
      } catch (error) {
        logger.error("Error getting persona monetization settings:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get monetization settings",
        });
      }
    }),
});

// Content Moderation Router
const contentModerationRouter = router({
  // Moderate content (called internally or by admins)
  moderateContent: protectedProcedure
    .input(
      z.object({
        contentType: z.enum([
          "message",
          "persona_description",
          "user_profile",
          "media",
          "conversation",
        ]),
        contentId: z.string(),
        content: z.string(),
        userId: z.string().uuid().optional(),
        personaId: z.string().uuid().optional(),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await contentModerationService.moderateContent({
          contentType: input.contentType,
          contentId: input.contentId,
          content: input.content,
          userId: input.userId,
          personaId: input.personaId,
          metadata: input.metadata,
        });

        return result;
      } catch (error) {
        logger.error("Error moderating content:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to moderate content",
        });
      }
    }),

  // Get user safety profile
  getUserSafetyProfile: protectedProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Only allow users to view their own profile or creators to view subscriber profiles
        if (input.userId !== ctx.user.id) {
          // TODO: Add creator permission check
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to view this safety profile",
          });
        }

        const profile = await contentModerationService.getUserSafetyProfile(
          input.userId
        );
        return profile;
      } catch (error) {
        logger.error("Error getting user safety profile:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get safety profile",
        });
      }
    }),

  // Rate user interaction (for creators)
  rateUserInteraction: protectedProcedure
    .input(
      z.object({
        ratedUserId: z.string().uuid(),
        personaId: z.string().uuid(),
        conversationId: z.string().uuid(),
        safetyRating: z.number().min(1).max(5),
        behaviorTags: z.array(z.string()),
        isInappropriate: z.boolean().optional(),
        isThreatening: z.boolean().optional(),
        isHarassing: z.boolean().optional(),
        isSpam: z.boolean().optional(),
        ratingReason: z.string().optional(),
        ratingNotes: z.string().optional(),
        isBlocked: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Verify the creator owns the persona
        const persona = await db
          .select()
          .from(personas)
          .where(
            and(
              eq(personas.id, input.personaId),
              eq(personas.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (persona.length === 0) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to rate interactions for this persona",
          });
        }

        const result = await contentModerationService.rateUserInteraction(
          ctx.user.id,
          input.ratedUserId,
          input.personaId,
          input.conversationId,
          {
            safetyRating: input.safetyRating,
            behaviorTags: input.behaviorTags,
            isInappropriate: input.isInappropriate,
            isThreatening: input.isThreatening,
            isHarassing: input.isHarassing,
            isSpam: input.isSpam,
            ratingReason: input.ratingReason,
            ratingNotes: input.ratingNotes,
            isBlocked: input.isBlocked,
          }
        );

        return result;
      } catch (error) {
        logger.error("Error rating user interaction:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to rate interaction",
        });
      }
    }),

  // Get user interaction ratings (for creators)
  getUserInteractionRatings: protectedProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        personaId: z.string().uuid().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Verify the creator owns the persona if specified
        if (input.personaId) {
          const persona = await db
            .select()
            .from(personas)
            .where(
              and(
                eq(personas.id, input.personaId),
                eq(personas.userId, ctx.user.id)
              )
            )
            .limit(1);

          if (persona.length === 0) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Not authorized to view ratings for this persona",
            });
          }
        }

        const ratings =
          await contentModerationService.getUserInteractionRatings(
            input.userId,
            input.personaId
          );

        return ratings;
      } catch (error) {
        logger.error("Error getting user interaction ratings:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get interaction ratings",
        });
      }
    }),

  // Block/unblock user
  blockUser: protectedProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        personaId: z.string().uuid(),
        isBlocked: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Verify the creator owns the persona
        const persona = await db
          .select()
          .from(personas)
          .where(
            and(
              eq(personas.id, input.personaId),
              eq(personas.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (persona.length === 0) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to block users for this persona",
          });
        }

        const result = await contentModerationService.blockUser(
          ctx.user.id,
          input.userId,
          input.personaId,
          input.isBlocked
        );

        return result;
      } catch (error) {
        logger.error("Error blocking/unblocking user:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update user block status",
        });
      }
    }),

  // Get moderation history
  getModerationHistory: protectedProcedure
    .input(
      z.object({
        contentId: z.string(),
        contentType: z.enum([
          "message",
          "persona_description",
          "user_profile",
          "media",
          "conversation",
        ]),
      })
    )
    .query(async ({ input }) => {
      try {
        const history = await contentModerationService.getModerationHistory(
          input.contentId,
          input.contentType
        );

        return history;
      } catch (error) {
        logger.error("Error getting moderation history:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get moderation history",
        });
      }
    }),
});

// Behavior Analysis Router
const behaviorAnalysisRouter = router({
  // Analyze user behavior
  analyzeUserBehavior: protectedProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        timeframeHours: z.number().optional().default(24),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Only allow analysis of own behavior or by authorized users
        if (input.userId !== ctx.user.id) {
          // TODO: Add admin/creator permission check
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to analyze this user",
          });
        }

        const analysis = await behaviorAnalysisService.analyzeUserBehavior(
          input.userId,
          input.timeframeHours
        );

        return analysis;
      } catch (error) {
        logger.error("Error analyzing user behavior:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to analyze behavior",
        });
      }
    }),

  // Get behavior summary
  getBehaviorSummary: protectedProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Only allow viewing own summary or by authorized users
        if (input.userId !== ctx.user.id) {
          // TODO: Add admin/creator permission check
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to view this behavior summary",
          });
        }

        const summary = await behaviorAnalysisService.getBehaviorSummary(
          input.userId
        );
        return summary;
      } catch (error) {
        logger.error("Error getting behavior summary:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get behavior summary",
        });
      }
    }),
});

// Social Features Routers

// Discovery Router
const discoveryRouter = router({
  // Get personalized recommendations
  getPersonalizedRecommendations: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(20),
        categories: z.array(z.string()).optional(),
        excludePersonaIds: z.array(z.string()).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const recommendations =
          await discoveryService.getPersonalizedRecommendations(
            ctx.user.id,
            input.limit,
            {
              categories: input.categories,
              excludePersonaIds: input.excludePersonaIds,
            }
          );

        return recommendations;
      } catch (error) {
        logger.error("Error getting personalized recommendations:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get recommendations",
        });
      }
    }),

  // Get trending personas
  getTrendingPersonas: publicProcedure
    .input(
      z.object({
        timeframe: z.enum(["24h", "7d", "30d"]).optional().default("24h"),
        limit: z.number().optional().default(50),
        categories: z.array(z.string()).optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const trending = await discoveryService.getTrendingPersonas(
          input.timeframe,
          input.limit,
          input.categories
        );

        return trending;
      } catch (error) {
        logger.error("Error getting trending personas:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get trending personas",
        });
      }
    }),

  // Search personas
  searchPersonas: publicProcedure
    .input(
      z.object({
        query: z.string(),
        limit: z.number().optional().default(20),
        categories: z.array(z.string()).optional(),
        minRating: z.number().optional(),
        hideNSFW: z.boolean().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const results = await discoveryService.searchPersonas(
          input.query,
          (ctx as any).user?.id || null,
          input.limit,
          {
            categories: input.categories,
            minRating: input.minRating,
            hideNSFW: input.hideNSFW,
          }
        );

        return results;
      } catch (error) {
        logger.error("Error searching personas:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to search personas",
        });
      }
    }),

  // Get similar personas
  getSimilarPersonas: protectedProcedure
    .input(
      z.object({
        personaId: z.string().uuid(),
        limit: z.number().optional().default(10),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const similar = await discoveryService.getSimilarPersonas(
          input.personaId,
          ctx.user.id,
          input.limit
        );

        return similar;
      } catch (error) {
        logger.error("Error getting similar personas:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get similar personas",
        });
      }
    }),
});

// Social Engagement Router
const socialEngagementRouter = router({
  // Follow/unfollow creator
  toggleFollow: protectedProcedure
    .input(
      z.object({
        creatorId: z.string().uuid(),
        followReason: z
          .enum([
            "creator_interest",
            "persona_discovery",
            "friend_connection",
            "recommendation",
          ])
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await socialEngagementService.toggleFollow(
          ctx.user.id,
          input.creatorId,
          input.followReason
        );

        return result;
      } catch (error) {
        logger.error("Error toggling follow:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update follow status",
        });
      }
    }),

  // Like/unlike persona
  toggleLike: protectedProcedure
    .input(
      z.object({
        personaId: z.string().uuid(),
        likeType: z
          .enum(["like", "favorite", "bookmark", "interested"])
          .optional()
          .default("like"),
        discoveredVia: z
          .enum([
            "feed",
            "search",
            "trending",
            "recommendation",
            "creator_profile",
            "direct_link",
          ])
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await socialEngagementService.toggleLike(
          ctx.user.id,
          input.personaId,
          input.likeType,
          input.discoveredVia
        );

        return result;
      } catch (error) {
        logger.error("Error toggling like:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update like status",
        });
      }
    }),

  // Submit review
  submitReview: protectedProcedure
    .input(
      z.object({
        personaId: z.string().uuid(),
        rating: z.number().min(1).max(5),
        title: z.string().optional(),
        reviewText: z.string().optional(),
        categories: z.array(z.string()).optional(),
        pros: z.array(z.string()).optional(),
        cons: z.array(z.string()).optional(),
        subscriptionTier: z.string().optional(),
        interactionDuration: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Create properly typed review submission
        const reviewSubmission = {
          personaId: input.personaId!,
          rating: input.rating!,
          title: input.title,
          reviewText: input.reviewText,
          categories: input.categories,
          pros: input.pros,
          cons: input.cons,
          subscriptionTier: input.subscriptionTier,
          interactionDuration: input.interactionDuration,
        };
        const result = await socialEngagementService.submitReview(
          ctx.user.id,
          reviewSubmission
        );
        return result;
      } catch (error) {
        logger.error("Error submitting review:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit review",
        });
      }
    }),

  // Get user social stats
  getUserSocialStats: protectedProcedure
    .input(
      z.object({
        userId: z.string().uuid().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const userId = input.userId || ctx.user.id;

        // Only allow viewing own stats or public stats
        if (userId !== ctx.user.id) {
          // Add permission check here for public stats
        }

        const stats = await socialEngagementService.getUserSocialStats(userId);
        return stats;
      } catch (error) {
        logger.error("Error getting user social stats:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get social stats",
        });
      }
    }),

  // Get persona engagement
  getPersonaEngagement: publicProcedure
    .input(
      z.object({
        personaId: z.string().uuid(),
      })
    )
    .query(async ({ input }) => {
      try {
        const engagement = await socialEngagementService.getPersonaEngagement(
          input.personaId
        );
        return engagement;
      } catch (error) {
        logger.error("Error getting persona engagement:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get persona engagement",
        });
      }
    }),

  // Get persona reviews
  getPersonaReviews: publicProcedure
    .input(
      z.object({
        personaId: z.string().uuid(),
        limit: z.number().optional().default(10),
        offset: z.number().optional().default(0),
        sortBy: z
          .enum(["newest", "oldest", "rating_high", "rating_low", "helpful"])
          .optional()
          .default("newest"),
      })
    )
    .query(async ({ input }) => {
      try {
        const reviews = await socialEngagementService.getPersonaReviews(
          input.personaId,
          input.limit,
          input.offset,
          input.sortBy
        );

        return reviews;
      } catch (error) {
        logger.error("Error getting persona reviews:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get reviews",
        });
      }
    }),

  // Get user's following
  getUserFollowing: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const following = await socialEngagementService.getUserFollowing(
          ctx.user.id,
          input.limit,
          input.offset
        );

        return following;
      } catch (error) {
        logger.error("Error getting user following:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get following list",
        });
      }
    }),

  // Get user's liked personas
  getUserLikedPersonas: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const liked = await socialEngagementService.getUserLikedPersonas(
          ctx.user.id,
          input.limit,
          input.offset
        );

        return liked;
      } catch (error) {
        logger.error("Error getting user liked personas:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get liked personas",
        });
      }
    }),

  // Check if following creator
  isFollowing: protectedProcedure
    .input(
      z.object({
        creatorId: z.string().uuid(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const isFollowing = await socialEngagementService.isFollowing(
          ctx.user.id,
          input.creatorId
        );
        return { isFollowing };
      } catch (error) {
        logger.error("Error checking follow status:", error);
        return { isFollowing: false };
      }
    }),

  // Check if persona is liked
  isLiked: protectedProcedure
    .input(
      z.object({
        personaId: z.string().uuid(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const isLiked = await socialEngagementService.isLiked(
          ctx.user.id,
          input.personaId
        );
        return { isLiked };
      } catch (error) {
        logger.error("Error checking like status:", error);
        return { isLiked: false };
      }
    }),
});

// Feed Router
const feedRouter = router({
  // Generate personalized feed
  generateFeed: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(50),
        includePromoted: z.boolean().optional().default(true),
        refreshExisting: z.boolean().optional().default(false),
        categories: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const feed = await feedAlgorithmService.generatePersonalizedFeed(
          ctx.user.id,
          input
        );
        return feed;
      } catch (error) {
        logger.error("Error generating feed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate feed",
        });
      }
    }),

  // Get user's feed
  getFeed: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const feed = await feedAlgorithmService.getUserFeed(
          ctx.user.id,
          input.limit,
          input.offset
        );

        return feed;
      } catch (error) {
        logger.error("Error getting feed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get feed",
        });
      }
    }),

  // Track feed interaction
  trackInteraction: protectedProcedure
    .input(
      z.object({
        feedItemId: z.string().uuid(),
        interactionType: z.enum([
          "viewed",
          "clicked",
          "liked",
          "shared",
          "dismissed",
        ]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const success = await feedAlgorithmService.trackFeedInteraction(
          ctx.user.id,
          input.feedItemId,
          input.interactionType
        );

        return { success };
      } catch (error) {
        logger.error("Error tracking feed interaction:", error);
        return { success: false };
      }
    }),

  // Get feed metrics
  getFeedMetrics: protectedProcedure
    .input(
      z.object({
        timeframe: z.enum(["24h", "7d", "30d"]).optional().default("7d"),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const metrics = await feedAlgorithmService.getFeedMetrics(
          ctx.user.id,
          input.timeframe
        );
        return metrics;
      } catch (error) {
        logger.error("Error getting feed metrics:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get feed metrics",
        });
      }
    }),
});

// Main app router
export const appRouter = router({
  auth: authRouter,
  personas: personasRouter,
  learning: learningRouter,
  chat: chatRouter,
  media: mediaRouter,
  social: socialRouter,
  creatorVerification: creatorVerificationRouter,
  creatorMonetization: creatorMonetizationRouter,
  personaMonetization: personaMonetizationRouter,
  contentModeration: contentModerationRouter,
  behaviorAnalysis: behaviorAnalysisRouter,
  discovery: discoveryRouter,
  socialEngagement: socialEngagementRouter,
  feed: feedRouter,
});

export type AppRouter = typeof appRouter;
