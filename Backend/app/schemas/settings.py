from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SystemSettingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    key: str
    value: str
    value_type: str
    description: str | None
    updated_by: int | None
    created_at: datetime
    updated_at: datetime


class SystemSettingsPatch(BaseModel):
    settings: dict[str, str] | None = None

    model_config = ConfigDict(extra="allow")

    def values_by_key(self) -> dict[str, str]:
        values = dict(self.settings or {})
        extra = self.model_extra or {}
        values.update({key: str(value) for key, value in extra.items()})
        return values


class CourseSettingsOut(BaseModel):
    lesson_completion_percent: int
    default_quiz_pass_score: int
    final_test_pass_score: int
    allow_quiz_retake: bool
    max_quiz_attempts: int
    allow_final_test_retake: bool
    max_final_test_attempts: int
    require_final_test: bool


class CourseSettingsPatch(BaseModel):
    lesson_completion_percent: int | None = Field(default=None, ge=1, le=100)
    default_quiz_pass_score: int | None = Field(default=None, ge=1, le=100)
    final_test_pass_score: int | None = Field(default=None, ge=1, le=100)
    allow_quiz_retake: bool | None = None
    max_quiz_attempts: int | None = Field(default=None, ge=1)
    allow_final_test_retake: bool | None = None
    max_final_test_attempts: int | None = Field(default=None, ge=1)
    require_final_test: bool | None = None
