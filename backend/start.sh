#!/bin/bash
set -e

echo "Starting Todo Backend API..."
echo "Environment: $ENVIRONMENT"

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

# Check migration status
echo "Migration status:"
alembic current

# Start the FastAPI application
echo "Starting FastAPI server on port 7860..."
exec uvicorn src.main:app --host 0.0.0.0 --port 7860
