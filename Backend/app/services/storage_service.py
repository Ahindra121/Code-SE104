import unicodedata
from functools import lru_cache
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status
from supabase import Client, create_client

from app.core.config import settings


def _safe_filename(filename: str, fallback: str = "upload") -> str:
    normalized = unicodedata.normalize("NFKD", Path(filename).name)
    ascii_name = normalized.encode("ascii", "ignore").decode("ascii").replace(" ", "_")
    return "".join(char for char in ascii_name if char.isalnum() or char in "._-") or fallback


@lru_cache
def _client() -> Client:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase Storage chua duoc cau hinh",
        )
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def _public_url(bucket: str, storage_path: str) -> str:
    result = _client().storage.from_(bucket).get_public_url(storage_path)
    if isinstance(result, str):
        return result
    return result.get("publicUrl") or result.get("publicURL") or result.get("signedURL") or storage_path


def _strip_public_url(url_or_path: str, bucket: str) -> str:
    marker = f"/storage/v1/object/public/{bucket}/"
    if marker not in url_or_path:
        return url_or_path
    return url_or_path.split(marker, 1)[1].split("?", 1)[0]


async def upload_file_to_storage(
    file: UploadFile,
    folder: str,
    allowed_extensions: set[str],
    max_size: int,
    invalid_message: str,
    size_message: str,
    bucket: str,
    public: bool = False,
) -> tuple[str, str, str]:
    extension = Path(file.filename or "").suffix.lower()
    if extension not in allowed_extensions:
        allowed = ", ".join(sorted(item.lstrip(".") for item in allowed_extensions))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{invalid_message}. Dinh dang cho phep: {allowed}")

    safe_name = _safe_filename(file.filename or f"upload{extension}")
    storage_path = f"{folder.strip('/')}/{uuid4().hex}_{safe_name}"
    size = 0
    chunks: list[bytes] = []

    try:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > max_size:
                raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=size_message)
            chunks.append(chunk)
    finally:
        await file.close()

    content_type = file.content_type or "application/octet-stream"
    try:
        _client().storage.from_(bucket).upload(
            storage_path,
            b"".join(chunks),
            {"content-type": content_type, "upsert": "false"},
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Upload file len Supabase Storage that bai") from exc

    url_or_path = _public_url(bucket, storage_path) if public else storage_path
    return url_or_path, safe_name, extension.lstrip(".")


def delete_storage_file(url_or_path: str | None, bucket: str) -> None:
    if not url_or_path or url_or_path.startswith("/uploads/"):
        return
    storage_path = _strip_public_url(url_or_path, bucket)
    try:
        _client().storage.from_(bucket).remove([storage_path])
    except Exception:
        pass


def create_signed_url(storage_path: str, bucket: str, expires_in: int = 300) -> str:
    if storage_path.startswith("http://") or storage_path.startswith("https://"):
        return storage_path
    result = _client().storage.from_(bucket).create_signed_url(storage_path, expires_in)
    if isinstance(result, str):
        return result
    return result.get("signedURL") or result.get("signedUrl") or result.get("signed_url") or storage_path
