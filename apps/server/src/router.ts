import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";
import express from "express";
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

// Helper function to get or create default persona for user
async function getOrCreateDefaultPersona(userId: string) {
  // First, try to find existing default persona
  const existingDefault = await db.execute(sql`
    SELECT * FROM personas 
    WHERE user_id = ${userId} AND is_default = true
    LIMIT 1
  `);

  if (existingDefault.rows.length > 0) {
    return existingDefault.rows[0];
  }

  // If no default exists, create one
  const defaultPersona = await db.execute(sql`
    INSERT INTO personas (
      user_id, name, description, is_default, 
      personality_traits, learning_enabled, image_analysis_enabled
    ) VALUES (
      ${userId}, 'My Persona', 'Your primary digital persona', true,
      '{"openness": 0.5, "conscientiousness": 0.5, "extraversion": 0.5, "agreeableness": 0.5, "neuroticism": 0.5}',
      true, true
    ) RETURNING *
  `);

  return defaultPersona.rows[0];
}

// Helper function to queue file for AI processing
async function queueFileForAIProcessing(
  fileId: string,
  personaId: string,
  mediaType: string
) {
  try {
    await db.execute(sql`
      INSERT INTO persona_learning_data (
        persona_id, source_type, source_id, content, processed, confidence
      ) VALUES (
        ${personaId}, 'media_file', ${fileId}, 
        ${"File uploaded for analysis: " + mediaType}, false, 50
      )
    `);
    logger.info(
      `Queued file ${fileId} for AI processing for persona ${personaId}`
    );
  } catch (error) {
    logger.error(`Failed to queue file for AI processing: ${error}`);
  }
}

// Schemas for validation
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const createPersonaSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const createMessageSchema = z.object({
  conversationId: z.string(),
  content: z.string().min(1),
  role: z.enum(["user", "assistant", "system"]),
});

// File upload schemas
const requestPresignedUrlSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  fileSize: z.number().positive(),
  conversationId: z.string().optional(),
  personaId: z.string().optional(),
});

const createFileMetadataSchema = z.object({
  fileId: z.string(),
  filename: z.string(),
  originalFilename: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  s3Key: z.string(),
  s3Bucket: z.string(),
  presignedUrl: z.string(),
  conversationId: z.string().optional(),
  personaId: z.string().optional(),
  description: z.string().optional(),
});

const updateFileStatusSchema = z.object({
  fileId: z.string(),
  status: z.enum(["pending", "completed", "deleted", "failure", "archived"]),
  uploadedAt: z.date().optional(),
});

// Initialize tRPC with context
const t = initTRPC
  .context<{
    req: express.Request;
    res: express.Response;
  }>()
  .create({
    transformer: superjson,
  });

// Base router and procedure
export const router = t.router;
export const publicProcedure = t.procedure;

// Auth middleware
const isAuthed = t.middleware(async ({ next, ctx }) => {
  const token = ctx.req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default-secret"
    ) as {
      userId: string;
    };
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user[0]) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return next({
      ctx: {
        user: user[0],
      },
    });
  } catch (error) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
});

const protectedProcedure = publicProcedure.use(isAuthed);

// Auth routes
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

      // Generate JWT token
      const token = jwt.sign(
        { userId: newUser[0].id },
        process.env.JWT_SECRET || "default-secret",
        { expiresIn: "7d" }
      );

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

    // Generate JWT token
    const token = jwt.sign(
      { userId: user[0].id },
      process.env.JWT_SECRET || "default-secret",
      { expiresIn: "7d" }
    );

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

// Personas routes
const personasRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await db
      .select()
      .from(personas)
      .where(eq(personas.userId, ctx.user.id));
  }),

  create: protectedProcedure
    .input(createPersonaSchema)
    .mutation(async ({ input, ctx }) => {
      const newPersona = await db
        .insert(personas)
        .values({
          ...input,
          userId: ctx.user.id,
        })
        .returning();

      return newPersona[0];
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const persona = await db
        .select()
        .from(personas)
        .where(and(eq(personas.id, input.id), eq(personas.userId, ctx.user.id)))
        .limit(1);

      if (!persona[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Persona not found",
        });
      }

      return persona[0];
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: createPersonaSchema.partial(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const updatedPersona = await db
        .update(personas)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(and(eq(personas.id, input.id), eq(personas.userId, ctx.user.id)))
        .returning();

      if (!updatedPersona[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Persona not found",
        });
      }

      return updatedPersona[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const deletedPersona = await db
        .delete(personas)
        .where(and(eq(personas.id, input.id), eq(personas.userId, ctx.user.id)))
        .returning();

      if (!deletedPersona[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Persona not found",
        });
      }

      return { success: true };
    }),
});

