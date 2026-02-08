# Task Management API Documentation

## Overview

REST API for multi-user task management with JWT-based authentication. All endpoints require authentication via httpOnly cookie and enforce user ownership validation.

**Base URL**: `http://localhost:8000/api`

**Authentication**: JWT token in `better-auth.session.token` cookie

**API Version**: 1.0.0

---

## Authentication

All task endpoints require JWT authentication via httpOnly cookie:

- **Cookie Name**: `better-auth.session.token`
- **Token Type**: JWT (signed with BETTER_AUTH_SECRET)
- **Payload**: Contains `userId` field with user's UUID
- **Validation**: Automatic via `get_current_user()` dependency

### Security Model

1. **JWT Extraction**: Token extracted from httpOnly cookie
2. **Token Validation**: Signature verification and expiration check
3. **User ID Match**: URL `user_id` must match JWT `userId`
4. **Ownership Check**: All operations verify resource belongs to authenticated user
5. **404 Response**: Return 404 (not 403) when task doesn't exist or isn't owned

---

## Endpoints

### 1. List All Tasks (User Story 1 - P1 MVP)

Retrieve all tasks belonging to the authenticated user.

**Endpoint**: `GET /api/{user_id}/tasks`

**Priority**: P1 (MVP)

**Authentication**: Required

**Request**:
```http
GET /api/550e8400-e29b-41d4-a716-446655440000/tasks HTTP/1.1
Cookie: better-auth.session.token=<jwt_token>
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Buy groceries",
    "completed": false,
    "created_at": "2026-01-19T10:30:00Z",
    "updated_at": "2026-01-19T10:30:00Z"
  },
  {
    "id": 2,
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Complete project",
    "completed": true,
    "created_at": "2026-01-19T11:00:00Z",
    "updated_at": "2026-01-19T12:00:00Z"
  }
]
```

**Empty Response** (200 OK):
```json
[]
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: URL user_id doesn't match JWT user_id
- `500 Internal Server Error`: Database query failure

---

### 2. Create Task (User Story 2 - P1 MVP)

Create a new task for the authenticated user.

**Endpoint**: `POST /api/{user_id}/tasks`

**Priority**: P1 (MVP)

**Authentication**: Required

**Request**:
```http
POST /api/550e8400-e29b-41d4-a716-446655440000/tasks HTTP/1.1
Cookie: better-auth.session.token=<jwt_token>
Content-Type: application/json

{
  "title": "Buy groceries",
  "completed": false
}
```

**Request Body Schema** (`TaskCreate`):
| Field | Type | Required | Constraints | Default |
|-------|------|----------|-------------|---------|
| title | string | Yes | 1-500 characters | - |
| completed | boolean | No | - | false |

**Response** (201 Created):
```json
{
  "id": 1,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Buy groceries",
  "completed": false,
  "created_at": "2026-01-19T10:30:00Z",
  "updated_at": "2026-01-19T10:30:00Z"
}
```

**Error Responses**:
- `400 Bad Request`: Validation error (missing title, title too long)
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: URL user_id doesn't match JWT user_id
- `500 Internal Server Error`: Database insertion failure

**Validation Examples**:

```json
// ❌ Missing title
{
  "completed": true
}
// Response: 400 "Validation failed"

// ❌ Title too long (>500 chars)
{
  "title": "x".repeat(501),
  "completed": false
}
// Response: 400 "Validation failed"

// ✅ Minimal valid request
{
  "title": "Valid task"
}
// completed defaults to false
```

---

### 3. Update Task Completion Status (User Story 3 - P2)

Update only the completion status of a task (partial update).

**Endpoint**: `PATCH /api/{user_id}/tasks/{task_id}`

**Priority**: P2

**Authentication**: Required

**Request**:
```http
PATCH /api/550e8400-e29b-41d4-a716-446655440000/tasks/1 HTTP/1.1
Cookie: better-auth.session.token=<jwt_token>
Content-Type: application/json

