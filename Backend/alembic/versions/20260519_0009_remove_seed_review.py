"""Remove seed review from React course

Revision ID: 20260519_0009
Revises: 20260519_0008
Create Date: 2026-05-19
"""

from alembic import op


revision = "20260519_0009"
down_revision = "20260519_0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        DELETE FROM reviews
        WHERE comment = 'Course content is practical and clear.'
          AND course_id IN (
              SELECT id FROM courses
              WHERE title = 'React & Next.js Masterclass 2024'
          )
        """
    )


def downgrade() -> None:
    pass
