# API Contract: Frontend ↔ Backend Integration

**Feature**: 003-frontend-ui-integration
**Backend Spec**: 002-backend-api-db
**Date**: 2026-01-19
**Status**: Contract Definition

---

## Overview

This document defines the complete API contract between the Next.js frontend (Spec 003) and the FastAPI backend (Spec 002). All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

**Base URL (Development)**: `http://localhost:8000`
**Base URL (Production)**: `https://api.yourdomain.com` (TBD)

---

## Authentication

### Header Format

All API requests (except auth endpoints) MUST include the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### JWT Token Structure

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "iat": 1674123456,
  "exp": 1674728256
}
```

- **userId**: UUID v4 format, used in API endpoint paths
- **email**: User's email address
- **iat**: Issued at (Unix timestamp)
- **exp**: Expiration (Unix timestamp, 7 days from iat)

### Authentication Errors

- **401 Unauthorized**: Missing, invalid, or expired JWT token
- **403 Forbidden**: Valid token but user_id mismatch (user accessing another user's data)

---

## Endpoint Catalog

| Endpoint | Method | Purpose | Auth Required | Functional Requirements |
|----------|--------|---------|---------------|-------------------------|
| `/api/{user_id}/tasks` | GET | List all tasks | Yes | FR-006 |
| `/api/{user_id}/tasks/{task_id}` | GET | Get single task | Yes | (Optional) |
| `/api/{user_id}/tasks` | POST | Create new task | Yes | FR-013, FR-014 |
| `/api/{user_id}/tasks/{task_id}` | PATCH | Toggle completion | Yes | FR-017, FR-018 |
| `/api/{user_id}/tasks/{task_id}` | PUT | Update task fully | Yes | FR-023 |
| `/api/{user_id}/tasks/{task_id}` | DELETE | Delete task | Yes | FR-027 |

---

## Endpoint Specifications

### 1. List All Tasks

**Endpoint**: `GET /api/{user_id}/tasks`

**Description**: Retrieve all tasks for the authenticated user.

**Path Parameters**:
- `user_id` (string, UUID v4): User identifier, MUST match JWT token's userId

**Request Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Example**:
```http
GET /api/550e8400-e29b-41d4-a716-446655440000/tasks HTTP/1.1
Host: localhost:8000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200 OK):
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Buy groceries",
    "completed": false,
    "created_at": "2026-01-19T10:30:00Z",
    "updated_at": "2026-01-19T10:30:00Z"
  },
  {
    "id": "223e4567-e89b-12d3-a456-426614174001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Write report",
    "completed": true,
    "created_at": "2026-01-18T14:20:00Z",
    "updated_at": "2026-01-19T09:15:00Z"
  }
]
```

**Response Fields**:
- `id`: Task UUID
- `user_id`: Owner user UUID
- `title`: Task description (1-500 characters)
- `completed`: Boolean completion status
- `created_at`: ISO 8601 timestamp
- `updated_at`: ISO 8601 timestamp

**Empty List Response** (200 OK):
```json
[]
```

**Error Responses**:
- **401 Unauthorized**: Missing or invalid JWT token
  ```json
  {
    "detail": "Could not validate credentials"
  }
  ```
- **403 Forbidden**: user_id in URL doesn't match JWT userId
  ```json
  {
    "detail": "Not authorized to access this resource"
  }
  ```
- **500 Internal Server Error**: Database error
  ```json
  {
    "detail": "Internal server error"
  }
  ```

**Frontend Implementation**: FR-006 (fetch and display all tasks on dashboard load)

**Performance**: Response time MUST be <2 seconds (FR-040)

---

### 2. Get Single Task

**Endpoint**: `GET /api/{user_id}/tasks/{task_id}`

**Description**: Retrieve a specific task by ID. (Optional endpoint, may not be used by frontend)

**Path Parameters**:
- `user_id` (string, UUID v4): User identifier
- `task_id` (string, UUID v4): Task identifier

**Request Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Example**:
```http
GET /api/550e8400-e29b-41d4-a716-446655440000/tasks/123e4567-e89b-12d3-a456-426614174000 HTTP/1.1
Host: localhost:8000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200 OK):
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Buy groceries",
  "completed": false,
  "created_at": "2026-01-19T10:30:00Z",
  "updated_at": "2026-01-19T10:30:00Z"
}
```

**Error Responses**:
- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: user_id mismatch
- **404 Not Found**: Task does not exist or user doesn't own it
  ```json
  {
    "detail": "Task not found"
  }
  ```

**Frontend Usage**: Optional, currently not required by any functional requirement

---

### 3. Create New Task

**Endpoint**: `POST /api/{user_id}/tasks`

**Description**: Create a new task for the authenticated user.

**Path Parameters**:
- `user_id` (string, UUID v4): User identifier, MUST match JWT token's userId

**Request Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "title": "Buy groceries"
}
```

