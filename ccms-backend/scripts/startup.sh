#!/bin/sh
set -e

python /app/scripts/wait_for_db.py
alembic upgrade head
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
