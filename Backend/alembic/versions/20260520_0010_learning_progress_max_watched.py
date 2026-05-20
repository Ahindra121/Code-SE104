"""add max watched seconds to learning progress

Revision ID: 20260520_0010
Revises: 20260519_0009
Create Date: 2026-05-20
"""

from alembic import op
import sqlalchemy as sa


revision = "20260520_0010"
down_revision = "20260519_0009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "learning_progress",
        sa.Column("max_watched_seconds", sa.Integer(), nullable=False, server_default="0"),
    )
    op.execute("UPDATE learning_progress SET max_watched_seconds = watched_seconds WHERE max_watched_seconds < watched_seconds")
    op.alter_column("learning_progress", "max_watched_seconds", server_default=None)


def downgrade() -> None:
    op.drop_column("learning_progress", "max_watched_seconds")
