# Feature Specification: Backend API & Database Layer

**Feature Branch**: `002-backend-api-db`
**Created**: 2026-01-19
**Status**: Draft
**Input**: User description: "Todo App - Backend API & Database Layer - Target audience: Frontend integration requiring authenticated REST endpoints - Focus: FastAPI server with JWT middleware and multi-user task database"

## User Scenarios & Testing

### User Story 1 - List All User Tasks (Priority: P1) 🎯 MVP

An authenticated user retrieves all their tasks from the database to display in the frontend application.

**Why this priority**: This is the foundational read operation required for any task management interface. Without the ability to list tasks, users cannot see their data. This is the most critical endpoint for MVP demonstration.

**Independent Test**: User signs in (using Spec 1 JWT), calls GET /api/{user_id}/tasks endpoint, receives array of their tasks (empty array if no tasks exist), and can display them in frontend.

**Acceptance Scenarios**:

1. **Given** user is authenticated with valid JWT token, **When** they request GET /api/{user_id}/tasks, **Then** system returns 200 OK with array of all their tasks
2. **Given** user has no tasks in database, **When** they request GET /api/{user_id}/tasks, **Then** system returns 200 OK with empty array []
3. **Given** user is not authenticated (missing JWT), **When** they request GET /api/{user_id}/tasks, **Then** system returns 401 Unauthorized
4. **Given** user is authenticated but user_id in URL doesn't match JWT user_id, **When** they request GET /api/{user_id}/tasks, **Then** system returns 403 Forbidden

---

### User Story 2 - Create New Task (Priority: P1) 🎯 MVP

An authenticated user creates a new task which is stored in the database with their user relationship.

**Why this priority**: Creating tasks is the second most critical operation after viewing tasks. Together with User Story 1, this provides a complete create+read workflow for MVP demonstration.

**Independent Test**: User signs in, calls POST /api/{user_id}/tasks with task data (title, completed status), receives newly created task with generated ID, then calls GET /api/{user_id}/tasks to verify task appears in list.

**Acceptance Scenarios**:

1. **Given** user is authenticated, **When** they POST /api/{user_id}/tasks with valid task data (title, completed), **Then** system returns 201 Created with task object including generated task_id
2. **Given** user is authenticated, **When** they POST /api/{user_id}/tasks with missing required field (title), **Then** system returns 400 Bad Request with validation error
3. **Given** user is not authenticated, **When** they POST /api/{user_id}/tasks, **Then** system returns 401 Unauthorized
4. **Given** user is authenticated but user_id in URL doesn't match JWT user_id, **When** they POST /api/{user_id}/tasks, **Then** system returns 403 Forbidden
5. **Given** user creates a task, **When** another user tries to GET /api/{their_user_id}/tasks, **Then** the first user's task does NOT appear in second user's list (data isolation verified)

---

### User Story 3 - Update Task Completion Status (Priority: P2)

An authenticated user toggles a task between completed and incomplete states.

**Why this priority**: Marking tasks as complete is a core user interaction in todo applications. This provides the essential "check off task" functionality users expect.

**Independent Test**: User creates a task (completed=false), calls PATCH /api/{user_id}/tasks/{task_id} with completed=true, then calls GET to verify task completion status updated.

**Acceptance Scenarios**:

1. **Given** user owns a task with completed=false, **When** they PATCH /api/{user_id}/tasks/{task_id} with completed=true, **Then** system returns 200 OK with updated task showing completed=true
2. **Given** user owns a task with completed=true, **When** they PATCH /api/{user_id}/tasks/{task_id} with completed=false, **Then** system returns 200 OK with updated task showing completed=false
3. **Given** user is authenticated, **When** they PATCH a task_id that doesn't exist, **Then** system returns 404 Not Found
4. **Given** user is authenticated, **When** they try to PATCH another user's task, **Then** system returns 404 Not Found (task ownership validated)
5. **Given** user is not authenticated, **When** they PATCH /api/{user_id}/tasks/{task_id}, **Then** system returns 401 Unauthorized

---

### User Story 4 - Update Task Details (Priority: P2)

An authenticated user modifies the title or other details of an existing task.

**Why this priority**: Users need to correct typos or update task descriptions. This complements the PATCH endpoint by allowing full task updates.

**Independent Test**: User creates a task with title "Buy milk", calls PUT /api/{user_id}/tasks/{task_id} with title "Buy organic milk", then calls GET to verify title updated.

**Acceptance Scenarios**:

1. **Given** user owns a task, **When** they PUT /api/{user_id}/tasks/{task_id} with updated title and completed status, **Then** system returns 200 OK with fully updated task
2. **Given** user owns a task, **When** they PUT /api/{user_id}/tasks/{task_id} with missing required field, **Then** system returns 400 Bad Request
3. **Given** user is authenticated, **When** they PUT a task_id that doesn't exist, **Then** system returns 404 Not Found
4. **Given** user is authenticated, **When** they try to PUT another user's task, **Then** system returns 404 Not Found
5. **Given** user is not authenticated, **When** they PUT /api/{user_id}/tasks/{task_id}, **Then** system returns 401 Unauthorized

---

### User Story 5 - Delete Task (Priority: P3)

An authenticated user permanently removes a task from their list.

**Why this priority**: While useful, deletion is less critical than create/read/update operations. Users can manage their tasks without deletion in MVP, making this lower priority.

**Independent Test**: User creates a task, calls DELETE /api/{user_id}/tasks/{task_id}, receives 204 No Content, then calls GET /api/{user_id}/tasks to verify task no longer appears.

**Acceptance Scenarios**:

1. **Given** user owns a task, **When** they DELETE /api/{user_id}/tasks/{task_id}, **Then** system returns 204 No Content and task is removed from database
2. **Given** user is authenticated, **When** they DELETE a task_id that doesn't exist, **Then** system returns 404 Not Found
3. **Given** user is authenticated, **When** they try to DELETE another user's task, **Then** system returns 404 Not Found
4. **Given** user is not authenticated, **When** they DELETE /api/{user_id}/tasks/{task_id}, **Then** system returns 401 Unauthorized
5. **Given** user deletes a task, **When** they immediately try to GET that task_id, **Then** system returns 404 Not Found

---

### User Story 6 - Retrieve Single Task (Priority: P3)

An authenticated user retrieves details of a specific task by its ID.

**Why this priority**: While GET /api/{user_id}/tasks provides all tasks, a single-task endpoint is useful for refresh operations or direct links. However, this is a convenience feature and lower priority than core CRUD operations.

**Independent Test**: User creates a task, notes the task_id from response, calls GET /api/{user_id}/tasks/{task_id}, receives that specific task object.

**Acceptance Scenarios**:

1. **Given** user owns a task, **When** they GET /api/{user_id}/tasks/{task_id}, **Then** system returns 200 OK with that task object
2. **Given** user is authenticated, **When** they GET a task_id that doesn't exist, **Then** system returns 404 Not Found
3. **Given** user is authenticated, **When** they try to GET another user's task, **Then** system returns 404 Not Found
4. **Given** user is not authenticated, **When** they GET /api/{user_id}/tasks/{task_id}, **Then** system returns 401 Unauthorized

---

### Edge Cases

