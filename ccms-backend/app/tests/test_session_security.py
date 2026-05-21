from __future__ import annotations

from datetime import datetime, timedelta, timezone
import os

import pytest
import redis.asyncio as aioredis


@pytest.mark.asyncio
async def test_idle_timeout_revokes_session(async_client, test_credentials) -> None:
    login_response = await async_client.post(
        "/api/v1/auth/login",
        json={
            "national_id": test_credentials["national_id"],
            "password": test_credentials["password"],
        },
    )
    assert login_response.status_code == 200
    payload = login_response.json()

    access_token = payload["access_token"]
    session_id = payload["session_id"]

    redis_url = os.getenv("CCMS_REDIS_URL") or os.getenv("REDIS_URL", "redis://localhost:6379/0")
    client: aioredis.Redis | None = None
    try:
        client = aioredis.from_url(redis_url, decode_responses=True)
        old_activity = datetime.now(tz=timezone.utc) - timedelta(hours=2)
        await client.hset(f"session:{session_id}", "last_activity", old_activity.isoformat())
    except Exception:
        pytest.skip("Redis not reachable for idle-timeout test")
    finally:
        if client is not None:
            await client.aclose()

    ping_response = await async_client.post(
        "/api/v1/auth/activity-ping",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert ping_response.status_code == 401
