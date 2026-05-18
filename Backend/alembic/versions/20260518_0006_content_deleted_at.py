"""add deleted_at to course content

Revision ID: 20260518_0006
Revises: 20260518_0005
Create Date: 2026-05-18 00:06:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "20260518_0006"
down_revision = "20260518_0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("courses", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("lessons", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("questions", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("questions", "deleted_at")
    op.drop_column("lessons", "deleted_at")
    op.drop_column("courses", "deleted_at")
