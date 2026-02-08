---
id: 0002
title: Backend API Implementation Plan
stage: plan
date: 2026-01-19
surface: agent
model: claude-sonnet-4-5-20250929
feature: 002-backend-api-db
branch: 002-backend-api-db
user: nazimakhter
command: /sp.plan
labels: ["backend", "api", "database", "fastapi", "planning", "architecture", "sqlmodel", "alembic"]
links:
  spec: specs/002-backend-api-db/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/002-backend-api-db/plan.md
  - specs/002-backend-api-db/research.md
  - specs/002-backend-api-db/data-model.md
  - specs/002-backend-api-db/contracts/tasks-api.yaml
  - specs/002-backend-api-db/quickstart.md
tests:
  - Constitution check: ALL 5 principles PASS
  - Project structure defined
  - Backend directory structure documented
---

## Prompt

```
/sp.plan

Create: Database schema, SQLModel models, JWT middleware, 6 API route handlers, database connection setup

Decisions needing documentation:
- JWT library for Python (PyJWT vs python-jose) - use PyJWT for simplicity
- Database migration approach (Alembic vs manual) - use Alembic for versioning
- Error response format (custom vs FastAPI default) - use consistent JSON structure
- Connection pooling settings - configure for Neon serverless

Testing strategy:
- Test each endpoint with valid JWT token
- Verify 401 response for missing/expired tokens
- Confirm 403 when user_id mismatch between URL and token
- Validate user can only CRUD their own tasks
- Test database constraints (foreign keys, unique user tasks)

Technical details:
- Create User and Task SQLModel models with relationship
- Implement JWT decode middleware using BETTER_AUTH_SECRET
- Add dependency injection for authenticated user extraction
- Filter all queries by authenticated_user.id
- Handle database connection via environment variables
- Follow phases: Database Setup → Models → Middleware → Endpoints → Integration Testing
```

## Response snapshot

Created comprehensive implementation plan for Backend API & Database Layer with complete architectural documentation.

**Planning Documents Created**:

1. **plan.md** - Complete implementation plan with:
   - Technical context (Python 3.11+, FastAPI, SQLModel, PyJWT, Alembic)
   - Constitution check (ALL 5 principles PASS)
   - Project structure (backend/ directory with detailed file tree)
   - No complexity violations

2. **research.md** - 6 architectural decisions documented:
   - Decision 1: PyJWT vs python-jose (chose PyJWT for simplicity)
   - Decision 2: Alembic vs manual migrations (chose Alembic for version control)
   - Decision 3: Custom JSON error format vs FastAPI default (chose custom for consistency)
   - Decision 4: NullPool vs QueuePool for Neon serverless (chose NullPool)
   - Decision 5: CORS configuration with credentials support
   - Decision 6: Auto-increment integer vs UUID for task_id (chose integer)

3. **data-model.md** - Complete database schema:
   - Entity Relationship Diagram (users 1:N tasks)
   - User model (reference from Spec 1, not created by backend)
   - Task model (owned by backend) with SQLModel and SQL schemas
   - Pydantic request/response schemas (TaskCreate, TaskUpdate, TaskPatch, TaskResponse)
   - Alembic migration file with CREATE TABLE, indexes, triggers
   - Query patterns with user isolation enforcement

4. **contracts/tasks-api.yaml** - OpenAPI 3.0 specification:
   - All 6 REST endpoints (GET list, GET single, POST, PUT, PATCH, DELETE)
   - Complete request/response schemas
   - Error response examples (400, 401, 403, 404, 500)
   - Security scheme (cookieAuth)
   - User story mappings in endpoint descriptions

5. **quickstart.md** - Setup and testing guide:
   - Step-by-step environment setup
   - Database configuration and migration
   - Server startup instructions
   - Testing with frontend JWT tokens
   - User isolation testing
   - Error scenario testing
   - Automated test suite instructions
   - Troubleshooting guide
   - Production deployment guide

**Architecture Highlights**:
- FastAPI with dependency injection for JWT validation
- SQLModel ORM with Neon PostgreSQL (NullPool for serverless)
- PyJWT for HS256 token verification using shared BETTER_AUTH_SECRET
- Alembic for versioned database migrations
- CORS middleware with allow_credentials=True for cookie transmission
- Structured JSON error responses with error codes
- Complete user isolation via JWT middleware filtering all queries by user_id

**Backend Structure**:
```
backend/
├── src/               (main.py, config.py, database.py)
│   ├── models/       (user.py, task.py)
│   ├── schemas/      (task.py, auth.py)
│   ├── auth/         (jwt.py, dependencies.py)
│   ├── api/          (tasks.py - 6 endpoints)
│   └── errors/       (handlers.py)
├── migrations/       (Alembic versions/)
└── tests/           (JWT, endpoints, user isolation)
```

## Outcome

- ✅ Impact: Complete implementation plan with all architectural decisions documented and ready for task breakdown
- 🧪 Tests: Constitution check passed (5/5 principles), test strategy defined (JWT validation, endpoint testing, user isolation)
- 📁 Files: plan.md, research.md, data-model.md, contracts/tasks-api.yaml, quickstart.md (5 documents, ~1800 lines total)
- 🔁 Next prompts: /sp.tasks to generate implementation task breakdown
- 🧠 Reflection: Plan provides clear path from database setup to endpoint implementation with emphasis on security (JWT middleware, user isolation, CORS). All technical decisions justified with rationale (PyJWT for simplicity, Alembic for versioning, NullPool for serverless). OpenAPI contract enables frontend integration planning.

## Evaluation notes (flywheel)

- Failure modes observed: None - all documents generated successfully with consistent cross-references
- Graders run and results (PASS/FAIL): Constitution check - PASS (5/5 principles), completeness check - PASS (all required sections)
- Prompt variant (if applicable): Standard /sp.plan workflow with detailed decision documentation
- Next experiment (smallest change to try): Proceed to /sp.tasks for task breakdown, then implement via fastapi-backend and neon-db-architect agents
