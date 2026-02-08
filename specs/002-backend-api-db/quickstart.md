# Quick Start Guide: Backend API & Database Layer

**Feature**: Backend API & Database Layer
**Branch**: `002-backend-api-db`
**Date**: 2026-01-19

## Overview

This guide provides step-by-step instructions to set up, run, and test the FastAPI backend server with Neon PostgreSQL database integration.

## Prerequisites

- Python 3.11+ installed
- Neon PostgreSQL database provisioned (get connection string from Neon console)
- Spec 1 frontend running (for JWT token generation)
- BETTER_AUTH_SECRET from Spec 1 (must be identical in frontend and backend)

---

## Step 1: Environment Setup

### 1.1 Clone Repository and Navigate to Backend

```bash
cd backend/
```

### 1.2 Create Python Virtual Environment

```bash
# Create virtual environment
python3.11 -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### 1.3 Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**requirements.txt**:
```text
fastapi==0.109.0
sqlmodel==0.0.14
pyjwt==2.8.0
alembic==1.13.1
uvicorn[standard]==0.27.0
psycopg2-binary==2.9.9
python-dotenv==1.0.0
pydantic==2.5.0
pydantic-settings==2.1.0

# Dev dependencies
pytest==8.0.0
pytest-asyncio==0.23.3
httpx==0.26.0
```

---

## Step 2: Database Configuration

### 2.1 Get Neon PostgreSQL Connection String

1. Log in to [Neon Console](https://console.neon.tech)
2. Select your project
3. Navigate to "Connection Details"
4. Copy the connection string (format: `postgresql://user:password@host/database?sslmode=require`)

### 2.2 Create Environment File

Create `.env` in `backend/` directory:

```bash
# Copy template
cp .env.example .env

# Edit .env with your values
```

**.env** (actual file - gitignored):
```bash
# CRITICAL: Must be IDENTICAL to frontend BETTER_AUTH_SECRET
BETTER_AUTH_SECRET=YMUQqkzlCJ0cCGRWx5lWKB081cETI/yqIwuixAMY9qbRGR+vXlXsgTy4Sx5oj7H41BynG1pI6NzzgjdFWhqpDQ==

# Neon PostgreSQL connection string
DATABASE_URL=postgresql://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require

# Environment
ENVIRONMENT=development

# Frontend origin for CORS
FRONTEND_URL=http://localhost:3000
```

**.env.example** (template - committed to git):
```bash
# CRITICAL: Copy from frontend .env.local
# Frontend and backend MUST use the same secret for JWT verification
BETTER_AUTH_SECRET=your-secret-from-frontend-here

# Get from Neon Console: https://console.neon.tech
DATABASE_URL=postgresql://username:password@host/database?sslmode=require

# development, staging, or production
ENVIRONMENT=development

# Frontend URL for CORS (localhost:3000 in dev, production domain in prod)
FRONTEND_URL=http://localhost:3000
```

### 2.3 Verify Database Connection

Test database connectivity:

```bash
python -c "
from sqlmodel import create_engine
from dotenv import load_dotenv
import os

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')

try:
    engine = create_engine(DATABASE_URL, echo=True)
    with engine.connect() as conn:
        print('✅ Database connection successful!')
except Exception as e:
    print(f'❌ Database connection failed: {e}')
"
```

---

## Step 3: Database Migration

### 3.1 Initialize Alembic (First Time Only)

```bash
# Already done in repository, skip if alembic.ini exists
alembic init migrations
```

### 3.2 Run Migration to Create Tasks Table

```bash
# Apply all migrations
alembic upgrade head
```

**Expected Output**:
```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> 001, Create tasks table
```

### 3.3 Verify Table Creation

```bash
# Connect to database and check tables
python -c "
from sqlmodel import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(text('SELECT tablename FROM pg_tables WHERE schemaname = \\'public\\''))
    tables = [row[0] for row in result]
    print('📋 Tables:', tables)
    if 'tasks' in tables:
        print('✅ Tasks table created successfully!')
    else:
        print('❌ Tasks table not found!')
"
```

---

## Step 4: Start Backend Server

### 4.1 Run Development Server

```bash
# Start Uvicorn server with auto-reload
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output**:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using StatReload
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### 4.2 Verify Server is Running

Open browser or use curl:

```bash
# Health check endpoint
curl http://localhost:8000/

