# Quickstart Guide: Authentication Session Fix Testing

**Feature**: 007-fix-auth-session
**Date**: 2026-02-11
**Purpose**: Testing and validation guide for cross-origin authentication session establishment fix

## Overview

This guide provides step-by-step instructions for testing the authentication session establishment fix in production. The fix addresses timeout errors that occur when users attempt to sign up or sign in.

**Important**: This issue only manifests in production (cross-origin environment). Local testing will not reproduce the problem because localhost uses same-origin requests.

## Prerequisites

- Access to production deployments:
  - Frontend: https://hackathon-02-phase-ii-lac.vercel.app
  - Backend: https://nazimbotexpert-todo-app.hf.space
- Modern browser with DevTools (Chrome, Firefox, Safari, or Edge)
- Test email account for creating new users

## Testing Environment Setup

### 1. Open Browser DevTools

1. Open your browser
2. Press F12 (or Cmd+Option+I on Mac) to open DevTools
3. Navigate to the **Network** tab
4. Enable "Preserve log" to keep network history across page navigations
5. Keep DevTools open during all tests

### 2. Clear Browser State

Before testing, clear existing session data:

1. Open DevTools → **Application** tab → **Cookies**
2. Delete all cookies for `hackathon-02-phase-ii-lac.vercel.app`
3. Delete all cookies for `nazimbotexpert-todo-app.hf.space`
4. Clear browser cache (Ctrl+Shift+Delete)
5. Close and reopen the browser

## Pre-Deployment Validation

### Check Current Configuration Issues

Before deploying the fix, verify the current broken state:

1. **Navigate to**: https://hackathon-02-phase-ii-lac.vercel.app/signup
2. **Open DevTools** → Network tab
3. **Attempt signup** with test credentials
4. **Expected Issues**:
   - Console error: `[Auth:waitForSession] Timeout exceeded`
   - Console error: `Session not established after signin`
   - User stuck on signup page (not redirected)

5. **Check Network Response**:
   - Find the `/api/auth/signup` request in Network tab
   - Click on it → **Headers** tab
   - Look for `Set-Cookie` header
   - **Expected Issue**: Missing `SameSite=None` and `Secure` flags

6. **Check CORS Headers**:
   - In the same request, check Response Headers
   - Look for `Access-Control-Allow-Credentials`
   - **Expected Issue**: Header missing or set to `false`

**Document these findings** to confirm the root cause before deploying the fix.

## Post-Deployment Validation

### Test 1: Signup Flow

**Objective**: Verify new users can create accounts and access the application without timeout errors.

**Steps**:

1. **Navigate to**: https://hackathon-02-phase-ii-lac.vercel.app/signup
2. **Open DevTools** → Console tab (clear any existing logs)
3. **Fill signup form**:
   - Email: `test_$(date +%s)@example.com` (use unique email)
   - Password: `SecurePass123` (min 8 characters)
   - Name: `Test User` (optional)
4. **Click "Sign Up"** button
5. **Observe**:
   - Loading indicator appears
   - No errors in console
   - Redirect to dashboard within 5 seconds

**Validation Checklist**:
- [ ] No timeout errors in console
- [ ] No "Session not established" errors
- [ ] User redirected to `/dashboard`
- [ ] Dashboard loads successfully
- [ ] User email displayed in dashboard

**Network Validation**:
1. Open DevTools → **Network** tab
2. Find the `/api/auth/signup` request
3. Click on it → **Headers** tab
4. **Verify Response Headers**:
   - [ ] `Access-Control-Allow-Credentials: true` present
   - [ ] `Set-Cookie` header present
5. **Verify Cookie Flags** (in Set-Cookie header):
   - [ ] `SameSite=None` present
   - [ ] `Secure` present
   - [ ] `HttpOnly` present
   - [ ] `Max-Age=604800` (7 days) present

**Cookie Validation**:
1. Open DevTools → **Application** tab → **Cookies**
2. **Important**: You'll see cookies grouped by domain. Look under **both domains**:
   - `https://hackathon-02-phase-ii-lac.vercel.app` (frontend cookies)
   - `https://nazimbotexpert-todo-app.hf.space` (backend session cookie)
3. Find `better-auth.session.token` cookie (should be under the backend domain)
4. **Verify Cookie Properties**:
   - [ ] HttpOnly: ✓
   - [ ] Secure: ✓
   - [ ] SameSite: None
   - [ ] Expires: ~7 days from now
   - [ ] Domain: nazimbotexpert-todo-app.hf.space

**Note**: The session cookie is set by the backend, so it appears under the backend domain even when viewing the frontend page. This is normal for cross-origin authentication.

**If Test Fails**:
- Check console for specific error messages
- Verify backend deployment completed successfully
- Verify frontend deployment completed successfully
- Check Network tab for failed requests
- Review backend logs for errors

### Test 2: Signin Flow

**Objective**: Verify existing users can log in without timeout errors.

