# Session Validation Contract

**Feature**: 005-fix-session-expiry
**Phase**: 1 - Design & Contracts
**Date**: 2026-01-22

## Overview

This contract defines the expected behavior of session validation functions and the timing guarantees required for reliable authentication across page navigation.

## Session Validation Functions

### `getSession(): Promise<UserSession | null>`

**Purpose**: Retrieve current authenticated user session from browser storage

**Input**: None (reads from browser cookies)

**Output**:
```typescript
interface UserSession {
  user: {
    id: string;
    email: string;
  };
  token: string;
  expiresAt: number; // Unix timestamp (seconds)
}
```

Returns `null` if:
- No session cookie exists
- Cookie exists but cannot be decoded
- Token has expired (exp claim < current time)
- Token signature is invalid

**Timing Contract**:
- Initial attempt: Synchronous cookie read + decode (< 10ms)
- If null on first attempt: Wait 500ms and retry once
- Maximum total time: 510ms (initial + retry)
- No network calls required (reads from local browser storage)

**Error Handling**:
- Catches all exceptions and returns null (fail-safe)
- Logs errors to console for debugging
- Never throws exceptions (prevents app crashes)

**Usage**:
```typescript
// In dashboard page component
const session = await getSession();
if (!session) {
  // Redirect to signin
  router.push('/signin?message=session_expired');
  return;
}
// Proceed with authenticated content
```

### `getTokenFromCookie(): string | null`

**Purpose**: Extract JWT token string from browser cookies

**Input**: None (reads from document.cookie)

**Output**: JWT token string or null

**Timing Contract**:
- Synchronous operation (< 5ms)
- No async operations required

**Cookie Parsing Logic**:
```typescript
// Parse document.cookie string
const cookies = document.cookie.split(';');
// Find cookie with name containing 'better-auth.session.token'
const tokenCookie = cookies.find(c => c.trim().startsWith('better-auth.session.token='));
// Extract token value
const token = tokenCookie?.split('=')[1] || null;
```

**Edge Cases**:
- Empty document.cookie → returns null
- Multiple cookies → finds first match
- Malformed cookie format → returns null (fail-safe)

### `validateSession(session: UserSession): boolean`

**Purpose**: Check if session is valid (not expired)

**Input**:
```typescript
interface UserSession {
  expiresAt: number; // Unix timestamp
}
```

**Output**: boolean

**Validation Logic**:
```typescript
const currentTime = Math.floor(Date.now() / 1000); // Convert to Unix seconds
const isExpired = session.expiresAt <= currentTime;
return !isExpired;
```

**Timing Contract**:
- Synchronous operation (< 1ms)
- No side effects

**Clock Skew Tolerance**:
- Allow 5-minute tolerance for minor time differences
- `session.expiresAt + 300` seconds grace period (optional enhancement)

## Signin Flow Contract

### POST /api/auth/signin

**Backend Response**:
```
HTTP/1.1 200 OK
Set-Cookie: better-auth.session.token=<JWT>; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800
Content-Type: application/json

{
  "message": "Signin successful",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com"
  }
}
```

**Frontend Handling** (UPDATED):
```typescript
// 1. Call signin API
const response = await fetch('/api/auth/signin', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});

// 2. Wait for response
const data = await response.json();

// 3. NEW: Confirm session before navigation
const sessionReady = await waitForSession({ maxWait: 1000 });

// 4. Navigate only after session confirmed
if (sessionReady) {
  router.push('/dashboard');
} else {
  // Handle failure: session not available after 1 second
  console.error('Session not established after signin');
  // Show error or retry
}
```

### `waitForSession(options): Promise<boolean>`

**Purpose**: Poll for session availability after signin

**Input**:
```typescript
interface WaitForSessionOptions {
  maxWait: number; // Maximum wait time in milliseconds (default: 1000)
  interval: number; // Polling interval in milliseconds (default: 50)
}
```

**Output**: Promise<boolean>
- `true` if session becomes available within maxWait
- `false` if timeout exceeded

**Implementation**:
```typescript
async function waitForSession(options = { maxWait: 1000, interval: 50 }) {
  const startTime = Date.now();

  while (Date.now() - startTime < options.maxWait) {
    const session = await getSession();
    if (session) {
      return true; // Session available
    }
    await new Promise(resolve => setTimeout(resolve, options.interval));
  }

  return false; // Timeout
}
```

**Timing Guarantees**:
- First check: Immediate (0ms)
- Subsequent checks: Every 50ms
- Maximum attempts: 20 (1000ms / 50ms)
- Typical resolution: 50-150ms (cookie available after first retry)

## Dashboard Mount Contract

### Dashboard Page Component

**Mount Sequence** (UPDATED):
```typescript
useEffect(() => {
  const validateAndLoadData = async () => {
    // 1. Attempt to get session (with built-in retry)
    const session = await getSession();

    // 2. Handle missing session
    if (!session) {
      console.warn('[Dashboard] No session found after retry');
      router.push('/signin?message=session_expired');
      return;
    }

    // 3. Validate session not expired
    if (!validateSession(session)) {
      console.warn('[Dashboard] Session expired');
      clearSession(); // Remove expired cookie
      router.push('/signin?message=session_expired');
      return;
    }

    // 4. Session valid - fetch user data
    console.log('[Dashboard] Session valid, loading todos');
    await fetchTodos(session.user.id, session.token);
  };

  validateAndLoadData();
}, []); // Empty dependency array: run only on mount
```

