FROM python:3.12-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY src ./src

# Copy alembic configuration if exists
COPY alembic.ini ./ 2>/dev/null || true
COPY alembic ./alembic/ 2>/dev/null || true

# Expose Hugging Face Spaces port
EXPOSE 8001

# Run the FastAPI application
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8001"]