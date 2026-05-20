"""instructor verifications and course review metadata

Revision ID: 20260520_0012
Revises: 20260520_0011
Create Date: 2026-05-20
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260520_0012"
down_revision = "20260520_0011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("ALTER TYPE course_status ADD VALUE IF NOT EXISTS 'pending_review'")

    verification_status = postgresql.ENUM(
        "pending",
        "approved",
        "rejected",
        name="instructor_verification_status",
        create_type=False,
    )
    sa.Enum("pending", "approved", "rejected", name="instructor_verification_status").create(bind, checkfirst=True)

    op.create_table(
        "instructor_verifications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("cccd_number", sa.String(length=30), nullable=False),
        sa.Column("cccd_front_url", sa.String(length=600), nullable=False),
        sa.Column("cccd_back_url", sa.String(length=600), nullable=False),
        sa.Column("degree_url", sa.String(length=600), nullable=False),
        sa.Column("major", sa.String(length=255), nullable=False),
        sa.Column("university_name", sa.String(length=255), nullable=False),
        sa.Column("graduation_year", sa.Integer(), nullable=False),
        sa.Column("status", verification_status, nullable=False),
        sa.Column("admin_note", sa.Text(), nullable=True),
        sa.Column("reviewed_by_id", sa.Integer(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["reviewed_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index(op.f("ix_instructor_verifications_id"), "instructor_verifications", ["id"], unique=False)
    op.create_index(op.f("ix_instructor_verifications_user_id"), "instructor_verifications", ["user_id"], unique=False)

    op.add_column("courses", sa.Column("reviewed_by_id", sa.Integer(), nullable=True))
    op.add_column("courses", sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True))
    op.create_foreign_key("fk_courses_reviewed_by_id_users", "courses", "users", ["reviewed_by_id"], ["id"], ondelete="SET NULL")


def downgrade() -> None:
    op.drop_constraint("fk_courses_reviewed_by_id_users", "courses", type_="foreignkey")
    op.drop_column("courses", "reviewed_at")
    op.drop_column("courses", "reviewed_by_id")

    op.drop_index(op.f("ix_instructor_verifications_user_id"), table_name="instructor_verifications")
    op.drop_index(op.f("ix_instructor_verifications_id"), table_name="instructor_verifications")
    op.drop_table("instructor_verifications")
    sa.Enum(name="instructor_verification_status").drop(op.get_bind(), checkfirst=True)
