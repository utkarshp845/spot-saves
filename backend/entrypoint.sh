#!/bin/sh

echo "Starting SpotSave backend..."

# Create data directory if it doesn't exist
mkdir -p /app/data
chmod 777 /app/data

# Initialize database - fail fast if there are issues
echo "Checking database..."
if ! python -c "from app.database import init_db; init_db()" 2>&1; then
    echo "ERROR: Database initialization failed!"
    exit 1
fi

# Run database migrations if needed
if ! python -c "from app.database import check_migrations; check_migrations()" 2>&1; then
    echo "ERROR: Database migrations failed!"
    exit 1
fi

echo "Starting FastAPI server..."
# Use exec to replace shell process, but catch any startup errors
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --log-level info

