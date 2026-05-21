from dataclasses import dataclass

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.entities import SystemSetting


@dataclass(frozen=True)
class SettingDefinition:
    value: str
    value_type: str
    description: str


SYSTEM_SETTING_DEFINITIONS: dict[str, SettingDefinition] = {
    "max_video_size_mb": SettingDefinition("100", "int", "Dung luong video toi da (MB)"),
    "max_document_size_mb": SettingDefinition("20", "int", "Dung luong tai lieu toi da (MB)"),
    "max_thumbnail_size_mb": SettingDefinition("5", "int", "Dung luong anh khoa hoc toi da (MB)"),
    "max_verification_file_size_mb": SettingDefinition("10", "int", "Dung luong file xac minh toi da (MB)"),
    "allowed_video_extensions": SettingDefinition("mp4,webm,mov", "csv", "Dinh dang video cho phep"),
    "allowed_document_extensions": SettingDefinition("pdf,doc,docx,ppt,pptx", "csv", "Dinh dang tai lieu cho phep"),
    "allowed_thumbnail_extensions": SettingDefinition("jpg,jpeg,png,webp", "csv", "Dinh dang anh khoa hoc cho phep"),
    "allowed_verification_extensions": SettingDefinition("pdf,jpg,jpeg,png", "csv", "Dinh dang file xac minh cho phep"),
}


def ensure_system_settings(db: Session) -> None:
    existing = set(db.scalars(select(SystemSetting.key)).all())
    for key, definition in SYSTEM_SETTING_DEFINITIONS.items():
        if key not in existing:
            db.add(
                SystemSetting(
                    key=key,
                    value=definition.value,
                    value_type=definition.value_type,
                    description=definition.description,
                )
            )
    db.flush()


def validate_setting_value(key: str, value: str, value_type: str) -> str:
    cleaned = str(value).strip()
    if value_type == "int":
        try:
            parsed = int(cleaned)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"{key} phai la so nguyen") from exc
        if key.startswith("max_") and parsed <= 0:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"{key} phai lon hon 0")
        return str(parsed)
    if value_type == "float":
        try:
            parsed = float(cleaned)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"{key} phai la so") from exc
        return str(parsed)
    if value_type == "bool":
        lowered = cleaned.lower()
        if lowered not in {"true", "false", "1", "0"}:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"{key} phai la true/false")
        return "true" if lowered in {"true", "1"} else "false"
    if value_type == "csv":
        items = [item.strip().lower().lstrip(".") for item in cleaned.split(",") if item.strip()]
        if not items:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"{key} khong duoc rong")
        if any(any(char.isspace() for char in item) for item in items):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"{key} co dinh dang khong hop le")
        return ",".join(dict.fromkeys(items))
    if not cleaned:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"{key} khong duoc rong")
    return cleaned


def get_setting(db: Session, key: str) -> SystemSetting | None:
    return db.scalar(select(SystemSetting).where(SystemSetting.key == key))


def get_int_setting(db: Session, key: str) -> int:
    setting = get_setting(db, key)
    default = SYSTEM_SETTING_DEFINITIONS[key].value
    value = setting.value if setting else default
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        parsed = int(default)
    return parsed if parsed > 0 else int(default)


def get_extensions_setting(db: Session, key: str) -> set[str]:
    setting = get_setting(db, key)
    raw_value = setting.value if setting else SYSTEM_SETTING_DEFINITIONS[key].value
    extensions = {f".{item.strip().lower().lstrip('.')}" for item in raw_value.split(",") if item.strip()}
    if extensions:
        return extensions
    return {f".{item.strip()}" for item in SYSTEM_SETTING_DEFINITIONS[key].value.split(",")}
