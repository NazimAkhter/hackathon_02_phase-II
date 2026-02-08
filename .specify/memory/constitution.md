<!--
Sync Impact Report:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Version Change: [INITIAL] → 1.0.0
Change Type: MINOR - Initial constitution creation with complete governance framework

Principles Added:
  1. Agentic Development Workflow
  2. Security-First Architecture
  3. RESTful API Design Standards
  4. Stateless JWT Authentication
  5. Multi-User Persistent Storage

Sections Added:
  - Technology Stack Constraints
  - Authentication & Authorization Standards
  - Success Criteria & Acceptance Gates

Templates Status:
  ✅ .specify/templates/plan-template.md - Constitution Check section ready
  ✅ .specify/templates/spec-template.md - Functional requirements aligned
  ✅ .specify/templates/tasks-template.md - Task categorization supports all principles

Follow-up TODOs:
  - RATIFICATION_DATE: Set to 2026-01-19 (constitution creation date)
  - Review after first feature implementation to validate principle enforcement
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-->

# Todo Full-Stack Web Application Constitution

## Core Principles

### I. Agentic Development Workflow

All code MUST be generated through Claude Code and Spec-Kit Plus following the Spec-Driven Development (SDD) workflow. Manual coding is prohibited.

**Required Workflow:**
- Write specification using `/sp.specify`
- Generate implementation plan via `/sp.plan`
- Break plan into tasks with `/sp.tasks`
- Implement via Claude Code agents (auth-security-architect, neon-db-architect,
  fastapi-backend, nextjs-ui-builder)
- Document all architectural decisions with `/sp.adr` when significant choices are made

**Rationale:** Ensures consistency, traceability, and leverages AI-assisted development
for quality and velocity. All prompts and iterations are recorded for review and learning.

### II. Security-First Architecture

User data isolation MUST be enforced at every layer. Each user can only access their
own data.

**Non-Negotiable Rules:**
- Every API endpoint MUST validate JWT token before processing
- User ID from JWT MUST match user ID in request URL/payload
- Database queries MUST filter by authenticated user ID
- 401 Unauthorized MUST be returned for missing/invalid tokens
- 403 Forbidden MUST be returned when user ID mismatch detected
- Zero authentication bypass vulnerabilities tolerated
- All secrets MUST be stored in environment variables, never hardcoded
- HTTPS-only in production environments

**Rationale:** Multi-user applications require strict security boundaries to prevent data
leaks and unauthorized access. Security violations are deployment blockers.

### III. RESTful API Design Standards

All API endpoints MUST follow RESTful conventions and HTTP semantics.

**Required Standards:**
- Resource-based URLs (nouns, not verbs): `/api/users/{user_id}/todos/{todo_id}`
- HTTP methods map to CRUD: GET (read), POST (create), PUT (update), PATCH (partial
  update), DELETE (remove)
- Proper HTTP status codes: 200 (success), 201 (created), 204 (no content), 400 (bad
  request), 401 (unauthorized), 403 (forbidden), 404 (not found), 500 (server error)
- All 5 basic CRUD operations MUST be implemented (Create, Read, Update, Delete, List)
- Consistent JSON response format with error details
- API versioning via URL path (`/api/v1/`) when backward-incompatible changes required

**Required Endpoints (Minimum):**
- `GET /api/users/{user_id}/todos` - List all todos for user
- `GET /api/users/{user_id}/todos/{todo_id}` - Get specific todo
- `POST /api/users/{user_id}/todos` - Create new todo
- `PUT /api/users/{user_id}/todos/{todo_id}` - Full update of todo
- `PATCH /api/users/{user_id}/todos/{todo_id}` - Partial update of todo
- `DELETE /api/users/{user_id}/todos/{todo_id}` - Delete todo

**Rationale:** RESTful design provides predictable, standards-based APIs that are easier
to consume, test, and maintain. Consistency reduces cognitive load.

### IV. Stateless JWT Authentication

Authentication MUST use JWT (JSON Web Tokens) issued by Better Auth with 7-day expiry.

