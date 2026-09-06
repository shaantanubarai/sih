from typing import Protocol

from app.db.models.document import VirusScanStatus


class AntivirusScanner(Protocol):
    def scan(self, data: bytes, filename: str) -> VirusScanStatus: ...


class MockAntivirusScanner:
    """Placeholder scanner for the MVP. Replace with ClamAV client in production."""

    def scan(self, data: bytes, filename: str) -> VirusScanStatus:
        lowered = filename.lower()
        if lowered.endswith((".exe", ".bat", ".cmd", ".msi", ".dll", ".sh")):
            return VirusScanStatus.INFECTED
        if b"EICAR-STANDARD-ANTIVIRUS-TEST-FILE" in data:
            return VirusScanStatus.INFECTED
        return VirusScanStatus.CLEAN


def get_antivirus() -> AntivirusScanner:
    return MockAntivirusScanner()