**Steps**:

1. **Sign out** (if currently logged in)
2. **Navigate to**: https://hackathon-02-phase-ii-lac.vercel.app/signin
3. **Open DevTools** → Console tab (clear logs)
4. **Fill signin form**:
   - Email: (use email from Test 1)
   - Password: `SecurePass123`
5. **Click "Sign In"** button
6. **Observe**:
   - Loading indicator appears
   - No errors in console
   - Redirect to dashboard within 5 seconds

**Validation Checklist**:
- [ ] No timeout errors in console
- [ ] No "Session not established" errors
- [ ] User redirected to `/dashboard`
- [ ] Dashboard loads successfully
- [ ] User data displayed correctly

**Network Validation**:
- Same as Test 1, but check `/api/auth/signin` request
- Verify same CORS and cookie headers

**If Test Fails**:
- Verify credentials are correct
- Check if account exists in database
- Review console errors
- Check Network tab for failed requests

### Test 3: Session Persistence (Page Refresh)

**Objective**: Verify sessions persist across page refreshes.

**Steps**:

1. **Ensure you're logged in** (complete Test 1 or Test 2)
2. **Navigate to**: https://hackathon-02-phase-ii-lac.vercel.app/dashboard
3. **Press F5** (or Cmd+R) to refresh the page
4. **Observe**:
   - Page reloads
   - User remains authenticated
   - No redirect to signin page
   - Dashboard content loads normally

**Validation Checklist**:
- [ ] No redirect to signin page
- [ ] User remains authenticated
- [ ] Dashboard content loads
- [ ] No console errors

**Cookie Validation**:
- Open DevTools → Application → Cookies
- Verify `better-auth.session.token` still exists
- Verify cookie hasn't expired

**If Test Fails**:
- Check if cookie was deleted on refresh
- Verify cookie expiration time
- Check console for session validation errors

### Test 4: Session Persistence (New Tab)

**Objective**: Verify sessions work across multiple browser tabs.

**Steps**:

1. **Ensure you're logged in** in current tab
2. **Open new tab** (Ctrl+T or Cmd+T)
3. **Navigate to**: https://hackathon-02-phase-ii-lac.vercel.app/dashboard
4. **Observe**:
   - User already authenticated in new tab
   - No signin required
   - Dashboard loads immediately

**Validation Checklist**:
- [ ] No signin required in new tab
- [ ] User authenticated automatically
- [ ] Dashboard loads successfully
- [ ] Same user data displayed

**If Test Fails**:
- Verify cookies are shared across tabs (browser setting)
- Check if cookie domain is correct
- Verify cookie flags allow cross-tab sharing

### Test 5: Invalid Credentials

**Objective**: Verify error handling for authentication failures.

**Steps**:

1. **Sign out** (if logged in)
2. **Navigate to**: https://hackathon-02-phase-ii-lac.vercel.app/signin
3. **Fill signin form**:
   - Email: `test@example.com`
   - Password: `WrongPassword123`
4. **Click "Sign In"** button
5. **Observe**:
   - Error message displayed
   - No timeout errors
   - User remains on signin page

**Validation Checklist**:
- [ ] Clear error message displayed
- [ ] Error message is user-friendly
- [ ] No timeout errors in console
- [ ] User can retry signin
- [ ] Form remains functional

**Expected Error Message**: "Invalid email or password" (or similar)

**If Test Fails**:
- Check if error message is displayed
- Verify error message is clear and actionable
- Check console for unexpected errors

### Test 6: Network Error Simulation

**Objective**: Verify error handling for network issues.

**Steps**:

1. **Open DevTools** → **Network** tab
2. **Enable network throttling**: Select "Offline" from dropdown
3. **Navigate to**: https://hackathon-02-phase-ii-lac.vercel.app/signup
4. **Attempt signup** with valid credentials
5. **Observe**:
   - Network error message displayed
   - No timeout errors (or appropriate timeout message)
   - User can retry when connection restored

6. **Disable network throttling**: Select "No throttling"
7. **Retry signup**
8. **Observe**: Signup succeeds

**Validation Checklist**:
- [ ] Network error message displayed
- [ ] Error message mentions connection issue
- [ ] User can retry after connection restored
- [ ] Retry succeeds when online

**If Test Fails**:
- Check if network errors are caught
- Verify error messages are appropriate
- Test retry mechanism

## Validation Checklist Summary

### Backend Configuration
- [ ] CORS includes `Access-Control-Allow-Credentials: true`
- [ ] Cookies have `SameSite=None` flag
- [ ] Cookies have `Secure` flag
- [ ] Cookies have `HttpOnly` flag
- [ ] Cookies have 7-day expiration

### Frontend Configuration
- [ ] Fetch requests include `credentials: 'include'`
- [ ] Session wait timeout is 5000ms
- [ ] Error handling displays clear messages

