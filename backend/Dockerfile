FROM python:3.12-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY src ./src

# Copy migrations directory and alembic configuration
COPY migrations ./migrations/
COPY alembic.ini .

# Copy startup script and make it executable
COPY start.sh .
RUN chmod +x start.sh

# Expose Hugging Face Spaces port (HF Spaces standard port)
EXPOSE 7860

# Run migrations and start the FastAPI application
CMD ["./start.sh"]