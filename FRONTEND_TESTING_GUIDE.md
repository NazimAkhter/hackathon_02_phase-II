# Frontend Testing Guide - Authentication Fix Verification

**Date**: 2026-02-10
**Purpose**: Verify authentication timeout fix works end-to-end in production
**Frontend URL**: https://hackathon-02-phase-ii-lac.vercel.app
**Backend URL**: https://nazimbotexpert-todo-app.hf.space

---

## Pre-Testing Setup

### 1. Clear Browser Data (CRITICAL)
Before testing, you MUST clear all cached data to ensure you're testing with the new backend code:

**Chrome/Edge**:
1. Press `F12` to open DevTools
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. Go to Application tab → Storage
5. Click "Clear site data"
6. Close and reopen browser

**Firefox**:
1. Press `Ctrl+Shift+Delete`
2. Select "Everything" for time range
3. Check "Cookies" and "Cache"
4. Click "Clear Now"
5. Close and reopen browser

**Safari**:
1. Go to Develop → Empty Caches
2. Go to Safari → Clear History
3. Select "all history"
4. Close and reopen browser

---

## Test Suite

### Test 1: Frontend Accessibility ✅
**Status**: Verified
- Frontend is accessible (HTTP 200)
- Response time: ~0.5 seconds
- Page loads correctly

---

### Test 2: User Signup Flow

**Objective**: Verify new user can create account without timeout error

**Steps**:
1. Navigate to https://hackathon-02-phase-ii-lac.vercel.app
2. Click "Sign Up" button (or navigate to signup page)
3. Fill in the form:
   - Email: `test_frontend_$(date +%s)@example.com` (use unique email)
   - Password: `TestPass123` (min 8 chars, letters + numbers)
   - Name: `Frontend Test User` (optional)
4. Click "Create Account" or "Sign Up" button
5. Wait for response (should be ~2 seconds due to bcrypt)

**Expected Results**:
- ✅ No timeout error
- ✅ No CORS errors in console
- ✅ Success message displayed
- ✅ Redirected to dashboard or home page
- ✅ User is logged in (can see authenticated content)

**Check Browser Console** (F12 → Console):
- ✅ No red error messages
- ✅ No "Session creation or retrieval failed" errors
- ✅ No CORS policy errors
- ✅ API request to `/api/auth/signup` shows 201 status

**Check Network Tab** (F12 → Network):
- ✅ POST request to `https://nazimbotexpert-todo-app.hf.space/api/auth/signup`
- ✅ Status: 201 Created
- ✅ Response includes user data and token
- ✅ Set-Cookie header present with HttpOnly flag

**Check Cookies** (F12 → Application → Cookies):
- ✅ Cookie name: `better-auth.session.token`
- ✅ Value: JWT token (long string starting with `eyJ`)
- ✅ HttpOnly: ✓ (checked)
- ✅ SameSite: Lax
- ✅ Expires: ~7 days from now

**If Test Fails**:
- Check console for specific error messages
- Verify backend is running (check Space status)
- Verify CORS configuration (should allow frontend origin)
- Take screenshot of error and share

---

### Test 3: User Signin Flow

**Objective**: Verify existing user can sign in without timeout error

**Steps**:
1. If logged in from Test 2, sign out first
2. Navigate to https://hackathon-02-phase-ii-lac.vercel.app
3. Click "Sign In" button (or navigate to signin page)
4. Fill in the form:
   - Email: Use email from Test 2 or `test_1770673871@example.com`
   - Password: `TestPass123`
5. Click "Sign In" button
6. Wait for response (should be ~2 seconds)

**Expected Results**:
- ✅ No timeout error
- ✅ No CORS errors in console
- ✅ Success message displayed
- ✅ Redirected to dashboard
- ✅ User is logged in

**Check Browser Console**:
- ✅ No "Session creation or retrieval failed" errors
- ✅ API request to `/api/auth/signin` shows 200 status

**Check Network Tab**:
- ✅ POST request to `https://nazimbotexpert-todo-app.hf.space/api/auth/signin`
- ✅ Status: 200 OK
- ✅ Response includes user data and token
- ✅ Set-Cookie header with HttpOnly flag

