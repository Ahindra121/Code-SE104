from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.entities import (
    Course,
    CourseProgress,
    Enrollment,
    EnrollmentStatus,
    FinalTest,
    FinalTestQuestion,
    FinalTestQuestionType,
    FinalTestSubmission,
    FinalTestSubmissionStatus,
    LearningProgress,
    Lesson,
    User,
    UserRole,
)
from app.schemas.common import ok
from app.schemas.final_test import (
    FinalTestCreate,
    FinalTestEligibilityOut,
    FinalTestForStudent,
    FinalTestGrade,
    FinalTestOut,
    FinalTestQuestionCreate,
    FinalTestQuestionOut,
    FinalTestQuestionUpdate,
    FinalTestSubmissionOut,
    FinalTestSubmit,
    FinalTestUpdate,
    InstructorSubmissionOut,
)
from app.services.course_service import assert_course_owner

router = APIRouter(tags=["Final Tests"])
instructor_router = APIRouter(prefix="/instructor", tags=["Instructor Final Tests"])


def _now() -> datetime:
    return datetime.now(UTC)


def _require_enrolled(db: Session, student_id: int, course_id: int) -> Enrollment:
    enrollment = db.scalar(
        select(Enrollment).where(
            Enrollment.student_id == student_id,
            Enrollment.course_id == course_id,
            Enrollment.status.in_([EnrollmentStatus.active, EnrollmentStatus.completed]),
        )
    )
    if not enrollment:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Enrollment required")
    return enrollment


def _lesson_completion_state(db: Session, student_id: int, course_id: int) -> tuple[int, int]:
    total_lessons = db.scalar(
        select(func.count(Lesson.id)).where(
            Lesson.course_id == course_id,
            Lesson.is_deleted.is_(False),
            Lesson.is_visible.is_(True),
        )
    ) or 0
    completed_lessons = db.scalar(
        select(func.count(LearningProgress.id)).where(
            LearningProgress.student_id == student_id,
            LearningProgress.course_id == course_id,
            LearningProgress.is_completed.is_(True),
        )
    ) or 0
    return int(total_lessons), int(completed_lessons)


def _assert_eligible(db: Session, student_id: int, course_id: int) -> None:
    _require_enrolled(db, student_id, course_id)
    total_lessons, completed_lessons = _lesson_completion_state(db, student_id, course_id)
    if total_lessons == 0 or completed_lessons < total_lessons:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must complete all lessons before taking the final test",
        )


def _active_final_test(db: Session, course_id: int) -> FinalTest:
    final_test = db.scalars(
        select(FinalTest)
        .options(selectinload(FinalTest.questions))
        .where(FinalTest.course_id == course_id, FinalTest.is_active.is_(True))
        .order_by(FinalTest.created_at.desc())
    ).first()
    if not final_test:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Final test not found")
    return final_test


def _final_test_pass_score(final_test: FinalTest) -> float:
    return float(final_test.course.final_test_pass_score)


def _answer_value(answer: Any) -> str:
    return str(answer).strip()


def _get_or_create_course_progress(db: Session, student_id: int, course_id: int) -> CourseProgress:
    progress = db.scalar(
        select(CourseProgress).where(
            CourseProgress.student_id == student_id,
            CourseProgress.course_id == course_id,
        )
    )
    if progress:
        return progress
    progress = CourseProgress(student_id=student_id, course_id=course_id, is_completed=False)
    db.add(progress)
    db.flush()
    return progress


def _complete_course(db: Session, submission: FinalTestSubmission) -> None:
    progress = _get_or_create_course_progress(db, submission.student_id, submission.course_id)
    progress.is_completed = True
    progress.completed_at = progress.completed_at or _now()
    progress.final_score_percent = submission.score_percent
    progress.final_submission_id = submission.id

    enrollment = db.scalar(
        select(Enrollment).where(
            Enrollment.student_id == submission.student_id,
            Enrollment.course_id == submission.course_id,
        )
    )
    if enrollment:
        enrollment.status = EnrollmentStatus.completed


def _submission_out(submission: FinalTestSubmission) -> FinalTestSubmissionOut:
    return FinalTestSubmissionOut.model_validate(submission)


@router.get("/courses/{course_id}/final-test/eligibility")
def check_final_test_eligibility(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.student)),
):
    _require_enrolled(db, current_user.id, course_id)
    course = db.get(Course, course_id)
    if course and not course.require_final_test:
        return ok(FinalTestEligibilityOut(eligible=False, reason="Final test is not required for this course"))
    final_test = db.scalar(select(FinalTest.id).where(FinalTest.course_id == course_id, FinalTest.is_active.is_(True)))
    if not final_test:
        return ok(FinalTestEligibilityOut(eligible=False, reason="Final test is not available"))
    total_lessons, completed_lessons = _lesson_completion_state(db, current_user.id, course_id)
    if total_lessons > 0 and completed_lessons >= total_lessons:
        return ok(FinalTestEligibilityOut(eligible=True, reason="All lessons completed"))
    return ok(
        FinalTestEligibilityOut(
            eligible=False,
            reason="You must complete all lessons before taking the final test",
        )
    )


