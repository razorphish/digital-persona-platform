/**
 * Airica Conversation Intelligence System
 * 
 * Manages smart conversation flow, relationship progression, and learning integration.
 * The heart of Airica's memory explorer functionality.
 */

import { QuestionBankService, Question } from './questionBank.js';
import { OpenAIService } from './openaiService.js';
import { db } from '@digital-persona/database';
import { users, personas, conversations, messages } from '@digital-persona/database';
import { eq, desc, and, gte, count } from 'drizzle-orm';

// Relationship stage configuration
export interface RelationshipStage {
  stage: 'stranger' | 'acquaintance' | 'friend' | 'close_friend';
  messageThreshold: number;
  intimacyLevel: number;
  questionProbability: number;
  name: string;
  description: string;
}

export const RELATIONSHIP_STAGES: RelationshipStage[] = [
  {
    stage: 'stranger',
    messageThreshold: 0,
    intimacyLevel: 2,
    questionProbability: 0.7, // High chance of questions for new users
    name: 'Getting to Know You',
    description: 'Learning the basics about who you are'
  },
  {
    stage: 'acquaintance',
    messageThreshold: 10,
    intimacyLevel: 4,
    questionProbability: 0.5, // Moderate question frequency
    name: 'Building Connection',
    description: 'Discovering your experiences and perspectives'
  },
  {
    stage: 'friend',
    messageThreshold: 50,
    intimacyLevel: 6,
    questionProbability: 0.4, // Fewer but deeper questions
    name: 'Deepening Bond',
    description: 'Understanding your deeper thoughts and feelings'
  },
  {
    stage: 'close_friend',
    messageThreshold: 150,
    intimacyLevel: 8,
    questionProbability: 0.3, // Occasional intimate questions
    name: 'Trusted Companion',
    description: 'Sharing in your most personal thoughts and dreams'
  }
];

// Conversation types that affect questioning strategy
export type ConversationType = 'conservative' | 'liberal' | 'open_ended';

export interface ConversationContext {
  userId: string;
  conversationId: string;
  messageCount: number;
  lastMessage: string;
  recentMessages: Array<{ role: string; content: string; timestamp: Date }>;
  userComfortLevel: number; // 0-1 scale
  conversationType: ConversationType;
  relationshipStage: RelationshipStage;
  recentQuestionIds: string[];
}

// Smart timing factors for question generation
export interface TimingFactors {
  messageLength: number; // 0-1 scale based on response depth
  emotionalContent: number; // 0-1 scale for emotional expression
  newInfoDetected: number; // 0-1 scale for new personal information
  timeSinceLastQuestion: number; // minutes since last question
  conversationFlow: number; // 0-1 scale for natural conversation rhythm
  relationshipStage: number; // 0-1 scale based on current stage
  conversationType: number; // 0-1 scale based on conversation openness
  userComfortLevel: number; // 0-1 scale for user openness
}

// Memory priorities for storing conversation insights
export enum MemoryPriority {
  EMOTIONAL_MOMENTS = 100,
  PERSONAL_FACTS = 80,
  SITUATIONAL_SCENARIOS = 60,
  PREFERENCES = 40,
  CASUAL_MENTIONS = 20
}

export interface MemoryInsight {
  content: string;
  priority: MemoryPriority;
  category: 'personality' | 'preferences' | 'memories' | 'relationships' | 'skills' | 'interests';
  confidence: number; // 0-1 scale
  emotionalWeight: number; // 0-1 scale
  personalFactScore: number; // 0-1 scale
  extractedAt: Date;
  relatedMessageId: string;
}

export class ConversationIntelligenceService {
  private openaiService: OpenAIService;
  private rateLimitTracker: Map<string, { count: number; resetTime: Date }> = new Map();

  constructor() {
    this.openaiService = new OpenAIService();
  }

  /**
   * Initialize a conversation session with dynamic greeting
   */
  async initializeSession(userId: string, conversationId?: string): Promise<string> {
    try {
      const context = await this.buildConversationContext(userId, conversationId);
      
      if (context.messageCount === 0) {
        // First time user - show intro
        return this.generateFirstTimeGreeting();
      } else {
        // Returning user - dynamic greeting + smart question
        const greeting = await this.generateDynamicGreeting(userId);
        const smartQuestion = await this.generateSmartQuestion(context);
        return `${greeting} ${smartQuestion || ''}`;
      }
    } catch (error) {
      console.error('Error initializing session:', error);
      return this.getFallbackGreeting();
    }
  }