**Check Cookies**:
- ✅ Cookie `better-auth.session.token` updated with new token
- ✅ HttpOnly flag present

**If Test Fails**:
- Verify email/password are correct
- Check if account exists (try signup first)
- Check console for authentication errors
- Verify backend authentication endpoint is working

---

### Test 4: Session Persistence

**Objective**: Verify session persists across page refreshes

**Steps**:
1. After signing in (Test 3), verify you're on dashboard
2. Note your authentication state (logged in)
3. Refresh the page (F5 or Ctrl+R)
4. Wait for page to reload

**Expected Results**:
- ✅ Still logged in after refresh
- ✅ No need to sign in again
- ✅ User data still displayed
- ✅ Cookie still present

**Check Browser Console**:
- ✅ No session retrieval errors
- ✅ Better Auth successfully retrieves session from cookie

**If Test Fails**:
- Check if cookie was deleted on refresh
- Verify cookie expiration is set correctly
- Check Better Auth client configuration

---

### Test 5: Create Task (Authenticated Request)

**Objective**: Verify authenticated API requests work correctly

**Steps**:
1. While logged in, navigate to task creation page/form
2. Enter task title: "Test Task - Frontend Verification"
3. Click "Create" or "Add Task" button
4. Wait for response

**Expected Results**:
- ✅ Task created successfully
- ✅ Task appears in task list
- ✅ No authentication errors
- ✅ Cookie sent with request

**Check Network Tab**:
- ✅ POST request to `https://nazimbotexpert-todo-app.hf.space/api/{user_id}/tasks`
- ✅ Status: 201 Created
- ✅ Request includes Cookie header with JWT token
- ✅ Response includes created task data

**If Test Fails**:
- Check if user is still authenticated
- Verify cookie is being sent with request
- Check backend task creation endpoint

---

### Test 6: List Tasks

**Objective**: Verify task listing works with authentication

**Steps**:
1. Navigate to task list page (usually dashboard)
2. Verify tasks are displayed

**Expected Results**:
- ✅ Tasks load successfully
- ✅ Created task from Test 5 is visible
- ✅ No authentication errors

**Check Network Tab**:
- ✅ GET request to `https://nazimbotexpert-todo-app.hf.space/api/{user_id}/tasks`
- ✅ Status: 200 OK
- ✅ Cookie sent with request
- ✅ Response includes array of tasks

---

### Test 7: Update Task

**Objective**: Verify task updates work with authentication

**Steps**:
1. Find the task created in Test 5
2. Click checkbox to mark as complete (or edit button)
3. Wait for response

**Expected Results**:
- ✅ Task updated successfully
- ✅ UI reflects the change
- ✅ No authentication errors

**Check Network Tab**:
- ✅ PATCH or PUT request to `https://nazimbotexpert-todo-app.hf.space/api/{user_id}/tasks/{task_id}`
- ✅ Status: 200 OK
- ✅ Cookie sent with request

---

### Test 8: Delete Task

**Objective**: Verify task deletion works with authentication

**Steps**:
1. Find the task created in Test 5
2. Click delete button
3. Confirm deletion if prompted
4. Wait for response

**Expected Results**:
- ✅ Task deleted successfully
- ✅ Task removed from list
- ✅ No authentication errors

**Check Network Tab**:
- ✅ DELETE request to `https://nazimbotexpert-todo-app.hf.space/api/{user_id}/tasks/{task_id}`
- ✅ Status: 204 No Content
- ✅ Cookie sent with request

---

### Test 9: Sign Out

**Objective**: Verify sign out clears session

**Steps**:
1. Click "Sign Out" or "Logout" button
2. Wait for response

**Expected Results**:
- ✅ User signed out successfully
- ✅ Redirected to signin/home page
- ✅ Cookie cleared or invalidated
- ✅ Cannot access authenticated pages

**Check Cookies**:
- ✅ `better-auth.session.token` cookie removed or expired

---

### Test 10: Protected Route Access

**Objective**: Verify unauthenticated users cannot access protected routes

**Steps**:
1. After signing out (Test 9), try to access dashboard directly
2. Navigate to a URL that requires authentication

**Expected Results**:
- ✅ Redirected to signin page
- ✅ Cannot access protected content
- ✅ Appropriate error message or redirect

