from __future__ import annotations

import re


def normalize_national_id(national_id: str) -> str:
    value = national_id.strip()
    if not value:
        raise ValueError("National ID is required")
    return value


def validate_password_strength(password: str) -> None:
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")
    if not re.search(r"[A-Za-z]", password):
        raise ValueError("Password must contain at least one letter")
    if not re.search(r"\d", password):
        raise ValueError("Password must contain at least one digit")


def validate_refresh_token(token: str) -> str:
    value = token.strip()
    if not value:
        raise ValueError("Refresh token is required")
    return value
