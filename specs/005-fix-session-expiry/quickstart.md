# Quickstart: Testing Session Expiry Fix

**Feature**: 005-fix-session-expiry
**Phase**: 1 - Design & Contracts
**Date**: 2026-01-22

## Purpose

This guide provides step-by-step instructions for testing and validating the session expiry bug fix.

## Prerequisites

- Both frontend and backend servers running
- Test user account created (email: test@example.com, password: Test123!)
- Browser DevTools knowledge (Network tab, Application tab, Console)

## Quick Validation Checklist

Use this checklist to verify the fix is working:

- [ ] **Environment Check**: BETTER_AUTH_SECRET matches in frontend and backend .env files
- [ ] **Cookie Configuration**: better-auth.session.token cookie appears with correct attributes
- [ ] **Signin Flow**: User can signin and reach dashboard without "session expired" error
- [ ] **Page Refresh**: Dashboard reloads successfully without losing session
- [ ] **API Calls**: First API call includes Authorization header with valid token
- [ ] **Navigation**: Moving between pages preserves session
- [ ] **Expiry Handling**: Expired tokens are detected and user is redirected with clear message

## Detailed Testing Procedures

### Test 1: Environment Variable Verification

**Purpose**: Confirm BETTER_AUTH_SECRET is consistent

**Steps**:
1. Open `/frontend/.env.local` and locate `BETTER_AUTH_SECRET=...`
2. Copy the value
3. Open `/backend/.env` and locate `BETTER_AUTH_SECRET=...`
4. Compare: Values must be identical

**Expected Result**: ✅ Secrets match exactly

**If Failed**:
- Update both files to use the same secret
- Restart both servers
- Re-test

---

### Test 2: Cookie Configuration Audit

**Purpose**: Verify cookie attributes are correct

**Steps**:
1. Open browser (Chrome recommended for DevTools)
2. Navigate to `http://localhost:3000/signin`
3. Open DevTools (F12) → Network tab
4. Enter credentials and submit signin form
5. Find the `POST /api/auth/signin` request in Network tab
6. Click on it → go to "Response Headers"
7. Locate the `Set-Cookie` header

**Expected Result**:
```
Set-Cookie: better-auth.session.token=<JWT>; Path=/; SameSite=Lax; Max-Age=604800
```

**Verify**:
- ✅ Cookie name is `better-auth.session.token`
- ✅ Path=/
- ✅ SameSite=Lax
- ✅ Max-Age=604800 (7 days in seconds)
- ✅ HttpOnly flag present (prevents JavaScript access for security)
- ⚠️ Secure flag: Should be ABSENT in development (HTTP), PRESENT in production (HTTPS)

**If Failed**:
- Check `/backend/src/api/auth.py` signin endpoint
- Verify cookie configuration matches expected format
- Update cookie attributes if needed

---

### Test 3: Signin Flow (Happy Path)

**Purpose**: Validate user can signin and access dashboard

**Steps**:
1. Clear browser cookies (DevTools → Application → Cookies → Clear all)
2. Navigate to `http://localhost:3000/signin`
3. Enter credentials:
   - Email: test@example.com
   - Password: Test123!
4. Click "Sign In"
5. Observe redirect to `/dashboard`
6. Check console for errors

**Expected Result**:
- ✅ Redirect to `/dashboard` occurs within 2 seconds
- ✅ Dashboard displays "Your Todos" or similar header
- ✅ No "session expired" error message
- ✅ Console shows debug logs (if logging enabled):
  ```
  [getSession] Cookie found: true
  [getSession] Token decoded: true
  [Dashboard] Session valid, loading todos
  ```

**If Failed**:
- Check console for error messages
- Verify cookie was set (DevTools → Application → Cookies)
- Check if "session expired" error appears
- If intermittent: Likely race condition (retry logic needed)

---

### Test 4: Cookie Persistence Verification

**Purpose**: Confirm cookie is stored in browser after signin

**Steps**:
1. After successful signin (Test 3), stay on dashboard
2. Open DevTools → Application tab
3. Navigate to Cookies → http://localhost:3000
4. Locate `better-auth.session.token`

**Expected Result**:
- ✅ Cookie exists with name `better-auth.session.token`
- ✅ Value is a JWT (format: `xxx.yyy.zzz` - three base64 sections)
- ✅ Path: /
- ✅ SameSite: Lax
- ✅ HttpOnly: ✓ (checked)
- ✅ Secure: (unchecked in development, checked in production)
- ✅ Expires: Date approximately 7 days in future

