# CCMS Backend

Centralized Crime Management System (CCMS) backend built with FastAPI, PostgreSQL, and Redis.

## Prerequisites
- Python 3.12+
- PostgreSQL 14+
- Redis 6+

## Setup
1. Create a virtual environment and install dependencies:
   ```bash
   sudo apt install python3-venv
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

   If your distribution packages Python differently, make sure the interpreter used for
   `venv` includes `ensurepip` support before creating the environment.

2. Configure environment variables:
   - Copy .env.example to .env and update values as needed.
   - Ensure SECRET_KEY is at least 32 characters.
   - Ensure DATABASE_URL uses the asyncpg driver.

3. Run database migrations:
   ```bash
   alembic upgrade head
   ```

   Alembic is the migration tool used by this backend. A migration is a tracked database
   schema change, such as creating a table or adding a column. The word `head` means
   "the latest migration in the repository". So `alembic upgrade head` tells Alembic to
   apply every pending migration until the database matches the newest schema version.

4. Start the API:
   ```bash
   uvicorn app.main:app --reload
   ```

## Docker Setup
The Docker workflow is already wired to run migrations automatically when the backend
container starts.

1. Make sure your `.env` file exists and points `DATABASE_URL` at the Postgres service
   inside Compose, not at `localhost`.
   - Inside Docker Compose, the database host should be `postgres`.
   - Redis should usually be `redis`.

2. Build and start the stack:
   ```bash
   docker compose --profile dev up --build
   ```

3. What happens during startup:
   - `postgres` starts first and becomes healthy.
   - `redis` starts and becomes healthy.
   - `backend` waits for both services.
   - `scripts/startup.sh` runs `alembic upgrade head` inside the container.
   - Uvicorn starts the API on port `8000`.

4. Open the API:
   - API health: `http://localhost:8000/api/v1/health`
   - Swagger docs: `http://localhost:8000/docs`

5. If you only want to run migrations in Docker, use:
   ```bash
   docker compose run --rm backend alembic upgrade head
   ```

## Troubleshooting
- If pip says it cannot find pydantic, upgrade pip first and try again:
   python3 -m pip install --upgrade pip setuptools wheel
- If your system uses a restricted or broken package mirror, install from PyPI directly:
   python3 -m pip install -i https://pypi.org/simple -r requirements.txt
- If you are using Docker, prefer the Compose workflow above. The image installs the
   Python packages during build and runs alembic upgrade head on container startup.

## Health Endpoints
- GET /api/v1/health
- GET /api/v1/readiness

## Notes
- Tests were intentionally omitted per request.
- Startup verifies Redis, database connectivity, and required seed data.
