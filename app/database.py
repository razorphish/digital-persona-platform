"""
Database connection and session management
"""
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker
from app.models.base import Base

# Database URL construction
def get_database_url():
    """Construct database URL from environment variables and secrets."""
    # Check if DATABASE_URL is provided directly
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return database_url
    
    # Construct from components
    db_password = os.getenv("DATABASE_PASSWORD")
    if db_password:
        # PostgreSQL with asyncpg
        return f"postgresql+asyncpg://hibiji_admin:{db_password}@hibiji-dev01-db.cr6q082uklxj.us-west-1.rds.amazonaws.com:5432/hibiji_dev01"
    
    # Fallback to SQLite
    return "sqlite+aiosqlite:///./digital_persona.db"

DATABASE_URL = get_database_url()

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=os.getenv("ENVIRONMENT", "development") != "test",  # Disable echo in test mode
    future=True,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
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