**If Failed**:
- Cookie missing: Check backend Set-Cookie header (Test 2)
- Cookie present but wrong attributes: Fix backend cookie configuration
- Cookie expires immediately: Check Max-Age value

---

### Test 5: Page Refresh Persistence

**Purpose**: Verify session survives page reload

**Steps**:
1. After successful signin, on dashboard page
2. Press F5 (or Ctrl+R / Cmd+R) to hard refresh
3. Observe page reload

**Expected Result**:
- ✅ Page reloads successfully
- ✅ User remains on dashboard (not redirected to signin)
- ✅ Todos are fetched and displayed
- ✅ No "session expired" error

**If Failed**:
- Check if cookie still exists after refresh (DevTools → Application → Cookies)
- Verify getSession() is called on page mount
- Check console for error messages

---

### Test 6: JWT Token Decode Validation

**Purpose**: Verify token structure and expiration

**Steps**:
1. After successful signin, open DevTools → Console
2. Run this command to extract token:
   ```javascript
   const cookie = document.cookie.split(';').find(c => c.includes('better-auth'));
   const token = cookie?.split('=')[1];
   console.log('Token:', token);
   ```
3. Copy the token value
4. Visit https://jwt.io
5. Paste token into "Encoded" field
6. Inspect "Decoded" payload

**Expected Result**:
- ✅ Header contains: `{ "alg": "HS256", "typ": "JWT" }`
- ✅ Payload contains:
  ```json
  {
    "userId": "<user-uuid>",
    "email": "test@example.com",
    "iat": <issued-at-timestamp>,
    "exp": <expiration-timestamp>
  }
  ```
- ✅ Expiration (exp) is ~7 days in future:
  ```javascript
  const expiryDate = new Date(payload.exp * 1000);
  console.log('Token expires:', expiryDate);
  // Should be approximately 7 days from now
  ```
- ✅ Signature verification shows "Verified" (if BETTER_AUTH_SECRET entered)

**If Failed**:
- Token format invalid: Check backend JWT generation
- Expiry in past: Check server system time, backend exp calculation
- Signature fails: BETTER_AUTH_SECRET mismatch

---

### Test 7: Authorization Header Verification

**Purpose**: Confirm token is sent with API requests

**Steps**:
1. After successful signin, on dashboard page
2. Open DevTools → Network tab
3. Refresh page to trigger API calls
4. Find the `GET /api/users/{user_id}/todos` request
5. Click on it → go to "Request Headers"
6. Locate `Authorization` header

**Expected Result**:
- ✅ Authorization header exists
- ✅ Format: `Bearer <JWT-token>`
- ✅ Token matches cookie value
- ✅ Request returns 200 OK (not 401 Unauthorized)

**If Failed**:
- Authorization header missing: Check API client configuration
- Token format wrong: Verify Bearer prefix is added
- 401 response: Token validation failing on backend (check secret match)

---

### Test 8: Race Condition Test (Advanced)

**Purpose**: Verify retry logic handles timing issues

**Steps**:
1. Clear cookies and navigate to signin
2. Open DevTools → Console
3. Add a breakpoint in browser using:
   ```javascript
   // In browser console before signing in:
   let originalPush = window.history.pushState;
   window.history.pushState = function() {
     debugger; // Pause here
     return originalPush.apply(this, arguments);
   };
   ```
4. Sign in
5. When debugger pauses, quickly check if cookie exists (Console tab):
   ```javascript
   document.cookie.includes('better-auth')
   ```
6. Continue execution

**Expected Result** (with fix):
- ✅ Even if cookie not available at first check, dashboard loads successfully
- ✅ Retry logic waits for cookie to be available
- ✅ No "session expired" error

**Expected Result** (without fix):
- ❌ Cookie might not be available immediately
- ❌ "Session expired" error appears
- ❌ User cannot access dashboard

**If Failed** (with fix):
- Increase retry delay or count
- Check console logs for retry attempts
- Verify waitForSession() is called before navigation

---

### Test 9: Expired Token Handling

**Purpose**: Verify system correctly handles expired tokens

**Steps**:
1. Sign in successfully
2. Manually create an expired token (short expiry for testing):
   - Option A: Modify backend to issue 1-second expiry token for testing
   - Option B: Wait 7 days (not practical)
   - Option C: Manually set cookie with expired token from jwt.io
3. Refresh dashboard page

