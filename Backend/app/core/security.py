from __future__ import annotations

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config.settings import settings

ALGORITHM = "HS256"

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=settings.BCRYPT_ROUNDS,
)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def needs_rehash(hashed_password: str) -> bool:
    return pwd_context.needs_update(hashed_password)


def rehash_password(plain_password: str) -> str:
    return hash_password(plain_password)


def hash_national_id(national_id: str) -> str:
    return hashlib.sha256(national_id.encode()).hexdigest()


def generate_secure_token() -> str:
    return secrets.token_urlsafe(32)


def create_access_token(
    officer_id: int,
    role_name: str,
    department_id: int | None,
    session_id: str,
) -> tuple[str, str, int]:
    jti = str(uuid.uuid4())
    now = datetime.now(tz=timezone.utc)
    exp = now + timedelta(seconds=settings.ACCESS_TOKEN_TTL_SECONDS)
    exp_ts = int(exp.timestamp())
    iat_ts = int(now.timestamp())

    payload: dict[str, Any] = {
        "sub": str(officer_id),
        "role": role_name,
        "department_id": department_id,
        "session_id": session_id,
        "exp": exp_ts,
        "iat": iat_ts,
        "jti": jti,
        "type": "access",
        "kid": settings.SECRET_KEY_ID,
    }

    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)
    return token, jti, exp_ts


def create_refresh_token(
    officer_id: int,
    session_id: str,
) -> tuple[str, str, int]:
    jti = str(uuid.uuid4())
    now = datetime.now(tz=timezone.utc)
    exp = now + timedelta(seconds=settings.MAX_SESSION_SECONDS)
    exp_ts = int(exp.timestamp())
    iat_ts = int(now.timestamp())

    payload: dict[str, Any] = {
        "sub": str(officer_id),
        "type": "refresh",
        "session_id": session_id,
        "exp": exp_ts,
        "iat": iat_ts,
        "jti": jti,
        "kid": settings.SECRET_KEY_ID,
    }

    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)
    return token, jti, exp_ts


def decode_token(token: str, verify_expiry: bool = True) -> dict[str, Any]:
    keys_to_try: list[tuple[str, str]] = [
        (settings.SECRET_KEY_ID, settings.SECRET_KEY)
    ]
    for prev in settings.PREVIOUS_SECRET_KEYS:
        keys_to_try.append((prev["id"], prev["key"]))

    options: dict[str, Any] = {}
    if not verify_expiry:
        options["verify_exp"] = False

    last_error: Exception | None = None
    for _kid, key in keys_to_try:
        try:
            payload = jwt.decode(token, key, algorithms=[ALGORITHM], options=options)
            return payload
        except JWTError as exc:
            last_error = exc
            continue

    raise last_error or JWTError("Token decode failed with all known keys")


def calculate_remaining_seconds(exp: int) -> int:
    now = datetime.now(tz=timezone.utc)
    exp_dt = datetime.fromtimestamp(exp, tz=timezone.utc)
    delta = (exp_dt - now).total_seconds()
    return max(0, int(delta))
