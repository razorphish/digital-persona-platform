"""
Database connection and session management
"""
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker
from app.models.base import Base

# Database URL for async operations (using asyncpg)
# Convert psycopg2 URL to asyncpg if needed
db_url = os.getenv("DATABASE_URL", "postgresql+asyncpg://david@localhost:5432/dpp_dev")
if db_url.startswith("postgresql+psycopg2://"):
    db_url = db_url.replace("postgresql+psycopg2://", "postgresql+asyncpg://")
DATABASE_URL = db_url

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=True,  # Set to False in production
    future=True
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Dependency to get database session
async def get_db():
    """Get database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

# Create tables (for development)
async def create_tables():
    """Create all tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Drop tables (for development)
async def drop_tables():
    """Drop all tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all) 