{
  "completed": true
}
```

**Request Body Schema** (`TaskPatch`):
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| completed | boolean | Yes | - |

**Response** (200 OK):
```json
{
  "id": 1,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Buy groceries",
  "completed": true,
  "created_at": "2026-01-19T10:30:00Z",
  "updated_at": "2026-01-19T14:00:00Z"
}
```

**Error Responses**:
- `400 Bad Request`: Validation error (missing completed field)
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: URL user_id doesn't match JWT user_id
- `404 Not Found`: Task not found or doesn't belong to user
- `500 Internal Server Error`: Database update failure

---

### 4. Full Task Update (User Story 4 - P2)

Update both title and completion status of a task (full update).

**Endpoint**: `PUT /api/{user_id}/tasks/{task_id}`

**Priority**: P2

**Authentication**: Required

**Request**:
```http
PUT /api/550e8400-e29b-41d4-a716-446655440000/tasks/1 HTTP/1.1
Cookie: better-auth.session.token=<jwt_token>
Content-Type: application/json

{
  "title": "Buy groceries and cook dinner",
  "completed": true
}
```

**Request Body Schema** (`TaskUpdate`):
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| title | string | Yes | 1-500 characters |
| completed | boolean | Yes | - |

**Response** (200 OK):
```json
{
  "id": 1,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Buy groceries and cook dinner",
  "completed": true,
  "created_at": "2026-01-19T10:30:00Z",
  "updated_at": "2026-01-19T15:00:00Z"
}
```

**Error Responses**:
- `400 Bad Request`: Validation error (missing required fields)
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: URL user_id doesn't match JWT user_id
- `404 Not Found`: Task not found or doesn't belong to user
- `500 Internal Server Error`: Database update failure

**PATCH vs PUT**:
- **PATCH** (`/tasks/{id}`): Update completion status only
- **PUT** (`/tasks/{id}`): Update both title and completion (full replacement)

---

### 5. Delete Task (User Story 5 - P3)

Delete a task permanently.

**Endpoint**: `DELETE /api/{user_id}/tasks/{task_id}`

**Priority**: P3

**Authentication**: Required

**Request**:
```http
DELETE /api/550e8400-e29b-41d4-a716-446655440000/tasks/1 HTTP/1.1
Cookie: better-auth.session.token=<jwt_token>
```

**Response** (204 No Content):
```http
HTTP/1.1 204 No Content
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: URL user_id doesn't match JWT user_id
- `404 Not Found`: Task not found or doesn't belong to user
- `500 Internal Server Error`: Database deletion failure

**Note**: Successful deletion returns 204 with no response body.

---

### 6. Get Single Task Details (User Story 6 - P3)

Retrieve detailed information for a specific task.

**Endpoint**: `GET /api/{user_id}/tasks/{task_id}`

**Priority**: P3

**Authentication**: Required

**Request**:
```http
GET /api/550e8400-e29b-41d4-a716-446655440000/tasks/1 HTTP/1.1
Cookie: better-auth.session.token=<jwt_token>
```

**Response** (200 OK):
```json
{
  "id": 1,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Buy groceries",
  "completed": false,
  "created_at": "2026-01-19T10:30:00Z",
  "updated_at": "2026-01-19T10:30:00Z"
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: URL user_id doesn't match JWT user_id
- `404 Not Found`: Task not found or doesn't belong to user
- `500 Internal Server Error`: Database query failure

---

## Error Response Format

All errors follow a consistent JSON structure:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field1": "error details",
    "field2": "more details"
  }
}
```

### Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | ERR_VALIDATION_FAILED | Request validation failed |
| 401 | ERR_UNAUTHORIZED | Missing or invalid JWT token |
| 403 | ERR_FORBIDDEN | User ID mismatch or permission denied |
| 404 | ERR_NOT_FOUND | Task not found or not owned |
| 500 | ERR_DATABASE_ERROR | Database operation failed |
| 500 | ERR_INTERNAL_ERROR | Unexpected server error |

### Example Error Responses

**401 Unauthorized**:
```json
{
  "error": "Missing authentication token",
  "code": "ERR_UNAUTHORIZED",
  "details": {}
}
```

**403 Forbidden**:
```json
{
  "error": "Cannot access another user's resources",
  "code": "ERR_FORBIDDEN",
  "details": {}
}
```

**404 Not Found**:
```json
{
  "error": "Task 123 not found",
  "code": "ERR_NOT_FOUND",
  "details": {}
}
```

**400 Validation Failed**:
```json
{
  "error": "Validation failed",
  "code": "ERR_VALIDATION_FAILED",
  "details": {
    "fields": {
      "title": "Field required",
      "completed": "Input should be a valid boolean"
    },
    "errors": [...]
  }
}
```