  /**
   * Process user response and determine if a follow-up question should be asked
   */
  async processUserResponse(
    userId: string,
    conversationId: string,
    response: string
  ): Promise<{ followUpQuestion?: string; insights: MemoryInsight[] }> {
    try {
      const context = await this.buildConversationContext(userId, conversationId);
      context.lastMessage = response;

      // Extract learning insights from response
      const insights = await this.extractMemoryInsights(response, conversationId);

      // Store insights in learning system
      await this.storeLearningInsights(userId, insights);

      // Determine if follow-up question needed
      const shouldAskQuestion = await this.shouldAskLearningQuestion(context);
      
      let followUpQuestion: string | undefined;
      if (shouldAskQuestion) {
        followUpQuestion = await this.generateSmartQuestion(context);
      }

      return { followUpQuestion, insights };
    } catch (error) {
      console.error('Error processing user response:', error);
      return { insights: [] };
    }
  }

  /**
   * Determine current relationship stage based on interaction history
   */
  async determineRelationshipStage(userId: string, conversationId?: string): Promise<RelationshipStage> {
    try {
      // Count total messages from user across all conversations
      const messageCount = await this.getUserMessageCount(userId);
      
      // Find appropriate stage based on message threshold
      for (let i = RELATIONSHIP_STAGES.length - 1; i >= 0; i--) {
        const stage = RELATIONSHIP_STAGES[i];
        if (messageCount >= stage.messageThreshold) {
          return stage;
        }
      }
      
      return RELATIONSHIP_STAGES[0]; // Default to stranger
    } catch (error) {
      console.error('Error determining relationship stage:', error);
      return RELATIONSHIP_STAGES[0];
    }
  }

  /**
   * Smart algorithm to determine if a learning question should be asked
   */
  private async shouldAskLearningQuestion(context: ConversationContext): Promise<boolean> {
    const factors = await this.calculateTimingFactors(context);
    
    // Weighted scoring algorithm
    const score = (
      factors.messageLength * 0.2 +
      factors.emotionalContent * 0.25 +
      factors.newInfoDetected * 0.2 +
      factors.conversationFlow * 0.15 +
      factors.userComfortLevel * 0.1 +
      factors.conversationType * 0.1
    );

    // Adjust probability based on relationship stage
    const stageMultiplier = context.relationshipStage.questionProbability;
    const finalProbability = score * stageMultiplier;

    return finalProbability > 0.6;
  }

  /**
   * Calculate timing factors for smart question generation
   */
  private async calculateTimingFactors(context: ConversationContext): Promise<TimingFactors> {
    return {
      messageLength: this.analyzeResponseDepth(context.lastMessage),
      emotionalContent: await this.detectEmotionalContent(context.lastMessage),
      newInfoDetected: await this.detectNewInformation(context.lastMessage),
      timeSinceLastQuestion: this.getTimeSinceLastLearningQuestion(context),
      conversationFlow: this.analyzeConversationRhythm(context.recentMessages),
      relationshipStage: context.relationshipStage.intimacyLevel / 10,
      conversationType: this.getConversationTypeScore(context.conversationType),
      userComfortLevel: context.userComfortLevel
    };
  }

  /**
   * Generate a smart, contextual question using OpenAI or fallback to static questions
   */
  private async generateSmartQuestion(context: ConversationContext): Promise<string | null> {
    try {
      // Check rate limits first
      if (!this.checkRateLimit(context.userId)) {
        return this.getFallbackQuestion(context);
      }

      // Try OpenAI first for dynamic question generation
      if (this.openaiService.isAvailable()) {
        try {
          const dynamicQuestion = await this.generateDynamicQuestion(context);
          if (dynamicQuestion) {
            this.updateRateLimit(context.userId);
            return dynamicQuestion;
          }
        } catch (error) {
          console.warn('OpenAI question generation failed, falling back to static questions:', error);
        }
      }

      // Fallback to static question bank
      return this.getFallbackQuestion(context);
    } catch (error) {
      console.error('Error generating smart question:', error);
      return null;
    }
  }

  /**
   * Generate dynamic question using OpenAI
   */
  private async generateDynamicQuestion(context: ConversationContext): Promise<string | null> {
    const prompt = this.buildQuestionGenerationPrompt(context);
    
    const response = await this.openaiService.generateChatCompletion([
      { role: 'system', content: 'You are Airica, a thoughtful AI companion who asks engaging questions to learn about users.' },
      { role: 'user', content: prompt }
    ], 'gpt-3.5-turbo', 150, 0.8);

    return response.content?.trim() || null;
  }

