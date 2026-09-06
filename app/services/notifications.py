import logging
from typing import Protocol

logger = logging.getLogger(__name__)


class NotificationService(Protocol):
    def send(self, to: str, subject: str, body: str) -> None: ...


class LoggingNotificationService:
    def send(self, to: str, subject: str, body: str) -> None:
        logger.info("notification queued to=%s subject=%s", to, subject)


def get_notifications() -> NotificationService:
    return LoggingNotificationService()
