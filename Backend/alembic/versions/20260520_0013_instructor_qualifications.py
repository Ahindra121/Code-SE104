"""instructor qualifications and pending verification edits

Revision ID: 20260520_0013
Revises: 20260520_0012
Create Date: 2026-05-20
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260520_0013"
down_revision = "20260520_0012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    sa.Enum("pending", "approved", "rejected", name="instructor_qualification_status").create(bind, checkfirst=True)
    qualification_status = postgresql.ENUM(
        "pending",
        "approved",
        "rejected",
        name="instructor_qualification_status",
        create_type=False,
    )

    op.add_column("instructor_verifications", sa.Column("pending_full_name", sa.String(length=255), nullable=True))
    op.add_column("instructor_verifications", sa.Column("pending_cccd_number", sa.String(length=30), nullable=True))
    op.add_column("instructor_verifications", sa.Column("pending_cccd_front_url", sa.String(length=600), nullable=True))
    op.add_column("instructor_verifications", sa.Column("pending_cccd_back_url", sa.String(length=600), nullable=True))
    op.add_column(
        "instructor_verifications",
        sa.Column("has_pending_changes", sa.Boolean(), server_default=sa.false(), nullable=False),
    )

    op.create_table(
        "instructor_qualifications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("verification_id", sa.Integer(), nullable=False),
        sa.Column("major", sa.String(length=255), nullable=False),
        sa.Column("university_name", sa.String(length=255), nullable=False),
        sa.Column("graduation_year", sa.Integer(), nullable=False),
        sa.Column("degree_url", sa.String(length=600), nullable=False),
        sa.Column("status", qualification_status, nullable=False),
        sa.Column("admin_note", sa.Text(), nullable=True),
        sa.Column("reviewed_by_id", sa.Integer(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["reviewed_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["verification_id"], ["instructor_verifications.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_instructor_qualifications_id"), "instructor_qualifications", ["id"], unique=False)
    op.create_index(
        op.f("ix_instructor_qualifications_verification_id"),
        "instructor_qualifications",
        ["verification_id"],
        unique=False,
    )

    op.execute(
        """
        INSERT INTO instructor_qualifications
            (verification_id, major, university_name, graduation_year, degree_url, status, admin_note, reviewed_by_id, reviewed_at, created_at, updated_at)
        SELECT
            id, major, university_name, graduation_year, degree_url,
            status::text::instructor_qualification_status,
            admin_note, reviewed_by_id, reviewed_at, created_at, updated_at
        FROM instructor_verifications
        WHERE degree_url IS NOT NULL
        """
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_instructor_qualifications_verification_id"), table_name="instructor_qualifications")
    op.drop_index(op.f("ix_instructor_qualifications_id"), table_name="instructor_qualifications")
    op.drop_table("instructor_qualifications")
    sa.Enum(name="instructor_qualification_status").drop(op.get_bind(), checkfirst=True)

    op.drop_column("instructor_verifications", "has_pending_changes")
    op.drop_column("instructor_verifications", "pending_cccd_back_url")
    op.drop_column("instructor_verifications", "pending_cccd_front_url")
    op.drop_column("instructor_verifications", "pending_cccd_number")
    op.drop_column("instructor_verifications", "pending_full_name")
