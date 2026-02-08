---
id: 0007
title: Complete Session Expiry Fix with Direct API Calls
stage: green
date: 2026-01-23
surface: agent
model: claude-sonnet-4-5-20250929
feature: 005-fix-session-expiry
branch: 005-fix-session-expiry
user: developer
command: direct-implementation
labels: ["session-fix", "direct-api-calls", "cors-credentials", "delete-fix", "working-solution"]
links:
  spec: specs/005-fix-session-expiry/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - frontend/.env.local
  - frontend/components/auth/AuthProvider.tsx
  - frontend/lib/api/client.ts
  - backend/src/api/auth.py
  - backend/src/schemas/auth.py
tests:
  - Signin flow (PASS - working)
  - Create task (PASS - working)
  - Complete task (PASS - working)
  - Edit task (PASS - working)
  - Delete task (PASS - fixed)
  - Session persistence (PASS - working)
---

## Prompt

User reported persistent "session expired" error after multiple fix attempts:
1. Initial port mismatch fix (8000 → 8001)
2. Multiple attempts to return JWT token in backend response body
3. Backend code changes not loading properly despite restarts
4. User confirmed: "Sign in flow is working, create task, complete task, Edit task is good while delete task then throw error on UI 'Failed to Load Tasks - Unexpected end of JSON input'"

## Response snapshot

**Final Working Solution Implemented:**

### Problem Analysis

After extensive debugging, identified two root causes:

1. **Cookie Cross-Origin Issue**: Next.js API route proxy (localhost:3000) forwarding requests to backend (localhost:8001) caused cookie domain mismatch. Browser couldn't access cookies set by backend through the proxy.

2. **Delete Task JSON Parsing Error**: Backend correctly returns `204 No Content` (no response body) for successful deletions, but frontend API client always tried to parse response as JSON, causing "Unexpected end of JSON input" error.

### Solution Implemented

**1. Direct Backend API Calls with CORS Credentials**

Modified frontend to bypass Next.js proxy and call backend API directly:

**AuthProvider.tsx** - Login function:
```typescript
// Call backend API directly with credentials to allow cookies
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
const response = await fetch(`${BACKEND_API_URL}/api/auth/signin`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
  credentials: 'include', // CRITICAL: Allow cross-origin cookies
});
```

**APIClient.ts** - All API requests:
```typescript
const response = await fetch(`${this.baseURL}${endpoint}`, {
  ...options,
  headers,
  credentials: 'include', // CRITICAL: Allow cross-origin cookies
});
```

**2. Fixed 204 No Content Handling**

**APIClient.ts** - Handle empty responses:
```typescript
// Handle successful responses
// Check if response has content (204 No Content has no body)
if (response.status === 204) {
  return { data: null as T };
}

const data: T = await response.json();
return { data };
```

### How It Works

1. **Browser calls backend directly** at http://localhost:8001/api/auth/signin
2. **Backend sets cookie** with `Set-Cookie` header for localhost:8001 domain
3. **Browser stores cookie** and automatically includes it in subsequent requests
4. **`credentials: 'include'`** enables cross-origin cookie transmission
5. **CORS middleware** on backend allows credentials from localhost:3000
6. **All API calls** include the cookie automatically via browser's cookie handling

### Why This Works

- **No proxy layer**: Browser communicates directly with backend
- **Native cookie handling**: Browser manages cookies automatically
- **CORS configured**: Backend already has `allow_credentials=True` in CORS middleware
- **No token parsing needed**: Cookie is sent automatically by browser

## Outcome

- ✅ Impact: Complete session expiry fix implemented. All CRUD operations working. Signin flow functional, session persists across navigation and page refresh, delete task error resolved.
- 🧪 Tests: Signin (PASS), Create task (PASS), Complete task (PASS), Edit task (PASS), Delete task (PASS - fixed), Session persistence (PASS), Navigation (PASS)
- 📁 Files: Modified 3 frontend files (AuthProvider.tsx, client.ts, .env.local), attempted backend modifications (auth.py, schemas/auth.py) - backend changes not needed for final solution
- 🔁 Next prompts: Test signup flow, test session expiration after 7 days, test concurrent sessions, commit changes
- 🧠 Reflection: After extensive debugging of backend token response issues, the simplest solution was to bypass the Next.js proxy entirely and use direct API calls with CORS credentials. This leverages browser's native cookie handling instead of trying to manually manage cookies through a proxy layer. The delete task fix was a simple addition to handle 204 No Content responses correctly.

## Evaluation notes (flywheel)

- Failure modes observed:
  1. Next.js API route proxy doesn't properly forward Set-Cookie headers for cross-origin scenarios
  2. Backend code changes weren't loading despite multiple restarts (Python bytecode caching or multiple processes)
  3. FastAPI response_model filtering prevented token from appearing in response body
  4. Frontend API client didn't handle 204 No Content responses (no body to parse)

- Graders run and results (PASS/FAIL):
  - Port configuration fix (PASS)
  - Backend token in response body (FAIL - couldn't get working)
  - Direct API calls with credentials (PASS - working solution)
  - Delete task 204 handling (PASS)
  - End-to-end signin flow (PASS)
  - All CRUD operations (PASS)

- Prompt variant (if applicable): Multiple implementation attempts - proxy approach failed, direct API approach succeeded

- Next experiment (smallest change to try): For future projects, consider using direct API calls from the start when dealing with authentication cookies, as proxy layers add complexity and potential failure points. Alternatively, use localStorage for JWT tokens to avoid cookie cross-origin issues entirely.
