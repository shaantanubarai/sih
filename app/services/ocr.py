from typing import Protocol

from app.db.models.document import OcrStatus


class OcrEngine(Protocol):
    def extract(self, data: bytes, mime_type: str) -> tuple[str, OcrStatus]: ...


class MockOcrEngine:
    """Mock OCR. Replace with Tesseract or a cloud OCR provider later."""

    def extract(self, data: bytes, mime_type: str) -> tuple[str, OcrStatus]:
        if mime_type == "text/plain":
            try:
                return data.decode("utf-8", errors="ignore")[:50_000], OcrStatus.COMPLETED
            except Exception:
                return "", OcrStatus.FAILED
        snippet = f"[MOCK OCR] Extracted {len(data)} bytes from {mime_type}."
        return snippet, OcrStatus.COMPLETED


def get_ocr() -> OcrEngine:
    return MockOcrEngine()
