# Quickstart: Authentication & User Management System

**Feature**: 001-auth-user-management
**Date**: 2026-01-19
**Purpose**: Setup instructions for developers implementing JWT-based authentication

## Prerequisites

- Node.js 20+ installed
- npm or pnpm package manager
- Next.js 16+ project initialized
- Code editor (VS Code recommended)
- Terminal access

## Installation

### 1. Install Dependencies

```bash
# Navigate to frontend directory
cd frontend

# Install Better Auth and related packages
npm install better-auth bcryptjs jsonwebtoken zod

# Install TypeScript types (dev dependencies)
npm install -D @types/bcryptjs @types/jsonwebtoken

# Install testing dependencies (optional but recommended)
npm install -D @testing-library/react @testing-library/jest-dom @playwright/test
```

### 2. Environment Variables Setup

Create `.env.local` file in the frontend root:

```bash
# .env.local (DO NOT commit this file)
BETTER_AUTH_SECRET=your-64-character-random-secret-here-replace-this-value
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/todo_app
```

**Generate a secure secret**:

```bash
# Use OpenSSL to generate a random secret
openssl rand -base64 64

# Copy the output to BETTER_AUTH_SECRET in .env.local
```

**Create `.env.example`** (safe to commit):

```env
# .env.example
BETTER_AUTH_SECRET=generate-with-openssl-rand-base64-64
NODE_ENV=development
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

### 3. Project Structure Setup

Create the following directory structure:

```bash
# From frontend/ directory
mkdir -p src/app/api/auth/signup
mkdir -p src/app/api/auth/signin
mkdir -p src/app/\(auth\)/signup
mkdir -p src/app/\(auth\)/signin
mkdir -p src/components/auth
mkdir -p src/lib/auth
mkdir -p src/types
mkdir -p tests/integration
mkdir -p tests/e2e
```

## Configuration

### 1. Environment Variable Validation

Create `src/lib/env.ts`:

```typescript
import { z } from "zod";

const envSchema = z.object({
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "Secret must be at least 32 characters"),
  NODE_ENV: z.enum(["development", "production", "test"]),
  DATABASE_URL: z.string().url().optional(),
});

export const env = envSchema.parse(process.env);
```

### 2. Better Auth Configuration

Create `src/lib/auth/better-auth.ts`:

```typescript
import { createAuth } from "better-auth";
import { jwtPlugin } from "better-auth/plugins";
import { env } from "../env";

export const auth = createAuth({
  plugins: [
    jwtPlugin({
      secret: env.BETTER_AUTH_SECRET,
      expiresIn: "7d", // 604800 seconds
      payload: (user) => ({
        userId: user.id,
        email: user.email,
      }),
    }),
  ],
  cookies: {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 604800, // 7 days in seconds
    path: "/",
  },
});
```

### 3. TypeScript Types

Create `src/types/auth.ts`:

```typescript
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
  password: string;
}