@router.get("/courses/{course_id}/final-test")
def get_final_test(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.student)),
):
    _assert_eligible(db, current_user.id, course_id)
    final_test = _active_final_test(db, course_id)
    return ok(FinalTestForStudent.model_validate(final_test))


@router.post("/courses/{course_id}/final-test/submit")
def submit_final_test(
    course_id: int,
    payload: FinalTestSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.student)),
):
    _assert_eligible(db, current_user.id, course_id)
    final_test = _active_final_test(db, course_id)
    attempts_count = db.scalar(
        select(func.count(FinalTestSubmission.id)).where(
            FinalTestSubmission.final_test_id == final_test.id,
            FinalTestSubmission.student_id == current_user.id,
        )
    ) or 0
    max_attempts = 1 if not final_test.course.allow_final_test_retake else final_test.course.max_final_test_attempts
    if attempts_count >= max_attempts:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Ban da het so lan lam Final Test toi da ({max_attempts})")
    questions = list(final_test.questions)
    if not questions:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Final test has no questions")

    answers_by_question = {item.question_id: item.answer for item in payload.answers}
    missing = [question.id for question in questions if not _answer_value(answers_by_question.get(question.id, ""))]
    if missing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="All final test questions must be answered")

    auto_score = 0.0
    max_score = round(sum(float(question.max_score or 0) for question in questions), 2)
    has_essay = any(question.question_type == FinalTestQuestionType.essay for question in questions)
    stored_answers: list[dict[str, Any]] = []
    for question in questions:
        answer = _answer_value(answers_by_question.get(question.id))
        is_correct = None
        earned_score = None
        if question.question_type == FinalTestQuestionType.multiple_choice:
            is_correct = answer.lower() == _answer_value(question.correct_answer).lower()
            earned_score = float(question.max_score) if is_correct else 0.0
            auto_score += earned_score
        stored_answers.append(
            {
                "question_id": question.id,
                "question_type": question.question_type.value,
                "answer": answer,
                "is_correct": is_correct,
                "auto_score": earned_score,
            }
        )

    attempt_number = (
        db.scalar(
            select(func.count(FinalTestSubmission.id)).where(
                FinalTestSubmission.final_test_id == final_test.id,
                FinalTestSubmission.student_id == current_user.id,
            )
        )
        or 0
    ) + 1

    submission = FinalTestSubmission(
        final_test_id=final_test.id,
        course_id=course_id,
        student_id=current_user.id,
        attempt_number=attempt_number,
        answers=stored_answers,
        auto_score=round(auto_score, 2),
        max_score=max_score,
        status=FinalTestSubmissionStatus.pending_grading if has_essay else FinalTestSubmissionStatus.submitted,
    )
    if not has_essay:
        submission.manual_score = 0
        submission.total_score = submission.auto_score
        submission.score_percent = 0 if max_score <= 0 else round((submission.total_score / max_score) * 100, 2)
        submission.status = (
            FinalTestSubmissionStatus.passed
            if submission.score_percent >= _final_test_pass_score(final_test)
            else FinalTestSubmissionStatus.failed
        )
    db.add(submission)
    db.flush()
    if submission.status == FinalTestSubmissionStatus.passed:
        _complete_course(db, submission)
    db.commit()
    db.refresh(submission)
    return ok(_submission_out(submission), "Final test submitted")


@router.get("/courses/{course_id}/final-test/submissions/me")
def my_final_test_submissions(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.student)),
):
    _require_enrolled(db, current_user.id, course_id)
    submissions = db.scalars(
        select(FinalTestSubmission)
        .where(FinalTestSubmission.course_id == course_id, FinalTestSubmission.student_id == current_user.id)
        .order_by(FinalTestSubmission.submitted_at.desc())
    ).all()
    return ok([_submission_out(submission) for submission in submissions])


@instructor_router.post("/courses/{course_id}/final-test")
def create_final_test(
    course_id: int,
    payload: FinalTestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.instructor)),
):
    course = db.get(Course, course_id)
    if not course or course.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    assert_course_owner(course, current_user)
    if payload.is_active:
        db.query(FinalTest).filter(FinalTest.course_id == course_id).update({FinalTest.is_active: False})
    final_test = FinalTest(course_id=course_id, **payload.model_dump())
    final_test.passing_score_percent = course.final_test_pass_score
    db.add(final_test)
    db.commit()
    db.refresh(final_test)
    return ok(FinalTestOut.model_validate(final_test), "Final test saved")


