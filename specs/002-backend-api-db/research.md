# Research & Architectural Decisions: Backend API & Database Layer

**Feature**: Backend API & Database Layer
**Branch**: `002-backend-api-db`
**Date**: 2026-01-19

## Overview

This document captures architectural decisions made during the planning phase for the backend API implementation. Each decision includes rationale, alternatives considered, and implications for implementation.

## Decision 1: JWT Library Selection - PyJWT vs python-jose

**Decision**: Use **PyJWT** for JWT token verification

**Context**: Backend needs to verify JWT tokens issued by Better Auth (Spec 1 frontend). Two primary Python JWT libraries exist: PyJWT and python-jose.

**Options Considered**:

| Library | Pros | Cons |
|---------|------|------|
| PyJWT | Lightweight, widely adopted, simple API, actively maintained, supports HS256 | Fewer features than python-jose |
| python-jose | Feature-rich, supports multiple algorithms, includes cryptography extras | Heavier dependency, more complex API, less active maintenance |

**Rationale**:
- Spec 1 uses Better Auth which generates simple HS256 JWT tokens
- No need for advanced features like JWE (encrypted tokens) or multiple algorithm support
- PyJWT is sufficient for HS256 signature verification
- Simpler API reduces implementation complexity
- Smaller dependency footprint for serverless deployment

**Implementation**:
```python
import jwt
from fastapi import HTTPException

def verify_jwt_token(token: str, secret: str) -> dict:
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

**Dependencies**: `PyJWT==2.8.0`

---

## Decision 2: Database Migration Strategy - Alembic vs Manual

**Decision**: Use **Alembic** for database migrations

**Context**: Need a reliable way to create, version, and rollback database schema changes as the application evolves.

**Options Considered**:

| Approach | Pros | Cons |
|----------|------|------|
| Alembic | Industry standard, version control, auto-generation from SQLModel, rollback support, team-friendly | Requires initial setup, learning curve |
| Manual SQL | Simple for initial schema, direct control | No version history, error-prone, difficult to collaborate, no rollback |
| SQLModel .create_all() | Easiest setup, works with SQLModel | No migrations, no rollback, breaks on schema changes |

**Rationale**:
- Application will evolve - need migration versioning for production deployments
- Alembic integrates seamlessly with SQLModel
- Auto-generation reduces manual SQL writing errors
- Rollback capability critical for production safety
- Version control enables team collaboration and deployment history

**Implementation**:
```bash
# Initialize Alembic
alembic init migrations

# Generate migration from SQLModel changes
alembic revision --autogenerate -m "Create tasks table"

# Apply migration
alembic upgrade head

# Rollback if needed
alembic downgrade -1
```

**Dependencies**: `alembic==1.13.1`

**Migration Structure**:
```
migrations/
├── env.py                    # Alembic environment config
├── script.py.mako            # Migration template
└── versions/
    └── 001_create_tasks_table.py  # Auto-generated migration
```

---

## Decision 3: Error Response Format - Custom vs FastAPI Default

**Decision**: Use **custom structured JSON** error format

**Context**: Need consistent error responses across all endpoints for frontend consumption. FastAPI provides default error responses, but they lack standardization for our use case.

**Options Considered**:

| Format | Example | Pros | Cons |
|--------|---------|------|------|
| FastAPI Default | `{"detail": "Error message"}` | Built-in, no code needed | Inconsistent structure, limited info |
| Custom Structured | `{"error": "message", "code": "ERR_CODE", "field": "title"}` | Consistent, machine-readable codes, field-level errors | Requires custom exception handler |

**Rationale**:
- Frontend needs to display field-specific validation errors (e.g., "title is required")
- Machine-readable error codes enable frontend internationalization
- Consistent structure simplifies error handling in frontend
- Spec requires "descriptive error messages" (FR-017) - custom format supports this

**Implementation**:

**Error Response Structure**:
```json
{
  "error": "Human-readable error message",
  "code": "ERR_VALIDATION_FAILED",
  "details": {
    "field": "title",
    "constraint": "required"
  }
}
```

**Custom Exception Handler**:
```python
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI()

@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=400,
        content={
            "error": "Validation failed",
            "code": "ERR_VALIDATION_FAILED",
            "details": exc.errors()
        }
    )
