-- Initialize Digital Persona Platform Database
-- This script runs when the PostgreSQL container starts for the first time

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'UTC';

-- Create indexes for better performance (if they don't exist)
-- These will be created by Alembic migrations, but this ensures they exist
DO $$
BEGIN
    -- Users table indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_users_email') THEN
        CREATE INDEX CONCURRENTLY ix_users_email ON users(email);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_users_username') THEN
        CREATE INDEX CONCURRENTLY ix_users_username ON users(username);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_users_created_at') THEN
        CREATE INDEX CONCURRENTLY ix_users_created_at ON users(created_at);
    END IF;
    
    -- Personas table indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_personas_user_id') THEN
        CREATE INDEX CONCURRENTLY ix_personas_user_id ON personas(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_personas_created_at') THEN
        CREATE INDEX CONCURRENTLY ix_personas_created_at ON personas(created_at);
    END IF;
    
    -- Conversations table indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_conversations_user_id') THEN
        CREATE INDEX CONCURRENTLY ix_conversations_user_id ON conversations(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_conversations_persona_id') THEN
        CREATE INDEX CONCURRENTLY ix_conversations_persona_id ON conversations(persona_id);
    END IF;
    
    -- Chat messages table indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_chat_messages_conversation_id') THEN
        CREATE INDEX CONCURRENTLY ix_chat_messages_conversation_id ON chat_messages(conversation_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_chat_messages_created_at') THEN
        CREATE INDEX CONCURRENTLY ix_chat_messages_created_at ON chat_messages(created_at);
    END IF;
    
    -- Media files table indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_media_files_user_id') THEN
        CREATE INDEX CONCURRENTLY ix_media_files_user_id ON media_files(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_media_files_persona_id') THEN
        CREATE INDEX CONCURRENTLY ix_media_files_persona_id ON media_files(persona_id);
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Tables might not exist yet, that's okay
        NULL;
END $$;

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns (if tables exist)
DO $$
BEGIN
    -- Users table trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        DROP TRIGGER IF EXISTS update_users_updated_at ON users;
        CREATE TRIGGER update_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Personas table trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'personas') THEN
        DROP TRIGGER IF EXISTS update_personas_updated_at ON personas;
        CREATE TRIGGER update_personas_updated_at
            BEFORE UPDATE ON personas
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Conversations table trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') THEN
        DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
        CREATE TRIGGER update_conversations_updated_at
            BEFORE UPDATE ON conversations
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Tables might not exist yet, that's okay
        NULL;
END $$;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE digital_persona TO dpp_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dpp_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dpp_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO dpp_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dpp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO dpp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO dpp_user; 