**Request Body Schema**:
- `title` (string, required): Task description
  - Min length: 1 character
  - Max length: 500 characters
  - Cannot be empty or whitespace-only

**Request Example**:
```http
POST /api/550e8400-e29b-41d4-a716-446655440000/tasks HTTP/1.1
Host: localhost:8000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "Buy groceries"
}
```

**Success Response** (201 Created):
```json
{
  "id": "323e4567-e89b-12d3-a456-426614174002",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Buy groceries",
  "completed": false,
  "created_at": "2026-01-19T11:00:00Z",
  "updated_at": "2026-01-19T11:00:00Z"
}
```

**Error Responses**:
- **400 Bad Request**: Invalid input (empty title, title too long, etc.)
  ```json
  {
    "detail": [
      {
        "loc": ["body", "title"],
        "msg": "ensure this value has at least 1 characters",
        "type": "value_error.any_str.min_length"
      }
    ]
  }
  ```
- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: user_id mismatch
- **500 Internal Server Error**: Database error

**Frontend Implementation**:
- FR-011: Provide input field and "Add Task" button
- FR-012: Validate title not empty before submission
- FR-013: Send POST request on form submit
- FR-014: Add newly created task to UI immediately
- FR-015: Clear input field after successful creation

**Performance**: UI update MUST complete within 1 second (FR-040)

---

### 4. Toggle Task Completion

**Endpoint**: `PATCH /api/{user_id}/tasks/{task_id}`

**Description**: Toggle the completion status of a task (completed ↔ incomplete).

**Path Parameters**:
- `user_id` (string, UUID v4): User identifier
- `task_id` (string, UUID v4): Task identifier

**Request Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "completed": true
}
```

**Request Body Schema**:
- `completed` (boolean, required): New completion status
  - `true`: Mark as completed
  - `false`: Mark as incomplete

**Request Example**:
```http
PATCH /api/550e8400-e29b-41d4-a716-446655440000/tasks/123e4567-e89b-12d3-a456-426614174000 HTTP/1.1
Host: localhost:8000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "completed": true
}
```

**Success Response** (200 OK):
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Buy groceries",
  "completed": true,
  "created_at": "2026-01-19T10:30:00Z",
  "updated_at": "2026-01-19T11:05:00Z"
}
```

**Error Responses**:
- **400 Bad Request**: Invalid input (missing completed field, wrong type)
- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: user_id mismatch
- **404 Not Found**: Task does not exist or user doesn't own it
- **500 Internal Server Error**: Database error

**Frontend Implementation**:
- FR-016: Display checkbox for each task
- FR-017: Send PATCH request when checkbox toggled
- FR-018: Update task visual appearance immediately (strikethrough, opacity)
- FR-019: Revert checkbox if API request fails, display error message

**Performance**: UI update MUST complete within 1 second

---

### 5. Update Task (Full Update)

**Endpoint**: `PUT /api/{user_id}/tasks/{task_id}`

**Description**: Fully update a task's title and/or completion status.

**Path Parameters**:
- `user_id` (string, UUID v4): User identifier
- `task_id` (string, UUID v4): Task identifier

**Request Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "title": "Buy groceries and cook dinner",
  "completed": false
}
```

**Request Body Schema**:
- `title` (string, required): New task description
  - Min length: 1 character
  - Max length: 500 characters
- `completed` (boolean, optional): Completion status (defaults to current value if omitted)

**Request Example**:
```http
PUT /api/550e8400-e29b-41d4-a716-446655440000/tasks/123e4567-e89b-12d3-a456-426614174000 HTTP/1.1
Host: localhost:8000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "Buy groceries and cook dinner",
  "completed": false
}
```

**Success Response** (200 OK):
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Buy groceries and cook dinner",
  "completed": false,
  "created_at": "2026-01-19T10:30:00Z",
  "updated_at": "2026-01-19T11:10:00Z"
}
```