  /**
   * Build prompt for OpenAI question generation
   */
  private buildQuestionGenerationPrompt(context: ConversationContext): string {
    const { relationshipStage, lastMessage, recentMessages, userComfortLevel } = context;
    
    return `Generate a thoughtful, engaging question for me to ask a user. 

Context:
- Relationship stage: ${relationshipStage.name} (${relationshipStage.description})
- User's last message: "${lastMessage}"
- User comfort level: ${Math.round(userComfortLevel * 100)}%
- Conversation type: ${context.conversationType}
- Recent topics: ${this.extractRecentTopics(recentMessages)}

Generate a question that:
1. Feels natural and conversational in Airica's friendly voice
2. Helps learn about the user's personality, experiences, or perspectives
3. Matches the intimacy level of a ${relationshipStage.stage} relationship
4. Avoids repeating recent topics
5. Encourages meaningful sharing

Return just the question, no explanation.`;
  }

  /**
   * Get fallback static question when OpenAI is unavailable
   */
  private getFallbackQuestion(context: ConversationContext): string | null {
    const question = QuestionBankService.getRandomQuestion(
      context.relationshipStage.stage,
      undefined,
      context.recentQuestionIds
    );
    
    return question ? question.question : null;
  }

  /**
   * Extract memory insights from user response
   */
  private async extractMemoryInsights(response: string, conversationId: string): Promise<MemoryInsight[]> {
    const insights: MemoryInsight[] = [];

    try {
      // Use OpenAI for sophisticated insight extraction
      if (this.openaiService.isAvailable()) {
        const analysisPrompt = `Analyze this user response for personality insights, personal facts, and emotional content:

"${response}"

Return a JSON array of insights with this format:
[
  {
    "content": "Brief description of the insight",
    "category": "personality|preferences|memories|relationships|skills|interests",
    "confidence": 0.8,
    "emotionalWeight": 0.5,
    "personalFactScore": 0.7
  }
]

Only include meaningful insights. Return empty array if no significant insights found.`;

        const aiResponse = await this.openaiService.generateChatCompletion([
          { role: 'system', content: 'You are an expert at extracting personality insights from conversation. Return valid JSON only.' },
          { role: 'user', content: analysisPrompt }
        ], 'gpt-3.5-turbo', 500, 0.3);

        if (aiResponse.content) {
          try {
            const parsedInsights = JSON.parse(aiResponse.content);
            for (const insight of parsedInsights) {
              insights.push({
                ...insight,
                priority: this.calculateMemoryPriority(insight),
                extractedAt: new Date(),
                relatedMessageId: conversationId
              });
            }
          } catch (parseError) {
            console.warn('Failed to parse OpenAI insights, using fallback analysis');
          }
        }
      }

      // Fallback simple keyword-based analysis
      if (insights.length === 0) {
        insights.push(...this.performSimpleInsightExtraction(response, conversationId));
      }

    } catch (error) {
      console.error('Error extracting memory insights:', error);
      // Always return at least basic analysis
      insights.push(...this.performSimpleInsightExtraction(response, conversationId));
    }

    return insights;
  }

  /**
   * Calculate memory priority based on insight characteristics
   */
  private calculateMemoryPriority(insight: any): MemoryPriority {
    const { emotionalWeight, personalFactScore, category } = insight;
    
    if (emotionalWeight > 0.7) return MemoryPriority.EMOTIONAL_MOMENTS;
    if (personalFactScore > 0.7) return MemoryPriority.PERSONAL_FACTS;
    if (category === 'memories' || category === 'relationships') return MemoryPriority.SITUATIONAL_SCENARIOS;
    if (category === 'preferences') return MemoryPriority.PREFERENCES;
    
    return MemoryPriority.CASUAL_MENTIONS;
  }

  /**
   * Simple fallback insight extraction using keywords and patterns
   */
  private performSimpleInsightExtraction(response: string, conversationId: string): MemoryInsight[] {
    const insights: MemoryInsight[] = [];
    const lowerResponse = response.toLowerCase();

    // Emotional indicators
    const emotionalKeywords = ['feel', 'love', 'hate', 'excited', 'sad', 'happy', 'angry', 'afraid', 'worried'];
    if (emotionalKeywords.some(keyword => lowerResponse.includes(keyword))) {
      insights.push({
        content: 'User expressed emotional content',
        priority: MemoryPriority.EMOTIONAL_MOMENTS,
        category: 'personality',
        confidence: 0.6,
        emotionalWeight: 0.8,
        personalFactScore: 0.3,
        extractedAt: new Date(),
        relatedMessageId: conversationId
      });
    }

    // Personal fact indicators
    const personalKeywords = ['my family', 'my job', 'my home', 'i work', 'i live', 'i studied'];
    if (personalKeywords.some(keyword => lowerResponse.includes(keyword))) {
      insights.push({
        content: 'User shared personal information',
        priority: MemoryPriority.PERSONAL_FACTS,
        category: 'relationships',
        confidence: 0.7,
        emotionalWeight: 0.2,
        personalFactScore: 0.9,
        extractedAt: new Date(),
        relatedMessageId: conversationId
      });
    }

    return insights;
  }

