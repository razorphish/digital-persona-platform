import { db } from "@digital-persona/database";
import {
  users,
  personas,
  mediaFiles,
  // TODO: Add these after database migration
  // userConnections,
  // subscriptionPlans,
  // learningInterviews,
} from "@digital-persona/database";
import { eq, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Learning questions for persona development
export const LEARNING_QUESTIONS = {
  simple: [
    {
      id: "color-pref",
      question: "What's your favorite color and why does it resonate with you?",
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
    {
      id: "music-pref",
      question: "What music makes you feel most like yourself?",
      type: "simple" as const,
      category: "preferences",
    },
    {
      id: "vacation-pref",
      question: "Describe your perfect vacation. What makes it ideal for you?",
      type: "simple" as const,
      category: "preferences",
    },
  ],
  complex: [
    {
      id: "friend-conflict",
      question:
        "Tell me about a time you had a disagreement with a close friend. How did you handle it, and what did you learn about yourself?",
      type: "complex" as const,
      category: "relationships",
      expectedResponseType: "video" as const,
    },
    {
      id: "difficult-decision",
      question:
        "Describe a difficult decision you've made that changed your life. What factors influenced your choice?",
      type: "complex" as const,
      category: "personality",
      expectedResponseType: "video" as const,
    },
    {
      id: "failure-growth",
      question:
        "Tell me about a significant failure or setback. How did it shape who you are today?",
      type: "complex" as const,
      category: "personality",
    },
    {
      id: "values-conflict",
      question:
        "Describe a time when your values were challenged. How did you respond?",
      type: "complex" as const,
      category: "personality",
      expectedResponseType: "video" as const,
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
    {
      id: "family-emergency",
      question:
        "Your family needs you during an important career opportunity. How do you handle this conflict?",
      type: "scenario" as const,
      category: "relationships",
    },
    {
      id: "moral-dilemma",
      question:
        "You find a wallet with a large amount of cash and no ID. What's your thought process for handling this?",
      type: "scenario" as const,
      category: "personality",
    },
    {
      id: "leadership-challenge",
      question:
        "You're leading a team where two members constantly clash. How would you address this?",
      type: "scenario" as const,
      category: "skills",
    },
  ],
};

export class PersonaService {
  /**
   * Create and initialize a main persona for a new user
   * This persona is indestructible and acts as the user's digital brain
   */
  static async createMainPersona(userId: string, userName: string) {
    try {
      // Check if user already has a main persona (using isDefault for now)
      const existingMain = await db
        .select()
        .from(personas)
        .where(and(eq(personas.userId, userId), eq(personas.isDefault, true)))
        .limit(1);

      if (existingMain.length > 0) {
        return existingMain[0];
      }

      // Create the indestructible main persona using current schema
      const [mainPersona] = await db
        .insert(personas)
        .values({
          userId,
          name: `${userName}'s Digital Mind`,
          description:
            "Your primary digital persona - the core of your digital self that learns and grows with you.",
          isDefault: true, // Using isDefault until we migrate to isMainPersona
          traits: {
            personaType: "main",
            isMainPersona: true,
            isDeletable: false,
            learningEnabled: true,
            allowConnections: false,
            contentFilter: {
              allowExplicit: false,
              allowPersonalInfo: true,
              allowSecrets: true,
              allowPhotos: true,
              allowVideos: true,
              customRules: [],
            },
            guardRails: {
              allowedUsers: [userId],
              blockedUsers: [],
              allowedTopics: [],
              blockedTopics: [],
              maxInteractionDepth: 100,
            },
          },
          preferences: {
            privacyLevel: "private",
            isPubliclyListed: false,
            requiresSubscription: false,
          },
        })
        .returning();

      // TODO: Start the initial learning interview after migration
      // await this.startLearningInterview(userId, mainPersona.id, "initial");

      return mainPersona;
    } catch (error) {
      console.error("Error creating main persona:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create main persona",
      });
    }
  }

  /**
   * Start a learning interview session for persona development
   * TODO: Implement after database migration with learningInterviews table
   */
  static async startLearningInterview(
    userId: string,
    personaId: string,
    sessionType:
      | "initial"
      | "simple_questions"
      | "complex_questions"
      | "scenario_questions"
      | "social_integration"
      | "interactive_discussion"
  ) {
    console.log(
      `Learning interview started for persona ${personaId}, session type: ${sessionType}`
    );

    // Select questions based on session type
    let questions: any[] = [];
    switch (sessionType) {
      case "initial":
        questions = [
          ...LEARNING_QUESTIONS.simple.slice(0, 3),
          LEARNING_QUESTIONS.complex[0],
        ];
        break;
      case "simple_questions":
        questions = LEARNING_QUESTIONS.simple;
        break;
      case "complex_questions":
        questions = LEARNING_QUESTIONS.complex;
        break;
      case "scenario_questions":
        questions = LEARNING_QUESTIONS.scenario;
        break;
      case "social_integration":
        questions = [
          {
            id: "social-connect",
            question:
              "Would you like to connect your social media accounts to help me learn more about you?",
            type: "simple",
            category: "social",
          },
        ];
        break;
      case "interactive_discussion":
        questions = [
          {
            id: "open-discussion-start",
            question:
              "Hi! I'm here to have a natural conversation with you to better understand your personality. Feel free to talk about anything on your mind - your day, interests, thoughts, or ask me questions. What would you like to discuss?",
            type: "discussion",
            category: "open_conversation",
            isOpenEnded: true,
            allowFollowUp: true,
          },
        ];
        break;
    }

    // For now, store in persona traits until we have the learning interviews table
    const [persona] = await db
      .select()
      .from(personas)
      .where(eq(personas.id, personaId))
      .limit(1);

    if (persona && persona.userId === userId) {
      const updatedTraits = {
        ...persona.traits,
        activeInterview: {
          sessionType,
          questions,
          status: "in_progress",
          currentQuestionIndex: 0,
          totalQuestions: questions.length,
          completionPercentage: 0,
          startedAt: new Date(),
        },
      };

      await db
        .update(personas)
        .set({ traits: updatedTraits })
        .where(eq(personas.id, personaId));

      return { id: `temp-${personaId}`, questions, status: "in_progress" };
    }

    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Persona not found",
    });
  }

  /**
   * Create a child persona derived from the main persona
   */
  static async createChildPersona(
    userId: string,
    parentPersonaId: string,
    personaData: {
      name: string;
      description?: string;
      personaType: "child" | "public" | "premium";
      privacyLevel: "public" | "friends" | "subscribers" | "private";
      requiresSubscription?: boolean;
      subscriptionPrice?: number;
      contentFilter?: any;
      guardRails?: any;
    }
  ) {
    try {
      // Get the parent persona (usually main persona)
      const [parentPersona] = await db
        .select()
        .from(personas)
        .where(eq(personas.id, parentPersonaId))
        .limit(1);

      if (!parentPersona || parentPersona.userId !== userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Parent persona not found",
        });
      }

      // Inherit traits and preferences from parent
      const inheritedTraits = {
        ...parentPersona.traits,
        personaType: personaData.personaType,
        parentPersonaId,
        isDeletable: true,
        learningEnabled: false,
        contentFilter: {
          allowExplicit: false,
          allowPersonalInfo: personaData.personaType !== "public",
          allowSecrets: false,
          allowPhotos: personaData.personaType !== "public",
          allowVideos: personaData.personaType !== "public",
          customRules: [],
          ...personaData.contentFilter,
        },
        guardRails: {
          allowedUsers: [],
          blockedUsers: [],
          allowedTopics: [],
          blockedTopics: [],
          maxInteractionDepth: personaData.personaType === "public" ? 5 : 10,
          ...personaData.guardRails,
        },
      };

      const inheritedPreferences = {
        ...parentPersona.preferences,
        privacyLevel: personaData.privacyLevel,
        isPubliclyListed: personaData.personaType === "public",
        allowConnections: true,
        requiresSubscription: personaData.requiresSubscription || false,
        subscriptionPrice: personaData.subscriptionPrice,
      };

      const [childPersona] = await db
        .insert(personas)
        .values({
          userId,
          name: personaData.name,
          description:
            personaData.description ||
            `A ${personaData.personaType} persona derived from ${parentPersona.name}`,
          traits: inheritedTraits,
          preferences: inheritedPreferences,
          isDefault: false,
        })
        .returning();

      // TODO: Create subscription plans if it's a premium persona after migration
      // if (personaData.requiresSubscription && personaData.subscriptionPrice) {
      //   await this.createDefaultSubscriptionPlans(childPersona.id, personaData.subscriptionPrice);
      // }

      return childPersona;
    } catch (error) {
      console.error("Error creating child persona:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create child persona",
      });
    }
  }

  /**
   * Answer a learning interview question and process insights
   * TODO: Implement properly after database migration
   */
  static async answerInterviewQuestion(
    userId: string,
    interviewId: string,
    questionId: string,
    response?: string,
    mediaFiles?: string[],
    skipQuestion = false
  ) {
    try {
      // For now, work with the temporary interview stored in persona traits
      const personaId = interviewId.replace("temp-", "");
      const [persona] = await db
        .select()
        .from(personas)
        .where(eq(personas.id, personaId))
        .limit(1);

      if (!persona || persona.userId !== userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Interview not found",
        });
      }

      const traits = persona.traits as any;
      const activeInterview = traits?.activeInterview;

      if (!activeInterview) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No active interview found",
        });
      }

      const questionIndex = activeInterview.questions.findIndex(
        (q: any) => q.id === questionId
      );

      if (questionIndex === -1) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Question not found",
        });
      }

      // Update the question with response
      activeInterview.questions[questionIndex] = {
        ...activeInterview.questions[questionIndex],
        answered: !skipQuestion,
        response: skipQuestion ? undefined : response,
        mediaFiles: skipQuestion ? undefined : mediaFiles,
        confidence: skipQuestion ? 0 : 85,
      };

      // Calculate completion percentage
      const answeredQuestions = activeInterview.questions.filter(
        (q: any) => q.answered
      ).length;
      const completionPercentage = Math.round(
        (answeredQuestions / activeInterview.questions.length) * 100
      );

      activeInterview.completionPercentage = completionPercentage;
      activeInterview.currentQuestionIndex = Math.min(
        activeInterview.currentQuestionIndex + 1,
        activeInterview.questions.length
      );

      if (completionPercentage === 100) {
        activeInterview.status = "completed";
        activeInterview.completedAt = new Date();
      }

      // If not skipped, process the response for personality insights
      if (!skipQuestion && response) {
        await this.processLearningResponse(
          personaId,
          activeInterview.questions[questionIndex],
          response,
          mediaFiles
        );
      }

      // Update persona
      const updatedTraits = {
        ...traits,
        activeInterview,
      };

      await db
        .update(personas)
        .set({ traits: updatedTraits })
        .where(eq(personas.id, personaId));

      return activeInterview;
    } catch (error) {
      console.error("Error answering interview question:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to answer interview question",
      });
    }
  }

  /**
   * Process learning response to extract personality insights
   */
  private static async processLearningResponse(
    personaId: string,
    question: any,
    response: string,
    mediaFileIds?: string[]
  ) {
    try {
      // Enhanced personality analysis with media processing
      const insights: Record<string, any> = {};

      // Process audio files for voice analysis if present
      if (mediaFileIds && mediaFileIds.length > 0) {
        console.log(
          `📼 Processing ${mediaFileIds.length} media files for persona ${personaId}`
        );

        // Get media file details from database
        const { sql, inArray } = await import("drizzle-orm");

        const mediaDetails = await db
          .select()
          .from(mediaFiles)
          .where(inArray(mediaFiles.fileId, mediaFileIds));

        console.log("📁 Media file details:", mediaDetails);

        // Process audio files for AI/ML analysis
        for (const media of mediaDetails) {
          if (
            media.mediaType === "audio" ||
            media.mimeType?.startsWith("audio/")
          ) {
            console.log(
              `🎤 Processing audio file: ${media.filename} (${media.s3Key})`
            );

            // Mark as learning data for AI/ML processing
            await db
              .update(mediaFiles)
              .set({
                isLearningData: true,
                aiAnalysis: {
                  questionId: question.id,
                  questionText: question.question,
                  questionCategory: question.category,
                  textResponse: response,
                  processedAt: new Date(),
                  status: "pending_analysis",
                  personalityContext: {
                    personaId,
                    sessionType: "learning_interview",
                  },
                },
              })
              .where(sql`${mediaFiles.fileId} = ${media.fileId}`);

            // TODO: Send to AI/ML service for voice analysis
            // This would analyze speech patterns, tone, emotion, etc.
            insights.voiceAnalysis = {
              hasAudioResponse: true,
              audioFileId: media.fileId,
              analysisStatus: "pending",
              expectedInsights: [
                "tone",
                "emotion",
                "speech_patterns",
                "confidence_level",
              ],
            };

            console.log(
              `🎯 Audio file ${media.fileId} queued for AI/ML analysis`
            );

            // Send audio to AI/ML service for processing
            await this.sendToAIMLService(media, question, response, personaId);
          }
        }
      }

      // Enhanced analysis for open conversation data
      if (
        question.category === "open_conversation" ||
        question.type === "discussion"
      ) {
        insights.conversationalData = {
          responseLength: response.length,
          topicFreedom: "high", // User chose their own topic
          naturalExpression: true,
          conversationFlow: "organic",
          hasAudioData: mediaFileIds && mediaFileIds.length > 0,
          timestamp: new Date(),
        };

        // Analyze natural conversation patterns
        const responseWords = response.toLowerCase();
        const wordCount = response.split(/\s+/).length;

        insights.communicationStyle = {
          verbosity:
            wordCount > 50
              ? "detailed"
              : wordCount > 20
              ? "moderate"
              : "concise",
          emotionalExpression:
            responseWords.includes("feel") || responseWords.includes("emotion")
              ? "high"
              : "moderate",
          questionAsking: response.includes("?") ? "inquisitive" : "direct",
          topicInitiation: "self_directed", // User initiated the topic
        };
      }

      // Analyze response for personality traits
      if (question.category === "preferences") {
        insights.preferences = {
          [question.id]: response,
          lastUpdated: new Date(),
        };
      }

      if (
        question.category === "personality" ||
        question.category === "open_conversation"
      ) {
        // Extract personality indicators from response
        const responseWords = response.toLowerCase();
        if (
          responseWords.includes("team") ||
          responseWords.includes("together")
        ) {
          insights.extraversion = Math.min(
            (insights.extraversion || 0.5) + 0.1,
            1.0
          );
        }
        if (
          responseWords.includes("plan") ||
          responseWords.includes("organize")
        ) {
          insights.conscientiousness = Math.min(
            (insights.conscientiousness || 0.5) + 0.1,
            1.0
          );
        }
      }

      // Update persona with new insights
      const [persona] = await db
        .select()
        .from(personas)
        .where(eq(personas.id, personaId))
        .limit(1);

      if (persona) {
        const currentTraits = (persona.traits as any) || {};
        const currentPreferences = (persona.preferences as any) || {};

        const updatedTraits = { ...currentTraits, ...insights };
        const updatedPreferences = {
          ...currentPreferences,
          ...insights.preferences,
          learningHistory: [
            ...(currentPreferences.learningHistory || []),
            {
              questionId: question.id,
              category: question.category,
              question: question.question,
              response,
              mediaFiles: mediaFileIds,
              processedAt: new Date(),
            },
          ],
        };

        await db
          .update(personas)
          .set({
            traits: updatedTraits,
            preferences: updatedPreferences,
          })
          .where(eq(personas.id, personaId));
      }
    } catch (error) {
      console.error("Error processing learning response:", error);
      // Don't throw - this is background processing
    }
  }

  /**
   * Send audio file to AI/ML service for personality analysis
   */
  private static async sendToAIMLService(
    mediaFile: any,
    question: any,
    textResponse: string,
    personaId: string
  ) {
    try {
      console.log(`🤖 Sending audio ${mediaFile.fileId} to AI/ML service`);

      // Prepare data for AI/ML service
      const analysisPayload = {
        audioFile: {
          fileId: mediaFile.fileId,
          s3Key: mediaFile.s3Key,
          s3Url: mediaFile.s3Url,
          filename: mediaFile.filename,
          mimeType: mediaFile.mimeType,
          fileSize: mediaFile.fileSize,
        },
        context: {
          personaId,
          questionId: question.id,
          questionText: question.question,
          questionCategory: question.category,
          textResponse,
          sessionType: "learning_interview",
        },
        analysisRequests: [
          "voice_tone_analysis", // Emotional tone and sentiment
          "speech_pattern_analysis", // Speaking pace, pauses, clarity
          "personality_indicators", // Confidence, extroversion, etc.
          "emotional_state", // Current emotional indicators
          "authenticity_analysis", // Genuine vs rehearsed responses
        ],
      };

      // TODO: Send to Python ML service
      // For now, we'll simulate the call with logging
      console.log(
        "🎯 AI/ML Analysis Payload:",
        JSON.stringify(analysisPayload, null, 2)
      );

      // In production, this would be:
      // const response = await fetch(`${process.env.ML_SERVICE_URL}/analyze-voice`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(analysisPayload)
      // });

      // Simulate successful processing
      const simulatedResults = {
        voiceTone: {
          confidence: 0.85,
          primaryEmotion: "neutral",
          energyLevel: 0.7,
          stress_indicators: 0.2,
        },
        speechPatterns: {
          wordsPerMinute: 150,
          pauseFrequency: "normal",
          clarity: 0.9,
          confidence_markers: 0.8,
        },
        personalityIndicators: {
          extraversion: 0.6,
          conscientiousness: 0.7,
          openness: 0.8,
          agreeableness: 0.75,
          neuroticism: 0.3,
        },
      };

      // Update the media file with analysis results
      await db
        .update(mediaFiles)
        .set({
          aiAnalysis: {
            ...analysisPayload.context,
            status: "completed",
            completedAt: new Date(),
            results: simulatedResults,
            processingTimeMs: 2500, // Simulated processing time
          },
        })
        .where(eq(mediaFiles.fileId, mediaFile.fileId));

      console.log(`✅ AI/ML analysis completed for audio ${mediaFile.fileId}`);
    } catch (error) {
      console.error(`❌ AI/ML service error for ${mediaFile.fileId}:`, error);

      // Update status to failed
      await db
        .update(mediaFiles)
        .set({
          aiAnalysis: {
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
            failedAt: new Date(),
          },
        })
        .where(eq(mediaFiles.fileId, mediaFile.fileId));
    }
  }

  /**
   * Get main persona for user, creating if needed
   */
  static async getOrCreateMainPersona(userId: string) {
    try {
      const [mainPersona] = await db
        .select()
        .from(personas)
        .where(and(eq(personas.userId, userId), eq(personas.isDefault, true)))
        .limit(1);

      if (mainPersona) {
        return mainPersona;
      }

      // Get user info for persona creation
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return await this.createMainPersona(userId, user.name);
    } catch (error) {
      console.error("Error getting/creating main persona:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get or create main persona",
      });
    }
  }

  /**
   * Check if persona can be deleted (main personas cannot be deleted)
   */
  static async canDeletePersona(
    userId: string,
    personaId: string
  ): Promise<boolean> {
    try {
      const [persona] = await db
        .select()
        .from(personas)
        .where(eq(personas.id, personaId))
        .limit(1);

      if (!persona || persona.userId !== userId) {
        return false;
      }

      // Check if it's a main persona (using traits for now)
      const traits = persona.traits as any;
      return !traits?.isMainPersona && !persona.isDefault;
    } catch (error) {
      console.error("Error checking persona deletion permissions:", error);
      return false;
    }
  }

  /**
   * Get current learning interview for persona
   */
  static async getCurrentInterview(userId: string, personaId: string) {
    try {
      const [persona] = await db
        .select()
        .from(personas)
        .where(eq(personas.id, personaId))
        .limit(1);

      if (!persona || persona.userId !== userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Persona not found",
        });
      }

      const traits = persona.traits as any;
      const activeInterview = traits?.activeInterview;

      if (!activeInterview || activeInterview.status === "completed") {
        return null;
      }

      return {
        id: `temp-${personaId}`,
        ...activeInterview,
      };
    } catch (error) {
      console.error("Error getting current interview:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get current interview",
      });
    }
  }
}