- **What happens when JWT token is expired?** System returns 401 Unauthorized with "Token expired" message, prompting user to sign in again
- **What happens when JWT signature is invalid (wrong secret)?** System returns 401 Unauthorized with "Invalid token signature" message
- **What happens when user_id in URL is not a valid UUID format?** System returns 400 Bad Request with "Invalid user_id format" message
- **What happens when task_id in URL is not a valid integer?** System returns 400 Bad Request with "Invalid task_id format" message
- **What happens when request body JSON is malformed?** System returns 400 Bad Request with "Invalid JSON format" message
- **What happens when database connection fails?** System returns 500 Internal Server Error and logs error for debugging
- **What happens when user tries to access /api/{different_user_id}/tasks with valid JWT for their own user?** System returns 403 Forbidden (user_id mismatch detected)
- **What happens when task title exceeds reasonable length (e.g., 10,000 characters)?** System accepts it (no explicit length limit specified) but database column size may truncate
- **What happens when completed field is missing from POST request?** System defaults to false (task starts as incomplete)
- **What happens when extra unknown fields are sent in request body?** System ignores unknown fields (permissive validation) and processes only known fields

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide GET /api/{user_id}/tasks endpoint that returns all tasks for the authenticated user
- **FR-002**: System MUST provide POST /api/{user_id}/tasks endpoint that creates a new task with user ownership
- **FR-003**: System MUST provide GET /api/{user_id}/tasks/{task_id} endpoint that returns a single task if user owns it
- **FR-004**: System MUST provide PUT /api/{user_id}/tasks/{task_id} endpoint that updates all task fields
- **FR-005**: System MUST provide PATCH /api/{user_id}/tasks/{task_id} endpoint that updates task completion status
- **FR-006**: System MUST provide DELETE /api/{user_id}/tasks/{task_id} endpoint that removes a task
- **FR-007**: System MUST extract JWT token from "better-auth.session.token" cookie on every request
- **FR-008**: System MUST validate JWT token signature using BETTER_AUTH_SECRET from Spec 1
- **FR-009**: System MUST extract user_id and email from validated JWT payload
- **FR-010**: System MUST compare user_id from JWT with user_id in URL path
- **FR-011**: System MUST return 401 Unauthorized if JWT is missing, expired, or invalid
- **FR-012**: System MUST return 403 Forbidden if user_id in JWT doesn't match user_id in URL
- **FR-013**: System MUST return 404 Not Found if task_id doesn't exist or belongs to a different user
- **FR-014**: System MUST store tasks in Neon PostgreSQL database with user_id foreign key relationship
- **FR-015**: System MUST validate task title is present (required field) in POST and PUT requests
- **FR-016**: System MUST validate completed field is boolean in POST, PUT, and PATCH requests
- **FR-017**: System MUST return 400 Bad Request for validation failures with descriptive error messages
- **FR-018**: System MUST ensure each user can only access their own tasks (data isolation)
- **FR-019**: System MUST use SQLModel ORM for database operations
- **FR-020**: System MUST return appropriate HTTP status codes (200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error)
- **FR-021**: System MUST default completed field to false if not provided in POST request
- **FR-022**: System MUST generate unique task_id automatically when creating tasks
- **FR-023**: System MUST include created_at and updated_at timestamps for audit trail
- **FR-024**: System MUST validate request body is valid JSON before processing

### Key Entities

- **Task**: Represents a todo item with user ownership
  - Attributes: task_id (unique identifier), user_id (owner reference), title (task description), completed (boolean status), created_at (timestamp), updated_at (timestamp)
  - Relationships: Belongs to one User (from Spec 1 authentication system)

- **User**: Represents an authenticated user (defined in Spec 1)
  - Attributes: user_id (UUID from Spec 1), email (from JWT token)
  - Relationships: Has many Tasks
  - Note: User data is NOT stored in this backend - only referenced via JWT token

## Success Criteria

### Measurable Outcomes

- **SC-001**: All 6 REST endpoints (GET list, GET single, POST, PUT, PATCH, DELETE) return appropriate responses within 500ms for databases with under 10,000 tasks
- **SC-002**: Frontend can successfully create a task, view it in the list, update it, mark it complete, and delete it in a single user flow
- **SC-003**: Two users can sign in simultaneously and each sees only their own tasks (100% data isolation verified)
- **SC-004**: API correctly rejects 100% of requests with missing, expired, or invalid JWT tokens (401 Unauthorized)
- **SC-005**: API correctly rejects 100% of requests where user_id in URL doesn't match JWT user_id (403 Forbidden)
- **SC-006**: API handles 50 concurrent requests from different users without data corruption or cross-user data leakage
- **SC-007**: Database stores all task data persistently - tasks survive server restarts
- **SC-008**: Every API error response includes a clear error message explaining what went wrong
- **SC-009**: Frontend developer can integrate all 6 endpoints using the API without backend code modifications
- **SC-010**: API returns correct HTTP status codes for all scenarios (200/201/204/400/401/403/404/500) with 100% accuracy

### Security Outcomes

- **SC-011**: Zero cross-user data leakage - user A cannot access, modify, or delete user B's tasks under any circumstances
- **SC-012**: All endpoints validate JWT on every request - no unauthenticated access to task data
- **SC-013**: Database stores user_id relationships correctly - orphaned tasks (tasks without valid user_id) are impossible

### Integration Outcomes

- **SC-014**: Frontend (Spec 1) can authenticate user, receive JWT cookie, and immediately use it to call backend endpoints
- **SC-015**: BETTER_AUTH_SECRET from Spec 1 frontend .env matches backend .env, enabling seamless JWT verification

## Assumptions