**500 Database Error**:
```json
{
  "error": "Failed to create task: Connection timeout",
  "code": "ERR_DATABASE_ERROR",
  "details": {}
}
```

---

## Security Implementation

### Multi-Layer Security

1. **JWT Authentication**
   - Token extracted from httpOnly cookie
   - Signature verification with BETTER_AUTH_SECRET
   - Automatic expiration check
   - User ID extraction from validated token

2. **Authorization Checks**
   - URL `user_id` must match JWT `userId`
   - Returns 403 if mismatch detected
   - Logged for security monitoring

3. **Ownership Validation**
   - All queries filter by authenticated user_id
   - Task operations check: `task.id == task_id AND task.user_id == current_user`
   - Returns 404 (not 403) to avoid revealing task existence

4. **SQL Injection Protection**
   - Parameterized queries via SQLModel/SQLAlchemy
   - No raw SQL execution
   - Input validation via Pydantic schemas

5. **Data Isolation**
   - Users can ONLY access their own tasks
   - No cross-user data leakage
   - Database-level foreign key constraints

### Security Example

```python
# ✅ CORRECT: Query with user_id filter
statement = select(Task).where(
    Task.id == task_id,
    Task.user_id == current_user  # From JWT token
)

# ❌ WRONG: Query without user_id filter (exposes all tasks)
statement = select(Task).where(Task.id == task_id)
```

### Logging

All operations are logged with:
- Authenticated user_id
- Action performed
- Task ID (where applicable)
- Timestamp (automatic)

**Log Examples**:
```
INFO: User 550e8400-e29b-41d4-a716-446655440000 listing tasks
INFO: User 550e8400-e29b-41d4-a716-446655440000 created task 42
INFO: User 550e8400-e29b-41d4-a716-446655440000 updated task 42
WARNING: User 550e8400-e29b-41d4-a716-446655440000 attempted to access task 99 for user 123e4567-e89b-12d3-a456-426614174000
```

---

## Testing

### Run Tests

```bash
# Install test dependencies
cd backend
pip install pytest pytest-cov

# Run all tests
pytest tests/test_tasks_api.py -v

# Run with coverage
pytest tests/test_tasks_api.py --cov=src.api.tasks --cov-report=html
```

### Test Coverage

All 6 endpoints have comprehensive test coverage:

