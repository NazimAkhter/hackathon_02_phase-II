# Research: Authentication & User Management System

**Feature**: 001-auth-user-management
**Date**: 2026-01-19
**Phase**: Phase 0 - Research & Investigation

## Research Questions

1. How to configure Better Auth with JWT plugin in Next.js 16+ App Router?
2. What is the recommended cookie configuration for httpOnly, Secure, and SameSite flags?
3. How should JWT tokens be structured for FastAPI backend verification?
4. What password hashing algorithm does Better Auth use by default?
5. How to implement rate limiting for authentication endpoints in Next.js?

## Decision 1: Better Auth Configuration with JWT Plugin

**Decision**: Use Better Auth library with JWT plugin configured in Next.js API routes

**Rationale**:
- Better Auth provides built-in JWT token generation with customizable payloads
- Native integration with Next.js App Router via API route handlers
- Supports httpOnly cookie storage out of the box
- Provides TypeScript types for type-safe authentication
- Handles password hashing automatically (bcrypt/Argon2)
- Reduces custom JWT implementation complexity and security risks

**Alternatives Considered**:
- **NextAuth.js**: Popular but primarily designed for OAuth providers; JWT support is secondary, more complex for simple email/password
- **Custom JWT implementation**: Using `jsonwebtoken` library directly provides full control but increases security risk and maintenance burden
- **Auth0/Clerk SaaS**: Third-party auth services add external dependencies, monthly costs, and latency; Better Auth keeps everything in-house

**Implementation Approach**:
```typescript
// lib/auth/better-auth.ts
import { createAuth } from "better-auth";
import { jwtPlugin } from "better-auth/plugins";

export const auth = createAuth({
  plugins: [
    jwtPlugin({
      secret: process.env.BETTER_AUTH_SECRET!,
      expiresIn: "7d", // 604800 seconds
      payload: (user) => ({
        userId: user.id,
        email: user.email,
      }),
    }),
  ],
  cookies: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
});
```

## Decision 2: Cookie Configuration for Security

**Decision**: Use httpOnly, Secure (production), and SameSite=Lax flags

**Rationale**:
- **httpOnly**: Prevents JavaScript access to cookies, mitigating XSS attacks where malicious scripts steal tokens
- **Secure**: Ensures cookies only transmitted over HTTPS in production, preventing man-in-the-middle interception
- **SameSite=Lax**: Balances security and usability - prevents CSRF attacks while allowing cookies on top-level navigations (signup redirect scenarios)

**Alternatives Considered**:
- **SameSite=Strict**: More secure but breaks legitimate flows like email verification links or OAuth redirects
- **SameSite=None**: Allows cross-site requests but requires Secure flag and increases CSRF risk
- **localStorage**: More vulnerable to XSS (JavaScript can always access) and doesn't support httpOnly protection

**Configuration**:
```typescript
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 604800, // 7 days in seconds
  path: "/",
};
```

**Security Impact**:
- XSS mitigation: httpOnly prevents `document.cookie` access
- CSRF mitigation: SameSite=Lax blocks cross-site POST requests
- MITM mitigation: Secure flag prevents unencrypted transmission in production

## Decision 3: JWT Token Structure

**Decision**: JWT payload contains `userId`, `email`, `iat` (issued at), `exp` (expiration)

**Rationale**:
- **userId**: Required for FastAPI backend to identify user and filter data
- **email**: Convenient for display purposes without database lookup
- **iat (issued at)**: Standard JWT claim for audit trail and token freshness validation
- **exp (expiration)**: Standard JWT claim enforced by Better Auth and FastAPI verification (7 days = 604800 seconds)

**Token Example**:
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "iat": 1705651200,
  "exp": 1706256000
}
```

**Alternatives Considered**:
- **Include roles/permissions**: Out of scope for Phase 1; RBAC deferred to future iteration
- **Include session ID**: Stateless design eliminates need for session storage; JWT is self-contained
- **Include refresh token**: Out of scope per specification; users re-authenticate after 7 days

**FastAPI Integration**:
```python
# FastAPI will decode JWT using same BETTER_AUTH_SECRET
import jwt

