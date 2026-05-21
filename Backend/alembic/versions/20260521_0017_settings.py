"""system and course settings

Revision ID: 20260521_0017
Revises: 20260521_0016
Create Date: 2026-05-21
"""

from alembic import op
import sqlalchemy as sa

revision = "20260521_0017"
down_revision = "20260521_0016"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "system_settings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("key", sa.String(length=120), nullable=False),
        sa.Column("value", sa.Text(), nullable=False),
        sa.Column("value_type", sa.String(length=20), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("key"),
    )
    op.create_index(op.f("ix_system_settings_id"), "system_settings", ["id"], unique=False)
    op.create_index(op.f("ix_system_settings_key"), "system_settings", ["key"], unique=True)
    op.bulk_insert(
        sa.table(
            "system_settings",
            sa.column("key", sa.String),
            sa.column("value", sa.Text),
            sa.column("value_type", sa.String),
            sa.column("description", sa.Text),
        ),
        [
            {"key": "max_video_size_mb", "value": "100", "value_type": "int", "description": "Dung luong video toi da (MB)"},
            {"key": "max_document_size_mb", "value": "20", "value_type": "int", "description": "Dung luong tai lieu toi da (MB)"},
            {"key": "max_thumbnail_size_mb", "value": "5", "value_type": "int", "description": "Dung luong anh khoa hoc toi da (MB)"},
            {"key": "max_verification_file_size_mb", "value": "10", "value_type": "int", "description": "Dung luong file xac minh toi da (MB)"},
            {"key": "allowed_video_extensions", "value": "mp4,webm,mov", "value_type": "csv", "description": "Dinh dang video cho phep"},
            {"key": "allowed_document_extensions", "value": "pdf,doc,docx,ppt,pptx", "value_type": "csv", "description": "Dinh dang tai lieu cho phep"},
            {"key": "allowed_thumbnail_extensions", "value": "jpg,jpeg,png,webp", "value_type": "csv", "description": "Dinh dang anh khoa hoc cho phep"},
            {"key": "allowed_verification_extensions", "value": "pdf,jpg,jpeg,png", "value_type": "csv", "description": "Dinh dang file xac minh cho phep"},
        ],
    )
    op.add_column("courses", sa.Column("lesson_completion_percent", sa.Integer(), server_default="90", nullable=False))
    op.add_column("courses", sa.Column("default_quiz_pass_score", sa.Integer(), server_default="80", nullable=False))
    op.add_column("courses", sa.Column("final_test_pass_score", sa.Integer(), server_default="80", nullable=False))
    op.add_column("courses", sa.Column("allow_quiz_retake", sa.Boolean(), server_default=sa.true(), nullable=False))
    op.add_column("courses", sa.Column("max_quiz_attempts", sa.Integer(), server_default="3", nullable=False))
    op.add_column("courses", sa.Column("allow_final_test_retake", sa.Boolean(), server_default=sa.true(), nullable=False))
    op.add_column("courses", sa.Column("max_final_test_attempts", sa.Integer(), server_default="3", nullable=False))
    op.add_column("courses", sa.Column("require_final_test", sa.Boolean(), server_default=sa.true(), nullable=False))


def downgrade() -> None:
    op.drop_column("courses", "require_final_test")
    op.drop_column("courses", "max_final_test_attempts")
    op.drop_column("courses", "allow_final_test_retake")
    op.drop_column("courses", "max_quiz_attempts")
    op.drop_column("courses", "allow_quiz_retake")
    op.drop_column("courses", "final_test_pass_score")
    op.drop_column("courses", "default_quiz_pass_score")
    op.drop_column("courses", "lesson_completion_percent")
    op.drop_index(op.f("ix_system_settings_key"), table_name="system_settings")
    op.drop_index(op.f("ix_system_settings_id"), table_name="system_settings")
    op.drop_table("system_settings")
