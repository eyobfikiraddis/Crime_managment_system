from __future__ import annotations

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config.settings import settings


def get_ip_key(request: Request) -> str:
    return get_remote_address(request)


def get_national_id_key(request: Request) -> str:
    return "global"


limiter = Limiter(
    key_func=get_ip_key,
    default_limits=["200/minute"],
    storage_uri=settings.REDIS_URL,
)

RATE_LIMITS = {
    "login_ip": "10/minute",
    "login_national_id": "5/15minutes",
    "password_reset_request": "3/hour",
    "password_reset_confirm": "5/15minutes",
    "activity_ping": "60/minute",
    "default": "200/minute",
}