# Expected response:
# {"message": "Todo API is running"}
```

### 4.3 Access API Documentation

FastAPI provides automatic interactive documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

---

## Step 5: Testing with Frontend JWT Tokens

### 5.1 Get JWT Token from Frontend

1. Start Spec 1 frontend: `cd frontend && npm run dev`
2. Navigate to http://localhost:3000/signup
3. Create test account:
   - Email: `test@example.com`
   - Password: `password123`
4. Open Browser DevTools → Application → Cookies
5. Find `better-auth.session.token` cookie
6. Copy the JWT token value

### 5.2 Test Backend Endpoints with Token

**Using curl (extract token from cookie)**:

```bash
# List all tasks (should return empty array for new user)
curl -X GET \
  'http://localhost:8000/api/550e8400-e29b-41d4-a716-446655440000/tasks' \
  -H 'Cookie: better-auth.session.token=YOUR_JWT_TOKEN_HERE' \
  -H 'Content-Type: application/json'

# Expected response:
# []

# Create a task
curl -X POST \
  'http://localhost:8000/api/550e8400-e29b-41d4-a716-446655440000/tasks' \
  -H 'Cookie: better-auth.session.token=YOUR_JWT_TOKEN_HERE' \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Buy groceries",
    "completed": false
  }'

# Expected response (201 Created):
# {
#   "id": 1,
#   "user_id": "550e8400-e29b-41d4-a716-446655440000",
#   "title": "Buy groceries",
#   "completed": false,
#   "created_at": "2026-01-19T10:00:00Z",
#   "updated_at": "2026-01-19T10:00:00Z"
# }
```

**Using Swagger UI (http://localhost:8000/docs)**:

1. Click "Authorize" button at top right
2. Enter JWT token in "cookieAuth" field
3. Click "Authorize" then "Close"
4. Expand any endpoint (e.g., GET /api/{user_id}/tasks)
5. Click "Try it out"
6. Enter user_id (UUID from JWT token)
7. Click "Execute"
8. View response below

---

## Step 6: Testing User Isolation

### 6.1 Create Second User

1. Sign out from first account in frontend
2. Create second account with different email
3. Get new JWT token from cookies
4. Note the different user_id in token

### 6.2 Verify Cross-User Access is Blocked

```bash
# User 1 creates a task (save task_id from response)
# User 1's JWT token and user_id

# User 2 tries to access User 1's task (should return 404)
curl -X GET \
  'http://localhost:8000/api/USER1_ID/tasks/1' \
  -H 'Cookie: better-auth.session.token=USER2_JWT_TOKEN' \
  -H 'Content-Type: application/json'

# Expected response (404 Not Found):
# {
#   "error": "Task not found",
#   "code": "ERR_NOT_FOUND"
# }

# User 2 tries to use User 1's user_id in URL (should return 403)
curl -X GET \
  'http://localhost:8000/api/USER1_ID/tasks' \
  -H 'Cookie: better-auth.session.token=USER2_JWT_TOKEN' \
  -H 'Content-Type: application/json'

# Expected response (403 Forbidden):
# {
#   "error": "Access forbidden - user ID mismatch",
#   "code": "ERR_FORBIDDEN"
# }
```

---

## Step 7: Testing Error Scenarios

### 7.1 Test Missing JWT Token (401)

```bash
curl -X GET \
  'http://localhost:8000/api/550e8400-e29b-41d4-a716-446655440000/tasks' \
  -H 'Content-Type: application/json'

# Expected response (401 Unauthorized):
# {
#   "error": "Missing authentication token",
#   "code": "ERR_UNAUTHORIZED"
# }
```

### 7.2 Test Validation Errors (400)

```bash
# Create task without required title field
curl -X POST \
  'http://localhost:8000/api/550e8400-e29b-41d4-a716-446655440000/tasks' \
  -H 'Cookie: better-auth.session.token=YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "completed": false
  }'

# Expected response (400 Bad Request):
# {
#   "error": "Validation failed",
#   "code": "ERR_VALIDATION_FAILED",
#   "details": {
#     "field": "title",
#     "constraint": "required"
#   }
# }
```

### 7.3 Test Task Not Found (404)

```bash
# Try to get non-existent task
curl -X GET \
  'http://localhost:8000/api/550e8400-e29b-41d4-a716-446655440000/tasks/99999' \
  -H 'Cookie: better-auth.session.token=YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json'