// Chat routes
const chatRouter = router({
  conversations: protectedProcedure.query(async ({ ctx }) => {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, ctx.user.id))
      .orderBy(desc(conversations.updatedAt));
  }),

  createConversation: protectedProcedure
    .input(
      z.object({
        title: z.string().optional(),
        personaId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const newConversation = await db
        .insert(conversations)
        .values({
          ...input,
          userId: ctx.user.id,
        })
        .returning();

      return newConversation[0];
    }),

  getMessages: protectedProcedure
    .input(z.object({ conversationId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // Verify conversation belongs to user
      const conversation = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, input.conversationId),
            eq(conversations.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!conversation[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      return await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, input.conversationId))
        .orderBy(messages.createdAt);
    }),

  sendMessage: protectedProcedure
    .input(createMessageSchema)
    .mutation(async ({ input, ctx }) => {
      // Verify conversation belongs to user
      const conversation = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, input.conversationId),
            eq(conversations.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!conversation[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      // Insert user message
      const userMessage = await db.insert(messages).values(input).returning();

      // Here you would integrate with AI service to generate response
      // For now, we'll just return the user message
      return userMessage[0];
    }),
});

// Social media routes
const socialRouter = router({
  connections: protectedProcedure.query(async ({ ctx }) => {
    return await db
      .select()
      .from(socialConnections)
      .where(eq(socialConnections.userId, ctx.user.id));
  }),

  connect: protectedProcedure
    .input(
      z.object({
        platform: z.enum([
          "twitter",
          "instagram",
          "facebook",
          "linkedin",
          "tiktok",
        ]),
        platformUserId: z.string(),
        username: z.string().optional(),
        accessToken: z.string(),
        refreshToken: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const newConnection = await db
        .insert(socialConnections)
        .values({
          ...input,
          userId: ctx.user.id,
        })
        .returning();

      return newConnection[0];
    }),

  disconnect: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const deletedConnection = await db
        .delete(socialConnections)
        .where(
          and(
            eq(socialConnections.id, input.id),
            eq(socialConnections.userId, ctx.user.id)
          )
        )
        .returning();

      if (!deletedConnection[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Connection not found",
        });
      }

      return { success: true };
    }),
});