export interface UserSignInInput {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  email: string;
  createdAt: string; // ISO 8601
  lastSignInAt: string | null;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export interface AuthSession {
  isAuthenticated: boolean;
  userId: string | null;
  email: string | null;
  expiresAt: Date | null;
}
```

## Implementation Checklist

### Phase 1: Setup (Completed Above)
- [x] Install dependencies
- [x] Configure environment variables
- [x] Create directory structure
- [x] Set up Better Auth configuration
- [x] Define TypeScript types

### Phase 2: Backend API Routes
- [ ] Implement `src/app/api/auth/signup/route.ts`
- [ ] Implement `src/app/api/auth/signin/route.ts`
- [ ] Add email validation helper (`src/lib/auth/validation.ts`)
- [ ] Add rate limiting middleware (`src/lib/auth/rate-limit.ts`)

### Phase 3: Frontend UI Components
- [ ] Create `SignupForm.tsx` component
- [ ] Create `SigninForm.tsx` component
- [ ] Create `AuthErrorDisplay.tsx` component
- [ ] Implement signup page (`src/app/(auth)/signup/page.tsx`)
- [ ] Implement signin page (`src/app/(auth)/signin/page.tsx`)

### Phase 4: Testing
- [ ] Write integration tests for signup flow
- [ ] Write integration tests for signin flow
- [ ] Write E2E tests with Playwright
- [ ] Test JWT token structure and expiration

### Phase 5: Documentation
- [ ] Document API endpoints in README
- [ ] Add inline code comments
- [ ] Update environment variable documentation

## Testing

### Run Unit Tests

```bash
# Run Jest tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Run E2E Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run E2E tests in headed mode (see browser)
npm run test:e2e -- --headed

# Run specific test file
npm run test:e2e tests/e2e/auth-journey.spec.ts
```

### Manual Testing

#### Test Signup Flow

```bash
# Start development server
npm run dev

# Visit http://localhost:3000/signup
# Fill in form:
# - Email: test@example.com
# - Password: TestPass123
# Click "Sign Up"
# Expected: Redirect to dashboard, cookie set
```

#### Test Signin Flow

```bash
# Visit http://localhost:3000/signin
# Fill in form:
# - Email: test@example.com
# - Password: TestPass123
# Click "Sign In"
# Expected: Redirect to dashboard, cookie set
```

#### Verify JWT Token

```bash
# Open browser DevTools → Application → Cookies
# Check for cookie: better-auth.session.token
# Verify attributes:
# - HttpOnly: ✓
# - Secure: ✓ (in production)
# - SameSite: Lax
# - Max-Age: 604800 (7 days)
```

## Debugging

### Common Issues

#### 1. "BETTER_AUTH_SECRET is not defined"

**Cause**: Environment variable not loaded

**Solution**:
```bash
# Check .env.local exists and contains the secret
cat .env.local

# Restart Next.js dev server to reload env vars
npm run dev
```

#### 2. "Invalid token signature"

**Cause**: Secret mismatch between frontend and backend

**Solution**:
```bash
# Verify secret is identical in both .env.local files
echo $BETTER_AUTH_SECRET  # Frontend
echo $BETTER_AUTH_SECRET  # Backend (Spec 2)

# Regenerate secret if needed
openssl rand -base64 64
```

#### 3. "Email already registered"

**Cause**: Attempting to signup with existing email

**Solution**:
```bash
# Use different email OR
# Delete test user from database (Spec 2):
# DELETE FROM users WHERE email = 'test@example.com';
```

#### 4. "Too many attempts"

**Cause**: Rate limiting triggered (5 failed attempts per 15 minutes)

**Solution**:
```bash
# Wait 15 minutes OR
# Restart dev server to clear in-memory rate limit store
npm run dev
```

## Security Checklist

Before deploying to production:

- [ ] `BETTER_AUTH_SECRET` is at least 64 characters
- [ ] `BETTER_AUTH_SECRET` is identical in frontend and backend `.env` files
- [ ] `.env.local` is in `.gitignore` (never commit secrets)
- [ ] `NODE_ENV=production` is set in production environment
- [ ] HTTPS is enabled in production (for Secure cookie flag)
- [ ] Rate limiting is enabled on auth endpoints
- [ ] Error messages are generic (no email enumeration)
- [ ] Password validation enforced (min 8 chars, letters + numbers)
- [ ] httpOnly cookies prevent XSS attacks
- [ ] SameSite=Lax prevents CSRF attacks

## Integration with Spec 2 (Backend)

### Shared Secret Setup

**Frontend (.env.local)**:
```env
BETTER_AUTH_SECRET=your-shared-secret-here
```

**Backend (.env)**:
```env
BETTER_AUTH_SECRET=your-shared-secret-here  # MUST MATCH FRONTEND
```

### JWT Verification in FastAPI

**FastAPI will verify tokens using**:

```python
# backend/src/auth/jwt_verification.py
import jwt
import os

BETTER_AUTH_SECRET = os.getenv("BETTER_AUTH_SECRET")

def verify_jwt_token(token: str) -> dict:
    """
    Verify JWT token from Better Auth frontend
    Returns payload containing userId and email
    Raises jwt.ExpiredSignatureError or jwt.InvalidTokenError
    """
    payload = jwt.decode(
        token,
        BETTER_AUTH_SECRET,
        algorithms=["HS256"]
    )
    return {
        "user_id": payload["userId"],
        "email": payload["email"]
    }
```

### Token Extraction in FastAPI

```python
# Extract from Cookie header
from fastapi import Cookie, HTTPException

async def get_current_user(
    better_auth_session_token: str = Cookie(None, alias="better-auth.session.token")
) -> dict:
    if not better_auth_session_token:
        raise HTTPException(status_code=401, detail="Missing authentication token")

    try:
        return verify_jwt_token(better_auth_session_token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token signature")
```

## Resources

### Documentation
- [Better Auth Docs](https://betterauth.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [JWT.io](https://jwt.io) - Decode and verify JWT tokens
- [OpenAPI Spec](./contracts/auth-api.yaml) - API contract

### Tools
- [OpenSSL](https://www.openssl.org/) - Generate secure secrets
- [Playwright](https://playwright.dev/) - E2E testing
- [JWT Debugger](https://jwt.io/#debugger) - Decode tokens for testing

## Next Steps

1. Run `/sp.tasks` to generate implementation tasks
2. Implement tasks using `nextjs-ui-builder` agent
3. Review security with `auth-security-architect` agent
4. Run tests and verify all acceptance criteria pass
5. Document any architectural decisions with `/sp.adr`
6. Proceed to Spec 2 (Backend + Database integration)

## Support

If you encounter issues:

1. Check this quickstart guide
2. Review `research.md` for technical decisions
3. Consult `data-model.md` for entity definitions
4. Check `contracts/auth-api.yaml` for API spec
5. Ask for clarification on unclear requirements
