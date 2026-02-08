# Data Model: Authentication & User Management System

**Feature**: 001-auth-user-management
**Date**: 2026-01-19
**Phase**: Phase 1 - Design

## Entity: User

**Purpose**: Represents an authenticated user account in the system

### Attributes

| Attribute | Type | Constraints | Description |
|-----------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, NOT NULL, AUTO-GENERATED | Unique identifier for the user |
| email | string | UNIQUE, NOT NULL, MAX_LENGTH(255) | User's email address (also serves as username) |
| passwordHash | string | NOT NULL, LENGTH(60) | Bcrypt hash of user's password (cost factor 12) |
| createdAt | timestamp | NOT NULL, DEFAULT NOW() | Account creation timestamp |
| updatedAt | timestamp | NOT NULL, DEFAULT NOW(), ON UPDATE NOW() | Last account modification timestamp |
| lastSignInAt | timestamp | NULLABLE | Timestamp of most recent successful signin |

### Validation Rules

- **email**:
  - Must match RFC 5322 email format: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
  - Must be lowercase (normalized on creation)
  - Maximum 255 characters
  - Must be unique across all users

- **password** (plaintext, before hashing):
  - Minimum 8 characters
  - Must contain at least one letter (a-z or A-Z)
  - Must contain at least one number (0-9)
  - No maximum length constraint (hashed to fixed 60-char bcrypt string)

- **passwordHash**:
  - Always 60 characters (bcrypt format: `$2b$12$...`)
  - Generated via bcrypt with cost factor 12
  - Never exposed in API responses

### TypeScript Interface

```typescript
// types/auth.ts
export interface User {
  id: string; // UUID
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  lastSignInAt: Date | null;
}

export interface UserCreateInput {
  email: string;
  password: string; // Plaintext, will be hashed
}

export interface UserSignInInput {
  email: string;
  password: string; // Plaintext, will be verified against hash
}

export interface UserResponse {
  id: string;
  email: string;
  createdAt: string; // ISO 8601 format
  lastSignInAt: string | null; // ISO 8601 format
  // passwordHash intentionally excluded
}
```

### State Transitions

```
[New User]
    ↓ (submit signup form with valid email/password)
[Account Created] → User.createdAt set, User.lastSignInAt = null
    ↓ (successful signup)
[Authenticated] → JWT token issued, User.lastSignInAt updated
    ↓ (token expires after 7 days OR user signs out)
[Unauthenticated]
    ↓ (submit signin form with valid credentials)
[Authenticated] → New JWT token issued, User.lastSignInAt updated
```

### Relationships

**Phase 1 (Current)**:
- No relationships (User entity is self-contained)

**Phase 2 (Future - Todo CRUD)**:
- User → Todos (one-to-many): A user can have many todos
- Foreign key: `todos.user_id` references `users.id`
- Cascade delete: When user deleted, all their todos are deleted

## Entity: JWT Token

**Purpose**: Represents an authentication credential containing user identity

**Note**: JWT tokens are NOT stored in the database. They are stateless, self-contained credentials signed with BETTER_AUTH_SECRET. This entity documents the token structure for integration purposes.

### Token Structure

```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "iat": 1705651200,
  "exp": 1706256000
}
```

### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| userId | string (UUID) | References User.id - used by backend to identify user |
| email | string | User's email for display purposes (convenience) |
| iat (issued at) | number | Unix timestamp when token was issued |
| exp (expiration) | number | Unix timestamp when token expires (iat + 604800 seconds = 7 days) |

### Signature

- Algorithm: HMAC-SHA256 (HS256)
- Secret: BETTER_AUTH_SECRET (minimum 32 characters)
- Format: JWT standard (header.payload.signature)
- Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJpYXQiOjE3MDU2NTEyMDAsImV4cCI6MTcwNjI1NjAwMH0.signature`

### Validation Rules

- **Signature verification**: Must match HMAC-SHA256(header.payload, BETTER_AUTH_SECRET)
- **Expiration check**: Current time < exp (reject expired tokens with 401)
- **Required claims**: userId and email must be present
- **Format check**: Must be valid JWT structure (3 base64-encoded parts separated by dots)

### TypeScript Interface

```typescript
// types/auth.ts
export interface JWTPayload {
  userId: string; // UUID
  email: string;
  iat: number; // Unix timestamp (seconds)
  exp: number; // Unix timestamp (seconds)
}

export interface JWTToken {
  token: string; // Full JWT string (header.payload.signature)
  expiresAt: Date; // Human-readable expiration time
}
```

### Storage

- **Location**: httpOnly cookie named `better-auth.session.token`
- **Cookie attributes**:
  - `httpOnly: true` (prevents JavaScript access)
  - `secure: true` (production only, requires HTTPS)
  - `sameSite: "lax"` (prevents CSRF, allows top-level navigation)
  - `maxAge: 604800` (7 days in seconds)
  - `path: "/"` (available to all routes)

## Entity: Authentication Session

**Purpose**: Represents the state of a user's authenticated session

**Note**: This is a logical entity, not a database table. State is maintained via JWT token in cookies.

### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| jwtToken | JWT Token | The JWT token containing user identity and expiration |
| userId | string (UUID) | Extracted from JWT token payload |
| email | string | Extracted from JWT token payload |
| isAuthenticated | boolean | Derived from token validity (signature + expiration check) |
| expiresAt | Date | Token expiration time (for UI display) |

### TypeScript Interface

```typescript
// types/auth.ts
export interface AuthSession {
  isAuthenticated: boolean;
  userId: string | null;
  email: string | null;
  expiresAt: Date | null;
}

