# Implementation Plan: Backend API & Database Layer

**Branch**: `002-backend-api-db` | **Date**: 2026-01-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-backend-api-db/spec.md`

## Summary

Build a FastAPI backend server with JWT authentication middleware and Neon PostgreSQL database to provide 6 REST endpoints for multi-user task management. All endpoints validate JWT tokens from Spec 1 (Better Auth), enforce user_id matching between URL and token, and filter database queries by authenticated user to ensure complete data isolation.

**Technical Approach:**
- FastAPI application with dependency injection for JWT validation
- SQLModel ORM for type-safe database operations with Neon PostgreSQL
- PyJWT library for token verification using shared BETTER_AUTH_SECRET
- Alembic for database migrations with version control
- CORS middleware configured for frontend cookie transmission
- Structured JSON error responses with clear messages

## Technical Context

**Language/Version**: Python 3.11+
**Primary Dependencies**: FastAPI 0.109+, SQLModel 0.0.14+, PyJWT 2.8+, Alembic 1.13+, Uvicorn 0.27+, psycopg2-binary 2.9+
**Storage**: Neon Serverless PostgreSQL with connection pooling
**Testing**: pytest with pytest-asyncio for async endpoint testing, httpx for test client
**Target Platform**: Linux server (containerized deployment)
**Project Type**: Web application backend (REST API)
**Performance Goals**: <500ms response time for queries under 10,000 tasks, handle 50 concurrent requests
**Constraints**: Stateless authentication (JWT only), serverless-friendly (no persistent connections), 100% data isolation between users
**Scale/Scope**: Multi-user application, 6 REST endpoints, 2 database tables (users reference from Spec 1, tasks owned by backend)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Agentic Development Workflow ✅ PASS

- ✅ Specification created via `/sp.specify` (spec.md exists)
- ✅ Implementation plan via `/sp.plan` (this document)
- ✅ Will break plan into tasks with `/sp.tasks`
- ✅ Will implement via fastapi-backend and neon-db-architect agents
- ✅ Will document architectural decisions with `/sp.adr` for:
  - PyJWT vs python-jose library choice
  - Alembic vs manual migration approach
  - Connection pooling configuration for Neon serverless
  - Error response format standardization

### Principle II: Security-First Architecture ✅ PASS

- ✅ JWT validation on every endpoint via dependency injection
- ✅ User ID from JWT must match user ID in URL (403 if mismatch)
- ✅ Database queries filtered by authenticated user ID
- ✅ 401 Unauthorized for missing/invalid tokens
- ✅ 403 Forbidden for user ID mismatch
- ✅ Secrets via environment variables (BETTER_AUTH_SECRET, DATABASE_URL)
- ✅ HTTPS enforced in production (deployment configuration)

### Principle III: RESTful API Design Standards ✅ PASS

- ✅ Resource-based URLs: `/api/{user_id}/tasks/{task_id}`
- ✅ HTTP methods map to CRUD: GET (list/read), POST (create), PUT (update), PATCH (partial update), DELETE (remove)
- ✅ Proper HTTP status codes: 200, 201, 204, 400, 401, 403, 404, 500
- ✅ All 6 required endpoints implemented:
  - `GET /api/{user_id}/tasks` - List all tasks
  - `GET /api/{user_id}/tasks/{task_id}` - Get specific task
  - `POST /api/{user_id}/tasks` - Create task
  - `PUT /api/{user_id}/tasks/{task_id}` - Full update
  - `PATCH /api/{user_id}/tasks/{task_id}` - Partial update (completion status)
  - `DELETE /api/{user_id}/tasks/{task_id}` - Delete task
- ✅ Consistent JSON response format with error details

### Principle IV: Stateless JWT Authentication ✅ PASS

- ✅ JWT tokens issued by Better Auth (Spec 1)
- ✅ Shared BETTER_AUTH_SECRET between frontend and backend
- ✅ JWT payload contains: userId, email, iat, exp
- ✅ Tokens transmitted via `better-auth.session.token` cookie (extracted by backend)
- ✅ Backend verifies token signature using shared secret on every request
- ✅ Token expiry enforced (7-day maximum from Spec 1)
- ✅ 401 with clear error message for failed authentication
- ✅ Token validation flow:
  1. Extract token from cookie
  2. Verify signature with BETTER_AUTH_SECRET
  3. Check expiration timestamp
  4. Decode userId from payload
  5. Validate userId matches URL parameter
  6. Filter database queries by userId

### Principle V: Multi-User Persistent Storage ✅ PASS

- ✅ Neon Serverless PostgreSQL as single source of truth
- ✅ SQLModel ORM for type-safe operations
- ✅ Database schema normalized (3NF minimum):
  - `users` table referenced from Spec 1 (not created by backend)
  - `tasks` table with foreign key to users.id
- ✅ Foreign key relationships enforced via constraints
- ✅ Migrations versioned and reversible (Alembic)
- ✅ Connection pooling configured for serverless environment
- ✅ Indexes on foreign keys (user_id) and primary keys
- ✅ CASCADE delete: when user deleted, tasks deleted
- ✅ NOT NULL constraints on required fields (title, user_id)

**Constitution Compliance**: ALL PRINCIPLES PASS ✅

## Project Structure

### Documentation (this feature)

```text
specs/002-backend-api-db/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0: Architectural decisions documentation
├── data-model.md        # Phase 1: Database schema and SQLModel models
├── quickstart.md        # Phase 1: Setup and testing guide
├── contracts/           # Phase 1: API contract specifications
│   └── tasks-api.yaml   # OpenAPI 3.0 spec for 6 endpoints
└── tasks.md             # Phase 2: NOT created by /sp.plan (created by /sp.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py               # Environment variable configuration
│   ├── database.py             # Database connection and session management
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py            # User SQLModel (reference from Spec 1)
│   │   └── task.py            # Task SQLModel with user relationship
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── task.py            # Pydantic request/response schemas
│   │   └── auth.py            # JWT payload schema
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── jwt.py             # JWT verification utilities
│   │   └── dependencies.py    # FastAPI dependencies for auth
│   ├── api/
│   │   ├── __init__.py
│   │   └── tasks.py           # 6 task endpoint handlers
│   └── errors/
│       ├── __init__.py
│       └── handlers.py        # Custom error response formatting
├── migrations/
│   ├── env.py                 # Alembic environment configuration
│   ├── script.py.mako         # Alembic migration template
│   └── versions/              # Generated migration files
│       └── 001_create_tasks_table.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py            # Pytest fixtures (test DB, auth tokens)
│   ├── test_jwt_middleware.py # Test JWT validation logic
│   ├── test_tasks_endpoints.py # Test all 6 endpoints
│   └── test_user_isolation.py  # Test cross-user data access prevention
├── .env.example               # Environment variable template
├── .env                       # Actual environment (gitignored)
├── alembic.ini                # Alembic configuration
├── requirements.txt           # Python dependencies
└── README.md                  # Backend setup instructions

frontend/
└── [Existing Spec 1 implementation - no changes needed]
```

**Structure Decision**: Web application with separate `backend/` directory. Frontend exists from Spec 1 (authentication layer). Backend provides REST API consumed by frontend. Both share BETTER_AUTH_SECRET for JWT verification.

## Complexity Tracking

**No violations** - all constitution principles pass. No complexity justification needed.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