def verify_token(token: str, secret: str):
    payload = jwt.decode(token, secret, algorithms=["HS256"])
    return payload["userId"], payload["email"]
```

## Decision 4: Password Hashing Algorithm

**Decision**: Use Better Auth's default password hashing (bcrypt with cost factor 12 or Argon2id)

**Rationale**:
- Better Auth automatically handles password hashing using industry-standard algorithms
- bcrypt cost factor 12 provides strong security while maintaining acceptable performance (<100ms hashing time)
- Argon2id (if available) provides even stronger resistance to GPU/ASIC attacks
- Automatic salt generation prevents rainbow table attacks
- No custom implementation needed, reducing security risk

**Alternatives Considered**:
- **PBKDF2**: Older algorithm, more vulnerable to parallelized attacks than bcrypt
- **scrypt**: Good alternative but less common, fewer libraries, higher memory requirements
- **Plain bcrypt (cost factor 10)**: Faster but weaker against brute force; 12 is recommended for 2026

**Implementation**:
```typescript
// Better Auth handles this automatically in signup/signin routes
// No explicit hashing code needed in application logic
// Configuration sets cost factor if needed:
auth.config.passwordHashCost = 12; // bcrypt rounds
```

## Decision 5: Rate Limiting for Authentication Endpoints

**Decision**: Implement in-memory rate limiting using `@upstash/ratelimit` or custom middleware with Map store

**Rationale**:
- Prevents brute force attacks (5 failed attempts per email per 15 minutes per spec)
- In-memory storage (Map) sufficient for single-instance Next.js apps
- Upstash Redis option available for distributed deployments (future scaling)
- Rate limiting by email address (not just IP) prevents distributed attacks
- Sliding window algorithm balances security and UX

**Alternatives Considered**:
- **IP-based only**: Easily bypassed with VPN/proxy rotation
- **Redis required**: Adds infrastructure dependency for MVP; in-memory acceptable for Phase 1
- **No rate limiting**: Violates security requirements; allows unlimited brute force attempts
- **CAPTCHA**: Better UX to implement rate limiting first; add CAPTCHA later if needed

**Implementation**:
```typescript
// lib/auth/rate-limit.ts
const attemptStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const record = attemptStore.get(email);

  if (!record || now > record.resetAt) {
    attemptStore.set(email, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true; // Allow
  }

  if (record.count >= 5) {
    return false; // Block
  }

  record.count++;
  return true; // Allow
}
```

## Decision 6: Environment Variable Schema Validation

**Decision**: Use Zod schema validation for BETTER_AUTH_SECRET and other environment variables

**Rationale**:
- Validates required environment variables at build/runtime startup
- Prevents silent failures from missing or malformed secrets
- TypeScript inference provides type-safe access to env vars
- Early error detection (fail fast at startup, not during first auth request)
- Documents expected environment variables

**Alternatives Considered**:
- **Manual checks**: Error-prone, no type safety, scattered validation logic
- **dotenv only**: Loads variables but doesn't validate format or presence
- **No validation**: Fails silently or throws runtime errors when secret is needed

**Implementation**:
```typescript
// lib/env.ts
import { z } from "zod";

const envSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(32, "Secret must be at least 32 characters"),
  NODE_ENV: z.enum(["development", "production", "test"]),
  DATABASE_URL: z.string().url().optional(), // For future database integration
});

