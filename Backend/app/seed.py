from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.entities import (
    AnswerOption,
    Course,
    CourseLevel,
    CourseStatus,
    Enrollment,
    Lesson,
    Question,
    Review,
    User,
    UserRole,
)


def get_or_create_user(db, email: str, username: str, role: UserRole, full_name: str) -> User:
    user = db.scalar(select(User).where(User.username == username))
    if user:
        return user
    user = User(
        email=email,
        username=username,
        full_name=full_name,
        phone="0901234567",
        role=role,
        hashed_password=get_password_hash("Demo@123"),
    )
    db.add(user)
    db.flush()
    return user


def run() -> None:
    db = SessionLocal()
    try:
        admin = get_or_create_user(db, "admin@example.com", "admin123", UserRole.admin, "Admin LearnHub")
        instructor = get_or_create_user(db, "instructor@example.com", "instructor123", UserRole.instructor, "Nguyen Van Instructor")
        student = get_or_create_user(db, "student@example.com", "student123", UserRole.student, "Tran Thi Student")

        if not db.scalar(select(Course).where(Course.title == "React & Next.js Masterclass 2024")):
            course1 = Course(
                title="React & Next.js Masterclass 2024",
                category="IT",
                description="Build modern frontend apps with React, Next.js and API integration.",
                price=1299000,
                thumbnail_url="https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop",
                level=CourseLevel.intermediate,
                status=CourseStatus.approved,
                instructor_id=instructor.id,
            )
            course2 = Course(
                title="Python for Data Science & Machine Learning",
                category="IT",
                description="Learn Python, data analysis, visualization and basic machine learning workflows.",
                price=1499000,
                thumbnail_url="https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&h=450&fit=crop",
                level=CourseLevel.advanced,
                status=CourseStatus.approved,
                instructor_id=instructor.id,
            )
            db.add_all([course1, course2])
            db.flush()

            lesson1 = Lesson(course_id=course1.id, title="Welcome to React", order_index=1, duration_seconds=600, video_url="https://example.com/react-1.mp4")
            lesson2 = Lesson(course_id=course1.id, title="Next.js Routing", order_index=2, duration_seconds=900, video_url="https://example.com/next-routing.mp4")
            lesson3 = Lesson(course_id=course2.id, title="Python Data Basics", order_index=1, duration_seconds=720, video_url="https://example.com/python-data.mp4")
            db.add_all([lesson1, lesson2, lesson3])
            db.flush()

            db.add_all(
                [
                    Question(
                        lesson_id=lesson1.id,
                        content="What hook is commonly used for component state in React?",
                        option_a="useState",
                        option_b="useRoute",
                        option_c="useTable",
                        option_d="useQueryOnly",
                        correct_option=AnswerOption.A,
                    ),
                    Question(
                        lesson_id=lesson1.id,
                        content="JSX is closest to which kind of syntax?",
                        option_a="SQL",
                        option_b="HTML-like markup in JavaScript",
                        option_c="YAML",
                        option_d="Binary",
                        correct_option=AnswerOption.B,
                    ),
                    Question(
                        lesson_id=lesson3.id,
                        content="Which library is commonly used for data frames in Python?",
                        option_a="Pandas",
                        option_b="FastAPI",
                        option_c="Jinja",
                        option_d="Uvicorn",
                        correct_option=AnswerOption.A,
                    ),
                ]
            )
            db.add(Enrollment(student_id=student.id, course_id=course1.id))
            db.add(Review(student_id=student.id, course_id=course1.id, rating=5, comment="Course content is practical and clear."))

        db.commit()
        print("Seed data created. Demo password for all users: Demo@123")
        print("Users: admin123, instructor123, student123")
    finally:
        db.close()


if __name__ == "__main__":
    run()
