# Navigation Flows: Enhanced UI with Post-Signin Routing Fix

**Feature**: 004-ui-enhancement-routing
**Date**: 2026-01-22
**Purpose**: Document navigation patterns, redirect logic, and route protection contracts

## Overview

This document defines all navigation flows for automatic post-signin routing, protected route access, and session management. Each flow includes state transitions, decision points, and error handling paths.

---

## Flow 1: Successful Signin (Primary Happy Path)

**Objective**: User signs in and is automatically redirected to dashboard within 1 second.

### Flow Diagram

```
┌─────────────────┐
│  User on        │
│  /signin page   │
└────────┬────────┘
         │
         │ [User submits credentials]
         │
         ▼
┌─────────────────┐
│  POST           │
│  /api/auth/     │
│  signin         │
└────────┬────────┘
         │
         │ [200 OK - JWT token set in httpOnly cookie]
         │
         ▼
┌─────────────────┐
│  Better Auth    │
│  onSuccess      │
│  callback       │
└────────┬────────┘
         │
         │ [router.push('/dashboard')]
         │ ⏱ Target: < 500ms from API response
         │
         ▼
┌─────────────────┐
│  middleware.ts  │
│  validates      │
│  JWT token      │
└────────┬────────┘
         │
         │ [Token valid]
         │
         ▼
┌─────────────────┐
│  Dashboard      │
│  page renders   │
└────────┬────────┘
         │
         │ [useEffect calls fetchTasks()]
         │
         ▼
┌─────────────────┐
│  Task list      │
│  appears with   │
│  fade-in        │
└─────────────────┘
```

### Implementation Details

**Step 1: Form Submission**
```typescript
// In app/(auth)/signin/page.tsx
const onSubmit = async (data: SigninData) => {
  setIsSubmitting(true);

  const response = await fetch('/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',  // Include httpOnly cookie in request
  });

  if (response.ok) {
    const { user } = await response.json();
    // Better Auth onSuccess callback fires here
    router.push('/dashboard');  // PRIMARY REDIRECT
  } else {
    const { error } = await response.json();
    setError(error);
  }

  setIsSubmitting(false);
};
```

**Step 2: Middleware Validation**
```typescript
// In middleware.ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from cookie
  const token = request.cookies.get('better-auth.session.token')?.value;

  // Protected route check
  if (pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  return NextResponse.next();
}
```

**Step 3: Backup Redirect Guard**
```typescript
// In components/auth/AuthProvider.tsx (useEffect)
useEffect(() => {
  // Backup redirect if onSuccess didn't fire
  if (isAuthenticated && ['/signin', '/signup'].includes(pathname)) {
    router.push('/dashboard');
  }
}, [isAuthenticated, pathname, router]);
```

### Success Criteria

- ✅ User reaches dashboard within 1 second (SC-001)
- ✅ No flicker or intermediate pages
- ✅ Task list loads immediately after redirect
- ✅ JWT token attached to subsequent API calls

### Error Paths

See Flow 5 (Signin Failure) and Flow 6 (Network Error)

---

## Flow 2: Successful Signup (New User)

**Objective**: New user creates account and is automatically redirected to dashboard.

### Flow Diagram

```
┌─────────────────┐
│  User on        │
│  /signup page   │
└────────┬────────┘
         │
         │ [User submits credentials + name]
         │
         ▼
┌─────────────────┐
│  POST           │
│  /api/auth/     │
│  signup         │
└────────┬────────┘
         │
         │ [201 Created - JWT token set, user created in DB]
         │
         ▼
┌─────────────────┐
│  Better Auth    │
│  onSuccess      │
│  callback       │
└────────┬────────┘
         │
         │ [router.push('/dashboard')]
         │
         ▼
┌─────────────────┐
│  Dashboard      │
│  renders with   │
│  empty state    │
└────────┬────────┘
         │
         │ [No tasks yet - shows "Create your first task"]
         │
         ▼
┌─────────────────┐
│  User clicks    │
│  "Add Task"     │
└─────────────────┘
```

