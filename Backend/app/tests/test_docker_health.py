from __future__ import annotations

import pytest


@pytest.mark.asyncio
async def test_health_endpoint(async_client) -> None:
    response = await async_client.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body.get("status") in {"healthy", "degraded"}
    assert "database" in body.get("components", {})
    assert "redis" in body.get("components", {})


@pytest.mark.asyncio
async def test_readiness_endpoint(async_client) -> None:
    response = await async_client.get("/api/v1/readiness")
    assert response.status_code == 200
    body = response.json()
    assert "ready" in body
    assert "checks" in body
    assert "database" in body["checks"]
    assert "redis" in body["checks"]