@instructor_router.get("/courses/{course_id}/final-test")
def get_instructor_final_test(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.instructor)),
):
    course = db.get(Course, course_id)
    if not course or course.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    assert_course_owner(course, current_user)
    final_test = db.scalars(
        select(FinalTest)
        .options(selectinload(FinalTest.questions))
        .where(FinalTest.course_id == course_id)
        .order_by(FinalTest.created_at.desc())
    ).first()
    return ok(FinalTestOut.model_validate(final_test) if final_test else None)


@instructor_router.patch("/final-tests/{final_test_id}")
def update_final_test(
    final_test_id: int,
    payload: FinalTestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.instructor)),
):
    final_test = db.get(FinalTest, final_test_id)
    if not final_test:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Final test not found")
    assert_course_owner(final_test.course, current_user)
    values = payload.model_dump(exclude_unset=True)
    if values.get("is_active"):
        db.query(FinalTest).filter(FinalTest.course_id == final_test.course_id, FinalTest.id != final_test.id).update(
            {FinalTest.is_active: False}
        )
    for field, value in values.items():
        setattr(final_test, field, value)
    db.commit()
    db.refresh(final_test)
    return ok(FinalTestOut.model_validate(final_test), "Final test updated")


@instructor_router.post("/final-tests/{final_test_id}/questions")
def add_final_test_question(
    final_test_id: int,
    payload: FinalTestQuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.instructor)),
):
    final_test = db.get(FinalTest, final_test_id)
    if not final_test:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Final test not found")
    assert_course_owner(final_test.course, current_user)
    question = FinalTestQuestion(final_test_id=final_test_id, **payload.model_dump())
    db.add(question)
    db.commit()
    db.refresh(question)
    return ok(FinalTestQuestionOut.model_validate(question), "Question added")


@instructor_router.patch("/final-test-questions/{question_id}")
def update_final_test_question(
    question_id: int,
    payload: FinalTestQuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.instructor)),
):
    question = db.get(FinalTestQuestion, question_id)
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    assert_course_owner(question.final_test.course, current_user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(question, field, value)
    db.commit()
    db.refresh(question)
    return ok(FinalTestQuestionOut.model_validate(question), "Question updated")


@instructor_router.delete("/final-test-questions/{question_id}")
def delete_final_test_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.instructor)),
):
    question = db.get(FinalTestQuestion, question_id)
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    assert_course_owner(question.final_test.course, current_user)
    db.delete(question)
    db.commit()
    return ok(None, "Question deleted")


@instructor_router.get("/courses/{course_id}/final-test/submissions")
def list_final_test_submissions(
    course_id: int,
    status_filter: FinalTestSubmissionStatus | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.instructor)),
):
    course = db.get(Course, course_id)
    if not course or course.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    assert_course_owner(course, current_user)
    filters = [FinalTestSubmission.course_id == course_id]
    if status_filter:
        filters.append(FinalTestSubmission.status == status_filter)
    submissions = db.scalars(
        select(FinalTestSubmission)
        .options(selectinload(FinalTestSubmission.final_test).selectinload(FinalTest.questions), selectinload(FinalTestSubmission.student))
        .where(*filters)
        .order_by(FinalTestSubmission.submitted_at.desc())
    ).all()
    return ok(
        [
            InstructorSubmissionOut(
                **FinalTestSubmissionOut.model_validate(submission).model_dump(),
                student_name=submission.student.full_name or submission.student.username if submission.student else None,
                student_email=submission.student.email if submission.student else None,
                questions=[question for question in submission.final_test.questions],
            )
            for submission in submissions
        ]
    )


@instructor_router.patch("/final-test-submissions/{submission_id}/grade")
def grade_final_test_submission(
    submission_id: int,
    payload: FinalTestGrade,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.instructor)),
):
    submission = db.scalars(
        select(FinalTestSubmission)
        .options(selectinload(FinalTestSubmission.final_test).selectinload(FinalTest.questions))
        .where(FinalTestSubmission.id == submission_id)
    ).first()
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    assert_course_owner(submission.final_test.course, current_user)
    essay_max_score = sum(
        float(question.max_score or 0)
        for question in submission.final_test.questions
        if question.question_type == FinalTestQuestionType.essay
    )
    if payload.manual_score > essay_max_score:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Manual score exceeds essay max score")

    submission.manual_score = round(payload.manual_score, 2)
    submission.total_score = round((submission.auto_score or 0) + submission.manual_score, 2)
    submission.score_percent = 0 if submission.max_score <= 0 else round((submission.total_score / submission.max_score) * 100, 2)
    submission.status = (
        FinalTestSubmissionStatus.passed
        if submission.score_percent >= _final_test_pass_score(submission.final_test)
        else FinalTestSubmissionStatus.failed
    )
    submission.instructor_feedback = payload.instructor_feedback
    submission.graded_by = current_user.id
    submission.graded_at = _now()
    if submission.status == FinalTestSubmissionStatus.passed:
        _complete_course(db, submission)
    db.commit()
    db.refresh(submission)
    return ok(_submission_out(submission), "Submission graded")
