"""Add S3 support to media_files table

Revision ID: 1f3296ad01bd
Revises: c6d4619032a3
Create Date: 2025-07-05 21:04:59.997774

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1f3296ad01bd'
down_revision: Union[str, Sequence[str], None] = 'c6d4619032a3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    # Add nullable columns first
    op.add_column('media_files', sa.Column('file_id', sa.String(length=36), nullable=True))
    op.add_column('media_files', sa.Column('s3_key', sa.String(length=500), nullable=True))
    op.add_column('media_files', sa.Column('s3_bucket', sa.String(length=100), nullable=True))
    op.add_column('media_files', sa.Column('s3_url', sa.String(length=500), nullable=True))
    op.add_column('media_files', sa.Column('upload_method', sa.String(length=20), nullable=True))
    op.add_column('media_files', sa.Column('is_s3_stored', sa.Boolean(), nullable=True))
    
    # Update existing records with default values
    op.execute("UPDATE media_files SET file_id = 'legacy-' || id, is_s3_stored = 0")
    
    # Make columns NOT NULL
    op.alter_column('media_files', 'file_id', nullable=False)
    op.alter_column('media_files', 'is_s3_stored', nullable=False)
    
    # Create unique constraint
    op.create_unique_constraint('uq_media_files_file_id', 'media_files', ['file_id'])
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint('uq_media_files_file_id', 'media_files', type_='unique')
    op.drop_column('media_files', 'is_s3_stored')
    op.drop_column('media_files', 'upload_method')
    op.drop_column('media_files', 's3_url')
    op.drop_column('media_files', 's3_bucket')
    op.drop_column('media_files', 's3_key')
    op.drop_column('media_files', 'file_id')
    # ### end Alembic commands ###