### Key Differences from Signin

1. **HTTP Status**: 201 Created (vs 200 OK)
2. **Database**: New user record created in `users` table
3. **Dashboard State**: Empty task list (no tasks yet)
4. **Redirect Speed**: Same < 1 second requirement

### Implementation Details

**Signup Endpoint**
```typescript
// In app/api/auth/signup/route.ts
export async function POST(request: NextRequest) {
  const { email, password, name } = await request.json();

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user in database
  const user = await createUser({
    id: crypto.randomUUID(),
    email: email.toLowerCase(),
    password_hash: passwordHash,
    name,
  });

  // Generate JWT token
  const token = generateJWT(user);

  // Set httpOnly cookie
  return NextResponse.json(
    { message: 'Account created successfully', user },
    {
      status: 201,
      headers: {
        'Set-Cookie': `better-auth.session.token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`,
      },
    }
  );
}
```

### Success Criteria

- ✅ Account created in database
- ✅ User redirected to dashboard within 1 second
- ✅ Empty state shows "Create your first task"
- ✅ First task creation works immediately

---

## Flow 3: Protected Route Access (Unauthenticated User)

**Objective**: Redirect unauthenticated users trying to access protected routes, preserve intended destination.

### Flow Diagram

```
┌─────────────────┐
│  Unauthenticated│
│  user navigates │
│  to /dashboard  │
└────────┬────────┘
         │
         │ [Browser request]
         │
         ▼
┌─────────────────┐
│  middleware.ts  │
│  checks token   │
└────────┬────────┘
         │
         │ [getTokenFromCookie() → null]
         │
         ▼
┌─────────────────┐
│  Redirect to    │
│  /signin?       │
│  returnUrl=     │
│  /dashboard     │
└────────┬────────┘
         │
         │ [User signs in successfully]
         │
         ▼
┌─────────────────┐
│  onSuccess      │
│  checks         │
│  returnUrl      │
└────────┬────────┘
         │
         │ [returnUrl exists]
         │
         ▼
┌─────────────────┐
│  Redirect to    │
│  original       │
│  destination    │
│  (/dashboard)   │
└─────────────────┘
```

### Implementation Details

**Middleware Redirect with Return URL**
```typescript
// In middleware.ts
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get('better-auth.session.token')?.value;

  const protectedRoutes = ['/dashboard'];
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtected && !token) {
    const returnUrl = encodeURIComponent(pathname + search);
    return NextResponse.redirect(
      new URL(`/signin?returnUrl=${returnUrl}`, request.url)
    );
  }

  return NextResponse.next();
}
```

**Signin Page Reads Return URL**
```typescript
// In app/(auth)/signin/page.tsx
const searchParams = useSearchParams();
const returnUrl = searchParams.get('returnUrl') || '/dashboard';

const onSubmitSuccess = async () => {
  // Decode return URL (handles special characters)
  const destination = decodeURIComponent(returnUrl);
  router.push(destination);
};
```

### Success Criteria

- ✅ 100% of protected routes redirect unauthenticated users (SC-002)
- ✅ Return URL preserved through signin flow
- ✅ Deep links work (e.g., /dashboard?tab=settings)
- ✅ No security bypass (token validated before render)

### Edge Cases

**Edge Case 1: Multiple Redirect Hops**
```
User navigates: /dashboard/task/123 (unauthenticated)
  ↓
Redirect: /signin?returnUrl=/dashboard/task/123
  ↓
User signs in successfully
  ↓
Redirect: /dashboard/task/123
  ↓
If task doesn't exist: /dashboard (fallback)
```

**Edge Case 2: Return URL Injection Attack**
```
Malicious URL: /signin?returnUrl=https://evil.com
  ↓
Validation: Check returnUrl starts with '/' (relative path only)
  ↓
If invalid: Use default '/dashboard' instead
```

