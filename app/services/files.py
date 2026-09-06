from pathlib import Path

from app.core.config import get_settings
from app.core.exceptions import AppError

SIGNATURES: dict[bytes, str] = {
    b"%PDF": "application/pdf",
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG\r\n\x1a\n": "image/png",
    b"II*\x00": "image/tiff",
    b"MM\x00*": "image/tiff",
    b"PK\x03\x04": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

EXECUTABLE_EXTENSIONS = {".exe", ".bat", ".cmd", ".msi", ".dll", ".sh", ".com", ".js", ".vbs"}
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".tif", ".tiff", ".txt", ".docx"}
EXT_TO_MIME = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".tif": "image/tiff",
    ".tiff": "image/tiff",
    ".txt": "text/plain",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


def detect_mime(data: bytes, filename: str, declared: str | None) -> str:
    ext = Path(filename).suffix.lower()
    if ext in EXECUTABLE_EXTENSIONS:
        raise AppError("EXECUTABLE_UPLOAD", "Executable files are not allowed.", 400)
    if ext not in ALLOWED_EXTENSIONS:
        raise AppError("INVALID_EXTENSION", "File extension is not allowed.", 400)
    expected = EXT_TO_MIME[ext]
    settings = get_settings()
    if expected not in settings.allowed_mime_list:
        raise AppError("INVALID_MIME_TYPE", "MIME type is not allowed.", 400)
    if declared and declared.split(";")[0].strip() not in {expected, "application/octet-stream"}:
        if declared.split(";")[0].strip() not in settings.allowed_mime_list:
            raise AppError("INVALID_MIME_TYPE", "Declared MIME type is not allowed.", 400)
    for magic, mime in SIGNATURES.items():
        if data.startswith(magic):
            if mime != expected and not (
                expected.endswith("wordprocessingml.document") and mime.endswith("wordprocessingml.document")
            ):
                raise AppError("INVALID_MIME_TYPE", "File signature does not match extension.", 400)
            return expected
    if expected == "text/plain":
        try:
            data.decode("utf-8")
            return expected
        except UnicodeDecodeError as exc:
            raise AppError("INVALID_MIME_TYPE", "Text file is not valid UTF-8.", 400) from exc
    raise AppError("INVALID_MIME_TYPE", "Unable to verify file signature.", 400)


def enforce_size(data: bytes) -> None:
    settings = get_settings()
    if len(data) > settings.max_upload_bytes:
        raise AppError("FILE_TOO_LARGE", "Uploaded file exceeds the maximum allowed size.", 413)
    if len(data) == 0:
        raise AppError("EMPTY_FILE", "Uploaded file is empty.", 400)
