"""add course deletion requests

Revision ID: 20260518_0004
Revises: 20260518_0003
Create Date: 2026-05-18
"""

from alembic import op
import sqlalchemy as sa


revision = "20260518_0004"
down_revision = "20260518_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "course_deletion_requests",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("course_id", sa.Integer(), nullable=False),
        sa.Column("instructor_id", sa.Integer(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("student_count", sa.Integer(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("pending", "approved", "rejected", name="course_deletion_request_status"),
            nullable=False,
        ),
        sa.Column("admin_response", sa.Text(), nullable=True),
        sa.Column("reviewed_by_id", sa.Integer(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["instructor_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reviewed_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_course_deletion_requests_id"), "course_deletion_requests", ["id"], unique=False)
    op.create_index(op.f("ix_course_deletion_requests_course_id"), "course_deletion_requests", ["course_id"], unique=False)
    op.create_index(op.f("ix_course_deletion_requests_instructor_id"), "course_deletion_requests", ["instructor_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_course_deletion_requests_instructor_id"), table_name="course_deletion_requests")
    op.drop_index(op.f("ix_course_deletion_requests_course_id"), table_name="course_deletion_requests")
    op.drop_index(op.f("ix_course_deletion_requests_id"), table_name="course_deletion_requests")
    op.drop_table("course_deletion_requests")
    op.execute("DROP TYPE IF EXISTS course_deletion_request_status")
