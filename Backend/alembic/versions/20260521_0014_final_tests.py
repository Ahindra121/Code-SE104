"""final tests and course progress

Revision ID: 20260521_0014
Revises: 20260520_0013
Create Date: 2026-05-21
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260521_0014"
down_revision = "20260520_0013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    sa.Enum("multiple_choice", "essay", name="final_test_question_type").create(bind, checkfirst=True)
    sa.Enum("submitted", "pending_grading", "graded", "passed", "failed", name="final_test_submission_status").create(
        bind, checkfirst=True
    )
    question_type = postgresql.ENUM("multiple_choice", "essay", name="final_test_question_type", create_type=False)
    submission_status = postgresql.ENUM(
        "submitted",
        "pending_grading",
        "graded",
        "passed",
        "failed",
        name="final_test_submission_status",
        create_type=False,
    )

    op.create_table(
        "final_tests",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("course_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("passing_score_percent", sa.Float(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_final_tests_course_id"), "final_tests", ["course_id"], unique=False)
    op.create_index(op.f("ix_final_tests_id"), "final_tests", ["id"], unique=False)

    op.create_table(
        "final_test_questions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("final_test_id", sa.Integer(), nullable=False),
        sa.Column("question_text", sa.Text(), nullable=False),
        sa.Column("question_type", question_type, nullable=False),
        sa.Column("options", sa.JSON(), nullable=True),
        sa.Column("correct_answer", sa.Text(), nullable=True),
        sa.Column("max_score", sa.Float(), nullable=False),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["final_test_id"], ["final_tests.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_final_test_questions_final_test_id"), "final_test_questions", ["final_test_id"], unique=False)
    op.create_index(op.f("ix_final_test_questions_id"), "final_test_questions", ["id"], unique=False)

    op.create_table(
        "final_test_submissions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("final_test_id", sa.Integer(), nullable=False),
        sa.Column("course_id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("attempt_number", sa.Integer(), nullable=False),
        sa.Column("answers", sa.JSON(), nullable=False),
        sa.Column("auto_score", sa.Float(), nullable=False),
        sa.Column("manual_score", sa.Float(), nullable=True),
        sa.Column("total_score", sa.Float(), nullable=True),
        sa.Column("max_score", sa.Float(), nullable=False),
        sa.Column("score_percent", sa.Float(), nullable=True),
        sa.Column("status", submission_status, nullable=False),
        sa.Column("instructor_feedback", sa.Text(), nullable=True),
        sa.Column("graded_by", sa.Integer(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("graded_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["final_test_id"], ["final_tests.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["graded_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["student_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_final_test_submissions_course_id"), "final_test_submissions", ["course_id"], unique=False)
    op.create_index(op.f("ix_final_test_submissions_final_test_id"), "final_test_submissions", ["final_test_id"], unique=False)
    op.create_index(op.f("ix_final_test_submissions_id"), "final_test_submissions", ["id"], unique=False)
    op.create_index(op.f("ix_final_test_submissions_student_id"), "final_test_submissions", ["student_id"], unique=False)

    op.create_table(
        "course_progress",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("course_id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("is_completed", sa.Boolean(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("final_score_percent", sa.Float(), nullable=True),
        sa.Column("final_submission_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["final_submission_id"], ["final_test_submissions.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["student_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("student_id", "course_id", name="uq_course_progress_student_course"),
    )
    op.create_index(op.f("ix_course_progress_course_id"), "course_progress", ["course_id"], unique=False)
    op.create_index(op.f("ix_course_progress_id"), "course_progress", ["id"], unique=False)
    op.create_index(op.f("ix_course_progress_student_id"), "course_progress", ["student_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_course_progress_student_id"), table_name="course_progress")
    op.drop_index(op.f("ix_course_progress_id"), table_name="course_progress")
    op.drop_index(op.f("ix_course_progress_course_id"), table_name="course_progress")
    op.drop_table("course_progress")

    op.drop_index(op.f("ix_final_test_submissions_student_id"), table_name="final_test_submissions")
    op.drop_index(op.f("ix_final_test_submissions_id"), table_name="final_test_submissions")
    op.drop_index(op.f("ix_final_test_submissions_final_test_id"), table_name="final_test_submissions")
    op.drop_index(op.f("ix_final_test_submissions_course_id"), table_name="final_test_submissions")
    op.drop_table("final_test_submissions")

    op.drop_index(op.f("ix_final_test_questions_id"), table_name="final_test_questions")
    op.drop_index(op.f("ix_final_test_questions_final_test_id"), table_name="final_test_questions")
    op.drop_table("final_test_questions")

    op.drop_index(op.f("ix_final_tests_id"), table_name="final_tests")
    op.drop_index(op.f("ix_final_tests_course_id"), table_name="final_tests")
    op.drop_table("final_tests")

    sa.Enum(name="final_test_submission_status").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="final_test_question_type").drop(op.get_bind(), checkfirst=True)