**Expected Result**:
- ✅ System detects token is expired (exp < current time)
- ✅ Cookie is cleared
- ✅ User redirected to `/signin?message=session_expired`
- ✅ Error message displayed: "Your session has expired. Please sign in again."

**If Failed**:
- Expired token not detected: Check validateSession() logic
- User not redirected: Check dashboard mount logic
- Wrong error message: Check signin page error display

---

### Test 10: Cross-Page Navigation

**Purpose**: Verify session persists across navigation

**Steps**:
1. Sign in successfully, reach dashboard
2. Navigate to profile page (if exists) or other protected route
3. Navigate back to dashboard
4. Repeat navigation 3-5 times

**Expected Result**:
- ✅ Session persists across all navigations
- ✅ No "session expired" errors
- ✅ Each page loads successfully
- ✅ API calls include Authorization header

**If Failed**:
- Session lost during navigation: Check middleware timing
- Cookie cleared unexpectedly: Check cookie path attribute
- Specific route fails: Check that route's authentication logic

---

## Debugging Commands

### Browser Console Quick Checks

```javascript
// Check if cookie exists
document.cookie.includes('better-auth')

// Get cookie value
document.cookie.split(';').find(c => c.includes('better-auth'))?.split('=')[1]

// Decode token payload (manual)
function decodeJWT(token) {
  const payload = token.split('.')[1];
  const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(decoded);
}

const token = /* paste token */;
const payload = decodeJWT(token);
console.log('User ID:', payload.userId);
console.log('Email:', payload.email);
console.log('Expires:', new Date(payload.exp * 1000));
console.log('Is Expired:', payload.exp < Date.now() / 1000);

// Check session (if getSession is exported)
import { getSession } from '@/lib/auth/utils';
const session = await getSession();
console.log('Session:', session);
```

### Backend Log Monitoring

```bash
# Watch backend logs for auth-related events
cd backend
tail -f <log-file> | grep -i "auth\|signin\|token"

# Or if using uvicorn console output
# Look for lines like:
# INFO: POST /api/auth/signin 200 OK
# [AUTH] User signed in: test@example.com
```

## Common Issues and Solutions

### Issue: "Session expired" immediately after signin

**Symptoms**: User signs in, gets redirected to dashboard, immediately sees "session expired" error

**Root Cause**: Race condition - dashboard loads before cookie is fully written

**Solution**: Implement waitForSession() with retry logic before navigation

**Validation**: Run Test 8 (Race Condition Test)

---

### Issue: Cookie exists but session still shows as expired

**Symptoms**: Cookie visible in DevTools, but getSession() returns null

**Root Cause**: Token decode failing or expiration check incorrect

**Solution**:
1. Verify token format is valid JWT (Test 6)
2. Check BETTER_AUTH_SECRET matches (Test 1)
3. Verify exp claim is in future (Test 6)

**Validation**: Run Test 6 (JWT Token Decode)

---

### Issue: 401 Unauthorized on API calls despite valid session

**Symptoms**: Dashboard loads, but API calls fail with 401

**Root Cause**: Token not included in Authorization header OR backend validation failing

**Solution**:
1. Check Authorization header is sent (Test 7)
2. Verify BETTER_AUTH_SECRET matches (Test 1)
3. Check backend token validation logic

**Validation**: Run Test 7 (Authorization Header Verification)

---

### Issue: Session lost on page refresh

**Symptoms**: User signs in, refresh page, gets redirected to signin

**Root Cause**: Cookie not persisting OR getSession() not checking cookie on mount

**Solution**:
1. Verify cookie has correct Path=/ attribute (Test 2)
2. Check Max-Age is set correctly (Test 4)
3. Ensure dashboard calls getSession() on mount

**Validation**: Run Test 5 (Page Refresh Persistence)

---

## Success Criteria

Fix is considered complete when:

- ✅ All 10 tests pass consistently
- ✅ Zero "session expired" false positives during valid sessions
- ✅ Signin → dashboard transition < 3 seconds
- ✅ Session persists across page refresh and navigation
- ✅ Expired tokens are detected and handled gracefully
- ✅ Clear error messages displayed for different failure scenarios
- ✅ Console logs provide useful debugging information

## Next Steps

After validating the fix:

1. Run `/sp.tasks` to break down implementation into atomic tasks
2. Implement changes using specialized agents (auth-security-architect, nextjs-ui-builder)
3. Test each change incrementally
4. Document any deviations from plan in ADR (if significant decisions made)
5. Create PR with comprehensive test results

---

**Quickstart Guide Complete** - Ready for implementation phase
