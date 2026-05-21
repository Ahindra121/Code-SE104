"""review visibility for rating moderation

Revision ID: 20260521_0016
Revises: 20260521_0015
Create Date: 2026-05-21
"""

from alembic import op
import sqlalchemy as sa

revision = "20260521_0016"
down_revision = "20260521_0015"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("reviews", sa.Column("is_visible", sa.Boolean(), server_default=sa.true(), nullable=False))


def downgrade() -> None:
    op.drop_column("reviews", "is_visible")
