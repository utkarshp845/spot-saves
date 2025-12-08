#!/bin/sh

echo "Starting SpotSave backend..."

# Create data directory if it doesn't exist
mkdir -p /app/data
chmod 777 /app/data

# Initialize database (don't fail if it already exists)
echo "Checking database..."
python -c "from app.database import init_db; init_db()" 2>&1 || echo "Database initialization had issues, but continuing..."

# Run database migrations if needed
python -c "from app.database import check_migrations; check_migrations()" 2>&1 || echo "Migrations check had issues, but continuing..."

echo "Starting FastAPI server..."
# Use exec to replace shell process, but catch any startup errors
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --log-level info

