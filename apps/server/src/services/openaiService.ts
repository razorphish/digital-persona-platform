/**
 * OpenAI Service for Main Backend
 * 
 * Handles AI-powered conversation intelligence and question generation
 * Integrated directly with the tRPC backend for tight coupling with user data
 */

import OpenAI from 'openai';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionResponse {
  content: string | null;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  finish_reason?: string;
}

export class OpenAIService {
  private client: OpenAI | null = null;
  private isInitialized = false;
  private rateLimitTracker: Map<string, { count: number; resetTime: Date }> = new Map();
  
  // Rate limiting configuration
  private readonly RATE_LIMITS = {
    TIER_1: { // New users, first 30 days
      requestsPerMinute: 2,
      requestsPerHour: 50,
      requestsPerDay: 200
    },
    TIER_2: { // Established users, after 30 days
      requestsPerMinute: 5,
      requestsPerHour: 100,
      requestsPerDay: 500
    },
    FALLBACK_THRESHOLD: 0.8 // Use static questions when 80% limit reached
  };

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      
      if (!apiKey || apiKey === 'your-openai-api-key') {
        console.warn('OpenAI API key not configured. AI features will use fallback questions.');
        return;
      }

      this.client = new OpenAI({
        apiKey: apiKey,
      });
      
      this.isInitialized = true;
      console.log('OpenAI service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OpenAI service:', error);
    }
  }

  /**
   * Check if OpenAI service is available
   */
  isAvailable(): boolean {
    return this.isInitialized && this.client !== null;
  }

  /**
   * Generate chat completion with error handling and rate limiting
   */
  async generateChatCompletion(
    messages: ChatMessage[],
    model: string = 'gpt-3.5-turbo',
    maxTokens: number = 150,
    temperature: number = 0.7,
    userId?: string
  ): Promise<ChatCompletionResponse> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI service not available');
    }

    // Check rate limits if userId provided
    if (userId && !this.checkRateLimit(userId)) {
      throw new Error('Rate limit exceeded');
    }

    try {
      const response = await this.client!.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      // Update rate limit tracking
      if (userId) {
        this.updateRateLimit(userId);
      }

      const choice = response.choices[0];
      if (!choice) {
        throw new Error('No response generated');
      }

      return {
        content: choice.message.content,
        usage: response.usage ? {
          prompt_tokens: response.usage.prompt_tokens,
          completion_tokens: response.usage.completion_tokens,
          total_tokens: response.usage.total_tokens
        } : undefined,
        finish_reason: choice.finish_reason || undefined
      };

    } catch (error) {
      console.error('OpenAI API error:', error);
      
      if (error instanceof Error) {
        // Handle specific OpenAI errors
        if (error.message.includes('rate limit')) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (error.message.includes('insufficient_quota')) {
          throw new Error('API quota exceeded. Using fallback questions.');
        }
        if (error.message.includes('model_not_found')) {
          throw new Error('AI model not available. Using fallback questions.');
        }
      }
      
      throw error;
    }
  }

  /**
   * Generate a contextual learning question using AI
   */
  async generateLearningQuestion(context: {
    relationshipStage: string;
    userResponse?: string;
    recentTopics?: string[];
    userComfortLevel?: number;
    conversationType?: string;
  }, userId?: string): Promise<string | null> {
    try {
      const prompt = this.buildLearningQuestionPrompt(context);
      
      const response = await this.generateChatCompletion([
        { 
          role: 'system', 
          content: 'You are Airica, a thoughtful AI companion who asks engaging questions to learn about users. Always respond with just a single question, no explanation or additional text.' 
        },
        { role: 'user', content: prompt }
      ], 'gpt-3.5-turbo', 100, 0.8, userId);

      return response.content?.trim() || null;
    } catch (error) {
      console.warn('Failed to generate AI question:', error);
      return null;
    }
  }

  /**
   * Analyze user response for personality insights
   */
  async analyzePersonalityInsights(
    response: string,
    userId?: string
  ): Promise<Array<{
    content: string;
    category: string;
    confidence: number;
    emotionalWeight: number;
    personalFactScore: number;
  }> | null> {
    try {
      const prompt = `Analyze this user response for personality insights, personal facts, and emotional content:

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

Only include meaningful insights (minimum confidence 0.6). Return empty array if no significant insights found. Must be valid JSON.`;

      const aiResponse = await this.generateChatCompletion([
        { 
          role: 'system', 
          content: 'You are an expert at extracting personality insights from conversation. Return only valid JSON, no other text.' 
        },
        { role: 'user', content: prompt }
      ], 'gpt-3.5-turbo', 300, 0.3, userId);

      if (aiResponse.content) {
        try {
          return JSON.parse(aiResponse.content);
        } catch (parseError) {
          console.warn('Failed to parse AI insights response:', parseError);
        }
      }

      return null;
    } catch (error) {
      console.warn('Failed to analyze personality insights:', error);
      return null;
    }
  }

  /**
   * Generate dynamic greeting message
   */
  async generateDynamicGreeting(context: {
    userName?: string;
    timeOfDay?: string;
    lastInteraction?: Date;
    relationshipStage?: string;
  }, userId?: string): Promise<string | null> {
    try {
      const prompt = `Generate a warm, friendly greeting for a user. Context:
- Time: ${context.timeOfDay || 'unknown'}
- Relationship level: ${context.relationshipStage || 'new'}
- Last interaction: ${context.lastInteraction ? this.formatTimeAgo(context.lastInteraction) : 'first time'}

Create a natural, conversational greeting that:
1. Feels warm and personal
2. Matches the relationship level
3. Is 1-2 sentences maximum
4. Sounds like Airica, a friendly AI companion

Return just the greeting, no explanation.`;

      const response = await this.generateChatCompletion([
        { 
          role: 'system', 
          content: 'You are Airica, a warm and friendly AI companion. Generate natural, conversational greetings.' 
        },
        { role: 'user', content: prompt }
      ], 'gpt-3.5-turbo', 80, 0.9, userId);

      return response.content?.trim() || null;
    } catch (error) {
      console.warn('Failed to generate dynamic greeting:', error);
      return null;
    }
  }

  /**
   * Build prompt for learning question generation
   */
  private buildLearningQuestionPrompt(context: {
    relationshipStage: string;
    userResponse?: string;
    recentTopics?: string[];
    userComfortLevel?: number;
    conversationType?: string;
  }): string {
    const { relationshipStage, userResponse, recentTopics, userComfortLevel, conversationType } = context;
    
    return `Generate a thoughtful question to learn more about a user.

Context:
- Relationship stage: ${relationshipStage}
${userResponse ? `- User's last response: "${userResponse}"` : ''}
${recentTopics?.length ? `- Recent topics: ${recentTopics.join(', ')}` : ''}
- User comfort level: ${userComfortLevel ? Math.round(userComfortLevel * 100) + '%' : 'moderate'}
- Conversation style: ${conversationType || 'balanced'}

Generate a question that:
1. Feels natural and conversational
2. Helps understand the user's personality, experiences, or thoughts
3. Matches the intimacy level of a ${relationshipStage} relationship
4. Avoids repeating recent topics
5. Encourages meaningful but comfortable sharing
6. Is engaging and shows genuine interest

Return only the question, no explanation or additional text.`;
  }

  /**
   * Check rate limits for a user
   */
  private checkRateLimit(userId: string, tier: 'TIER_1' | 'TIER_2' = 'TIER_1'): boolean {
    const limit = this.rateLimitTracker.get(userId);
    const limits = this.RATE_LIMITS[tier];
    
    if (!limit) return true;
    
    const now = new Date();
    if (now > limit.resetTime) {
      this.rateLimitTracker.delete(userId);
      return true;
    }
    
    return limit.count < limits.requestsPerHour;
  }

  /**
   * Update rate limit tracking
   */
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

  /**
   * Get rate limit status for a user
   */
  getRateLimitStatus(userId: string, tier: 'TIER_1' | 'TIER_2' = 'TIER_1'): {
    remaining: number;
    resetTime: Date | null;
    percentUsed: number;
  } {
    const limit = this.rateLimitTracker.get(userId);
    const limits = this.RATE_LIMITS[tier];
    
    if (!limit) {
      return {
        remaining: limits.requestsPerHour,
        resetTime: null,
        percentUsed: 0
      };
    }
    
    const remaining = Math.max(0, limits.requestsPerHour - limit.count);
    const percentUsed = (limit.count / limits.requestsPerHour) * 100;
    
    return {
      remaining,
      resetTime: limit.resetTime,
      percentUsed
    };
  }

  /**
   * Check if user should use fallback questions due to rate limiting
   */
  shouldUseFallback(userId: string, tier: 'TIER_1' | 'TIER_2' = 'TIER_1'): boolean {
    const status = this.getRateLimitStatus(userId, tier);
    return status.percentUsed >= (this.RATE_LIMITS.FALLBACK_THRESHOLD * 100);
  }

  /**
   * Helper method to format time ago
   */
  private formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'recently';
    }
  }

  /**
   * Health check for the service
   */
  getHealthStatus(): {
    available: boolean;
    initialized: boolean;
    apiKeyConfigured: boolean;
  } {
    return {
      available: this.isAvailable(),
      initialized: this.isInitialized,
      apiKeyConfigured: !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key'
    };
  }
}