1. **Database availability**: Neon PostgreSQL database is provisioned and accessible with connection string in environment variable
2. **JWT token format**: JWT tokens from Spec 1 frontend contain userId and email fields as documented
3. **Cookie transmission**: Browsers automatically send "better-auth.session.token" cookie with API requests (CORS configured if needed)
4. **User existence**: user_id from JWT token is valid - no need to verify user exists in database (authentication already handled by Spec 1)
5. **Task uniqueness**: task_id is database-generated auto-increment or UUID, guaranteed unique per user
6. **Timestamp handling**: Database automatically manages created_at and updated_at timestamps
7. **Environment configuration**: BETTER_AUTH_SECRET, DATABASE_URL, and other config available via environment variables
8. **Default values**: completed defaults to false if not provided; title has no maximum length unless database column restricts it
9. **Concurrent access**: Database handles concurrent updates with appropriate locking (optimistic or pessimistic as needed)
10. **Error logging**: Application logs errors to stdout/stderr for debugging (structured logging preferred)

## Out of Scope

The following features are explicitly NOT included in this specification:

- Task sharing or collaboration between multiple users
- Task categories, tags, or labels for organization
- Task prioritization (high/medium/low) or custom sorting
- Batch operations (delete multiple tasks, mark multiple complete)
- Task search functionality or filtering by criteria
- Task due dates, reminders, or scheduling
- Rate limiting or request throttling
- Caching layer (Redis, in-memory cache)
- Task history or audit log of changes
- Soft delete (trash/archive functionality)
- Task attachments or file uploads
- Rich text formatting in task titles
- Task assignment to other users
- Pagination for large task lists (return all tasks)
- Real-time updates or WebSocket support
- API versioning (v1, v2)
- GraphQL interface (REST only)
- User management endpoints (handled by Spec 1 frontend)
- Email notifications or webhooks
- Task import/export functionality
- Analytics or usage statistics

## Dependencies

### External Dependencies

- **Spec 1 (Authentication & User Management)**: Backend requires JWT tokens issued by Spec 1 frontend. Must share BETTER_AUTH_SECRET for token validation.
- **Neon PostgreSQL Database**: Serverless PostgreSQL database service must be provisioned and accessible
- **Python 3.10+**: FastAPI requires Python 3.10 or higher
- **PyJWT library**: For JWT token verification
- **SQLModel library**: For database ORM operations
- **FastAPI framework**: For REST API implementation
- **Uvicorn**: ASGI server for running FastAPI application
- **Browser cookie support**: Frontend must send cookies with API requests (httpOnly cookies from Spec 1)

### Internal Dependencies

- JWT middleware must run before all endpoint handlers
- Database connection must be established before handling requests
- Environment variables must be loaded at application startup
- SQLModel models must be synced with database schema

## Risks & Mitigations

### Risk 1: BETTER_AUTH_SECRET Mismatch

**Risk**: Frontend and backend use different JWT secrets, causing all token validations to fail.

**Likelihood**: Medium
**Impact**: Critical (complete authentication failure)

**Mitigation**:
- Document secret sharing requirement prominently in setup guide
- Add startup validation that checks BETTER_AUTH_SECRET is configured
- Provide clear error messages when JWT signature validation fails
- Include troubleshooting section in documentation

### Risk 2: CORS Configuration

**Risk**: If frontend and backend run on different domains/ports during development, browsers block API requests.

**Likelihood**: High (common in development)
**Impact**: High (frontend cannot call backend)

**Mitigation**:
- Document CORS configuration in setup guide
- Provide example CORS middleware configuration for FastAPI
- Include allow_credentials=True for cookie transmission
- Test with frontend on different port during development

### Risk 3: Database Connection Failures

**Risk**: Neon PostgreSQL connection fails due to network issues, credential problems, or service outages.

**Likelihood**: Medium
**Impact**: Critical (all endpoints fail)

**Mitigation**:
- Implement retry logic for transient connection failures
- Return 500 Internal Server Error with generic message (don't expose DB details)
- Log detailed error information for debugging
- Document database connection string requirements

### Risk 4: User_ID Type Mismatch

**Risk**: JWT contains user_id as UUID string but database expects integer, or vice versa.

**Likelihood**: Low (types specified in Spec 1)
**Impact**: High (data storage/retrieval fails)

**Mitigation**:
- Verify user_id type consistency between Spec 1 and database schema
- Document expected user_id format (UUID from Spec 1)
- Add type validation in SQLModel models
- Test with actual Spec 1 JWT tokens during development

### Risk 5: SQL Injection

**Risk**: Malicious input in task title or other fields could cause SQL injection attacks.

**Likelihood**: Low (SQLModel provides protection)
**Impact**: Critical (database compromise)

**Mitigation**:
- Use SQLModel ORM for all database queries (parameterized queries)
- Never concatenate user input into SQL strings
- Validate and sanitize all user inputs
- Include security testing in test plan