**Validation Code**:
```typescript
const returnUrl = searchParams.get('returnUrl') || '/dashboard';
const safeReturnUrl = returnUrl.startsWith('/') ? returnUrl : '/dashboard';
```

---

## Flow 4: Authenticated User on Signin Page (Redirect Loop Prevention)

**Objective**: Prevent authenticated users from accessing signin/signup pages, avoid infinite redirect loops.

### Flow Diagram

```
┌─────────────────┐
│  Authenticated  │
│  user manually  │
│  navigates to   │
│  /signin        │
└────────┬────────┘
         │
         │ [Browser request]
         │
         ▼
┌─────────────────┐
│  Page loads,    │
│  AuthProvider   │
│  useEffect runs │
└────────┬────────┘
         │
         │ [Checks: isAuthenticated && pathname === '/signin']
         │
         ▼
┌─────────────────┐
│  Redirect to    │
│  /dashboard     │
│  (router.push)  │
└────────┬────────┘
         │
         │ [Dashboard renders]
         │
         ▼
┌─────────────────┐
│  User sees      │
│  dashboard      │
│  (never saw     │
│  signin form)   │
└─────────────────┘
```

### Implementation Details

**Redirect Guard in AuthProvider**
```typescript
// In components/auth/AuthProvider.tsx
useEffect(() => {
  // Prevent authenticated users from seeing signin/signup pages
  const publicAuthPages = ['/signin', '/signup'];

  if (isAuthenticated && publicAuthPages.includes(pathname)) {
    // Prevent redirect loop by checking current path
    if (pathname !== '/dashboard') {
      router.push('/dashboard');
    }
  }
}, [isAuthenticated, pathname, router]);
```

### Loop Prevention Logic

**Guard Conditions**:
```typescript
// ✅ SAFE: Redirect authenticated user from /signin to /dashboard
if (isAuthenticated && pathname === '/signin') {
  router.push('/dashboard');
}

// ❌ UNSAFE: Could cause infinite loop
if (isAuthenticated) {
  router.push('/dashboard');  // Runs even when on /dashboard!
}

// ✅ SAFE: Additional guard to prevent loop
if (isAuthenticated && pathname !== '/dashboard' && pathname === '/signin') {
  router.push('/dashboard');
}
```

### Success Criteria

- ✅ Authenticated users cannot see signin/signup forms
- ✅ No redirect loops (tested with browser back button)
- ✅ Redirect happens before form renders (no flicker)

---

## Flow 5: Token Expiry Mid-Session

**Objective**: Gracefully handle token expiry during active session, redirect to signin with clear message.

### Flow Diagram

```
┌─────────────────┐
│  User on        │
│  dashboard      │
│  (token expires)│
└────────┬────────┘
         │
         │ [User clicks "Add Task"]
         │
         ▼
┌─────────────────┐
│  POST           │
│  /api/{user_id}/│
│  tasks          │
└────────┬────────┘
         │
         │ [401 Unauthorized - JWT expired]
         │
         ▼
┌─────────────────┐
│  API client     │
│  error          │
│  interceptor    │
└────────┬────────┘
         │
         │ [Detects 401 response]
         │
         ▼
┌─────────────────┐
│  Clear expired  │
│  token from     │
│  cookie         │
└────────┬────────┘
         │
         │ [Update auth state: isAuthenticated = false]
         │
         ▼
┌─────────────────┐
│  Show error:    │
│  "Session       │
│  expired"       │
└────────┬────────┘
         │
         │ [After 2 seconds delay]
         │
         ▼
┌─────────────────┐
│  Redirect to    │
│  /signin?       │
│  message=       │
│  session_expired│
└────────┬────────┘
         │
         │ [Signin page shows message]
         │
         ▼
┌─────────────────┐
│  "Your session  │
│  has expired.   │
│  Please sign    │
│  in again."     │
└─────────────────┘
```

### Implementation Details

