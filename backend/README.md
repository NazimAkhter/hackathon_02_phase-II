---
title: Todo Backend API
emoji: 📝
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
license: mit
---

# Todo Backend API

FastAPI backend for multi-user task management with JWT authentication.

## Features

- RESTful API with FastAPI
- JWT-based authentication (Better Auth compatible)
- User signup and signin endpoints
- Task CRUD operations
- User-specific data filtering
- Neon PostgreSQL integration
- Docker deployment ready

## API Documentation

Once deployed, access the interactive API documentation at:

- Swagger UI: `https://[your-space].hf.space/docs`
- ReDoc: `https://[your-space].hf.space/redoc`

## Health Check

GET `/` - Returns server status and configuration

```json
{
  "status": "ok",
  "environment": "production",
  "version": "1.0.0",
  "cors_origins": ["https://your-frontend.vercel.app"],
  "message": "Task Management API is running"
}
```

## Environment Variables

Required environment variables (configure in HF Spaces settings):

- `BETTER_AUTH_SECRET` - JWT signing secret (must match frontend)
- `DATABASE_URL` - PostgreSQL connection string
- `ENVIRONMENT` - Application environment (production)
- `FRONTEND_URL` - Frontend URL for CORS configuration
- `PORT` - Server port (7860 for HF Spaces)

## API Endpoints

### Authentication

- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User authentication

### Tasks

- `GET /api/users/{user_id}/todos` - List user's tasks
- `POST /api/users/{user_id}/todos` - Create new task
- `GET /api/users/{user_id}/todos/{todo_id}` - Get task details
- `PUT /api/users/{user_id}/todos/{todo_id}` - Update task
- `PATCH /api/users/{user_id}/todos/{todo_id}` - Partial update
- `DELETE /api/users/{user_id}/todos/{todo_id}` - Delete task

## Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Run the server
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

## Deployment

This backend is configured for **automatic deployment** on Hugging Face Spaces using Docker SDK via GitHub Actions CI/CD.

**Deployment Status**: ✅ CI/CD Enabled & Security Fixed (2026-02-10)

- **Platform**: Hugging Face Spaces
- **Space**: https://huggingface.co/spaces/NazimBotExpert/todo-app
- **Workflow**: `.github/workflows/deploy-backend.yml`
- **Trigger**: Automatic on push to main with backend changes
- **Security**: Token authentication via credential helper (no token exposure)

**Recent Updates**:
- ✅ Fixed token exposure vulnerability (2026-02-10)
- ✅ Added token validation and verification steps
- ✅ Added performance optimizations (caching, shallow clone)
- ✅ Added comprehensive error handling

See [HF_SPACES_DEPLOYMENT_GUIDE.md](../HF_SPACES_DEPLOYMENT_GUIDE.md) for complete deployment instructions.

## Tech Stack

- **Framework**: FastAPI
- **ORM**: SQLModel
- **Database**: Neon PostgreSQL
- **Authentication**: JWT (Better Auth compatible)
- **Container**: Docker
- **Platform**: Hugging Face Spaces

## Repository

https://github.com/NazimAkhter/hackathon_02_phase-II
