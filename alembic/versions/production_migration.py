"""Production database migration

Revision ID: production_001
Revises: c6d4619032a3
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'production_001'
down_revision = 'c6d4619032a3'
branch_labels = None
depends_on = None

def upgrade():
    # Create indexes for better performance
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_username', 'users', ['username'], unique=True)
    op.create_index('ix_personas_user_id', 'personas', ['user_id'])
    op.create_index('ix_conversations_user_id', 'conversations', ['user_id'])
    op.create_index('ix_conversations_persona_id', 'conversations', ['persona_id'])
    op.create_index('ix_chat_messages_conversation_id', 'chat_messages', ['conversation_id'])
    op.create_index('ix_media_files_user_id', 'media_files', ['user_id'])
    op.create_index('ix_media_files_persona_id', 'media_files', ['persona_id'])
    
    # Add created_at and updated_at indexes for better query performance
    op.create_index('ix_users_created_at', 'users', ['created_at'])
    op.create_index('ix_personas_created_at', 'personas', ['created_at'])
    op.create_index('ix_conversations_created_at', 'conversations', ['created_at'])
    op.create_index('ix_chat_messages_created_at', 'chat_messages', ['created_at'])
    
    # Add partial indexes for active records
    op.create_index('ix_users_active', 'users', ['is_active'], postgresql_where=sa.text("is_active = true"))
    op.create_index('ix_personas_active', 'personas', ['status'], postgresql_where=sa.text("status = 'active'"))
    op.create_index('ix_conversations_active', 'conversations', ['is_active'], postgresql_where=sa.text("is_active = true"))

def downgrade():
    # Drop indexes
    op.drop_index('ix_users_email', table_name='users')
    op.drop_index('ix_users_username', table_name='users')
    op.drop_index('ix_personas_user_id', table_name='personas')
    op.drop_index('ix_conversations_user_id', table_name='conversations')
    op.drop_index('ix_conversations_persona_id', table_name='conversations')
    op.drop_index('ix_chat_messages_conversation_id', table_name='chat_messages')
    op.drop_index('ix_media_files_user_id', table_name='media_files')
    op.drop_index('ix_media_files_persona_id', table_name='media_files')
    
    op.drop_index('ix_users_created_at', table_name='users')
    op.drop_index('ix_personas_created_at', table_name='personas')
    op.drop_index('ix_conversations_created_at', table_name='conversations')
    op.drop_index('ix_chat_messages_created_at', table_name='chat_messages')
    
    op.drop_index('ix_users_active', table_name='users')
    op.drop_index('ix_personas_active', table_name='personas')
    op.drop_index('ix_conversations_active', table_name='conversations') 