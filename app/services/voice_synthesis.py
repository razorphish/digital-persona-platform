"""
Voice Synthesis Service for text-to-speech capabilities
"""
import os
import time
import logging
import json
import asyncio
from typing import Dict, List, Any, Optional, BinaryIO
from pathlib import Path
import aiofiles
from fastapi import HTTPException, status
from gtts import gTTS
import edge_tts
from app.models.persona_db import Persona as DBPersona
from app.models.chat_db import ChatMessage as DBChatMessage
from app.models.ai_capabilities import VoiceSynthesis as DBVoiceSynthesis
from sqlalchemy.ext.asyncio import AsyncSession

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class VoiceSynthesisService:
    """Service for text-to-speech capabilities with multiple engines."""
    
    def __init__(self):
        self.audio_dir = Path("uploads/audio")
        self.audio_dir.mkdir(parents=True, exist_ok=True)
        
        # Available TTS engines
        self.engines = {
            "gtts": self._synthesize_gtts,
            "edge": self._synthesize_edge_tts
        }
        
        # Default voice settings
        self.default_voices = {
            "parent": {"engine": "edge", "voice": "en-US-JennyNeural", "rate": "+0%", "volume": "+0%"},
            "spouse": {"engine": "edge", "voice": "en-US-AriaNeural", "rate": "+0%", "volume": "+0%"},
            "child": {"engine": "edge", "voice": "en-US-JennyNeural", "rate": "+10%", "volume": "+10%"},
            "sibling": {"engine": "edge", "voice": "en-US-GuyNeural", "rate": "+0%", "volume": "+0%"},
            "friend": {"engine": "edge", "voice": "en-US-DavisNeural", "rate": "+0%", "volume": "+0%"},
            "colleague": {"engine": "edge", "voice": "en-US-TonyNeural", "rate": "-10%", "volume": "+0%"},
            "other": {"engine": "edge", "voice": "en-US-JennyNeural", "rate": "+0%", "volume": "+0%"}
        }
    
    async def synthesize_speech(
        self,
        text: str,
        persona: DBPersona,
        message: DBChatMessage,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Synthesize speech for a persona's message."""
        
        if not persona.voice_synthesis_enabled:
            return {"error": "Voice synthesis is disabled for this persona"}
        
        start_time = time.time()
        
        try:
            # Get voice settings for the persona
            voice_settings = self._get_voice_settings(persona)
            
            # Generate audio file
            audio_file_path = await self._generate_audio(text, voice_settings, persona.id, message.id)
            
            # Calculate processing time
            processing_time_ms = int((time.time() - start_time) * 1000)
            
            # Save to database
            voice_synthesis = await self._save_voice_synthesis(
                db, persona, message, audio_file_path, voice_settings, processing_time_ms
            )
            
            return {
                "audio_file_path": audio_file_path,
                "voice_settings": voice_settings,
                "processing_time_ms": processing_time_ms,
                "synthesis_id": voice_synthesis.id
            }
            
        except Exception as e:
            logger.error(f"Voice synthesis failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Voice synthesis failed: {str(e)}"
            )
    
    def _get_voice_settings(self, persona: DBPersona) -> Dict[str, Any]:
        """Get voice settings for a persona."""
        
        # Check if persona has custom voice settings
        if persona.voice_settings:
            try:
                custom_settings = json.loads(persona.voice_settings)
                return custom_settings
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Use default settings based on relationship type
        relation_type = persona.relation_type.lower()
        return self.default_voices.get(relation_type, self.default_voices["other"])
    
    async def _generate_audio(
        self, 
        text: str, 
        voice_settings: Dict[str, Any], 
        persona_id: int,
        message_id: int
    ) -> str:
        """Generate audio file using the specified TTS engine."""
        
        engine = voice_settings.get("engine", "edge")
        
        if engine not in self.engines:
            raise ValueError(f"Unsupported TTS engine: {engine}")
        
        # Generate unique filename
        timestamp = int(time.time())
        filename = f"persona_{persona_id}_message_{message_id}_{timestamp}.mp3"
        file_path = self.audio_dir / filename
        
        # Generate audio using the specified engine
        await self.engines[engine](text, voice_settings, file_path)
        
        return str(file_path)
    
    async def _synthesize_gtts(
        self, 
        text: str, 
        voice_settings: Dict[str, Any], 
        file_path: Path
    ):
        """Synthesize speech using Google TTS."""
        try:
            # Google TTS settings
            lang = voice_settings.get("language", "en")
            slow = voice_settings.get("slow", False)
            
            tts = gTTS(text=text, lang=lang, slow=slow)
            tts.save(str(file_path))
            
        except Exception as e:
            logger.error(f"Google TTS synthesis failed: {e}")
            raise
    
    async def _synthesize_edge_tts(
        self, 
        text: str, 
        voice_settings: Dict[str, Any], 
        file_path: Path
    ):
        """Synthesize speech using Microsoft Edge TTS."""
        try:
            # Edge TTS settings
            voice = voice_settings.get("voice", "en-US-JennyNeural")
            rate = voice_settings.get("rate", "+0%")
            volume = voice_settings.get("volume", "+0%")
            
            communicate = edge_tts.Communicate(text, voice, rate=rate, volume=volume)
            await communicate.save(str(file_path))
            
        except Exception as e:
            logger.error(f"Edge TTS synthesis failed: {e}")
            raise
    
    async def _save_voice_synthesis(
        self,
        db: AsyncSession,
        persona: DBPersona,
        message: DBChatMessage,
        audio_file_path: str,
        voice_settings: Dict[str, Any],
        processing_time_ms: int
    ) -> DBVoiceSynthesis:
        """Save voice synthesis data to the database."""
        try:
            voice_synthesis = DBVoiceSynthesis(
                persona_id=persona.id,
                message_id=message.id,
                audio_file_path=audio_file_path,
                voice_settings=json.dumps(voice_settings),
                processing_time_ms=processing_time_ms
            )
            
            db.add(voice_synthesis)
            await db.commit()
            await db.refresh(voice_synthesis)
            
            return voice_synthesis
            
        except Exception as e:
            logger.error(f"Failed to save voice synthesis: {e}")
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save voice synthesis: {str(e)}"
            )
    
    async def get_available_voices(self) -> Dict[str, Any]:
        """Get available voices for different TTS engines."""
        try:
            # Get Edge TTS voices
            edge_voices = []
            voices = await edge_tts.list_voices()
            for voice in voices:
                if voice["Locale"].startswith("en-"):
                    edge_voices.append({
                        "name": voice["ShortName"],
                        "display_name": voice["FriendlyName"],
                        "locale": voice["Locale"],
                        "gender": voice["Gender"]
                    })
            
            return {
                "edge_tts": edge_voices,
                "gtts": [
                    {"name": "en", "display_name": "English", "locale": "en", "gender": "neutral"},
                    {"name": "en-gb", "display_name": "English (UK)", "locale": "en-gb", "gender": "neutral"},
                    {"name": "en-au", "display_name": "English (Australia)", "locale": "en-au", "gender": "neutral"}
                ]
            }
            
        except Exception as e:
            logger.error(f"Failed to get available voices: {e}")
            return {"error": str(e)}
    
    async def update_persona_voice_settings(
        self,
        persona: DBPersona,
        voice_settings: Dict[str, Any],
        db: AsyncSession
    ) -> DBPersona:
        """Update voice settings for a persona."""
        try:
            persona.voice_settings = json.dumps(voice_settings)
            await db.commit()
            await db.refresh(persona)
            
            return persona
            
        except Exception as e:
            logger.error(f"Failed to update persona voice settings: {e}")
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update voice settings: {str(e)}"
            )


# Global voice synthesis service instance
voice_synthesis_service = VoiceSynthesisService() 