**Error States**:
1. **No session**: Redirect to /signin with message "session_expired"
2. **Expired session**: Clear cookie, redirect to /signin with message "session_expired"
3. **API call fails (401)**: Clear session, redirect to /signin with message "session_expired"
4. **API call fails (other)**: Show error message, don't redirect (may be temporary network issue)

## Middleware Contract

### Authentication Middleware

**Current Issue**: Middleware may check authentication before cookie is available

**Solution**: Middleware should skip auth check for certain routes or implement same retry logic

**Updated Middleware Logic**:
```typescript
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Skip auth check for public routes
  if (path === '/' || path === '/signin' || path === '/signup') {
    return NextResponse.next();
  }

  // For protected routes, check session
  const session = await getSession();

  if (!session) {
    // Redirect to signin
    return NextResponse.redirect(new URL('/signin?message=session_expired', request.url));
  }

  // Session valid, allow request
  return NextResponse.next();
}
```

**Note**: Middleware runs on server, cannot access document.cookie. Alternative approach:
- Read cookie from request.cookies
- Decode and validate JWT server-side
- Or defer authentication check to page component

## Error Message Contract

### Query Parameter Messages

When redirecting to signin page due to authentication failure:

```typescript
// Missing session
router.push('/signin?message=session_expired');
// Display: "Your session has expired. Please sign in again."

// Invalid credentials
router.push('/signin?message=invalid_credentials');
// Display: "Invalid email or password."

// Server error
router.push('/signin?message=auth_error');
// Display: "Authentication error. Please try again."
```

### Signin Page Error Display

```typescript
const searchParams = useSearchParams();
const message = searchParams.get('message');

const errorMessages = {
  'session_expired': 'Your session has expired. Please sign in again.',
  'invalid_credentials': 'Invalid email or password.',
  'auth_error': 'Authentication error. Please try again.',
};

const errorText = errorMessages[message] || '';
```

## Logging Contract

### Debug Logging

All authentication-related operations should log at appropriate detail level:

```typescript
// INFO level (always enabled)
console.log('[Auth] User signed in:', email);
console.log('[Dashboard] Loading user data');

// DEBUG level (development only)
console.debug('[getSession] Cookie found:', !!token);
console.debug('[getSession] Token decoded:', payload);
console.debug('[waitForSession] Attempt', attempt, '/', maxAttempts);

// ERROR level (always enabled)
console.error('[getSession] Failed to decode token:', error);
console.error('[Dashboard] API call failed:', error);
```

### Structured Logging Format

```typescript
function logAuthEvent(event: string, details: object) {
  console.log(`[Auth:${event}]`, JSON.stringify(details));
}

// Usage
logAuthEvent('signin', { email, timestamp: Date.now() });
logAuthEvent('session_check', { hasToken: !!token, isValid });
logAuthEvent('navigation', { from: 'signin', to: 'dashboard', sessionReady });
```

## Performance Contracts

### Timing Budgets

- **getSession() first attempt**: < 10ms
- **getSession() with retry**: < 510ms
- **waitForSession()**: < 1000ms (configurable)
- **Token decode**: < 5ms
- **Session validation**: < 1ms
- **Signin → Dashboard (total)**: < 3000ms

### No Network Calls

- Session validation functions MUST NOT make network calls
- All operations read from local browser storage (cookies)
- Backend is only contacted for initial signin/signup

## Backward Compatibility

### No Breaking Changes

- API endpoints unchanged
- JWT token structure unchanged
- Cookie format unchanged
- Only internal timing and retry logic enhanced

### Migration Path

- Deploy frontend changes first (adds retry logic, backward compatible)
- No backend changes required
- No data migration needed
- No user-facing changes except bug fix

## Test Contract

### Unit Tests

```typescript
describe('getSession', () => {
  it('returns null when no cookie exists', async () => {
    document.cookie = ''; // Clear cookies
    const session = await getSession();
    expect(session).toBeNull();
  });

  it('returns session when valid cookie exists', async () => {
    document.cookie = `better-auth.session.token=${validJWT}`;
    const session = await getSession();
    expect(session).not.toBeNull();
    expect(session.user.email).toBe('test@example.com');
  });

  it('returns null when token is expired', async () => {
    document.cookie = `better-auth.session.token=${expiredJWT}`;
    const session = await getSession();
    expect(session).toBeNull();
  });
});
```

### Integration Tests

```typescript
describe('Signin flow', () => {
  it('successfully signs in and navigates to dashboard', async () => {
    await signin({ email: 'test@example.com', password: 'password' });
    await waitFor(() => expect(router.pathname).toBe('/dashboard'));
    await waitFor(() => expect(screen.getByText('Your Todos')).toBeInTheDocument());
  });

  it('handles race condition with retry logic', async () => {
    // Simulate delayed cookie availability
    mockDelayedCookie(100); // 100ms delay
    await signin({ email: 'test@example.com', password: 'password' });
    await waitFor(() => expect(router.pathname).toBe('/dashboard'));
    // Should succeed despite delay
  });
});
```

---

**Contract Status**: ✅ Complete - Ready for implementation
