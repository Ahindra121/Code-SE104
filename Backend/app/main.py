from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.core.config import settings
from app.routers import auth, certificates, courses, enrollments, lessons, progress, questions, quizzes, reports, reviews, users

app = FastAPI(title=settings.app_name, version="1.0.0")

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
    lessons.router,
    enrollments.router,
    progress.router,
    questions.router,
    quizzes.router,
    certificates.router,
    reviews.router,
    reports.router,
]:
    app.include_router(router, prefix=settings.api_prefix)