**Implementation Requirements:**
- Better Auth configured with JWT plugin for token generation
- Shared secret `BETTER_AUTH_SECRET` MUST be identical across frontend and backend
- JWT tokens contain: user ID, email, expiration timestamp, signature
- Tokens transmitted via `Authorization: Bearer <token>` header
- Backend MUST verify token signature using shared secret on every request
- Token expiry MUST be enforced (7-day maximum lifetime)
- Refresh token mechanism SHOULD be implemented for better UX
- Failed authentication MUST return 401 with clear error message

**Token Validation Flow:**
1. User logs in → Better Auth creates session and issues JWT token
2. Frontend stores token securely (httpOnly cookie or secure storage)
3. Frontend includes token in `Authorization` header for API calls
4. Backend extracts token, verifies signature, checks expiry
5. Backend decodes user ID from token
6. Backend validates user ID matches resource owner in URL
7. Backend processes request and filters data by user ID

**Rationale:** Stateless JWT authentication scales horizontally without session storage,
enables microservices architecture, and provides cryptographic security guarantees.

### V. Multi-User Persistent Storage

All data MUST be stored in Neon Serverless PostgreSQL with proper relational integrity.

**Database Requirements:**
- Neon Serverless PostgreSQL as single source of truth
- SQLModel ORM for type-safe database operations
- Database schema MUST be normalized (at minimum 3NF)
- Foreign key relationships MUST be enforced via constraints
- Migrations MUST be versioned and reversible
- Connection pooling MUST be configured for serverless environment
- Indexes MUST be created on foreign keys and frequently queried columns

**Schema Requirements (Minimum):**
- `users` table: id (PK), email (unique), password_hash, created_at, updated_at
- `todos` table: id (PK), user_id (FK → users.id), title, description, completed,
  priority, due_date, created_at, updated_at
- CASCADE delete: when user deleted, todos deleted
- NOT NULL constraints on required fields

**Rationale:** Persistent storage with referential integrity prevents data corruption,
enables complex queries, and provides ACID guarantees for data consistency.

## Technology Stack Constraints

### Mandatory Technologies

**Frontend:**
- Next.js 16+ (App Router architecture required)
- React 18+ with Server Components
- TypeScript for type safety
- Tailwind CSS or modern CSS-in-JS solution

**Backend:**
- Python 3.11+
- FastAPI framework
- SQLModel ORM (combines SQLAlchemy and Pydantic)
- Uvicorn ASGI server

**Database:**
- Neon Serverless PostgreSQL
- Connection pooling via pgBouncer or Neon's built-in pooler

**Authentication:**
- Better Auth with JWT plugin
- bcrypt or Argon2 for password hashing

**Development:**
- Claude Code for all code generation
- Spec-Kit Plus for specification workflow
- Git for version control

### Prohibited Technologies

- No manual coding (all via Claude Code agents)
- No session-based authentication (JWT required)
- No NoSQL databases (PostgreSQL required for ACID compliance)
- No GraphQL (RESTful APIs required)
- No serverless functions for backend (FastAPI monolith required)

**Rationale:** Technology constraints ensure architectural consistency, reduce complexity,
and align with project requirements and team expertise.

## Authentication & Authorization Standards

### User Signup Flow

1. User submits email + password via frontend form
2. Frontend validates format (email regex, password strength)
3. Frontend calls `POST /api/auth/signup` with credentials
4. Backend validates uniqueness of email
5. Backend hashes password with bcrypt (cost factor 12)
6. Backend creates user record in database
7. Backend generates JWT token via Better Auth
8. Backend returns token + user info (excluding password)
9. Frontend stores token securely
10. Frontend redirects to dashboard

### User Signin Flow

1. User submits email + password via frontend form
2. Frontend calls `POST /api/auth/signin` with credentials
3. Backend retrieves user by email
4. Backend verifies password hash using bcrypt
5. Backend generates fresh JWT token (7-day expiry)
6. Backend returns token + user info
7. Frontend stores token securely
8. Frontend redirects to dashboard

### Authorization Enforcement

**Every protected API endpoint MUST:**
1. Extract `Authorization` header from request
2. Parse `Bearer <token>` format
3. Verify JWT signature using `BETTER_AUTH_SECRET`
4. Check token expiration timestamp
5. Decode user ID from token payload
6. Extract user ID from request URL path
7. Compare token user ID === URL user ID
8. Return 401 if token invalid/expired
9. Return 403 if user ID mismatch
10. Proceed with request only if all checks pass