**Error Responses**:
- **400 Bad Request**: Invalid input (empty title, title too long)
- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: user_id mismatch
- **404 Not Found**: Task does not exist or user doesn't own it
- **500 Internal Server Error**: Database error

**Frontend Implementation**:
- FR-020: Provide "Edit" button for each task
- FR-021: Switch task to edit mode with input field showing current title
- FR-022: Provide "Save" and "Cancel" buttons in edit mode
- FR-023: Send PUT request with updated title when "Save" clicked
- FR-024: Restore original title and exit edit mode when "Cancel" clicked

**Validation**:
- FR-012 equivalent: Validate title not empty before submission
- Show validation error "Task title cannot be empty" if empty

**Performance**: UI update MUST complete within 1 second

---

### 6. Delete Task

**Endpoint**: `DELETE /api/{user_id}/tasks/{task_id}`

**Description**: Permanently delete a task.

**Path Parameters**:
- `user_id` (string, UUID v4): User identifier
- `task_id` (string, UUID v4): Task identifier

**Request Headers**:
```
Authorization: Bearer <jwt_token>
```

**Request Example**:
```http
DELETE /api/550e8400-e29b-41d4-a716-446655440000/tasks/123e4567-e89b-12d3-a456-426614174000 HTTP/1.1
Host: localhost:8000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (204 No Content):
```
(Empty body)
```

**Error Responses**:
- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: user_id mismatch
- **404 Not Found**: Task does not exist or user doesn't own it
  ```json
  {
    "detail": "Task not found"
  }
  ```
- **500 Internal Server Error**: Database error

**Frontend Implementation**:
- FR-025: Provide "Delete" button for each task
- FR-026: Show confirmation dialog before deletion ("Are you sure you want to delete this task?")
- FR-027: Send DELETE request when user confirms, remove task from UI immediately

**Error Handling**:
- If request fails, keep task in list and display error "Failed to delete task. Please try again."
- Provide retry button (FR-030)

**Performance**: UI update MUST complete within 1 second

---

## Error Handling

### HTTP Status Codes

| Status | Meaning | Frontend Action |
|--------|---------|----------------|
| 200 OK | Request succeeded | Update UI with response data |
| 201 Created | Resource created | Add new resource to UI |
| 204 No Content | Resource deleted | Remove resource from UI |
| 400 Bad Request | Invalid input | Display validation error message |
| 401 Unauthorized | Invalid/expired token | Clear session, redirect to /login |
| 403 Forbidden | Insufficient permissions | Display "You don't have permission" message |
| 404 Not Found | Resource not found | Display "Task not found" error |
| 500 Internal Server Error | Server error | Display "Server error. Please try again." with retry button |

### Error Response Format

All error responses follow this structure:

```json
{
  "detail": "Error message string or array of validation errors"
}
```

**Validation Error Example** (400 Bad Request):
```json
{
  "detail": [
    {
      "loc": ["body", "title"],
      "msg": "ensure this value has at least 1 characters",
      "type": "value_error.any_str.min_length"
    }
  ]
}
```

### Frontend Error Handling Requirements

- **FR-028**: Display user-friendly error messages for all failed API requests
- **FR-029**: Show specific error messages based on error type:
  - 400 → "Invalid input. Please check your data."
  - 401 → "Session expired. Please log in again." (auto-redirect)
  - 403 → "You don't have permission to access this resource."
  - 404 → "Task not found."
  - 500 → "Server error. Please try again."
  - Network error → "Unable to connect to server. Please check your internet connection."
- **FR-030**: Provide retry mechanism (retry button in error message)
- **FR-031**: Disable action buttons during API requests to prevent duplicate submissions

---

## CORS Configuration

**Backend MUST enable CORS** for frontend origin:

```python
# Backend CORS configuration (Spec 2)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Production**: Update `allow_origins` to include production frontend URL

---

## Request Examples (TypeScript)

### API Client Wrapper

