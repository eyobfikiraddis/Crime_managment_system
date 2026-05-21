from __future__ import annotations

import json
from typing import Any

import redis.asyncio as aioredis

from app.config.settings import settings

_redis_client: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
        )
    return _redis_client


async def close_redis() -> None:
    global _redis_client
    if _redis_client is not None:
        await _redis_client.aclose()
        _redis_client = None


async def check_redis_health() -> dict[str, object]:
    import time as _time

    start = _time.monotonic()
    try:
        client = await get_redis()
        await client.ping()
        latency_ms = round((_time.monotonic() - start) * 1000, 2)
        return {"status": "healthy", "latency_ms": latency_ms}
    except Exception as exc:
        return {"status": "unhealthy", "error": str(exc)}


# Session Operations

async def write_session_metadata(
    session_id: str,
    officer_id: int,
    ip_address: str,
    user_agent: str,
    ttl: int,
) -> None:
    client = await get_redis()
    import datetime

    now_iso = datetime.datetime.utcnow().isoformat()
    await client.hset(
        f"session:{session_id}",
        mapping={
            "officer_id": str(officer_id),
            "created_at": now_iso,
            "last_activity": now_iso,
            "ip_address": ip_address,
            "user_agent": user_agent,
        },
    )
    await client.expire(f"session:{session_id}", ttl)


async def get_session_metadata(session_id: str) -> dict[str, str] | None:
    client = await get_redis()
    data = await client.hgetall(f"session:{session_id}")
    return data if data else None


async def update_session_last_activity(session_id: str, now_iso: str) -> None:
    client = await get_redis()
    await client.hset(f"session:{session_id}", "last_activity", now_iso)


async def update_session_tokens(
    session_id: str,
    access_jti: str,
    access_exp: int,
    refresh_jti: str,
    refresh_exp: int,
) -> None:
    client = await get_redis()
    await client.hset(
        f"session:{session_id}",
        mapping={
            "access_jti": access_jti,
            "access_exp": str(access_exp),
            "refresh_jti": refresh_jti,
            "refresh_exp": str(refresh_exp),
        },
    )


async def delete_session(session_id: str) -> None:
    client = await get_redis()
    await client.delete(f"session:{session_id}")


# JTI Revocation

async def revoke_jti(jti: str, remaining_seconds: int) -> None:
    client = await get_redis()
    await client.set(f"revoked_jti:{jti}", "1", ex=remaining_seconds)


async def is_jti_revoked(jti: str) -> bool:
    client = await get_redis()
    result = await client.exists(f"revoked_jti:{jti}")
    return bool(result)


# Officer Blocklist

async def block_officer(officer_id: int, ttl: int = 604800) -> None:
    client = await get_redis()
    await client.set(f"blocked_officer:{officer_id}", "1", ex=ttl)


async def is_officer_blocked(officer_id: int) -> bool:
    client = await get_redis()
    result = await client.exists(f"blocked_officer:{officer_id}")
    return bool(result)


# Officer Profile Cache

async def cache_officer_profile(officer_id: int, profile: dict[str, Any]) -> None:
    client = await get_redis()
    await client.set(
        f"officer_profile:{officer_id}",
        json.dumps(profile),
        ex=settings.PERMISSION_CACHE_TTL_SECONDS,
    )


async def get_cached_officer_profile(officer_id: int) -> dict[str, Any] | None:
    client = await get_redis()
    data = await client.get(f"officer_profile:{officer_id}")
    return json.loads(data) if data else None


async def invalidate_officer_profile_cache(officer_id: int) -> None:
    client = await get_redis()
    await client.delete(f"officer_profile:{officer_id}")


# Password Reset Tokens

async def store_password_reset_token(token: str, officer_id: int, ttl: int = 900) -> None:
    client = await get_redis()
    await client.set(f"pwd_reset:{token}", str(officer_id), ex=ttl)


async def get_password_reset_token(token: str) -> int | None:
    client = await get_redis()
    value = await client.get(f"pwd_reset:{token}")
    return int(value) if value else None


async def delete_password_reset_token(token: str) -> None:
    client = await get_redis()
    await client.delete(f"pwd_reset:{token}")


# Officer-to-Session Index

async def add_officer_session(officer_id: int, session_id: str, ttl: int) -> None:
    client = await get_redis()
    await client.sadd(f"officer_sessions:{officer_id}", session_id)
    await client.expire(f"officer_sessions:{officer_id}", ttl)


async def remove_officer_session(officer_id: int, session_id: str) -> None:
    client = await get_redis()
    await client.srem(f"officer_sessions:{officer_id}", session_id)


async def extend_session_ttl(session_id: str, ttl: int) -> None:
    client = await get_redis()
    await client.expire(f"session:{session_id}", ttl)


async def extend_officer_sessions_ttl(officer_id: int, ttl: int) -> None:
    client = await get_redis()
    await client.expire(f"officer_sessions:{officer_id}", ttl)


async def get_officer_sessions(officer_id: int) -> set[str]:
    client = await get_redis()
    members = await client.smembers(f"officer_sessions:{officer_id}")
    return set(members)


async def remove_officer_sessions(officer_id: int) -> None:
    client = await get_redis()
    session_ids = await get_officer_sessions(officer_id)
    if session_ids:
        pipe = client.pipeline()
        for sid in session_ids:
            pipe.delete(f"session:{sid}")
        pipe.delete(f"officer_sessions:{officer_id}")
        await pipe.execute()
