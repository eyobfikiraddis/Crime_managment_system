from __future__ import annotations

import asyncio

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.config.settings import settings

MAX_RETRIES = 30
RETRY_INTERVAL_SECONDS = 2


async def wait_for_db() -> None:
    engine = create_async_engine(settings.DATABASE_URL, pool_pre_ping=True)
    try:
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                async with engine.connect() as conn:
                    await conn.execute(text("SELECT 1"))
                print("Database is ready")
                return
            except Exception as exc:
                print(f"Database not ready ({attempt}/{MAX_RETRIES}): {exc}")
                await asyncio.sleep(RETRY_INTERVAL_SECONDS)

        raise SystemExit("Database readiness check failed")
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(wait_for_db())
