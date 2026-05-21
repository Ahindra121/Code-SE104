from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import ValidationError

from app.core.config import settings
from app.routers import auth, certificates, courses, enrollments, final_tests, instructor_verifications, lessons, progress, questions, quizzes, reports, reviews, settings as settings_router, users

app = FastAPI(title=settings.app_name, version="1.0.0")
UPLOAD_ROOT = Path(__file__).resolve().parents[1] / "uploads"
UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_ROOT), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"success": False, "message": exc.detail, "data": None})


@app.exception_handler(ValidationError)
async def validation_exception_handler(_: Request, exc: ValidationError):
    return JSONResponse(status_code=422, content={"success": False, "message": "Validation error", "data": exc.errors()})


@app.get("/")
def root():
    return {"success": True, "message": "LearnHub API is running", "data": {"docs": "/docs"}}


for router in [
    auth.router,
    users.router,
    courses.router,
    courses.admin_router,
    settings_router.router,
    settings_router.admin_router,
    settings_router.course_router,
    instructor_verifications.router,
    instructor_verifications.admin_router,
    lessons.router,
    enrollments.router,
    progress.router,
    questions.router,
    quizzes.router,
    final_tests.router,
    final_tests.instructor_router,
    certificates.router,
    reviews.router,
    reviews.course_router,
    reviews.instructor_router,
    reviews.instructor_manage_router,
    reviews.admin_router,
    reports.router,
]:
    app.include_router(router, prefix=settings.api_prefix)
