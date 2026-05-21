from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from jose import JWTError

from app.core import redis_client as redis_ops
from app.core.security import calculate_remaining_seconds, decode_token
from app.modules.auth.exceptions import InvalidTokenError


def decode_and_validate_access_token(token: str) -> dict[str, Any]:
    if not token:
        raise JWTError("Missing token")

    payload = decode_token(token)
    if payload.get("type") != "access":
        raise JWTError("Invalid token type")

    if not payload.get("sub") or not payload.get("jti") or not payload.get("session_id"):
        raise JWTError("Invalid token claims")

    if not payload.get("role"):
        raise JWTError("Invalid token claims")

    if payload.get("exp") is None:
        raise JWTError("Missing exp claim")

    return payload


def decode_and_validate_refresh_token(token: str) -> dict[str, Any]:
    if not token:
        raise JWTError("Missing token")

    payload = decode_token(token)
    if payload.get("type") != "refresh":
        raise JWTError("Invalid token type")

    if not payload.get("sub") or not payload.get("jti") or not payload.get("session_id"):
        raise JWTError("Invalid token claims")

    if payload.get("exp") is None:
        raise JWTError("Missing exp claim")

    return payload


def normalize_exp(payload: dict[str, Any]) -> int | None:
    exp = payload.get("exp")
    if isinstance(exp, int):
        return exp
    if isinstance(exp, float):
        return int(exp)
    if isinstance(exp, datetime):
        return int(exp.replace(tzinfo=timezone.utc).timestamp())
    return None


async def ensure_token_not_revoked(jti: str) -> None:
    if await redis_ops.is_jti_revoked(jti):
        raise InvalidTokenError("Not authenticated")


async def revoke_token_jti(jti: str | None, exp: int | None) -> None:
    if not jti or not exp:
        return
    remaining = calculate_remaining_seconds(exp)
    if remaining > 0:
        await redis_ops.revoke_jti(jti, remaining)