**Rationale:** Multi-layered authorization prevents privilege escalation, ensures users
cannot access other users' data, and provides defense in depth.

## Success Criteria & Acceptance Gates

### Complete User Journey (MANDATORY)

All features MUST support the complete user lifecycle:

1. **Signup**: New user creates account
2. **Login**: User authenticates and receives JWT token
3. **Manage Tasks**: User performs CRUD operations on their todos
4. **Logout**: User invalidates session (optional: token revocation)

**Acceptance Test:** Manual walkthrough of complete journey MUST succeed before deployment.

### Functional Completeness (MANDATORY)

All 5 basic CRUD operations MUST be implemented and tested:

- ✅ **Create**: User can add new todo
- ✅ **Read**: User can view todo list and individual todo details
- ✅ **Update**: User can edit existing todo (full or partial)
- ✅ **Delete**: User can remove todo
- ✅ **List**: User can see all their todos

**Acceptance Test:** Integration tests for each operation MUST pass.

### Security Gates (MANDATORY - BLOCKS DEPLOYMENT)

- ✅ Each user sees ONLY their own tasks (no data leakage)
- ✅ Unauthenticated requests return 401 status
- ✅ JWT verification on every API call (no bypass routes)
- ✅ Zero authentication bypass vulnerabilities
- ✅ User ID validation prevents privilege escalation
- ✅ Secrets not hardcoded (`.env` validation)

**Acceptance Test:** Security audit script MUST pass all checks.

### Data Integrity (MANDATORY)

- ✅ Database properly normalized (3NF minimum)
- ✅ Foreign key constraints enforced
- ✅ CASCADE delete configured
- ✅ Indexes on foreign keys
- ✅ NOT NULL constraints on required fields

**Acceptance Test:** Database schema validation script MUST pass.

### Responsive UI (MANDATORY)

- ✅ Mobile viewport (320px-768px): Functional and readable
- ✅ Tablet viewport (768px-1024px): Optimal layout
- ✅ Desktop viewport (1024px+): Full feature set

**Acceptance Test:** Manual testing on 3 viewport sizes MUST succeed.

### API Contract Compliance (MANDATORY)

All 6 HTTP methods MUST be implemented correctly:

- ✅ `GET` - Retrieve resources (idempotent, no side effects)
- ✅ `POST` - Create resources (non-idempotent)
- ✅ `PUT` - Full update (idempotent)
- ✅ `PATCH` - Partial update (idempotent)
- ✅ `DELETE` - Remove resources (idempotent)
- ✅ `OPTIONS` - CORS preflight (automatic via FastAPI)

**Acceptance Test:** OpenAPI documentation MUST reflect all endpoints with correct methods.

## Governance

### Amendment Procedure

1. **Proposal**: Document proposed change with rationale in ADR
2. **Review**: Team reviews impact on existing principles and templates
3. **Version Bump**: Determine MAJOR/MINOR/PATCH increment
4. **Template Sync**: Update all dependent templates (plan, spec, tasks)
5. **Approval**: Stakeholder sign-off required
6. **Migration**: Document breaking changes and migration path
7. **Commit**: Update constitution with new version and date

### Versioning Policy

- **MAJOR** (X.0.0): Backward-incompatible principle removal or redefinition
  (requires migration plan)
- **MINOR** (0.X.0): New principle added or materially expanded guidance
  (backward compatible)
- **PATCH** (0.0.X): Clarifications, wording fixes, typos (no semantic change)

### Compliance Review

- All feature specifications MUST reference constitution principles
- All implementation plans MUST include "Constitution Check" section
- All PRs/code reviews MUST verify compliance with principles
- Security gates MUST pass before deployment approval
- Violations MUST be documented in "Complexity Tracking" with justification

### Enforcement

- **Constitution supersedes all other practices** - principles are non-negotiable
- Complexity MUST be justified if constitution check fails
- Use `CLAUDE.md` for agent-specific runtime development guidance
- PHRs (Prompt History Records) capture all user interactions for audit trail
- ADRs (Architectural Decision Records) document significant technical choices

**Version**: 1.0.0 | **Ratified**: 2026-01-19 | **Last Amended**: 2026-01-19
