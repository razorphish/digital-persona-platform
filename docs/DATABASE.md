# Database Integration with SQLAlchemy & PostgreSQL

This document describes the database integration using SQLAlchemy 2.0 with async support and PostgreSQL.

## Overview

The application now uses:

- **SQLAlchemy 2.0** with async ORM
- **PostgreSQL 15** as the database
- **Alembic** for database migrations
- **asyncpg** for async database connections
- **psycopg2** for sync operations (Alembic)

## Database Models

### User Model (`app/models/user_db.py`)

```python
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(128), nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    personas = relationship("Persona", back_populates="user", cascade="all, delete-orphan")
```

### Persona Model (`app/models/persona_db.py`)

```python
class Persona(Base):
    __tablename__ = "personas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=True)
    relation_type: Mapped[str] = mapped_column(String(32), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    status: Mapped[str] = mapped_column(String(32), default="active")
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    user = relationship("User", back_populates="personas")
```

## Database Setup

### 1. Install PostgreSQL

```bash
# macOS with Homebrew
brew install postgresql@15
brew services start postgresql@15

# Add to PATH
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
```

### 2. Create Database

```bash
createdb dpp_dev
```

### 3. Install Dependencies

```bash
pip install SQLAlchemy asyncpg psycopg2-binary alembic
```

### 4. Run Migrations

```bash
# Create initial migration
alembic revision --autogenerate -m "create users and personas tables"

# Apply migration
alembic upgrade head
```

## Database Configuration

### Environment Variables

Set these in your `.env` file:

```bash
# For Alembic (sync operations)
DATABASE_URL=postgresql+psycopg2://david@localhost:5432/dpp_dev

# For async operations (automatically converted from above)
# DATABASE_URL=postgresql+asyncpg://david@localhost:5432/dpp_dev
```

### Database Connection (`app/database.py`)

```python
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
```

## CRUD Operations

### User CRUD (`app/crud/user.py`)

- `get_user_by_email()` - Find user by email
- `get_user_by_username()` - Find user by username
- `get_user_by_id()` - Find user by ID
- `create_user()` - Create new user
- `update_user()` - Update user fields
- `delete_user()` - Delete user

### Persona CRUD (`app/crud/persona.py`)

- `get_persona_by_id()` - Find persona by ID (user-scoped)
- `get_personas_by_user()` - Get all personas for a user
- `create_persona()` - Create new persona
- `update_persona()` - Update persona fields
- `delete_persona()` - Delete persona (user-scoped)

## Database Sessions

### Dependency Injection

```python
from app.database import get_db

@router.post("/personas/")
async def create_persona(
    persona: PersonaCreate,
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    # Use db session for database operations
    db_persona = await persona_crud.create_persona(db, ...)
```

### Manual Session Management

```python
async with AsyncSessionLocal() as session:
    try:
        # Database operations
        result = await session.execute(select(User))
        users = result.scalars().all()
        await session.commit()
    except Exception:
        await session.rollback()
        raise
```

## Migrations with Alembic

### Configuration (`alembic.ini`)

```ini
[alembic]
script_location = alembic
sqlalchemy.url = postgresql+psycopg2://david@localhost:5432/dpp_dev
```

### Environment (`alembic/env.py`)

```python
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.models.base import Base
from app.models.user_db import User
from app.models.persona_db import Persona

target_metadata = Base.metadata
```

### Common Commands

```bash
# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Check current migration
alembic current

# Show migration history
alembic history
```

## Testing

### Database Test Script

```bash
python test_database.py
```

This script tests:

- User registration and storage
- User login from database
- Persona CRUD operations
- Data persistence across requests

### Manual Database Inspection

```bash
# Connect to database
psql postgresql://david@localhost:5432/dpp_dev

# List tables
\dt

# View table structure
\d users
\d personas

# Query data
SELECT * FROM users;
SELECT * FROM personas;
```

## Production Considerations

### 1. Database Security

- Use strong passwords
- Enable SSL connections
- Restrict database access
- Use connection pooling

### 2. Performance

- Add database indexes
- Use connection pooling
- Monitor query performance
- Consider read replicas

### 3. Backup & Recovery

- Set up automated backups
- Test recovery procedures
- Monitor database size
- Archive old data

### 4. Environment Variables

```bash
# Production database URL
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/database

# Disable SQL echo in production
# Set echo=False in database.py
```

## Troubleshooting

### Common Issues

1. **Connection Errors**

   - Check PostgreSQL is running
   - Verify database exists
   - Check user permissions
   - Confirm connection string

2. **Migration Errors**

   - Ensure models are imported in `alembic/env.py`
   - Check for syntax errors in models
   - Verify database URL format

3. **Async/Sync Driver Conflicts**

   - Use `psycopg2` for Alembic
   - Use `asyncpg` for async operations
   - URL conversion is handled automatically

4. **Import Errors**
   - Check all dependencies are installed
   - Verify import paths
   - Ensure virtual environment is activated

### Debug Commands

```bash
# Check PostgreSQL status
brew services list | grep postgresql

# Test database connection
psql postgresql://david@localhost:5432/dpp_dev -c "SELECT version();"

# Check migration status
alembic current

# View recent logs
tail -f /opt/homebrew/var/log/postgresql@15.log
```