- ✅ Success scenarios
- ✅ Validation errors
- ✅ Authentication errors (401)
- ✅ Authorization errors (403)
- ✅ Resource not found (404)
- ✅ User isolation (cannot access other users' tasks)
- ✅ Ownership validation

**Test Summary**:
- User Story 1 (List): 3 tests
- User Story 2 (Create): 5 tests
- User Story 3 (PATCH): 3 tests
- User Story 4 (PUT): 4 tests
- User Story 5 (Delete): 3 tests
- User Story 6 (Get): 3 tests
- Security: 2 additional isolation tests

**Total**: 23 comprehensive integration tests

---

## Interactive API Documentation

FastAPI provides auto-generated interactive API documentation:

### Swagger UI
**URL**: `http://localhost:8000/docs`

Features:
- Interactive endpoint testing
- Request/response examples
- Schema documentation
- Authentication testing

### ReDoc
**URL**: `http://localhost:8000/redoc`

Features:
- Clean, readable documentation
- Schema visualization
- Request/response examples
- Downloadable OpenAPI spec

### OpenAPI Schema
**URL**: `http://localhost:8000/openapi.json`

Features:
- Machine-readable API specification
- OpenAPI 3.0 format
- Use with code generators, testing tools, etc.

---

## Implementation Details

### File Structure

```
backend/src/
├── api/
│   ├── __init__.py
│   └── tasks.py              # All 6 task endpoints
├── auth/
│   ├── dependencies.py       # get_current_user() dependency
│   └── jwt.py               # JWT verification
├── models/
│   └── task.py              # SQLModel Task model
├── schemas/
│   └── task.py              # Pydantic schemas (TaskCreate, TaskUpdate, etc.)
├── errors/
│   └── handlers.py          # Custom exceptions and error handlers
├── database.py              # Database session management
├── config.py                # Configuration settings
└── main.py                  # FastAPI app initialization
```

### Dependencies

- **FastAPI**: Web framework
- **SQLModel**: ORM (SQLAlchemy + Pydantic)
- **Pydantic**: Request/response validation
- **PyJWT**: JWT token verification
- **psycopg2-binary**: PostgreSQL driver
- **python-dotenv**: Environment variable management

### Database Schema

```sql
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    title VARCHAR(500) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## Usage Examples

### Python (requests library)

```python
import requests

BASE_URL = "http://localhost:8000/api"
USER_ID = "550e8400-e29b-41d4-a716-446655440000"

# Set JWT cookie
cookies = {"better-auth.session.token": "<your_jwt_token>"}

# List all tasks
response = requests.get(f"{BASE_URL}/{USER_ID}/tasks", cookies=cookies)
tasks = response.json()

# Create task
response = requests.post(
    f"{BASE_URL}/{USER_ID}/tasks",
    json={"title": "New task", "completed": False},
    cookies=cookies
)
new_task = response.json()

# Update completion status
response = requests.patch(
    f"{BASE_URL}/{USER_ID}/tasks/{new_task['id']}",
    json={"completed": True},
    cookies=cookies
)
updated_task = response.json()

# Delete task
response = requests.delete(
    f"{BASE_URL}/{USER_ID}/tasks/{new_task['id']}",
    cookies=cookies
)
# Response: 204 No Content
```

### JavaScript (fetch API)

```javascript
const BASE_URL = "http://localhost:8000/api";
const USER_ID = "550e8400-e29b-41d4-a716-446655440000";

// List all tasks
const listTasks = async () => {
  const response = await fetch(`${BASE_URL}/${USER_ID}/tasks`, {
    credentials: "include", // Include cookies
  });
  const tasks = await response.json();
  return tasks;
};

// Create task
const createTask = async (title, completed = false) => {
  const response = await fetch(`${BASE_URL}/${USER_ID}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ title, completed }),
  });
  const task = await response.json();
  return task;
};

// Update completion status
const updateTaskCompletion = async (taskId, completed) => {
  const response = await fetch(`${BASE_URL}/${USER_ID}/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ completed }),
  });
  const task = await response.json();
  return task;
};

// Delete task
const deleteTask = async (taskId) => {
  const response = await fetch(`${BASE_URL}/${USER_ID}/tasks/${taskId}`, {
    method: "DELETE",
    credentials: "include",
  });
  // No response body (204 No Content)
};
```

### cURL

```bash
# List all tasks
curl -X GET \
  "http://localhost:8000/api/550e8400-e29b-41d4-a716-446655440000/tasks" \
  -H "Cookie: better-auth.session.token=<jwt_token>"

# Create task
curl -X POST \
  "http://localhost:8000/api/550e8400-e29b-41d4-a716-446655440000/tasks" \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session.token=<jwt_token>" \
  -d '{"title": "New task", "completed": false}'

# Update completion status
curl -X PATCH \
  "http://localhost:8000/api/550e8400-e29b-41d4-a716-446655440000/tasks/1" \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session.token=<jwt_token>" \
  -d '{"completed": true}'

# Full update
curl -X PUT \
  "http://localhost:8000/api/550e8400-e29b-41d4-a716-446655440000/tasks/1" \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session.token=<jwt_token>" \
  -d '{"title": "Updated task", "completed": true}'

# Delete task
curl -X DELETE \
  "http://localhost:8000/api/550e8400-e29b-41d4-a716-446655440000/tasks/1" \
  -H "Cookie: better-auth.session.token=<jwt_token>"

# Get single task
curl -X GET \
  "http://localhost:8000/api/550e8400-e29b-41d4-a716-446655440000/tasks/1" \
  -H "Cookie: better-auth.session.token=<jwt_token>"
```

---

## Next Steps

1. **Frontend Integration**: Use these endpoints in Next.js 16+ frontend
2. **Authentication**: Implement Better Auth for user signup/signin
3. **Database**: Set up Neon PostgreSQL and run migrations
4. **Deployment**: Deploy to production with proper environment variables
5. **Monitoring**: Add logging, metrics, and alerting
6. **Rate Limiting**: Implement rate limiting for API protection

---

## Support

For issues or questions:
- Check interactive docs: http://localhost:8000/docs
- Review test examples: `tests/test_tasks_api.py`
- Check error logs: Application logs contain detailed error information
