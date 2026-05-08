# CCMS Backend

Centralized Crime Management System (CCMS) backend built with FastAPI, PostgreSQL, and Redis.

## Prerequisites
- Python 3.12+
- PostgreSQL 14+
- Redis 6+

## Setup
1. Create a virtual environment and install dependencies:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. Configure environment variables:
   - Copy .env.example to .env and update values as needed.
   - Ensure SECRET_KEY is at least 32 characters.
   - Ensure DATABASE_URL uses the asyncpg driver.

3. Run database migrations:
   ```bash
   alembic upgrade head
   ```

4. Start the API:
   ```bash
   uvicorn app.main:app --reload
   ```

## Health Endpoints
- GET /api/v1/health
- GET /api/v1/readiness

## Notes
- Tests were intentionally omitted per request.
- Startup verifies Redis, database connectivity, and required seed data.
