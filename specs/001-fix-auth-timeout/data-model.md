# Data Model: Authentication Session Timeout Fix

**Feature**: 001-fix-auth-timeout
**Date**: 2026-02-10
**Status**: Complete

## Overview

This feature fixes authentication timeout issues without requiring database schema changes. The data model describes the runtime entities used for session management and authentication state tracking.

## Entities

### User Session

Represents an authenticated user's active connection to the application.

**Purpose**: Track session state and provide session information to the frontend.

**Attributes**:

| Attribute | Type | Description | Validation |
|-----------|------|-------------|------------|
| `user` | User | User information associated with the session | Required, must be valid User object |
| `token` | string | JWT token for authentication | Required, must be valid JWT format |
| `expiresAt` | number | Unix timestamp when session expires | Required, must be future timestamp |

**Relationships**:
- Belongs to one User (via user.id in JWT token)

**State Transitions**:
```
[No Session] --authenticate--> [Session Created] --verify--> [Session Valid]
                                                    |
                                                    v
                                              [Session Expired]
```

**Lifecycle**:
1. **Creation**: Session created when user successfully authenticates (signup/signin)
2. **Verification**: Session verified via backend API endpoint reading HttpOnly cookie
3. **Expiration**: Session expires after 7 days (JWT expiration time)
4. **Destruction**: Session destroyed when user logs out or token expires

**Storage**:
- **Backend**: JWT token stored in HttpOnly cookie (browser-managed)
- **Frontend**: Session data cached in React state after verification
- **Database**: No persistent storage (stateless JWT authentication)

**Example**:
```typescript
{
  user: {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "user@example.com"
  },
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  expiresAt: 1771285287  // Unix timestamp (7 days from creation)
}
```

---

### Authentication State

Represents the current status of user authentication in the frontend application.

**Purpose**: Control UI rendering, route access, and authentication flow behavior.

**Attributes**:

| Attribute | Type | Description | Validation |
|-----------|------|-------------|------------|
| `status` | AuthStatus | Current authentication status | Required, one of: unauthenticated, authenticating, authenticated, error |
| `user` | User \| null | Current user if authenticated | Optional, null when not authenticated |
| `error` | string \| null | Error message if authentication failed | Optional, null when no error |
| `isLoading` | boolean | Whether authentication check is in progress | Required, true during verification |

**Enum: AuthStatus**:
- `unauthenticated`: User is not logged in
- `authenticating`: Login/signup in progress
- `authenticated`: User is logged in with valid session
- `error`: Authentication failed or session invalid

**State Transitions**:
```
[unauthenticated] --login--> [authenticating] --success--> [authenticated]
                                    |
                                    |--failure--> [error] --retry--> [authenticating]

[authenticated] --logout--> [unauthenticated]
[authenticated] --session-expired--> [unauthenticated]
[authenticated] --page-refresh--> [authenticating] --verify--> [authenticated]
```

**Lifecycle**:
1. **Initial**: State is `unauthenticated` on app load
2. **Login**: State changes to `authenticating` when user submits credentials
3. **Verification**: Backend validates credentials and creates session
4. **Session Wait**: Frontend polls for session establishment (up to 3 seconds)
5. **Success**: State changes to `authenticated` with user data
6. **Persistence**: State maintained across page reloads via session verification
7. **Expiration**: State returns to `unauthenticated` when session expires

**Storage**:
- **Frontend**: React state in AuthProvider context
- **Persistence**: Restored from backend session endpoint on page load

**Example**:
```typescript
// Unauthenticated state
{
  status: 'unauthenticated',
  user: null,
  error: null,
  isLoading: false
}

// Authenticating state
{
  status: 'authenticating',
  user: null,
  error: null,
  isLoading: true
}

// Authenticated state
{
  status: 'authenticated',
  user: {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "user@example.com"
  },
  error: null,
  isLoading: false
}

// Error state
{
  status: 'error',
  user: null,
  error: "Session could not be established. Please try again.",
  isLoading: false
}
```

---

### User (Reference)

Represents a user account in the system. This entity already exists in the database and is not modified by this feature.

**Purpose**: Provide user identity information for session management.

**Attributes** (subset used in session management):

| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | string (UUID) | Unique user identifier |
| `email` | string | User's email address |

**Note**: Full User entity defined in existing database schema. Session management only uses id and email fields.

---

## Data Flow

### Authentication Flow

