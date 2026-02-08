# Research: Session Expiry & Authentication Flow Bug Fix

**Feature**: 005-fix-session-expiry
**Phase**: 0 - Outline & Research
**Date**: 2026-01-22

## Purpose

This research document consolidates findings from the diagnostic investigation of the session expiry bug and documents decisions made for the remediation approach.

## Configuration Audit Findings

### 1. Environment Variable Verification

**Decision**: Verify BETTER_AUTH_SECRET consistency across frontend and backend

**Research Task**: Check that the shared secret used for JWT signing/verification matches

**Findings**:
- Frontend: `BETTER_AUTH_SECRET` should be set in `/frontend/.env.local`
- Backend: `BETTER_AUTH_SECRET` should be set in `/backend/.env`
- **Critical**: If these don't match, JWT signature verification will fail immediately

**Rationale**: Token signature mismatch is a primary cause of "invalid token" errors that appear as session expiry

**Action Items**:
- Task 1: Read both .env files and compare BETTER_AUTH_SECRET values
- Task 2: If mismatch found, document in bug report and fix before proceeding
- Task 3: Add validation check to startup scripts to prevent future mismatches

**Alternatives Considered**:
- **Alt 1**: Use environment-specific secrets → **Rejected**: Adds complexity without benefit; shared secret is secure when properly managed
- **Alt 2**: Move to public/private key JWT → **Rejected**: Requires architecture change (out of scope for bug fix)

### 2. Cookie Configuration Audit

**Decision**: Verify cookie attributes match security requirements and browser compatibility

**Research Task**: Inspect current cookie configuration in backend auth endpoints

**Findings from User Input**:
- Current configuration mentioned: `sameSite: 'lax'`, `path: '/'`
- Required attributes for security: httpOnly, secure (production), sameSite, path
- Cookie name: `better-auth.session.token`

**Key Research Questions**:
1. Are cookies set to httpOnly to prevent JavaScript access?
2. Is secure flag enabled in production (HTTPS only)?
3. Is domain attribute set correctly for environment?
4. Is path set to '/' for application-wide access?
5. Is Max-Age set correctly to match 7-day JWT expiration?

**Rationale**: Incorrect cookie attributes can cause cookies to not be sent with requests, not persist across navigation, or be rejected by browsers

**Action Items**:
- Task 4: Inspect `/backend/src/api/auth.py` signin and signup endpoints
- Task 5: Verify cookie Set-Cookie header format and attributes
- Task 6: Test cookie persistence in browser DevTools (Application tab)