# Expected response (404 Not Found):
# {
#   "error": "Task not found",
#   "code": "ERR_NOT_FOUND"
# }
```

---

## Step 8: Running Automated Tests

### 8.1 Set Up Test Database

```bash
# Create separate test database in Neon or use local PostgreSQL
# Add to .env:
TEST_DATABASE_URL=postgresql://username:password@host/test_database?sslmode=require
```

### 8.2 Run Test Suite

```bash
# Run all tests
pytest tests/ -v

# Run specific test file
pytest tests/test_tasks_endpoints.py -v

# Run with coverage
pytest tests/ --cov=src --cov-report=html
```

**Expected Test Output**:
```
tests/test_jwt_middleware.py::test_valid_jwt_token PASSED
tests/test_jwt_middleware.py::test_expired_jwt_token PASSED
tests/test_jwt_middleware.py::test_invalid_jwt_signature PASSED
tests/test_tasks_endpoints.py::test_list_tasks_empty PASSED
tests/test_tasks_endpoints.py::test_create_task PASSED
tests/test_tasks_endpoints.py::test_update_task PASSED
tests/test_tasks_endpoints.py::test_patch_task_completion PASSED
tests/test_tasks_endpoints.py::test_delete_task PASSED
tests/test_user_isolation.py::test_cross_user_access_denied PASSED
tests/test_user_isolation.py::test_user_id_mismatch_forbidden PASSED

========================= 10 passed in 2.45s =========================
```

---

## Step 9: Troubleshooting

### Issue: "Database connection failed"

**Solution**:
- Verify DATABASE_URL in `.env` is correct
- Check Neon console for database status
- Ensure `sslmode=require` is in connection string
- Test connection with `psql` CLI tool

### Issue: "Invalid token signature" (401)

**Solution**:
- Verify BETTER_AUTH_SECRET is IDENTICAL in frontend and backend `.env` files
- No extra spaces or line breaks in secret
- Regenerate token in frontend if secret was changed

### Issue: "User ID mismatch" (403)

**Solution**:
- Extract `userId` from JWT payload (decode at jwt.io)
- Use that exact userId in URL path
- Ensure URL parameter matches JWT payload

### Issue: "Task not found" when it exists

**Solution**:
- Verify task belongs to authenticated user
- Check task_id is correct
- Ensure user_id in URL matches task owner

### Issue: CORS errors in browser

**Solution**:
- Verify FRONTEND_URL in backend `.env` matches actual frontend URL
- Check CORS middleware is configured with `allow_credentials=True`
- Ensure frontend is making requests to correct backend URL

---

## Step 10: Production Deployment

### 10.1 Environment Variables for Production

```bash
# .env (production)
BETTER_AUTH_SECRET=<same-as-frontend-production>
DATABASE_URL=<neon-production-connection-string>
ENVIRONMENT=production
FRONTEND_URL=https://yourdomain.com
```

### 10.2 Run Production Server

```bash
# Use gunicorn with uvicorn workers
gunicorn src.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 120
```

### 10.3 Docker Deployment (Optional)

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
# Build and run
docker build -t backend-api .
docker run -p 8000:8000 --env-file .env backend-api
```

---

## Quick Reference

**Start Backend**:
```bash
uvicorn src.main:app --reload --port 8000
```

**Run Migrations**:
```bash
alembic upgrade head
```

**Run Tests**:
```bash
pytest tests/ -v
```

**Generate Migration (after model changes)**:
```bash
alembic revision --autogenerate -m "Description of change"
alembic upgrade head
```

**Rollback Migration**:
```bash
alembic downgrade -1
```

**Check Current Migration Version**:
```bash
alembic current
```

---

## Next Steps

1. Integrate frontend with backend API endpoints
2. Implement additional endpoints as needed
3. Add monitoring and logging (Sentry, Datadog)
4. Set up CI/CD pipeline for automated testing
5. Configure production database backups
6. Implement rate limiting for production
7. Add health check endpoints for load balancers
8. Set up SSL/TLS certificates for HTTPS

---

## Support

For issues or questions:
- Check [troubleshooting section](#step-9-troubleshooting)
- Review API documentation at `/docs`
- Check backend logs for detailed error messages
- Verify environment variables are correctly configured
