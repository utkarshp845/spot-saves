#!/bin/sh
set -e

echo "Starting SpotSave backend..."

# Wait for database to be ready
if [ ! -f "/app/data/spotsave.db" ]; then
    echo "Initializing database..."
    python -c "from app.database import init_db; init_db()"
fi

# Run database migrations if needed
python -c "from app.database import check_migrations; check_migrations()"

echo "Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000

