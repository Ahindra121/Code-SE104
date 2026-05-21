"""course review criteria ratings

Revision ID: 20260521_0015
Revises: 20260521_0014
Create Date: 2026-05-21
"""

from alembic import op
import sqlalchemy as sa

revision = "20260521_0015"
down_revision = "20260521_0014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    for column_name in [
        "content_quality",
        "video_quality",
        "instructor_clarity",
        "material_usefulness",
        "assessment_quality",
        "practical_value",
        "overall_satisfaction",
    ]:
        op.add_column("reviews", sa.Column(column_name, sa.Integer(), nullable=True))

    op.add_column("reviews", sa.Column("average_rating", sa.Float(), nullable=True))
    op.add_column("reviews", sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True))

    op.execute(
        """
        UPDATE reviews
        SET
            content_quality = rating,
            video_quality = rating,
            instructor_clarity = rating,
            material_usefulness = rating,
            assessment_quality = rating,
            practical_value = rating,
            overall_satisfaction = rating,
            average_rating = rating,
            updated_at = COALESCE(created_at, now())
        """
    )

    for column_name in [
        "content_quality",
        "video_quality",
        "instructor_clarity",
        "material_usefulness",
        "assessment_quality",
        "practical_value",
        "overall_satisfaction",
        "average_rating",
        "updated_at",
    ]:
        op.alter_column("reviews", column_name, nullable=False)

    constraints = {
        "ck_review_content_quality_range": "content_quality >= 1 AND content_quality <= 5",
        "ck_review_video_quality_range": "video_quality >= 1 AND video_quality <= 5",
        "ck_review_instructor_clarity_range": "instructor_clarity >= 1 AND instructor_clarity <= 5",
        "ck_review_material_usefulness_range": "material_usefulness >= 1 AND material_usefulness <= 5",
        "ck_review_assessment_quality_range": "assessment_quality >= 1 AND assessment_quality <= 5",
        "ck_review_practical_value_range": "practical_value >= 1 AND practical_value <= 5",
        "ck_review_overall_satisfaction_range": "overall_satisfaction >= 1 AND overall_satisfaction <= 5",
    }
    for name, condition in constraints.items():
        op.create_check_constraint(name, "reviews", condition)


def downgrade() -> None:
    for name in [
        "ck_review_overall_satisfaction_range",
        "ck_review_practical_value_range",
        "ck_review_assessment_quality_range",
        "ck_review_material_usefulness_range",
        "ck_review_instructor_clarity_range",
        "ck_review_video_quality_range",
        "ck_review_content_quality_range",
    ]:
        op.drop_constraint(name, "reviews", type_="check")

    op.drop_column("reviews", "updated_at")
    op.drop_column("reviews", "average_rating")
    op.drop_column("reviews", "overall_satisfaction")
    op.drop_column("reviews", "practical_value")
    op.drop_column("reviews", "assessment_quality")
    op.drop_column("reviews", "material_usefulness")
    op.drop_column("reviews", "instructor_clarity")
    op.drop_column("reviews", "video_quality")
    op.drop_column("reviews", "content_quality")
