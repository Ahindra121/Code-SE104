"""add lesson document metadata and progress percent

Revision ID: 20260519_0008
Revises: 20260518_0007
Create Date: 2026-05-19 00:08:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "20260519_0008"
down_revision = "20260518_0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("lessons", sa.Column("document_name", sa.String(length=255), nullable=True))
    op.add_column("lessons", sa.Column("document_type", sa.String(length=30), nullable=True))
    op.add_column(
        "learning_progress",
        sa.Column("progress_percent", sa.Float(), nullable=False, server_default="0"),
    )
    op.add_column(
        "learning_progress",
        sa.Column("duration_seconds", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "learning_progress",
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.alter_column("learning_progress", "progress_percent", server_default=None)
    op.alter_column("learning_progress", "duration_seconds", server_default=None)
    op.alter_column("learning_progress", "updated_at", server_default=None)


def downgrade() -> None:
    op.drop_column("learning_progress", "updated_at")
    op.drop_column("learning_progress", "duration_seconds")
    op.drop_column("learning_progress", "progress_percent")
    op.drop_column("lessons", "document_type")
    op.drop_column("lessons", "document_name")
