"""add social media integrations

Revision ID: add_social_media_integrations
Revises: bbd3b7642cef
Create Date: 2024-07-06 19:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = 'add_social_media_integrations'
down_revision = 'bbd3b7642cef'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create social_media_integrations table
    op.create_table('social_media_integrations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('platform', sa.String(length=50), nullable=False),
        sa.Column('platform_user_id', sa.String(length=255), nullable=False),
        sa.Column('platform_username', sa.String(length=255), nullable=False),
        sa.Column('access_token', sa.Text(), nullable=False),
        sa.Column('refresh_token', sa.Text(), nullable=True),
        sa.Column('token_expires_at', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('last_sync_at', sa.DateTime(), nullable=True),
        sa.Column('sync_frequency_hours', sa.Integer(), nullable=True),
        sa.Column('platform_metadata', sqlite.JSON, nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_social_media_integrations_id'), 'social_media_integrations', ['id'], unique=False)

    # Create social_media_posts table
    op.create_table('social_media_posts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('integration_id', sa.Integer(), nullable=False),
        sa.Column('platform_post_id', sa.String(length=255), nullable=False),
        sa.Column('post_type', sa.String(length=50), nullable=False),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('media_urls', sqlite.JSON, nullable=True),
        sa.Column('hashtags', sqlite.JSON, nullable=True),
        sa.Column('mentions', sqlite.JSON, nullable=True),
        sa.Column('likes_count', sa.Integer(), nullable=True),
        sa.Column('comments_count', sa.Integer(), nullable=True),
        sa.Column('shares_count', sa.Integer(), nullable=True),
        sa.Column('engagement_score', sa.Float(), nullable=True),
        sa.Column('sentiment_score', sa.Float(), nullable=True),
        sa.Column('posted_at', sa.DateTime(), nullable=False),
        sa.Column('platform_metadata', sqlite.JSON, nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['integration_id'], ['social_media_integrations.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('platform_post_id')
    )
    op.create_index(op.f('ix_social_media_posts_id'), 'social_media_posts', ['id'], unique=False)

    # Create integration_analytics table
    op.create_table('integration_analytics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('integration_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.DateTime(), nullable=False),
        sa.Column('total_posts', sa.Integer(), nullable=True),
        sa.Column('total_likes', sa.Integer(), nullable=True),
        sa.Column('total_comments', sa.Integer(), nullable=True),
        sa.Column('total_shares', sa.Integer(), nullable=True),
        sa.Column('avg_engagement_rate', sa.Float(), nullable=True),
        sa.Column('top_hashtags', sqlite.JSON, nullable=True),
        sa.Column('top_mentions', sqlite.JSON, nullable=True),
        sa.Column('sentiment_distribution', sqlite.JSON, nullable=True),
        sa.Column('peak_activity_hours', sqlite.JSON, nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['integration_id'], ['social_media_integrations.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_integration_analytics_id'), 'integration_analytics', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_integration_analytics_id'), table_name='integration_analytics')
    op.drop_table('integration_analytics')
    op.drop_index(op.f('ix_social_media_posts_id'), table_name='social_media_posts')
    op.drop_table('social_media_posts')
    op.drop_index(op.f('ix_social_media_integrations_id'), table_name='social_media_integrations')
    op.drop_table('social_media_integrations') 