"""
OpenAI service for chat interactions with digital personas
"""
import os
import time
from typing import List, Dict, Any, Optional
from openai import OpenAI
from fastapi import HTTPException, status
from app.models.persona_db import Persona as DBPersona
from app.models.chat_db import ChatMessage as DBChatMessage


class OpenAIService:
    """Service for handling OpenAI API interactions."""
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client: Optional[OpenAI] = None
        self.default_model = "gpt-3.5-turbo"
        self.max_tokens = 1000
        self.temperature = 0.7
        self._initialized = False
    
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
    
    def create_persona_system_prompt(self, persona: DBPersona) -> str:
        """Create a system prompt based on persona information."""
        prompt = f"""You are {persona.name}, a digital persona created by a user.

Persona Information:
- Name: {persona.name}
- Description: {persona.description or 'No description provided'}
- Relationship Type: {persona.relation_type}

Instructions:
1. Respond as {persona.name} would, based on the relationship type and description
2. Stay in character throughout the conversation
3. Be helpful, engaging, and appropriate for the relationship type
4. If you don't have enough information about the persona, ask questions to learn more
5. Keep responses conversational and natural
6. Don't break character or mention that you're an AI

Relationship Context:
- {self._get_relationship_context(persona.relation_type)}

Remember: You are {persona.name}, not an AI assistant. Respond as this persona would."""
        
        return prompt
    
    def _get_relationship_context(self, relation_type: str) -> str:
        """Get context based on relationship type."""
        contexts = {
            "parent": "You are a caring, supportive parent figure. Be nurturing, give advice when asked, and show concern for the user's well-being.",
            "spouse": "You are a loving, supportive partner. Be romantic, understanding, and share in the user's joys and concerns.",
            "child": "You are a curious, energetic child. Be playful, ask questions, and show enthusiasm for learning and discovery.",
            "sibling": "You are a supportive sibling. Be friendly, share experiences, and offer brotherly/sisterly advice and support.",
            "friend": "You are a close friend. Be supportive, fun to talk to, and offer friendship and companionship.",
            "colleague": "You are a professional colleague. Be helpful, professional, and focus on work-related topics and collaboration.",
            "other": "You are someone with a special relationship to the user. Be supportive and engaging based on the persona's description."
        }
        return contexts.get(relation_type, contexts["other"])
    
    def format_conversation_history(self, messages: List[DBChatMessage]) -> List[Dict[str, str]]:
        """Format conversation history for OpenAI API."""
        formatted_messages = []
        
        for message in messages:
            formatted_messages.append({
                "role": message.role,
                "content": message.content
            })
        
        return formatted_messages
    
    async def generate_response(
        self, 
        persona: DBPersona, 
        user_message: str, 
        conversation_history: List[DBChatMessage]
    ) -> Dict[str, Any]:
        """Generate a response from the persona using OpenAI."""
        if not self.is_available():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OpenAI service is not available. Please set OPENAI_API_KEY environment variable."
            )
        
        start_time = time.time()
        
        try:
            # Initialize client if needed
            self._initialize_client()
            
            # Create system prompt
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
            
            response = self.client.chat.completions.create(
                model=self.default_model,
                messages=messages,
                max_tokens=self.max_tokens,
                temperature=self.temperature
            )
            
            # Calculate response time
            response_time_ms = int((time.time() - start_time) * 1000)
            
            # Extract response
            assistant_message = response.choices[0].message.content
            tokens_used = response.usage.total_tokens if response.usage else None
            
            return {
                "content": assistant_message,
                "tokens_used": tokens_used,
                "model_used": self.default_model,
                "response_time_ms": response_time_ms
            }
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"OpenAI API error: {str(e)}"
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
        except Exception:
            return False


# Global OpenAI service instance (lazy initialization)
openai_service = OpenAIService() 