"""add bio to users

Revision ID: 20260518_0005
Revises: 20260518_0004
Create Date: 2026-05-18 00:05:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "20260518_0005"
down_revision = "20260518_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("bio", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "bio")