```
1. User submits credentials
   ↓
2. Frontend: AuthState = authenticating
   ↓
3. Backend: Validate credentials, generate JWT
   ↓
4. Backend: Set HttpOnly cookie with JWT token
   ↓
5. Frontend: Poll session endpoint (up to 3 seconds)
   ↓
6. Backend: Read cookie, verify JWT, return user data
   ↓
7. Frontend: Create UserSession from response
   ↓
8. Frontend: AuthState = authenticated with user data
```

### Session Verification Flow (Page Reload)

```
1. Page loads, AuthState = unauthenticated, isLoading = true
   ↓
2. Frontend: Call getSession() to check for existing session
   ↓
3. Frontend: GET /api/auth/session (browser includes HttpOnly cookie)
   ↓
4. Backend: Read cookie from request headers
   ↓
5. Backend: Verify JWT signature and expiration
   ↓
6. Backend: Return user data if valid, 401 if invalid
   ↓
7. Frontend: Create UserSession if valid
   ↓
8. Frontend: AuthState = authenticated (or unauthenticated if no session)
```

### Session Timeout Handling

```
1. Frontend: waitForSession() starts polling
   ↓
2. Frontend: Call checkSession() every 50ms
   ↓
3. Backend: Verify session via API call
   ↓
4. If session valid: Return true, stop polling
   ↓
5. If session invalid: Continue polling
   ↓
6. If timeout (3000ms) exceeded: Return false, show error
```

---

## Validation Rules

### User Session Validation

- **Token Format**: Must be valid JWT with three parts (header.payload.signature)
- **Token Expiration**: `expiresAt` must be in the future (current time < expiresAt)
- **User Data**: User object must contain valid id (UUID) and email (email format)

**Validation Logic**:
```typescript
function validateSession(session: UserSession): boolean {
  const currentTime = Math.floor(Date.now() / 1000);
  return session.expiresAt > currentTime;
}
```

### Authentication State Validation

- **Status**: Must be one of the defined AuthStatus enum values
- **User Consistency**: If status is 'authenticated', user must not be null
- **Error Consistency**: If status is 'error', error message should be present

---

## Performance Considerations

### Session Verification

- **Frequency**: Only on page load and after authentication
- **Caching**: Session data cached in React state, not re-fetched on every render
- **Timeout**: 3 second maximum wait for session establishment
- **Retry**: Single retry with 500ms delay if initial check fails

### Memory Usage

- **User Session**: ~500 bytes (user data + JWT token)
- **Authentication State**: ~200 bytes (status + user reference)
- **Total per user**: <1 KB in frontend memory

---

## Security Considerations

### Token Storage

- **HttpOnly Cookie**: JWT token stored in HttpOnly cookie (not accessible to JavaScript)
- **XSS Protection**: Even if malicious script executes, cannot steal token
- **CSRF Protection**: SameSite=Lax attribute prevents cross-site request forgery

### Session Validation

- **Signature Verification**: Backend verifies JWT signature on every session check
- **Expiration Check**: Both frontend and backend validate token expiration
- **User Lookup**: Backend confirms user exists in database before returning session data

### Data Exposure

- **Minimal Data**: Session only contains user id and email (no sensitive data)
- **Token in Response**: Token included in session endpoint response for API calls
- **No Password**: Password never stored in session or transmitted after authentication

---

## Database Schema

**No database changes required**. This feature uses existing `users` table and stateless JWT authentication.

**Existing Schema** (reference only):
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

---

## Migration Plan

**No migrations required**. This is a bug fix that modifies runtime behavior without changing data structures.

---

## Testing Considerations

### Unit Tests

- Validate session expiration logic
- Test authentication state transitions
- Verify session data structure

### Integration Tests

- Test session endpoint with valid/invalid cookies
- Verify session persistence across page reloads
- Test timeout handling with slow backend responses

### End-to-End Tests

- Complete authentication flow (signup → session → dashboard)
- Session persistence (login → refresh → still authenticated)
- Timeout scenarios (slow network, backend delay)

---

## Summary

This data model describes the runtime entities for session management without requiring database changes. The key entities are:

1. **User Session**: Runtime representation of authenticated session (JWT-based)
2. **Authentication State**: Frontend state machine for auth flow control
3. **User**: Existing database entity (reference only)

All session data is derived from JWT tokens stored in HttpOnly cookies, maintaining security while fixing timeout issues.