  /**
   * Store learning insights in the database
   */
  private async storeLearningInsights(userId: string, insights: MemoryInsight[]): Promise<void> {
    // TODO: Implement database storage for insights
    // This would integrate with the existing learning system
    console.log(`Storing ${insights.length} insights for user ${userId}`);
  }

  // Helper methods for analysis
  private analyzeResponseDepth(message: string): number {
    const wordCount = message.split(' ').length;
    return Math.min(wordCount / 50, 1); // Normalize to 0-1 scale
  }

  private async detectEmotionalContent(message: string): Promise<number> {
    const emotionalWords = ['feel', 'love', 'hate', 'excited', 'sad', 'happy', 'angry', 'amazing', 'terrible'];
    const foundEmotions = emotionalWords.filter(word => 
      message.toLowerCase().includes(word)
    ).length;
    return Math.min(foundEmotions / 3, 1);
  }

  private async detectNewInformation(message: string): Promise<number> {
    const infoKeywords = ['my', 'i am', 'i work', 'i live', 'i studied', 'my family', 'my job'];
    const foundInfo = infoKeywords.filter(keyword => 
      message.toLowerCase().includes(keyword)
    ).length;
    return Math.min(foundInfo / 2, 1);
  }

  private getTimeSinceLastLearningQuestion(context: ConversationContext): number {
    // TODO: Implement actual timing logic
    return 0.5; // Placeholder
  }

  private analyzeConversationRhythm(recentMessages: any[]): number {
    // TODO: Implement conversation rhythm analysis
    return 0.7; // Placeholder
  }

  private getConversationTypeScore(type: ConversationType): number {
    const scores = { conservative: 0.3, liberal: 0.6, open_ended: 0.9 };
    return scores[type];
  }

  private extractRecentTopics(recentMessages: any[]): string {
    // TODO: Implement topic extraction
    return 'general conversation';
  }

  // Rate limiting methods
  private checkRateLimit(userId: string): boolean {
    const limit = this.rateLimitTracker.get(userId);
    if (!limit) return true;
    
    const now = new Date();
    if (now > limit.resetTime) {
      this.rateLimitTracker.delete(userId);
      return true;
    }
    
    return limit.count < 10; // 10 requests per hour
  }

  private updateRateLimit(userId: string): void {
    const now = new Date();
    const resetTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    
    const current = this.rateLimitTracker.get(userId);
    if (current && now < current.resetTime) {
      current.count++;
    } else {
      this.rateLimitTracker.set(userId, { count: 1, resetTime });
    }
  }

  // Greeting generation methods
  private generateFirstTimeGreeting(): string {
    return `Hello! I'm Airica, your AI companion. I'm here to get to know you and help you create your digital persona through our conversations.

As we chat, I'll learn about your personality, interests, values, and unique traits to build an authentic digital representation of who you are. Think of me as a friend who's genuinely curious about what makes you... you!

So tell me, what makes you uniquely you? What are your passions, goals, or something interesting about yourself? ✨`;
  }

  private async generateDynamicGreeting(userId: string): Promise<string> {
    const greetings = [
      "Good seeing you again! How's your day going?",
      "Welcome back! What's on your mind today?",
      "Hey there! Hope you're having a great day - what's new?",
      "Nice to see you again! How are you feeling today?",
      "Welcome back! I've been looking forward to our conversation.",
      "Good to have you back! What's been happening in your world?"
    ];
    
    const randomIndex = Math.floor(Math.random() * greetings.length);
    return greetings[randomIndex];
  }

  private getFallbackGreeting(): string {
    return "Hello! How are you doing today?";
  }

  // Context building methods
  private async buildConversationContext(userId: string, conversationId?: string): Promise<ConversationContext> {
    const messageCount = await this.getUserMessageCount(userId);
    const relationshipStage = await this.determineRelationshipStage(userId, conversationId);
    
    return {
      userId,
      conversationId: conversationId || '',
      messageCount,
      lastMessage: '',
      recentMessages: [], // TODO: Fetch from database
      userComfortLevel: 0.5, // TODO: Calculate based on user behavior
      conversationType: 'liberal', // TODO: Detect from conversation
      relationshipStage,
      recentQuestionIds: [] // TODO: Fetch from recent questions
    };
  }

  private async getUserMessageCount(userId: string): Promise<number> {
    try {
      const result = await db
        .select({ count: count() })
        .from(messages)
        .innerJoin(conversations, eq(messages.conversationId, conversations.id))
        .where(and(
          eq(conversations.userId, userId),
          eq(messages.role, 'user')
        ));
      
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting user message count:', error);
      return 0;
    }
  }
}