export interface AuthContext {
  session: AuthSession;
  signIn: (email: string, password: string) => Promise<UserResponse>;
  signUp: (email: string, password: string) => Promise<UserResponse>;
  signOut: () => Promise<void>;
}
```

### State Transitions

```
[Unauthenticated] → isAuthenticated: false, userId: null
    ↓ (successful signup or signin)
[Authenticated] → isAuthenticated: true, userId: <UUID>, expiresAt: <Date>
    ↓ (token expires OR user signs out)
[Unauthenticated] → isAuthenticated: false, userId: null
```

## Database Schema (PostgreSQL)

**Note**: Database implementation deferred to Spec 2 (backend). Schema provided here for reference and future integration.

```sql
-- User table (to be implemented in Spec 2)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash CHAR(60) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_sign_in_at TIMESTAMP NULL
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
```

## Data Flow Diagrams

### Signup Flow

```
User → SignupForm → POST /api/auth/signup → Better Auth
                                                ↓
                                         Validate email format
                                                ↓
                                         Check email uniqueness (future: DB)
                                                ↓
                                         Hash password (bcrypt)
                                                ↓
                                         Create user record (future: DB)
                                                ↓
                                         Generate JWT token
                                                ↓
                                         Set httpOnly cookie
                                                ↓
                                         Return UserResponse
                                                ↓
User ← Redirect to dashboard ← 201 Created + cookie
```

### Signin Flow

```
User → SigninForm → POST /api/auth/signin → Better Auth
                                               ↓
                                        Retrieve user by email (future: DB)
                                               ↓
                                        Verify password hash (bcrypt)
                                               ↓
                                        Generate fresh JWT token
                                               ↓
                                        Update last_sign_in_at (future: DB)
                                               ↓
                                        Set httpOnly cookie
                                               ↓
                                        Return UserResponse
                                               ↓
User ← Redirect to dashboard ← 200 OK + cookie
```

### Token Validation Flow (Spec 2 - FastAPI)

```
Browser → API Request + Cookie → Extract JWT from cookie
                                        ↓
                                 Verify signature (BETTER_AUTH_SECRET)
                                        ↓
                                 Check expiration (exp > now)
                                        ↓
                                 Decode payload (userId, email)
                                        ↓
                                 Extract userId from URL
                                        ↓
                                 Compare token.userId === URL.userId
                                        ↓
                                 Return 403 if mismatch
                                        ↓
                                 Return 401 if invalid/expired
                                        ↓
                                 Proceed with request if valid
```

## Error Cases

### Signup Errors

| Error | HTTP Status | Response Body |
|-------|-------------|---------------|
| Email already registered | 409 Conflict | `{"error": "Email already registered"}` |
| Invalid email format | 400 Bad Request | `{"error": "Invalid email format"}` |
| Weak password | 400 Bad Request | `{"error": "Password must be at least 8 characters and include letters and numbers"}` |
| Missing required fields | 400 Bad Request | `{"error": "Email and password are required"}` |

### Signin Errors

| Error | HTTP Status | Response Body |
|-------|-------------|---------------|
| Invalid credentials | 401 Unauthorized | `{"error": "Invalid email or password"}` |
| Rate limit exceeded | 429 Too Many Requests | `{"error": "Too many attempts. Try again in 15 minutes"}` |
| Missing required fields | 400 Bad Request | `{"error": "Email and password are required"}` |

### Token Validation Errors (Spec 2)

| Error | HTTP Status | Response Body |
|-------|-------------|---------------|
| Token expired | 401 Unauthorized | `{"error": "Token expired"}` |
| Invalid signature | 401 Unauthorized | `{"error": "Invalid token signature"}` |
| Missing token | 401 Unauthorized | `{"error": "Missing authentication token"}` |
| User ID mismatch | 403 Forbidden | `{"error": "Access denied"}` |

## Integration with Spec 2

### Data Sharing

**From Spec 1 (Frontend Auth) to Spec 2 (Backend API)**:
- JWT token transmitted via httpOnly cookie
- Token contains `userId` for database queries
- Token contains `email` for convenience (optional)

**From Spec 2 (Backend DB) to Spec 1 (Frontend Auth)**:
- User table provides email uniqueness validation
- User table stores password hashes for signin verification
- User table tracks `last_sign_in_at` for audit trail

### Shared Secret

- `BETTER_AUTH_SECRET` must be identical in both services
- Recommend 64-character random string: `openssl rand -base64 64`
- Store in `.env` files for both frontend and backend
- Never commit secrets to version control

### Migration Path

**Phase 1 (Current - Frontend Only)**:
- Better Auth configured with mock user storage (in-memory for testing)
- JWT token generation functional and testable
- Cookie storage and client-side validation complete

**Phase 2 (Future - Backend Integration)**:
- Replace mock storage with Neon PostgreSQL database
- Implement FastAPI endpoints for token validation
- Add database migrations for `users` table
- Connect Better Auth to real database via adapter

## Conclusion

Data model defines 3 entities:
1. **User**: Persistent database entity (implementation in Spec 2)
2. **JWT Token**: Stateless credential (no database storage)
3. **Authentication Session**: Logical entity (derived from JWT token)

User entity is self-contained in Phase 1. Relationships to Todos entity will be added in Phase 2 (database implementation).

JWT token structure is finalized and compatible with FastAPI verification. Shared secret (BETTER_AUTH_SECRET) enables cryptographic trust between services.