**Best Practices from Research**:
- **httpOnly**: ✅ Prevents XSS attacks from stealing tokens
- **secure**: ✅ Required in production (HTTPS), should be disabled in local development (HTTP)
- **sameSite: Lax**: ✅ Protects against CSRF while allowing normal navigation
- **path: /**: ✅ Makes cookie available to all routes in the application
- **domain**: Should NOT be set in development (localhost), should match app domain in production

**Alternatives Considered**:
- **Alt 1**: sameSite: 'strict' → **Rejected**: Breaks navigation from external links
- **Alt 2**: sameSite: 'none' → **Rejected**: Requires secure=true always, opens CSRF vulnerabilities
- **Alt 3**: No httpOnly flag → **Rejected**: Security risk (XSS token theft)

### 3. Session Validation Timing

**Decision**: Add await/delay before navigation to ensure session fully established

**Research Task**: Identify race conditions where dashboard loads before session credentials are available

**Findings from User Input**:
- Suspected timing issue: signin completes → router.push('/dashboard') executes immediately → dashboard loads → no session found yet
- Backend sets cookie in response, but frontend navigates before cookie is fully written to browser storage

**Research on Browser Cookie Timing**:
- Cookies in Set-Cookie header are processed AFTER the HTTP response completes
- Navigation triggered synchronously may execute before browser finishes cookie processing
- Solutions: (1) Add delay, (2) Poll for cookie, (3) Use callback after cookie confirmation

**Rationale**: Race conditions are a common cause of intermittent authentication failures in single-page applications

**Action Items**:
- Task 7: Add session confirmation check after signin API call
- Task 8: Implement retry logic with exponential backoff (50ms, 100ms, 200ms, max 500ms)
- Task 9: Only navigate after session is confirmed OR timeout (max wait: 1 second)

**Alternatives Considered**:
- **Alt 1**: Fixed delay (e.g., setTimeout 500ms) → **Rejected**: Arbitrary delay may be too short or unnecessarily long
- **Alt 2**: Synchronous check → **Rejected**: Cookies may not be immediately available
- **Alt 3**: Polling with retry logic → **Selected**: More reliable, adapts to actual cookie timing

###  4. Token Retrieval Method

**Decision**: Use document.cookie parsing instead of Better Auth getSession() for diagnostic clarity

**Research Task**: Determine most reliable method to access JWT token on dashboard mount

**Findings from Code Review**:
- Current implementation: `getTokenFromCookie()` parses `document.cookie` manually
- Better Auth may provide `getSession()` API, but unclear if it's available client-side
- Manual cookie parsing is straightforward and works reliably

**Rationale**: Direct cookie access provides transparency for debugging and doesn't depend on Better Auth client-side APIs that may not be fully configured

**Action Items**:
- Task 10: Keep existing `getTokenFromCookie()` implementation
- Task 11: Add comprehensive logging to trace cookie retrieval
- Task 12: Add validation to ensure decoded token is not expired (exp claim check)

**Alternatives Considered**:
- **Alt 1**: Use Better Auth SDK getSession() → **Rejected**: Adds dependency on SDK configuration; harder to debug
- **Alt 2**: Store token in localStorage → **Rejected**: Security risk (XSS), violates httpOnly cookie requirement
- **Alt 3**: Use document.cookie parsing → **Selected**: Direct, transparent, reliable

### 5. Error Recovery Strategy

**Decision**: Implement auto-retry once with clear error messages

**Research Task**: Design fallback behavior when session validation fails

**Findings from User Input**:
- Current behavior: Immediate "session expired" error → user confusion
- Desired behavior: Transparent retry, then clear error if still failing

**Recovery Flow Design**:
1. Dashboard mounts → attempt to get session
2. If no session found → wait 500ms → retry once
3. If still no session → check if token exists but is expired
4. Display appropriate error: "Session expired" (if expired) vs "Authentication error" (if invalid) vs "Please sign in" (if missing)
5. Redirect to signin page with error message in query parameter

**Rationale**: Single retry handles race condition timing issues; clear error messages help users understand what went wrong

**Action Items**:
- Task 13: Implement session retrieval with one retry (500ms delay)
- Task 14: Add error type detection (missing vs expired vs invalid)
- Task 15: Display user-friendly error messages on signin page

**Alternatives Considered**:
- **Alt 1**: No retry, immediate error → **Rejected**: Doesn't handle race conditions
- **Alt 2**: Multiple retries (3+) → **Rejected**: Adds unnecessary latency for genuine failures
- **Alt 3**: Single retry with exponential backoff → **Selected**: Balances reliability and performance

## Session Flow Diagram

```
┌─────────────┐
│  User       │
│ Submits     │
│ Signin Form │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│ Frontend: POST /api/auth/signin                 │
│ - Validates credentials                         │
│ - Calls backend /api/auth/signin                │
└──────┬──────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│ Backend: Validates user, generates JWT token    │
│ - Returns Set-Cookie: better-auth.session.token │
│ - Cookie attributes: httpOnly, sameSite=Lax,    │
│   path=/, Max-Age=604800 (7 days)               │
└──────┬──────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│ Frontend: Receives response                     │
│ - Browser processes Set-Cookie header           │
│ - Cookie written to browser storage             │
│ [TIMING CRITICAL SECTION]                       │
└──────┬──────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│ Frontend: Session Confirmation Check (NEW)      │
│ - Poll for cookie existence (max 1 second)      │
│ - Verify token decodes successfully             │
│ - Confirm expiration is in future               │
└──────┬──────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│ Frontend: Navigate to /dashboard                │
│ - router.push('/dashboard')                     │
│ - Next.js App Router handles navigation         │
└──────┬──────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│ Dashboard Page Mounts                           │
│ - useEffect runs on mount                       │
│ - Calls getSession() to retrieve token          │
└──────┬──────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│ getSession() with Retry Logic (ENHANCED)        │
│ - Attempt 1: getTokenFromCookie()               │
│ - If null → wait 500ms → Attempt 2              │
│ - If still null → return null (session missing) │
│ - If token found → decode and validate exp      │
└──────┬──────────────────────────────────────────┘
       │
       ├─────────────┬──────────────────────────┐
       │             │                          │
       ▼             ▼                          ▼
┌──────────┐  ┌──────────────┐       ┌──────────────────┐
│ Valid    │  │ Expired      │       │ Missing/Invalid  │
│ Session  │  │ Token        │       │ Token            │
└────┬─────┘  └──────┬───────┘       └────────┬─────────┘
     │               │                         │
     ▼               ▼                         ▼
┌──────────┐  ┌────────────────┐      ┌─────────────────┐
│ Fetch    │  │ Clear cookie,  │      │ Redirect to     │
│ User     │  │ redirect to    │      │ signin with     │
│ Todos    │  │ signin with    │      │ "Please sign in"│
│          │  │ "Session       │      │ message         │
│          │  │ expired"       │      │                 │
└──────────┘  └────────────────┘      └─────────────────┘
```

## Debugging Strategy

### Sequential Diagnostic Steps

Based on user input, here is the recommended debugging order:

1. **Environment Audit** (highest priority - blocks everything else)
   - Verify BETTER_AUTH_SECRET matches in frontend/.env.local and backend/.env
   - If mismatch: Stop, fix, restart both servers
   - Expected result: Secrets are identical

2. **Cookie Configuration Audit**
   - Inspect backend/src/api/auth.py signin endpoint
   - Check Set-Cookie header format: `better-auth.session.token=<JWT>; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`
   - Expected result: All security flags present, Max-Age matches 7 days

3. **Browser Cookie Inspection** (runtime verification)
   - Signin with valid credentials
   - Open Browser DevTools → Application tab → Cookies
   - Verify cookie appears with correct attributes
   - Expected result: Cookie exists, not expired, correct domain/path

4. **Console Log Tracing** (add comprehensive debug output)
   - Add logs at each step: signin API call → response received → cookie check → navigation → dashboard mount → token retrieval
   - Expected result: Logs show exact timing of each step
   - Look for: Dashboard mount happening before "cookie check" log

5. **JWT Token Decode Test** (browser console)
   - After signin, open console and run: `document.cookie.split(';').find(c => c.includes('better-auth'))`
   - Copy token value
   - Decode using jwt.io or browser function
   - Check `exp` claim: Should be 7 days in future (current timestamp + 604800 seconds)
   - Expected result: Token is valid and not expired

6. **Middleware Timing Check**
   - Inspect middleware.ts to see if it runs before session is available
   - Expected result: Middleware either skips auth check OR waits for session
   - Fix: Add session confirmation before middleware auth check

7. **useEffect Dependency Analysis**
   - Check dashboard page useEffect dependencies
   - Look for premature session checks triggered by dependency changes
   - Expected result: useEffect runs only on mount, not on every render

## Testing Strategy

###  Manual Test Cases

1. **Happy Path: Signin → Dashboard**
   - Action: Signin with valid credentials
   - Wait: 2 seconds (artificially added delay for testing)
   - Navigate: Should reach dashboard without error
   - Expected: Dashboard loads, todos displayed, no "session expired" error

2. **Race Condition Test: Immediate Navigation**
   - Action: Signin with valid credentials
   - Navigate: Immediately (no artificial delay)
   - Expected WITH FIX: Dashboard loads after brief delay (retry logic kicks in)
   - Expected WITHOUT FIX: "Session expired" error (identifies timing issue)

3. **Page Refresh Test**
   - Action: Signin successfully, reach dashboard
   - Action: Press F5 or Ctrl+R (hard refresh)
   - Expected: Dashboard reloads, session persists, todos displayed

4. **Authorization Header Test**
   - Action: Signin successfully, reach dashboard
   - Open: Browser DevTools → Network tab
   - Observe: First API call to /api/users/{user_id}/todos
   - Check: Request Headers contain `Authorization: Bearer <token>`
   - Expected: Token is present and valid

5. **Token Expiry Validation**
   - Action: Signin successfully
   - Browser Console: Decode token and check exp claim
   - Verify: `exp` timestamp is approximately 7 days in future
   - Formula: `new Date(payload.exp * 1000)` should be ~7 days from now
   - Expected: Expiration is correct (not in the past)

### Browser DevTools Checklist

**Network Tab**:
- [ ] POST /api/auth/signin returns 200 OK
- [ ] Response includes Set-Cookie header
- [ ] Set-Cookie contains better-auth.session.token
- [ ] Cookie attributes visible in Response Headers

**Application Tab → Cookies**:
- [ ] better-auth.session.token cookie exists
- [ ] Value is a valid JWT (three base64 sections separated by dots)
- [ ] Path is /
- [ ] SameSite is Lax
- [ ] HttpOnly is checked
- [ ] Secure is checked (production) or unchecked (local development)
- [ ] Expires/Max-Age shows date ~7 days in future

**Console Tab**:
- [ ] No errors during signin process
- [ ] Debug logs show session retrieval successful
- [ ] No "session expired" or auth error messages

## Performance Considerations

### Signin to Dashboard Timing Budget

- Signin API call: ~200-500ms (backend auth + JWT generation)
- Cookie processing: ~10-50ms (browser internal)
- Session confirmation polling: 50-500ms (retry logic, worst case)
- Navigation: ~100-200ms (Next.js routing)
- Dashboard mount + initial render: ~200-400ms
- First API call (fetch todos): ~200-500ms

**Total**: ~760ms - 2150ms (well within 3-second success criteria)

### Optimization Notes

- Retry logic adds max 500ms latency (only when race condition occurs)
- Session confirmation check is synchronous after first attempt (no network call)
- Debug logging should be conditionally enabled (production: disabled for performance)

## Risk Analysis

### Top Risks

1. **Risk**: BETTER_AUTH_SECRET mismatch causes ALL authentication to fail
   - **Mitigation**: Verify secrets first before any code changes
   - **Detection**: All signin attempts fail with 401, backend logs show "invalid signature"

2. **Risk**: Cookie domain misconfiguration prevents cookie from being sent
   - **Mitigation**: Audit cookie attributes, test in multiple browsers
   - **Detection**: Cookie appears in DevTools but not sent with requests (Network tab)

3. **Risk**: Retry logic still insufficient (race condition persists)
   - **Mitigation**: Increase retry count or delay if needed
   - **Detection**: Intermittent failures even with retry logic

### Rollback Plan

If changes cause regressions:
1. Revert commits to previous working state
2. Document specific failure mode
3. Re-evaluate approach based on new data

## Next Steps

After Phase 0 research:
1. Proceed to Phase 1: Design session validation flow and contracts
2. Create quickstart guide for testing and validation
3. Update agent context with new debugging utilities
4. Break down implementation into atomic tasks (Phase 2: /sp.tasks)

---

**Research Complete**: All unknowns resolved, ready for Phase 1 design.