```

**Error Codes**:
- `ERR_UNAUTHORIZED`: Missing or invalid JWT token (401)
- `ERR_FORBIDDEN`: User ID mismatch (403)
- `ERR_NOT_FOUND`: Task does not exist (404)
- `ERR_VALIDATION_FAILED`: Request body validation error (400)
- `ERR_DATABASE_ERROR`: Database connection or query error (500)

---

## Decision 4: Connection Pooling Configuration for Neon Serverless

**Decision**: Use **SQLAlchemy connection pooling with NullPool for serverless**

**Context**: Neon PostgreSQL is serverless and auto-scales connections. Traditional connection pooling can cause issues with serverless databases that dynamically manage connections.

**Options Considered**:

| Pool Strategy | Behavior | Pros | Cons |
|---------------|----------|------|------|
| QueuePool (default) | Maintains persistent connection pool | Good for traditional servers | Conflicts with Neon's connection scaling, wastes resources |
| NullPool | Creates new connection per request, closes immediately | Aligns with serverless model, no resource waste | Slightly higher latency per request |
| StaticPool | Single persistent connection shared across requests | Lowest latency | Not thread-safe, breaks with concurrent requests |

**Rationale**:
- Neon serverless already handles connection pooling at infrastructure level
- Application-level pooling duplicates work and can cause connection leaks
- NullPool ensures clean connection lifecycle per request
- Serverless deployment (AWS Lambda, Cloud Run) benefits from stateless connection management
- Latency impact negligible (<10ms) compared to query execution time

**Implementation**:
```python
from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool
from sqlmodel import Session

DATABASE_URL = "postgresql://user:pass@neon-host/db?sslmode=require"

engine = create_engine(
    DATABASE_URL,
    poolclass=NullPool,  # No connection pooling
    echo=False,          # Disable SQL logging in production
    connect_args={
        "sslmode": "require",
        "connect_timeout": 10,
    }
)

def get_session():
    with Session(engine) as session:
        yield session
```

**Configuration**:
- SSL required for Neon connections (`sslmode=require`)
- 10-second connection timeout to fail fast
- No connection recycling needed (NullPool handles)

---

## Decision 5: CORS Middleware Configuration

**Decision**: Configure **CORS middleware with credentials support** for frontend cookie transmission

**Context**: Frontend (localhost:3000 in dev, production domain) needs to send `better-auth.session.token` cookie to backend. Browsers block cross-origin cookie transmission unless CORS is configured correctly.

**Implementation**:
```python
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS configuration for cookie-based auth
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Development frontend
        "https://yourdomain.com",  # Production frontend
    ],
    allow_credentials=True,  # CRITICAL for cookies
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["*"],
)
```

**Critical Settings**:
- `allow_credentials=True`: **REQUIRED** for browsers to send httpOnly cookies cross-origin
- `allow_origins`: Explicit list (never use `["*"]` with credentials)
- Matches Spec 1 frontend domain configuration

**Security**:
- Never combine `allow_credentials=True` with `allow_origins=["*"]` (browser security violation)
- Use environment variables for allowed origins to support dev/staging/prod

---

## Decision 6: Task ID Format - Auto-Increment Integer vs UUID

**Decision**: Use **auto-increment integer** for task_id

**Context**: Need unique identifier for tasks. Two common approaches: auto-increment integers vs UUIDs.

**Options Considered**:

| ID Type | Example | Pros | Cons |
|---------|---------|------|------|
| Auto-Increment Integer | `1, 2, 3...` | Compact, URL-friendly, faster indexing, sequential | Predictable, reveals task count |
| UUID | `550e8400-e29b-41d4-a716-446655440000` | Globally unique, unpredictable | Larger storage (16 bytes vs 4 bytes), slower indexing |

**Rationale**:
- Tasks are scoped to user - uniqueness only required within user's tasks
- User isolation enforced by JWT middleware (user can't guess other users' task IDs anyway)
- Auto-increment provides clean, simple URLs: `/api/{user_id}/tasks/1`
- Performance benefit from smaller integer index vs UUID
- Revealing task count is not a security risk (user isolation prevents cross-user access)

**Implementation**:
```python
from sqlmodel import Field, SQLModel

class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)  # Auto-increment
    user_id: str = Field(foreign_key="users.id", index=True)
    title: str
    completed: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

---

## Summary of Technology Choices

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| Web Framework | FastAPI | 0.109+ | Async support, automatic OpenAPI docs, dependency injection |
| ORM | SQLModel | 0.0.14+ | Type-safe SQLAlchemy wrapper, Pydantic integration |
| JWT Library | PyJWT | 2.8+ | Simple HS256 verification, lightweight |
| Migrations | Alembic | 1.13+ | Version control, auto-generation, rollback support |
| Database Driver | psycopg2-binary | 2.9+ | PostgreSQL adapter for SQLAlchemy |
| ASGI Server | Uvicorn | 0.27+ | Production-ready async server for FastAPI |
| Testing | pytest + httpx | 8.0+ / 0.26+ | Async test support, HTTP client for endpoint testing |

## Implementation Dependencies

```text
# requirements.txt
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

## Next Steps

1. Create `data-model.md` with complete SQLModel schemas
2. Create `contracts/tasks-api.yaml` with OpenAPI 3.0 specification
3. Create `quickstart.md` with setup and testing instructions
4. Generate `tasks.md` via `/sp.tasks` command
5. Implement via `fastapi-backend` and `neon-db-architect` agents
