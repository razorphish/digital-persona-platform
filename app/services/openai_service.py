"""
OpenAI service for chat interactions with digital personas
"""
import os
import time
import logging
from typing import List, Dict, Any, Optional, Union
from openai import OpenAI, RateLimitError, APIError, APIConnectionError, APITimeoutError
from fastapi import HTTPException, status
from app.models.persona_db import Persona as DBPersona
from app.models.chat_db import ChatMessage as DBChatMessage

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class OpenAIService:
    """Enhanced service for handling OpenAI API interactions with persona-specific responses."""
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client: Optional[OpenAI] = None
        self.default_model = "gpt-3.5-turbo"
        self.max_tokens = 1000
        self.temperature = 0.7
        self.max_retries = 3
        self.retry_delay = 1.0  # seconds
        self._initialized = False
        
        # API limits and rate limiting
        self.requests_per_minute = 60
        self.tokens_per_minute = 90000
        self.last_request_time = 0
        self.min_request_interval = 1.0  # seconds between requests
    
    def _initialize_client(self):
        """Initialize the OpenAI client if not already done."""
        if self._initialized:
            return
            
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        
        self.client = OpenAI(api_key=self.api_key)
        self._initialized = True
    
    def is_available(self) -> bool:
        """Check if OpenAI service is available (API key is set)."""
        return bool(self.api_key)
    
    def _rate_limit_check(self):
        """Implement basic rate limiting."""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < self.min_request_interval:
            sleep_time = self.min_request_interval - time_since_last
            time.sleep(sleep_time)
        
        self.last_request_time = time.time()
    
    def create_persona_system_prompt(self, persona: DBPersona) -> str:
        """Create a sophisticated system prompt based on persona information."""
        
        # Enhanced relationship contexts with more personality traits
        relationship_contexts = {
            "parent": {
                "tone": "caring, nurturing, and supportive",
                "communication_style": "warm, patient, and encouraging",
                "typical_responses": "offers advice, shows concern, celebrates achievements",
                "emotional_range": "loving, proud, concerned, understanding"
            },
            "spouse": {
                "tone": "loving, intimate, and supportive",
                "communication_style": "romantic, understanding, and collaborative",
                "typical_responses": "shares feelings, offers emotional support, plans together",
                "emotional_range": "loving, supportive, playful, serious when needed"
            },
            "child": {
                "tone": "curious, energetic, and innocent",
                "communication_style": "playful, enthusiastic, and learning-focused",
                "typical_responses": "asks questions, shows excitement, shares discoveries",
                "emotional_range": "excited, curious, sometimes confused, always eager to learn"
            },
            "sibling": {
                "tone": "friendly, supportive, and familiar",
                "communication_style": "casual, teasing, and brotherly/sisterly",
                "typical_responses": "shares experiences, offers sibling advice, reminisces",
                "emotional_range": "supportive, playful, sometimes competitive, always loyal"
            },
            "friend": {
                "tone": "supportive, fun, and understanding",
                "communication_style": "casual, encouraging, and non-judgmental",
                "typical_responses": "listens, offers friendship, shares interests",
                "emotional_range": "supportive, excited, understanding, fun-loving"
            },
            "colleague": {
                "tone": "professional, helpful, and collaborative",
                "communication_style": "respectful, efficient, and work-focused",
                "typical_responses": "offers professional advice, discusses work topics, collaborates",
                "emotional_range": "professional, supportive, focused, occasionally casual"
            },
            "other": {
                "tone": "supportive and engaging",
                "communication_style": "adaptable based on the relationship description",
                "typical_responses": "varies based on the specific relationship",
                "emotional_range": "adaptable to the relationship context"
            }
        }
        
        context = relationship_contexts.get(persona.relation_type, relationship_contexts["other"])
        
        prompt = f"""You are {persona.name}, a digital persona with a unique personality and relationship to the user.

PERSONA PROFILE:
- Name: {persona.name}
- Description: {persona.description or 'A unique individual with a special connection to the user'}
- Relationship Type: {persona.relation_type}

PERSONALITY TRAITS:
- Tone: {context['tone']}
- Communication Style: {context['communication_style']}
- Typical Responses: {context['typical_responses']}
- Emotional Range: {context['emotional_range']}

CORE INSTRUCTIONS:
1. ALWAYS stay in character as {persona.name} - never break character or mention being an AI
2. Respond naturally as this persona would, considering the relationship type and description
3. Use appropriate language and tone for the relationship type
4. Be engaging, helpful, and authentic to the persona's characteristics
5. If you need more information about the persona, ask questions in character
6. Maintain consistency with previous responses in the conversation
7. Show genuine interest in the user's thoughts, feelings, and experiences

CONVERSATION GUIDELINES:
- Keep responses conversational and natural
- Use appropriate emotional expressions and reactions
- Ask follow-up questions when appropriate
- Share relevant experiences or thoughts (as the persona would)
- Be supportive and understanding
- Avoid generic or robotic responses

Remember: You ARE {persona.name}. Respond as this person would, with their unique personality, relationship dynamics, and communication style."""
        
        return prompt
    
    def format_conversation_history(self, messages: List[DBChatMessage]) -> List[Dict[str, str]]:
        """Format conversation history for OpenAI API with context management."""
        formatted_messages = []
        
        # Limit conversation history to prevent token overflow
        max_history_messages = 15
        recent_messages = messages[-max_history_messages:] if len(messages) > max_history_messages else messages
        
        for message in recent_messages:
            formatted_messages.append({
                "role": message.role,
                "content": message.content
            })
        
        return formatted_messages
    
    def _handle_openai_error(self, error: Exception, attempt: int) -> None:
        """Handle different types of OpenAI API errors with appropriate responses."""
        
        if isinstance(error, RateLimitError):
            logger.warning(f"Rate limit exceeded (attempt {attempt})")
            if attempt < self.max_retries:
                time.sleep(self.retry_delay * (2 ** attempt))  # Exponential backoff
                return
            else:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="OpenAI API rate limit exceeded. Please try again later."
                )
        
        elif isinstance(error, APITimeoutError):
            logger.warning(f"OpenAI API timeout (attempt {attempt})")
            if attempt < self.max_retries:
                time.sleep(self.retry_delay)
                return
            else:
                raise HTTPException(
                    status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                    detail="OpenAI API request timed out. Please try again."
                )
        
        elif isinstance(error, APIConnectionError):
            logger.warning(f"OpenAI API connection error (attempt {attempt})")
            if attempt < self.max_retries:
                time.sleep(self.retry_delay)
                return
            else:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Unable to connect to OpenAI API. Please check your internet connection."
                )
        
        elif isinstance(error, APIError):
            logger.error(f"OpenAI API error: {error}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"OpenAI API error: {str(error)}"
            )
        
        else:
            logger.error(f"Unexpected error: {error}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Unexpected error: {str(error)}"
            )
    
    async def generate_response(
        self, 
        persona: DBPersona, 
        user_message: str, 
        conversation_history: List[DBChatMessage]
    ) -> Dict[str, Any]:
        """Generate a response from the persona using OpenAI with enhanced error handling."""
        
        if not self.is_available():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OpenAI service is not available. Please set OPENAI_API_KEY environment variable."
            )
        
        start_time = time.time()
        
        # Rate limiting check
        self._rate_limit_check()
        
        for attempt in range(1, self.max_retries + 1):
            try:
                # Initialize client if needed
                self._initialize_client()
                
                # Create enhanced system prompt
                system_prompt = self.create_persona_system_prompt(persona)
                
                # Format conversation history
                messages = [{"role": "system", "content": system_prompt}]
                messages.extend(self.format_conversation_history(conversation_history))
                messages.append({"role": "user", "content": user_message})
                
                # Call OpenAI API
                if self.client is None:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="OpenAI client not initialized"
                    )
                
                logger.info(f"Generating response for persona '{persona.name}' (attempt {attempt})")
                
                response = self.client.chat.completions.create(
                    model=self.default_model,
                    messages=messages,  # type: ignore
                    max_tokens=self.max_tokens,
                    temperature=self.temperature,
                    presence_penalty=0.1,  # Slightly encourage new topics
                    frequency_penalty=0.1   # Slightly reduce repetition
                )
                
                # Calculate response time
                response_time_ms = int((time.time() - start_time) * 1000)
                
                # Extract response
                assistant_message = response.choices[0].message.content
                tokens_used = response.usage.total_tokens if response.usage else None
                
                logger.info(f"Successfully generated response for '{persona.name}' in {response_time_ms}ms")
                
                return {
                    "content": assistant_message,
                    "tokens_used": tokens_used,
                    "model_used": self.default_model,
                    "response_time_ms": response_time_ms
                }
                
            except (RateLimitError, APITimeoutError, APIConnectionError, APIError) as e:
                self._handle_openai_error(e, attempt)
                
            except Exception as e:
                logger.error(f"Unexpected error in generate_response: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to generate response: {str(e)}"
                )
        
        # If we get here, all retries failed
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to generate response after multiple attempts. Please try again later."
        )
    
    async def analyze_image_with_vision(
        self, 
        image_file, 
        prompt: str = "Describe what you see in this image."
    ) -> Dict[str, Any]:
        """Analyze an image using OpenAI Vision API."""
        
        if not self.is_available():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OpenAI service is not available. Please set OPENAI_API_KEY environment variable."
            )
        
        try:
            # Initialize client if needed
            self._initialize_client()
            
            if self.client is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="OpenAI client not initialized"
                )
            
            # Call OpenAI Vision API
            response = self.client.chat.completions.create(
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_file.read()}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=1000
            )
            
            return {
                "description": response.choices[0].message.content,
                "model_used": "gpt-4-vision-preview"
            }
            
        except Exception as e:
            logger.error(f"Image analysis failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Image analysis failed: {str(e)}"
            )
    
    async def analyze_text_for_personality(
        self, 
        text: str, 
        prompt: str
    ) -> Dict[str, Any]:
        """Analyze text for personality traits using OpenAI."""
        
        if not self.is_available():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OpenAI service is not available. Please set OPENAI_API_KEY environment variable."
            )
        
        try:
            # Initialize client if needed
            self._initialize_client()
            
            if self.client is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="OpenAI client not initialized"
                )
            
            # Call OpenAI API for personality analysis
            response = self.client.chat.completions.create(
                model=self.default_model,
                messages=[
                    {"role": "system", "content": "You are an expert in personality analysis. Provide detailed insights in JSON format."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.3  # Lower temperature for more consistent analysis
            )
            
            return {
                "analysis": response.choices[0].message.content,
                "model_used": self.default_model
            }
            
        except Exception as e:
            logger.error(f"Personality analysis failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Personality analysis failed: {str(e)}"
            )
    
    def validate_api_key(self) -> bool:
        """Validate that the OpenAI API key is working."""
        if not self.is_available():
            return False
            
        try:
            self._initialize_client()
            # Make a simple test call
            if self.client is None:
                return False
            response = self.client.models.list()
            return True
        except Exception as e:
            logger.error(f"API key validation failed: {e}")
            return False
    
    def get_api_status(self) -> Dict[str, Any]:
        """Get detailed API status information."""
        try:
            self._initialize_client()
            if self.client is None:
                return {"status": "error", "message": "Client not initialized"}
            
            # Test API connection
            models = self.client.models.list()
            
            return {
                "status": "healthy",
                "api_key_configured": bool(self.api_key),
                "models_available": len(models.data) if models.data else 0,
                "default_model": self.default_model,
                "rate_limits": {
                    "requests_per_minute": self.requests_per_minute,
                    "tokens_per_minute": self.tokens_per_minute
                }
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "api_key_configured": bool(self.api_key)
            }


# Global OpenAI service instance (lazy initialization)
openai_service = OpenAIService() 