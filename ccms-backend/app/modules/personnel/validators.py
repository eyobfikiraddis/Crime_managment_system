from __future__ import annotations

import re
from datetime import date, datetime, timezone


def validate_past_date(value: date | None) -> date | None:
    if value is None:
        return None
    today = datetime.now(tz=timezone.utc).date()
    if value >= today:
        raise ValueError("Date of birth must be a past date")
    return value


def validate_phone_format(value: str | None) -> str | None:
    if value is None:
        return None
    e164_pattern = re.compile(r"^\+[1-9]\d{1,14}$")
    if not e164_pattern.match(value):
        raise ValueError("Phone number must be in E.164 format (e.g. +251911234567)")
    return value


def validate_password_complexity(password: str) -> str:
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters")
    return password


PRIVILEGED_ROLE_NAMES = {"admin", "superadmin"}
