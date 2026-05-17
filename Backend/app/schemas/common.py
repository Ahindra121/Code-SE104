from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "OK"
    data: T | None = None


def ok(data=None, message: str = "OK") -> dict:
    return {"success": True, "message": message, "data": data}
