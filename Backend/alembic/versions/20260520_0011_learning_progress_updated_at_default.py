"""restore learning progress updated_at default

Revision ID: 20260520_0011
Revises: 20260520_0010
Create Date: 2026-05-20
"""

from alembic import op
import sqlalchemy as sa


revision = "20260520_0011"
down_revision = "20260520_0010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "learning_progress",
        "updated_at",
        server_default=sa.func.now(),
        existing_type=sa.DateTime(timezone=True),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "learning_progress",
        "updated_at",
        server_default=None,
        existing_type=sa.DateTime(timezone=True),
        existing_nullable=False,
    )
