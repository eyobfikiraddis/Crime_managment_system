from __future__ import annotations

import pytest


@pytest.mark.asyncio
async def test_logout_revokes_access_token(async_client, test_credentials) -> None:
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
    refresh_token = payload["refresh_token"]

    logout_response = await async_client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"refresh_token": refresh_token},
    )
    assert logout_response.status_code == 200

    ping_response = await async_client.post(
        "/api/v1/auth/activity-ping",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert ping_response.status_code == 401