export const env = envSchema.parse(process.env);
```

## Best Practices Summary

### Better Auth with Next.js App Router
- Use API route handlers in `app/api/auth/[action]/route.ts` structure
- Configure Better Auth instance in shared `lib/auth/better-auth.ts` module
- Export auth client for use in both server and client components
- Use Server Actions for form submissions (preferred over client-side fetch)

### JWT Token Security
- Always use httpOnly cookies (never localStorage or sessionStorage)
- Set Secure flag in production to enforce HTTPS
- Use SameSite=Lax to prevent CSRF while allowing legitimate redirects
- Keep JWT payload minimal (userId, email only) to reduce token size
- Never include sensitive data (password hash, API keys) in JWT payload

### Password Security
- Let Better Auth handle password hashing (never implement custom hashing)
- Enforce minimum password strength client-side (8+ chars, letters + numbers)
- Use generic error messages to prevent email enumeration
- Log failed authentication attempts for security monitoring

### Error Handling
- Return generic "Invalid email or password" for both wrong email and wrong password
- Use consistent HTTP status codes (400 validation, 401 unauthorized, 409 conflict)
- Log detailed errors server-side but return sanitized messages to client
- Never expose whether email exists in database (prevents user enumeration)

### Testing Strategy
- Unit test validation functions (email format, password strength)
- Integration test complete signup/signin flows with test database
- E2E test browser flows with Playwright (form submission, cookie storage, redirect)
- Verify JWT structure and expiration in tests using test secret

## Dependencies Identified

**NPM Packages Required**:
```json
{
  "dependencies": {
    "better-auth": "^1.x",
    "bcryptjs": "^2.x",
    "zod": "^3.x",
    "jsonwebtoken": "^9.x"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.x",
    "@types/jsonwebtoken": "^9.x",
    "@testing-library/react": "^14.x",
    "@playwright/test": "^1.x"
  }
}
```

**Environment Variables Required**:
```env
# .env.example
BETTER_AUTH_SECRET=your-secret-key-minimum-32-characters-long
NODE_ENV=development
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

## Integration Points with Spec 2 (Backend)

### JWT Verification Utility Export
The frontend will export a JWT verification utility that FastAPI can use:

```typescript
// lib/auth/jwt-utils.ts
export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export function decodeToken(token: string): JWTPayload {
  // For export to FastAPI documentation
  // FastAPI will implement its own verification using python-jose
}
```

### Shared Secret Requirement
- BETTER_AUTH_SECRET must be identical in both Next.js (.env.local) and FastAPI (.env)
- Recommend 64-character random string generated via `openssl rand -base64 64`
- Document in quickstart.md for deployment setup

### Token Transmission Format
- Frontend includes token in cookies automatically (httpOnly)
- For API-to-API calls, FastAPI can extract token from `Authorization: Bearer <token>` header
- Cookie name: `better-auth.session.token` (Better Auth default)

## Risks and Mitigations

### Risk: BETTER_AUTH_SECRET Mismatch
**Impact**: All token validations fail, complete auth system breakdown
**Mitigation**:
- Implement startup validation that verifies secret is loaded
- Add health check endpoint that tests token generation/validation roundtrip
- Document secret setup clearly in quickstart.md

### Risk: Token Expiration UX Confusion
**Impact**: Users lose access after 7 days without warning
**Mitigation**:
- Show clear "session expired" message on 401 errors
- Implement token refresh mechanism in future iteration (documented for Phase 2)
- Consider showing "session expires in X days" notice

### Risk: Rate Limiting Memory Leak
**Impact**: In-memory Map grows unbounded with failed attempts
**Mitigation**:
- Implement cleanup of expired entries (remove records older than 15 minutes)
- Set max Map size with LRU eviction if needed
- Consider Redis for production with distributed instances

## Research Conclusions

All research questions resolved. No NEEDS CLARIFICATION markers remain in Technical Context. Ready to proceed to Phase 1 (Design & Contracts).

**Key Findings**:
1. Better Auth with JWT plugin is optimal choice for Next.js authentication
2. httpOnly cookies with SameSite=Lax provide strong security without UX friction
3. Minimal JWT payload (userId, email) reduces token size and security surface
4. Better Auth default password hashing (bcrypt/Argon2) meets security requirements
5. In-memory rate limiting sufficient for Phase 1, Redis option available for scaling

**Next Steps**:
- Phase 1: Create data-model.md (User entity, JWT token structure)
- Phase 1: Generate API contracts (OpenAPI spec for auth endpoints)
- Phase 1: Write quickstart.md (setup instructions, environment variables, testing)