**API Client Error Interceptor**
```typescript
// In lib/api/client.ts
async function apiRequest(url: string, options: RequestInit) {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',  // Include httpOnly cookie
  });

  // Token expiry detection
  if (response.status === 401) {
    // Clear expired token (Better Auth handles this)
    await clearSession();

    // Show error message
    toast.error('Your session has expired. Please sign in again.');

    // Redirect after delay (allows user to read message)
    setTimeout(() => {
      router.push('/signin?message=session_expired');
    }, 2000);

    throw new Error('Session expired');
  }

  return response;
}
```

**Signin Page Shows Expiry Message**
```typescript
// In app/(auth)/signin/page.tsx
const searchParams = useSearchParams();
const message = searchParams.get('message');

useEffect(() => {
  if (message === 'session_expired') {
    toast.error('Your session has expired. Please sign in again.');
  }
}, [message]);
```

### Success Criteria

- ✅ Token expiry detected on ANY API call (not just task operations)
- ✅ User sees clear "Session expired" message before redirect
- ✅ Redirect happens after 2 second delay (user can read message)
- ✅ After re-signin, user returns to dashboard (not original task)

### User Experience Considerations

**Timing**:
- 2 second delay before redirect (allows reading error message)
- Error message dismissible (user can close if they want)
- Redirect URL includes message parameter (for signin page to display)

**Alternative Approaches Rejected**:
- Immediate redirect: Too abrupt, user doesn't understand why
- No redirect: User stuck with error, unclear what to do
- Modal confirmation: Adds unnecessary click for obvious action

---

## Flow 6: Signin/Signup Failure

**Objective**: Handle authentication failures with clear error messages and retry capability.

### Flow Diagram

```
┌─────────────────┐
│  User submits   │
│  signin form    │
└────────┬────────┘
         │
         │ [POST /api/auth/signin]
         │
         ▼
┌─────────────────┐
│  Backend        │
│  validation     │
└────────┬────────┘
         │
         │
         ├─ [401 Unauthorized - Invalid credentials]
         │
         ▼
┌─────────────────┐
│  Show error:    │
│  "Invalid email │
│  or password"   │
└────────┬────────┘
         │
         │ [Form re-enabled, user can retry]
         │
         ▼
┌─────────────────┐
│  User corrects  │
│  credentials    │
│  and resubmits  │
└─────────────────┘

         │
         ├─ [500 Server Error]
         │
         ▼
┌─────────────────┐
│  Show error:    │
│  "An error      │
│  occurred.      │
│  Please try     │
│  again."        │
└────────┬────────┘
         │
         │ [Retry button available]
         │
         ▼
┌─────────────────┐
│  User clicks    │
│  "Retry" or     │
│  resubmits form │
└─────────────────┘
```

### Error Messages by Status Code

| Status | Error Message | User Action |
|--------|---------------|-------------|
| 401 | "Invalid email or password" | Correct credentials |
| 409 (signup) | "An account with this email already exists" | Use different email or sign in |
| 422 | "Please check your input and try again" | Fix validation errors |
| 429 | "Too many attempts. Please try again in 5 minutes." | Wait and retry |
| 500 | "An error occurred. Please try again." | Retry request |
| Network | "Connection failed. Please check your internet and try again." | Check connection, retry |

### Implementation Details

**Form Error Handling**
```typescript
// In app/(auth)/signin/page.tsx
const onSubmit = async (data: SigninData) => {
  setIsSubmitting(true);
  setError(null);  // Clear previous errors

  try {
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (response.ok) {
      const { user } = await response.json();
      router.push('/dashboard');
    } else {
      const { error } = await response.json();

      // Map status codes to user-friendly messages
      if (response.status === 401) {
        setError('Invalid email or password. Please try again.');
      } else if (response.status === 429) {
        setError('Too many signin attempts. Please try again in 5 minutes.');
      } else {
        setError(error || 'An error occurred. Please try again.');
      }
    }
  } catch (networkError) {
    setError('Connection failed. Please check your internet and try again.');
  } finally {
    setIsSubmitting(false);  // Re-enable form
  }
};
```

