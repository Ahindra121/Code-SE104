"""add document viewed to learning progress

Revision ID: 20260518_0007
Revises: 20260518_0006
Create Date: 2026-05-18 00:07:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "20260518_0007"
down_revision = "20260518_0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "learning_progress",
        sa.Column("document_viewed", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.alter_column("learning_progress", "document_viewed", server_default=None)


def downgrade() -> None:
    op.drop_column("learning_progress", "document_viewed")
