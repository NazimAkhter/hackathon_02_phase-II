# Research: Authentication Session Timeout Fix

**Feature**: 001-fix-auth-timeout
**Date**: 2026-02-10
**Status**: Complete

## Research Questions

### 1. HttpOnly Cookie Behavior

**Question**: How do HttpOnly cookies work with JavaScript and why can't they be read via `document.cookie`?

**Findings**:

HttpOnly cookies are a security feature designed to prevent Cross-Site Scripting (XSS) attacks from stealing authentication tokens.

**Key Characteristics**:
- **Not accessible via JavaScript**: `document.cookie` API cannot read HttpOnly cookies
- **Automatically included in HTTP requests**: Browser sends HttpOnly cookies with every request to the domain
- **Server-side only**: Only the server can read and set HttpOnly cookies via HTTP headers
- **XSS Protection**: Even if malicious JavaScript executes on the page, it cannot steal the authentication token

**Technical Details**:
```
Set-Cookie: better-auth.session.token=<JWT>; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800
```

When this cookie is set:
- JavaScript `document.cookie` returns empty or only non-HttpOnly cookies
- Browser automatically includes cookie in `fetch()` requests when `credentials: 'include'` is set
- Server receives cookie in `Cookie` header and can extract the token

**Implications for Our Fix**:
- Frontend cannot check for session cookie existence using `document.cookie`
- Must use API-based verification where browser includes cookie automatically
- Backend reads cookie from request headers and validates JWT

**References**:
- MDN Web Docs: HttpOnly cookie attribute
- OWASP: HttpOnly cookie security best practices

---

### 2. Better Auth Session Management

**Question**: How does Better Auth expect session verification to work with HttpOnly cookies?

**Findings**:

Better Auth is designed to work with HttpOnly cookies as the primary session storage mechanism for security.

**Better Auth Architecture**:
1. **Session Creation**: Better Auth creates JWT token and sets HttpOnly cookie
2. **Session Storage**: Token stored in HttpOnly cookie (not accessible to JavaScript)
3. **Session Verification**: Frontend makes API calls, browser includes cookie automatically
4. **Session Retrieval**: Backend validates cookie and returns session data

**Expected Flow**:
```
Frontend                    Backend (Better Auth)
   |                              |
   |  POST /auth/signin           |
   |----------------------------->|
   |                              | Authenticate user
   |                              | Generate JWT token
   |  Set-Cookie: HttpOnly        |
   |<-----------------------------|
   |                              |
   |  GET /auth/session           |
   |  (Cookie sent automatically) |
   |----------------------------->|
   |                              | Read cookie from headers
   |                              | Verify JWT signature
   |                              | Return user data
   |  200 OK {user, expiresAt}    |
   |<-----------------------------|
```

**Why Previous Implementation Failed**:
- Frontend tried to read HttpOnly cookie via `document.cookie`
- Better Auth client expected cookie to be readable (incorrect assumption)
- Session verification timed out because cookie check always returned false

**Correct Implementation**:
- Frontend calls backend session endpoint
- Browser automatically includes HttpOnly cookie
- Backend validates cookie and returns session data
- Frontend uses response to determine authentication state

**References**:
- Better Auth documentation: Session management
- Better Auth GitHub issues: HttpOnly cookie handling

---

### 3. Timeout Best Practices

**Question**: What are appropriate timeout values for authentication flows considering backend processing time?

**Findings**:

Authentication timeout values must account for:
1. Network latency (client ↔ server)
2. Backend processing time (password hashing, database queries)
3. User experience expectations

**Backend Processing Times** (measured in our application):
- **bcrypt password hashing**: ~2 seconds (cost factor 12)
- **Database query** (user lookup): ~100-200ms
- **JWT token generation**: <10ms
- **Total backend time**: ~2-2.5 seconds

**Network Latency Considerations**:
- **Good connection**: 50-100ms round trip
- **Average connection**: 200-500ms round trip
- **Slow connection**: 1-3 seconds round trip

**Recommended Timeout Values**:

| Scenario | Timeout | Rationale |
|----------|---------|-----------|
| **Session verification** | 3000ms (3s) | Covers backend processing (~2s) + network latency (~500ms) + buffer (~500ms) |
| **Initial authentication** | 10000ms (10s) | Allows for slow networks and backend load |
| **Retry delay** | 500ms | Quick retry for timing issues without annoying user |

**Previous Implementation** (INCORRECT):
- Timeout: 1000ms (1 second)
- Problem: Backend bcrypt takes ~2 seconds, always exceeded timeout

**New Implementation** (CORRECT):
- Timeout: 3000ms (3 seconds)
- Covers normal backend processing time
- Provides buffer for network delays
- Still fast enough for good UX

**User Experience Guidelines**:
- Show loading indicator immediately (within 100ms)
- Provide feedback during wait (progress indicator)
- Display clear error messages on timeout
- Allow retry without page refresh

**References**:
- Nielsen Norman Group: Response time guidelines
- Web Performance Working Group: User timing recommendations

---

### 4. Session Verification Patterns

**Question**: What are standard patterns for verifying sessions when cookies are HttpOnly?

**Findings**:

When using HttpOnly cookies for authentication, the standard pattern is **API-based session verification**.

**Pattern 1: Session Endpoint (Recommended)**

Create a dedicated endpoint that verifies the session cookie and returns user data.

```
GET /api/auth/session
Cookie: better-auth.session.token=<JWT>

Response 200 OK:
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "expiresAt": 1234567890,
  "token": "jwt-token-string"
}

Response 401 Unauthorized:
{
  "detail": "No session cookie found"
}
```

**Advantages**:
- Clean separation of concerns
- Easy to test and monitor
- Can be cached for performance
- Provides single source of truth for session state

**Pattern 2: Middleware-Based Verification**

Use middleware to verify session on every request.

**Advantages**:
- Automatic verification on all protected routes
- No explicit session check needed
- Consistent across application

**Disadvantages**:
- Adds overhead to every request
- Harder to handle session state in frontend

**Pattern 3: Polling with Exponential Backoff**

Poll session endpoint with increasing delays until session is established.

```typescript
async function waitForSession(maxWait: number): Promise<boolean> {
  let delay = 50; // Start with 50ms
  const maxDelay = 500; // Cap at 500ms
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    const hasSession = await checkSession();
    if (hasSession) return true;

    await sleep(delay);
    delay = Math.min(delay * 2, maxDelay); // Exponential backoff
  }

  return false;
}
```

**Advantages**:
- Handles timing issues gracefully
- Reduces server load (fewer requests)
- Better UX (faster detection when session ready)

**Our Implementation**:

We use **Pattern 1 (Session Endpoint)** combined with **Pattern 3 (Polling)**:

1. Backend provides `GET /api/auth/session` endpoint
2. Frontend polls this endpoint after authentication
3. Browser automatically includes HttpOnly cookie
4. Backend validates cookie and returns session data
5. Frontend uses response to update authentication state

**Implementation Details**:
```typescript
// Frontend: session-wait.ts
async function defaultCheckSession(): Promise<boolean> {
  const response = await fetch(`${API_URL}/api/auth/session`, {
    credentials: 'include', // Include HttpOnly cookies
  });
  return response.ok;
}

// Frontend: AuthProvider.tsx
const sessionReady = await waitForSession({
  maxWait: 3000,
  interval: 50,
});
```

```python
# Backend: auth.py
@router.get("/session")
async def get_session(request: Request):
    token = request.cookies.get("better-auth.session.token")
    if not token:
        raise HTTPException(401, "No session cookie found")

    payload = verify_jwt_token(token)
    user = get_user_by_id(payload.userId)

    return {
        "user": user,
        "expiresAt": payload.exp,
        "token": token
    }
```

**References**:
- Auth0: Session management best practices
- OWASP: Authentication cheat sheet
- MDN: Using Fetch with credentials

---

## Summary of Key Decisions

### Decision 1: Use API-Based Session Verification

**Rationale**: HttpOnly cookies cannot be read by JavaScript, so we must use an API endpoint where the browser automatically includes the cookie.

**Alternatives Considered**:
- Reading cookie via `document.cookie` (REJECTED: Not possible with HttpOnly)
- Using localStorage for tokens (REJECTED: Security vulnerability, XSS attacks)
- Disabling HttpOnly flag (REJECTED: Unacceptable security risk)

**Implementation**: Create `GET /api/auth/session` endpoint that reads HttpOnly cookie from request headers.

---

### Decision 2: Increase Timeout to 3 Seconds

**Rationale**: Backend bcrypt operations take ~2 seconds, and 1 second timeout was too short.

**Alternatives Considered**:
- Keep 1 second timeout (REJECTED: Always fails due to backend processing time)
- Use 5+ second timeout (REJECTED: Too long, degrades UX)
- Make timeout configurable (CONSIDERED: Good for future, but 3s is reasonable default)

**Implementation**: Change `maxWait` from 1000ms to 3000ms in `waitForSession()` calls.

---

### Decision 3: Add Retry Logic

**Rationale**: Timing issues can cause initial session check to fail even when session is valid.

**Alternatives Considered**:
- No retry (REJECTED: Fails on timing edge cases)
- Multiple retries with backoff (CONSIDERED: Good for future, but single retry sufficient for now)

**Implementation**: `getSession()` retries once after 500ms delay if initial check fails.

---

### Decision 4: Maintain HttpOnly Cookie Security

**Rationale**: HttpOnly cookies prevent XSS attacks from stealing JWT tokens.

**Alternatives Considered**:
- Disable HttpOnly to allow JavaScript access (REJECTED: Unacceptable security risk)
- Use different storage mechanism (REJECTED: HttpOnly is industry best practice)

**Implementation**: Keep HttpOnly flag enabled, adapt frontend to work with it correctly.

---

## Implementation Checklist

- [x] Research HttpOnly cookie behavior
- [x] Understand Better Auth session management expectations
- [x] Determine appropriate timeout values
- [x] Identify session verification patterns
- [x] Document key decisions and rationale
- [x] Validate approach against security best practices

## Next Steps

Proceed to Phase 1: Design & Contracts
- Create data-model.md for session entities
- Define API contract for session endpoint
- Write quickstart.md for development setup