// Media router (file uploads)
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
        process.env.S3_BUCKET || "digital-persona-uploads"
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
          process.env.S3_BUCKET || "digital-persona-uploads"
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

  getFilesByConversation: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(async ({ input, ctx }) => {
      const result = await db.execute(sql`
        SELECT * FROM media_files 
        WHERE conversation_id = ${input.conversationId} AND user_id = ${ctx.user.id}
        ORDER BY created_at DESC
      `);

      return result.rows;
    }),

  getUserFiles: protectedProcedure.query(async ({ ctx }) => {
    const result = await db.execute(sql`
        SELECT * FROM media_files 
        WHERE user_id = ${ctx.user.id} AND upload_status != 'deleted'
        ORDER BY created_at DESC
        LIMIT 50
      `);

    return result.rows;
  }),

  deleteFile: protectedProcedure
    .input(z.object({ fileId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Soft delete the file
      await db.execute(sql`
        UPDATE media_files 
        SET upload_status = 'deleted', updated_at = ${new Date()}
        WHERE file_id = ${input.fileId} AND user_id = ${ctx.user.id}
      `);

      // Remove all AI/ML learning data tied to this file
      await db.execute(sql`
        DELETE FROM persona_learning_data 
        WHERE source_type = 'media_file' AND source_id = ${input.fileId}
      `);

      logger.info(
        `Soft deleted file ${input.fileId} and cleaned up AI/ML data`
      );
      return { success: true };
    }),

  restoreFile: protectedProcedure
    .input(z.object({ fileId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await db.execute(sql`
        UPDATE media_files 
        SET upload_status = 'completed', updated_at = ${new Date()}
        WHERE file_id = ${input.fileId} AND user_id = ${ctx.user.id}
      `);

      // Re-queue for AI processing if it's an image or video
      const fileResult = await db.execute(sql`
        SELECT media_type, persona_id FROM media_files 
        WHERE file_id = ${input.fileId} AND user_id = ${ctx.user.id}
      `);

      if (fileResult.rows.length > 0) {
        const file = fileResult.rows[0] as any;
        if (
          (file.media_type === "image" || file.media_type === "video") &&
          file.persona_id
        ) {
          await queueFileForAIProcessing(
            input.fileId,
            file.persona_id,
            file.media_type
          );
        }
      }

      return { success: true };
    }),

  getFileDetails: protectedProcedure
    .input(z.object({ fileId: z.string() }))
    .query(async ({ input, ctx }) => {
      const result = await db.execute(sql`
        SELECT mf.*, p.name as persona_name 
        FROM media_files mf
        LEFT JOIN personas p ON mf.persona_id = p.id
        WHERE mf.file_id = ${input.fileId} AND mf.user_id = ${ctx.user.id}
      `);

      if (result.rows.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "File not found",
        });
      }

      return result.rows[0];
    }),

  getAllUserFiles: protectedProcedure
    .input(
      z.object({
        includeDeleted: z.boolean().default(false),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        mediaType: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Build the main query with proper parameter binding
      let baseQuery = sql`
        SELECT 
          mf.*,
          p.name as persona_name,
          c.title as conversation_title,
          COUNT(pld.id) as ai_insights_count
        FROM media_files mf
        LEFT JOIN personas p ON mf.persona_id = p.id
        LEFT JOIN conversations c ON mf.conversation_id = c.id
        LEFT JOIN persona_learning_data pld ON pld.source_type = 'media_file' AND pld.source_id = mf.file_id
        WHERE mf.user_id = ${ctx.user.id}
      `;

      let countQuery = sql`
        SELECT COUNT(*) as total 
        FROM media_files mf 
        WHERE mf.user_id = ${ctx.user.id}
      `;

      // Add conditional filters
      if (!input.includeDeleted) {
        baseQuery = sql`${baseQuery} AND mf.upload_status != 'deleted'`;
        countQuery = sql`${countQuery} AND mf.upload_status != 'deleted'`;
      }

      if (input.mediaType) {
        baseQuery = sql`${baseQuery} AND mf.media_type = ${input.mediaType}`;
        countQuery = sql`${countQuery} AND mf.media_type = ${input.mediaType}`;
      }

      // Complete the main query
      baseQuery = sql`${baseQuery}
        GROUP BY mf.id, p.name, c.title
        ORDER BY mf.created_at DESC
        LIMIT ${input.limit} OFFSET ${input.offset}
      `;

      const result = await db.execute(baseQuery);
      const countResult = await db.execute(countQuery);

      return {
        files: result.rows,
        total: (countResult.rows[0] as any)?.total || 0,
        hasMore:
          input.offset + input.limit <
          ((countResult.rows[0] as any)?.total || 0),
      };
    }),

  getFileStats: protectedProcedure.query(async ({ ctx }) => {
    const statsResult = await db.execute(sql`
        SELECT 
          COUNT(*) as total_files,
          COUNT(CASE WHEN upload_status = 'completed' THEN 1 END) as completed_files,
          COUNT(CASE WHEN upload_status = 'pending' THEN 1 END) as pending_files,
          COUNT(CASE WHEN upload_status = 'deleted' THEN 1 END) as deleted_files,
          COUNT(CASE WHEN media_type = 'image' THEN 1 END) as image_files,
          COUNT(CASE WHEN media_type = 'video' THEN 1 END) as video_files,
          COUNT(CASE WHEN media_type = 'document' THEN 1 END) as document_files,
          COALESCE(SUM(CASE WHEN file_size IS NOT NULL AND file_size >= 0 THEN file_size ELSE 0 END), 0) as total_size
        FROM media_files 
        WHERE user_id = ${ctx.user.id} AND upload_status != 'deleted'
      `);

    const result = statsResult.rows[0] as any;

    // Ensure all values are properly typed and have defaults
    return {
      total_files: Number(result?.total_files) || 0,
      completed_files: Number(result?.completed_files) || 0,
      pending_files: Number(result?.pending_files) || 0,
      deleted_files: Number(result?.deleted_files) || 0,
      image_files: Number(result?.image_files) || 0,
      video_files: Number(result?.video_files) || 0,
      document_files: Number(result?.document_files) || 0,
      total_size: Number(result?.total_size) || 0,
    };
  }),
});

// Main app router
export const appRouter = router({
  hello: publicProcedure.query(() => {
    return { message: "Hello World from tRPC server!" };
  }),
  auth: authRouter,
  personas: personasRouter,
  chat: chatRouter,
  social: socialRouter,
  media: mediaRouter,
});

export type AppRouter = typeof appRouter;
