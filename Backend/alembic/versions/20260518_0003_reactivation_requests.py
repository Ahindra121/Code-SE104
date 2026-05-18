"""add admin lock and reactivation requests

Revision ID: 20260518_0003
Revises: 20260518_0002
Create Date: 2026-05-18
"""

from alembic import op
import sqlalchemy as sa


revision = "20260518_0003"
down_revision = "20260518_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("admin_locked_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("admin_locked_reason", sa.Text(), nullable=True))
    op.create_table(
        "reactivation_requests",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column(
            "reason",
            sa.Text(),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.Enum("pending", "approved", "rejected", name="reactivation_request_status"),
            nullable=False,
        ),
        sa.Column("admin_response", sa.Text(), nullable=True),
        sa.Column("reviewed_by_id", sa.Integer(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["reviewed_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_reactivation_requests_id"), "reactivation_requests", ["id"], unique=False)
    op.create_index(op.f("ix_reactivation_requests_user_id"), "reactivation_requests", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_reactivation_requests_user_id"), table_name="reactivation_requests")
    op.drop_index(op.f("ix_reactivation_requests_id"), table_name="reactivation_requests")
    op.drop_table("reactivation_requests")
    op.execute("DROP TYPE IF EXISTS reactivation_request_status")
    op.drop_column("users", "admin_locked_reason")
    op.drop_column("users", "admin_locked_at")