```typescript
// lib/api/client.ts
export class APIClient {
  private baseURL: string
  private getToken: () => string | null

  constructor(baseURL: string, getToken: () => string | null) {
    this.baseURL = baseURL
    this.getToken = getToken
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const token = this.getToken()
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new APIError(response.status, errorData.detail)
    }

    if (response.status === 204) {
      return undefined as T // No content
    }

    return response.json()
  }

  async listTasks(userId: string): Promise<Task[]> {
    return this.request<Task[]>(`/api/${userId}/tasks`)
  }

  async createTask(userId: string, data: CreateTaskRequest): Promise<Task> {
    return this.request<Task>(`/api/${userId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async toggleTaskCompletion(userId: string, taskId: string, completed: boolean): Promise<Task> {
    return this.request<Task>(`/api/${userId}/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed }),
    })
  }

  async updateTask(userId: string, taskId: string, data: UpdateTaskRequest): Promise<Task> {
    return this.request<Task>(`/api/${userId}/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteTask(userId: string, taskId: string): Promise<void> {
    return this.request<void>(`/api/${userId}/tasks/${taskId}`, {
      method: 'DELETE',
    })
  }
}

class APIError extends Error {
  constructor(public status: number, public detail: string) {
    super(`API Error ${status}: ${detail}`)
    this.name = 'APIError'
  }
}
```

---

## Testing the API Contract

### Prerequisites
1. Backend server running on `http://localhost:8000` (Spec 2)
2. Valid JWT token obtained from Better Auth (Spec 1)
3. User ID extracted from JWT token payload

### Manual Testing with cURL

**1. List Tasks**:
```bash
curl -X GET "http://localhost:8000/api/550e8400-e29b-41d4-a716-446655440000/tasks" \
  -H "Authorization: Bearer <your_jwt_token>"
```

**2. Create Task**:
```bash
curl -X POST "http://localhost:8000/api/550e8400-e29b-41d4-a716-446655440000/tasks" \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy groceries"}'
```

**3. Toggle Completion**:
```bash
curl -X PATCH "http://localhost:8000/api/550e8400-e29b-41d4-a716-446655440000/tasks/123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

**4. Update Task**:
```bash
curl -X PUT "http://localhost:8000/api/550e8400-e29b-41d4-a716-446655440000/tasks/123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy groceries and cook dinner", "completed": false}'
```

**5. Delete Task**:
```bash
curl -X DELETE "http://localhost:8000/api/550e8400-e29b-41d4-a716-446655440000/tasks/123e4567-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <your_jwt_token>"
```

### Integration Tests (Jest)

```typescript
// __tests__/integration/api/tasks.test.ts
describe('Task API Integration', () => {
  let apiClient: APIClient
  let userId: string
  let mockToken: string

  beforeAll(() => {
    mockToken = 'mock_jwt_token_here'
    userId = '550e8400-e29b-41d4-a716-446655440000'
    apiClient = new APIClient('http://localhost:8000', () => mockToken)
  })

  it('should list all tasks', async () => {
    const tasks = await apiClient.listTasks(userId)
    expect(Array.isArray(tasks)).toBe(true)
  })

  it('should create a new task', async () => {
    const newTask = await apiClient.createTask(userId, { title: 'Test task' })
    expect(newTask).toHaveProperty('id')
    expect(newTask.title).toBe('Test task')
    expect(newTask.completed).toBe(false)
  })

  it('should toggle task completion', async () => {
    const task = await apiClient.createTask(userId, { title: 'Toggle test' })
    const toggled = await apiClient.toggleTaskCompletion(userId, task.id, true)
    expect(toggled.completed).toBe(true)
  })

  it('should update task title', async () => {
    const task = await apiClient.createTask(userId, { title: 'Original title' })
    const updated = await apiClient.updateTask(userId, task.id, { title: 'New title', completed: false })
    expect(updated.title).toBe('New title')
  })

  it('should delete task', async () => {
    const task = await apiClient.createTask(userId, { title: 'To be deleted' })
    await apiClient.deleteTask(userId, task.id)
    // Verify task no longer exists
    await expect(apiClient.listTasks(userId)).resolves.not.toContainEqual(
      expect.objectContaining({ id: task.id })
    )
  })

  it('should handle 401 Unauthorized', async () => {
    const invalidClient = new APIClient('http://localhost:8000', () => 'invalid_token')
    await expect(invalidClient.listTasks(userId)).rejects.toThrow(APIError)
  })
})
```

---

## Summary

This API contract defines:
1. **6 RESTful endpoints** for complete task CRUD operations
2. **JWT authentication** via Authorization header on all requests
3. **Consistent error handling** with HTTP status codes and JSON error responses
4. **Type-safe TypeScript client** with automatic token injection
5. **Comprehensive testing strategy** (manual cURL, integration tests)

All endpoints align with Backend API implementation (Spec 2) and fulfill Frontend functional requirements (FR-001 to FR-043).

**Next Step**: Implement API client (`lib/api/client.ts`) and integrate with React components.
