from __future__ import annotations

import os

import httpx
import pytest


@pytest.fixture(scope="session")
def integration_enabled() -> bool:
    return os.getenv("CCMS_INTEGRATION_TESTS", "0") == "1"


@pytest.fixture(scope="session")
def base_url() -> str:
    return os.getenv("CCMS_BASE_URL", "http://localhost:8000")


@pytest.fixture(scope="session")
def test_credentials(integration_enabled: bool) -> dict[str, str]:
    if not integration_enabled:
        pytest.skip("Integration tests disabled. Set CCMS_INTEGRATION_TESTS=1")

    national_id = os.getenv("CCMS_TEST_NATIONAL_ID")
    password = os.getenv("CCMS_TEST_PASSWORD")
    if not national_id or not password:
        pytest.skip("Test credentials not provided via CCMS_TEST_NATIONAL_ID/PASSWORD")

    return {"national_id": national_id, "password": password}


@pytest.fixture
async def async_client(integration_enabled: bool, base_url: str) -> httpx.AsyncClient:
    if not integration_enabled:
        pytest.skip("Integration tests disabled. Set CCMS_INTEGRATION_TESTS=1")

    async with httpx.AsyncClient(base_url=base_url, timeout=10.0) as client:
        yield client
