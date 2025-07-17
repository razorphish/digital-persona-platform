"""
Memory Service for storing and retrieving persona memories
"""
import os
import time
import logging
import json
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from fastapi import HTTPException, status
from app.models.persona_db import Persona as DBPersona
from app.models.ai_capabilities import PersonaMemory as DBPersonaMemory
from app.models.chat_db import ChatMessage as DBChatMessage

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MemoryService:
    """Service for managing persona memories with vector embeddings."""
    
    def __init__(self):
        self.embedding_model = None
        self.chroma_client = None
        self.memory_collections = {}
        
        # Initialize embedding model and vector database
        self._initialize_services()
    
    def _initialize_services(self):
        """Initialize embedding model and ChromaDB client."""
        try:
            # Initialize sentence transformer for embeddings
            self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            
            # Initialize ChromaDB client
            self.chroma_client = chromadb.PersistentClient(
                path="./chroma_db",
                settings=Settings(anonymized_telemetry=False)
            )
            
            logger.info("Memory service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize memory service: {e}")
            self.embedding_model = None
            self.chroma_client = None
    
    def _get_collection_name(self, persona_id: int) -> str:
        """Get collection name for a persona."""
        return f"persona_memories_{persona_id}"
    
    def _get_or_create_collection(self, persona_id: int):
        """Get or create a ChromaDB collection for a persona."""
        collection_name = self._get_collection_name(persona_id)
        
        if collection_name not in self.memory_collections:
            try:
                self.memory_collections[collection_name] = self.chroma_client.get_or_create_collection(
                    name=collection_name,
                    metadata={"persona_id": persona_id}
                )
            except Exception as e:
                logger.error(f"Failed to get/create collection for persona {persona_id}: {e}")
                return None
        
        return self.memory_collections[collection_name]
    
    async def store_memory(
        self,
        db: AsyncSession,
        persona: DBPersona,
        memory_type: str,
        content: str,
        context: Optional[Dict[str, Any]] = None,
        importance: float = 1.0,
        expires_at: Optional[datetime] = None
    ) -> DBPersonaMemory:
        """Store a new memory for a persona."""
        
        if not persona.memory_enabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Memory is disabled for this persona"
            )
        
        try:
            # Create memory record in database
            memory = DBPersonaMemory(
                persona_id=persona.id,
                memory_type=memory_type,
                content=content,
                context=json.dumps(context) if context else None,
                importance=importance,
                expires_at=expires_at
            )
            
            db.add(memory)
            await db.commit()
            await db.refresh(memory)
            
            # Store in vector database if available
            if self.embedding_model and self.chroma_client:
                await self._store_vector_memory(memory)
            
            # Update persona's interaction count and last interaction
            persona.interaction_count += 1
            persona.last_interaction = datetime.utcnow()
            await db.commit()
            
            return memory
            
        except Exception as e:
            logger.error(f"Failed to store memory: {e}")
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to store memory: {str(e)}"
            )
    
    async def _store_vector_memory(self, memory: DBPersonaMemory):
        """Store memory in vector database."""
        try:
            collection = self._get_or_create_collection(memory.persona_id)
            if not collection:
                return
            
            # Generate embedding for the memory content
            embedding = self.embedding_model.encode(memory.content).tolist()
            
            # Add to collection
            collection.add(
                embeddings=[embedding],
                documents=[memory.content],
                metadatas=[{
                    "memory_id": memory.id,
                    "memory_type": memory.memory_type,
                    "importance": memory.importance,
                    "created_at": memory.created_at.isoformat()
                }],
                ids=[f"memory_{memory.id}"]
            )
            
        except Exception as e:
            logger.error(f"Failed to store vector memory: {e}")
    
    async def retrieve_relevant_memories(
        self,
        db: AsyncSession,
        persona: DBPersona,
        query: str,
        memory_types: Optional[List[str]] = None,
        limit: int = 10,
        min_importance: float = 0.5
    ) -> List[DBPersonaMemory]:
        """Retrieve memories relevant to a query using semantic search."""
        
        if not persona.memory_enabled:
            return []
        
        try:
            # Get memories from database
            query_stmt = select(DBPersonaMemory).where(
                and_(
                    DBPersonaMemory.persona_id == persona.id,
                    DBPersonaMemory.importance >= min_importance,
                    DBPersonaMemory.expires_at.is_(None) | (DBPersonaMemory.expires_at > datetime.utcnow())
                )
            ).order_by(desc(DBPersonaMemory.importance), desc(DBPersonaMemory.last_accessed))
            
            if memory_types:
                query_stmt = query_stmt.where(DBPersonaMemory.memory_type.in_(memory_types))
            
            result = await db.execute(query_stmt)
            all_memories = list(result.scalars().all())
            
            # If vector search is available, use it for ranking
            if self.embedding_model and self.chroma_client and query.strip():
                return await self._rank_memories_by_relevance(all_memories, query, limit)
            else:
                # Fallback to importance-based ranking
                return all_memories[:limit]
            
        except Exception as e:
            logger.error(f"Failed to retrieve memories: {e}")
            return []
    
    async def _rank_memories_by_relevance(
        self, 
        memories: List[DBPersonaMemory], 
        query: str, 
        limit: int
    ) -> List[DBPersonaMemory]:
        """Rank memories by relevance to the query using vector similarity."""
        try:
            if not memories or not self.embedding_model:
                return memories[:limit]
            
            # Generate query embedding
            query_embedding = self.embedding_model.encode(query).tolist()
            
            # Get collection for the persona
            collection = self._get_or_create_collection(memories[0].persona_id)
            if not collection:
                return memories[:limit]
            
            # Search for similar memories
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=min(len(memories), limit * 2)  # Get more results for better ranking
            )
            
            # Create mapping of memory IDs to memories
            memory_map = {memory.id: memory for memory in memories}
            
            # Rank memories based on vector similarity
            ranked_memories = []
            for i, memory_id_str in enumerate(results['ids'][0]):
                memory_id = int(memory_id_str.split('_')[1])
                if memory_id in memory_map:
                    memory = memory_map[memory_id]
                    # Update last accessed time
                    memory.last_accessed = datetime.utcnow()
                    ranked_memories.append(memory)
            
            # Add any remaining memories by importance
            remaining_memories = [m for m in memories if m not in ranked_memories]
            remaining_memories.sort(key=lambda x: (x.importance, x.last_accessed), reverse=True)
            
            return (ranked_memories + remaining_memories)[:limit]
            
        except Exception as e:
            logger.error(f"Failed to rank memories: {e}")
            return memories[:limit]
    
    async def get_memory_context(
        self,
        db: AsyncSession,
        persona: DBPersona,
        conversation_history: List[DBChatMessage],
        max_memories: int = 5
    ) -> str:
        """Get relevant memory context for a conversation."""
        
        if not persona.memory_enabled or not conversation_history:
            return ""
        
        try:
            # Extract key information from recent conversation
            recent_context = " ".join([
                msg.content for msg in conversation_history[-3:]  # Last 3 messages
            ])
            
            # Retrieve relevant memories
            relevant_memories = await self.retrieve_relevant_memories(
                db, persona, recent_context, limit=max_memories
            )
            
            if not relevant_memories:
                return ""
            
            # Format memory context
            memory_context = "RELEVANT MEMORIES:\n"
            for i, memory in enumerate(relevant_memories, 1):
                memory_context += f"{i}. {memory.content}\n"
            
            return memory_context
            
        except Exception as e:
            logger.error(f"Failed to get memory context: {e}")
            return ""
    
    async def learn_from_conversation(
        self,
        db: AsyncSession,
        persona: DBPersona,
        conversation_history: List[DBChatMessage]
    ) -> List[DBPersonaMemory]:
        """Learn new memories from a conversation."""
        
        if not persona.learning_enabled or not conversation_history:
            return []
        
        new_memories = []
        
        try:
            # Analyze conversation for learning opportunities
            for message in conversation_history:
                if message.role == "user":
                    # Extract potential preferences, facts, or emotional responses
                    content = message.content.lower()
                    
                    # Look for preference indicators
                    if any(word in content for word in ["like", "love", "hate", "prefer", "favorite"]):
                        await self.store_memory(
                            db, persona, "preference", message.content, 
                            importance=0.8
                        )
                        new_memories.append(message)
                    
                    # Look for factual information
                    elif any(word in content for word in ["is", "are", "was", "were", "has", "have"]):
                        await self.store_memory(
                            db, persona, "fact", message.content,
                            importance=0.7
                        )
                        new_memories.append(message)
                    
                    # Look for emotional content
                    elif any(word in content for word in ["feel", "happy", "sad", "angry", "excited", "worried"]):
                        await self.store_memory(
                            db, persona, "emotion", message.content,
                            importance=0.9
                        )
                        new_memories.append(message)
            
            return new_memories
            
        except Exception as e:
            logger.error(f"Failed to learn from conversation: {e}")
            return []
    
    async def cleanup_expired_memories(self, db: AsyncSession) -> int:
        """Clean up expired memories from the database."""
        try:
            # Find expired memories
            expired_memories = await db.execute(
                select(DBPersonaMemory).where(
                    and_(
                        DBPersonaMemory.expires_at.is_not(None),
                        DBPersonaMemory.expires_at < datetime.utcnow()
                    )
                )
            )
            
            expired_list = expired_memories.scalars().all()
            count = len(expired_list)
            
            # Delete expired memories
            for memory in expired_list:
                await db.delete(memory)
            
            await db.commit()
            
            logger.info(f"Cleaned up {count} expired memories")
            return count
            
        except Exception as e:
            logger.error(f"Failed to cleanup expired memories: {e}")
            await db.rollback()
            return 0


# Global memory service instance
memory_service = MemoryService() 