### Functional Tests
- [ ] Signup completes without timeout (Test 1)
- [ ] Signin completes without timeout (Test 2)
- [ ] Session persists across page refresh (Test 3)
- [ ] Session persists across browser tabs (Test 4)
- [ ] Invalid credentials show clear error (Test 5)
- [ ] Network errors handled gracefully (Test 6)

### Success Criteria
- [ ] Zero timeout errors during normal authentication
- [ ] 100% of successful authentications establish sessions within 5 seconds
- [ ] All 6 test cases pass
- [ ] No console errors during normal flows

## Troubleshooting

### Issue: Timeout Errors Still Occur

**Possible Causes**:
1. Backend changes not deployed
2. Frontend changes not deployed
3. Browser cache not cleared
4. Cookie flags incorrect

**Resolution**:
1. Verify backend deployment: Check Hugging Face Spaces logs
2. Verify frontend deployment: Check Vercel deployment status
3. Clear browser cache and cookies completely
4. Verify cookie flags in DevTools → Application → Cookies

### Issue: CORS Errors in Console

**Symptoms**: `Access-Control-Allow-Origin` errors

**Possible Causes**:
1. CORS not configured correctly
2. Origin mismatch
3. Credentials not allowed

**Resolution**:
1. Check backend CORS configuration in `main.py`
2. Verify `allow_credentials=True` is present
3. Verify `allow_origins` includes exact frontend URL
4. Check for typos in origin URL

### Issue: Cookies Not Set

**Symptoms**: No `better-auth.session.token` cookie in DevTools

**Possible Causes**:
1. Cookie flags incorrect
2. HTTPS not enforced
3. Browser blocking cookies

**Resolution**:
1. Verify `SameSite=None` and `Secure` flags in Set-Cookie header
2. Verify both frontend and backend use HTTPS
3. Check browser privacy settings (allow cookies)
4. Try different browser to rule out browser-specific issues

### Issue: Session Not Detected

**Symptoms**: Timeout error even though cookie is set

**Possible Causes**:
1. Frontend not sending credentials
2. Session wait timeout too short
3. Session detection logic broken

**Resolution**:
1. Verify `credentials: 'include'` in fetch requests
2. Verify `maxWait: 5000` in session-wait.ts
3. Check console for session detection logs
4. Review session detection logic in useAuth hook

## Rollback Procedure

If the fix causes issues in production:

1. **Identify the Problem**:
   - Document specific error messages
   - Capture screenshots
   - Save browser console logs
   - Note which test cases fail

2. **Revert Backend Changes**:
   ```bash
   git revert <commit-hash>
   git push origin 007-fix-auth-session
   ```
   - GitHub Actions will automatically redeploy

3. **Revert Frontend Changes**:
   ```bash
   git revert <commit-hash>
   git push origin 007-fix-auth-session
   ```
   - Vercel will automatically redeploy

4. **Verify Rollback**:
   - Test that application returns to previous state
   - Verify no new errors introduced

5. **Investigate Root Cause**:
   - Review error logs
   - Identify what went wrong
   - Plan corrective action

## Monitoring

### First 24 Hours After Deployment

**Metrics to Track**:
1. Authentication success rate
2. Timeout error frequency
3. Support tickets related to login issues
4. User feedback

**Monitoring Tools**:
- Backend logs (Hugging Face Spaces)
- Frontend logs (Vercel)
- Browser console errors (user reports)
- Support ticket system

**Alert Thresholds**:
- Authentication success rate drops below 95%
- More than 5 timeout errors per hour
- More than 3 support tickets about login issues

**Action Plan**:
- If thresholds exceeded, investigate immediately
- Consider rollback if issues are widespread
- Document all issues for post-mortem

## Success Metrics

### Immediate (Within 5 Minutes)
- [ ] All 6 test cases pass
- [ ] No timeout errors in test runs
- [ ] Smoke tests complete successfully

### Short-Term (Within 24 Hours)
- [ ] No new support tickets about login issues
- [ ] Authentication success rate ≥ 99%
- [ ] Zero timeout errors reported

### Long-Term (7 Days)
- [ ] Sustained 99% authentication success rate
- [ ] 90% reduction in login-related support tickets
- [ ] Positive user feedback about authentication experience

## Next Steps

After successful validation:

1. **Document Results**: Record test outcomes and any issues found
2. **Monitor Metrics**: Track success metrics for 7 days
3. **Collect Feedback**: Gather user feedback on authentication experience
4. **Close Feature**: Mark feature as complete if all success criteria met
5. **Post-Mortem**: Document lessons learned and improvements for future

## Support

If you encounter issues during testing:

1. **Check this guide** for troubleshooting steps
2. **Review error logs** in browser console and backend logs
3. **Verify configuration** using validation checklists
4. **Document the issue** with screenshots and error messages
5. **Contact development team** with detailed information

---

**Last Updated**: 2026-02-11
**Feature**: 007-fix-auth-session
**Status**: Ready for testing
