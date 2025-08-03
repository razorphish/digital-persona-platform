import { initTRPC, TRPCError } from "@trpc/server";
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
});

// Enhanced Personas router with new functionality
const personasRouter = router({
  // Get all personas for user
  list: protectedProcedure.query(async ({ ctx }) => {
    const userPersonas = await db
      .select()
      .from(personas)
      .where(eq(personas.userId, ctx.user.id))
      .orderBy(desc(personas.createdAt));

    return userPersonas.map((persona: typeof personas.$inferSelect) => ({
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
        .select()
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

// Chat router (existing functionality with learning integration)
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

  // Send message
  sendMessage: protectedProcedure
    .input(sendMessageSchema)
    .mutation(async ({ input, ctx }) => {
      // Create user message
      const [userMessage] = await db
        .insert(messages)
        .values({
          conversationId: input.conversationId,
          role: "user",
          content: input.content,
        })
        .returning();

      // TODO: Generate AI response based on persona
      // For now, create a simple acknowledgment
      const [aiMessage] = await db
        .insert(messages)
        .values({
          conversationId: input.conversationId,
          role: "assistant",
          content:
            "Thank you for sharing that with me. I'm learning more about you every day!",
        })
        .returning();

      return {
        userMessage: {
          ...userMessage,
          createdAt: userMessage.createdAt.toISOString(),
        },
        aiMessage: {
          ...aiMessage,
          createdAt: aiMessage.createdAt.toISOString(),
        },
      };
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

// Main app router
export const appRouter = router({
  auth: authRouter,
  personas: personasRouter,
  learning: learningRouter,
  chat: chatRouter,
  media: mediaRouter,
  social: socialRouter,
});

export type AppRouter = typeof appRouter;