---

## Common Issues and Solutions

### Issue 1: "Session creation or retrieval failed before the timeout"

**Status**: Should be FIXED with HttpOnly flag enabled

**If still occurring**:
1. Clear browser cache completely
2. Verify backend is running (check Space status)
3. Check browser console for specific error
4. Verify cookie is being set (check Application tab)
5. Check if HttpOnly flag is present in cookie

**Debug Steps**:
```bash
# Verify backend cookie configuration
curl -X POST https://nazimbotexpert-todo-app.hf.space/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}' \
  -v 2>&1 | grep -i "httponly"
```

Expected: Should see `HttpOnly` in Set-Cookie header

---

### Issue 2: CORS Errors

**Symptoms**:
- "Access to fetch has been blocked by CORS policy"
- "No 'Access-Control-Allow-Origin' header"

**Solution**:
1. Verify FRONTEND_URL is set in Hugging Face Space
2. Check backend CORS configuration
3. Verify frontend origin matches exactly

**Debug Steps**:
```bash
# Check CORS configuration
curl -s https://nazimbotexpert-todo-app.hf.space/ | grep cors_origins
```

Expected: `"cors_origins":["https://hackathon-02-phase-ii-lac.vercel.app"]`

---

### Issue 3: Cookie Not Being Set

**Symptoms**:
- No cookie in Application tab
- Authentication succeeds but session not created

**Solution**:
1. Check if browser is blocking third-party cookies
2. Verify Set-Cookie header in Network tab
3. Check cookie domain and path settings

**Debug Steps**:
- Open DevTools → Network tab
- Find the signin/signup request
- Check Response Headers for Set-Cookie
- Verify cookie attributes (HttpOnly, SameSite, Path)

---

### Issue 4: 401 Unauthorized on Authenticated Requests

**Symptoms**:
- Can sign in successfully
- Task operations fail with 401 error

**Solution**:
1. Verify cookie is being sent with requests (check Network tab)
2. Check if JWT token is valid (not expired)
3. Verify backend JWT validation is working

**Debug Steps**:
- Check Network tab → Request Headers
- Look for Cookie header with JWT token
- Verify token format (should start with `eyJ`)

---

## Test Results Template

Copy this template and fill in results:

```
## Frontend Testing Results

**Date**: 2026-02-10
**Tester**: [Your Name]
**Browser**: [Chrome/Firefox/Safari] [Version]

### Test Results

- [ ] Test 1: Frontend Accessibility - PASS/FAIL
- [ ] Test 2: User Signup - PASS/FAIL
- [ ] Test 3: User Signin - PASS/FAIL
- [ ] Test 4: Session Persistence - PASS/FAIL
- [ ] Test 5: Create Task - PASS/FAIL
- [ ] Test 6: List Tasks - PASS/FAIL
- [ ] Test 7: Update Task - PASS/FAIL
- [ ] Test 8: Delete Task - PASS/FAIL
- [ ] Test 9: Sign Out - PASS/FAIL
- [ ] Test 10: Protected Routes - PASS/FAIL

### Issues Found

[List any issues encountered]

### Screenshots

[Attach screenshots of any errors]

### Browser Console Errors

[Copy any error messages from console]

### Overall Status

- [ ] All tests passed - Authentication fix verified working
- [ ] Some tests failed - Issues need investigation
- [ ] Critical failures - Authentication still broken
```

---

## Success Criteria

The authentication fix is considered successful if:

✅ **All 10 tests pass**
✅ **No timeout errors during signup/signin**
✅ **HttpOnly cookie is set correctly**
✅ **Session persists across page refreshes**
✅ **All authenticated requests work**
✅ **No CORS errors in console**

---

## Next Steps After Testing

### If All Tests Pass ✅
1. Mark authentication fix as complete
2. Update project status documentation
3. Monitor production for any issues
4. Consider adding automated E2E tests

### If Tests Fail ❌
1. Document specific failures
2. Check browser console for error messages
3. Verify backend is running correctly
4. Check if issue is frontend or backend
5. Report findings for further investigation

---

**Ready to Test**: The backend fix is deployed and verified. Please run through these tests and report results.