### Success Criteria

- ✅ Error messages are user-friendly (no technical jargon)
- ✅ Form re-enabled after error (user can retry immediately)
- ✅ Error dismissible (user can clear message manually)
- ✅ Retry preserves form values (user doesn't retype everything)

---

## Flow 7: Deep Link Preservation

**Objective**: Preserve query parameters and hash fragments through authentication redirects.

### Flow Diagram

```
┌─────────────────┐
│  User shares    │
│  link:          │
│  /dashboard?    │
│  tab=completed  │
└────────┬────────┘
         │
         │ [Recipient clicks link (unauthenticated)]
         │
         ▼
┌─────────────────┐
│  Middleware     │
│  redirects to:  │
│  /signin?       │
│  returnUrl=     │
│  /dashboard%3F  │
│  tab%3D         │
│  completed      │
└────────┬────────┘
         │
         │ [User signs in]
         │
         ▼
┌─────────────────┐
│  onSuccess      │
│  decodes        │
│  returnUrl      │
└────────┬────────┘
         │
         │ [Redirect to full URL with query params]
         │
         ▼
┌─────────────────┐
│  Dashboard      │
│  renders with   │
│  "completed"    │
│  tab active     │
└─────────────────┘
```

### Implementation Details

**URL Encoding/Decoding**
```typescript
// In middleware.ts (encoding)
const returnUrl = encodeURIComponent(pathname + search);
// Result: /dashboard%3Ftab%3Dcompleted

// In signin page (decoding)
const returnUrl = searchParams.get('returnUrl') || '/dashboard';
const decodedUrl = decodeURIComponent(returnUrl);
// Result: /dashboard?tab=completed

router.push(decodedUrl);
```

### Success Criteria

- ✅ Query parameters preserved (?tab=completed)
- ✅ Hash fragments preserved (#section-id)
- ✅ Multiple query params work (?tab=completed&sort=date)
- ✅ Special characters encoded properly (%20 for space, etc.)

---

## Middleware Configuration

### Protected Routes

```typescript
// In middleware.ts
const protectedRoutes = [
  '/dashboard',
  // Add more protected routes here as app grows
];

const publicRoutes = [
  '/',
  '/signin',
  '/signup',
  '/api/auth/signin',
  '/api/auth/signup',
];
```

### Matcher Configuration

```typescript
// In middleware.ts
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};
```

---

## Performance Requirements

All navigation flows must meet these performance targets:

| Flow | Target Time | Measured From | Measured To |
|------|-------------|---------------|-------------|
| Signin → Dashboard | < 1 second | Form submit | Dashboard visible |
| Signup → Dashboard | < 1 second | Form submit | Dashboard visible |
| Protected Route Redirect | < 200ms | Request start | Signin page visible |
| Token Expiry Redirect | 2 seconds | Error detected | Signin page visible |
| Deep Link Restore | < 500ms | Signin success | Full URL rendered |

---

## Testing Strategy

### Manual Tests

1. **Signin Flow**: Sign in and verify auto-redirect to dashboard
2. **Signup Flow**: Create account and verify auto-redirect to dashboard
3. **Protected Route**: Try accessing /dashboard without auth, verify redirect
4. **Deep Link**: Access /dashboard?tab=settings without auth, verify preservation
5. **Token Expiry**: Wait for token to expire, try operation, verify message + redirect
6. **Redirect Loop**: Sign in, manually navigate to /signin, verify redirect back

### Automated Tests (E2E)

```typescript
// Example: signin-flow.spec.ts
test('successful signin redirects to dashboard within 1 second', async ({ page }) => {
  await page.goto('/signin');

  const startTime = Date.now();

  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForURL('/dashboard');

  const endTime = Date.now();
  const duration = endTime - startTime;

  expect(duration).toBeLessThan(1000);  // < 1 second
  expect(page.url()).toContain('/dashboard');
});
```

---

**Navigation Flows Status**: ✅ **Complete** - All 7 flows documented with implementation details
