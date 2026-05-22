from functools import lru_cache

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "LearnHub API"
    api_prefix: str = "/api"
    database_url: str = Field(..., validation_alias="DATABASE_URL")
    secret_key: str = Field(..., validation_alias="SECRET_KEY")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_course_assets_bucket: str = "course-assets"
    supabase_lesson_files_bucket: str = "lesson-files"
    supabase_verification_files_bucket: str = "verification-files"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
