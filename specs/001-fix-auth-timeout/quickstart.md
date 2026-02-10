# Quick Start Guide: Authentication Session Timeout Fix

**Feature**: 001-fix-auth-timeout
**Date**: 2026-02-10
**Status**: Development Ready

## Overview

This guide helps developers set up, test, and debug the authentication session timeout fix. The fix addresses timeout errors that prevent users from logging in by implementing API-based session verification compatible with HttpOnly cookies.

## Prerequisites

### Required Software

- **Node.js**: 18.x or higher
- **Python**: 3.11 or higher
- **Git**: Latest version
- **Code Editor**: VS Code recommended

### Required Accounts

- **Neon PostgreSQL**: Database access credentials
- **Hugging Face**: Account for backend deployment (optional for local dev)
- **Vercel**: Account for frontend deployment (optional for local dev)

### Environment Variables

You'll need the following environment variables configured:

**Backend (.env in backend/):**
```bash
DATABASE_URL=postgresql://user:password@host/database
BETTER_AUTH_SECRET=your-secret-key-min-32-chars
BETTER_AUTH_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env.local in frontend/):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
BETTER_AUTH_URL=http://localhost:8000
BETTER_AUTH_SECRET=your-secret-key-min-32-chars
```

**Important**: Use the same `BETTER_AUTH_SECRET` in both frontend and backend.

## Setup Instructions

### 1. Clone and Checkout Branch

```bash
# Clone repository (if not already cloned)
git clone <repository-url>
cd hackathon_02_phase-II

# Checkout feature branch
git checkout 001-fix-auth-timeout

# Pull latest changes
git pull origin 001-fix-auth-timeout
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from .env.example if available)
cp .env.example .env
# Edit .env with your actual values

# Run database migrations (if any)
# alembic upgrade head

# Start backend server
uvicorn src.main:app --reload --port 8000
```

**Verify backend is running:**
- Open browser to http://localhost:8000/docs
- You should see FastAPI Swagger documentation

### 3. Frontend Setup

```bash
# Open new terminal
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local
# Edit .env.local with your actual values

# Start development server
npm run dev
```

**Verify frontend is running:**
- Open browser to http://localhost:3000
- You should see the application homepage

## Testing the Fix

### Manual Testing Workflow

#### Test 1: Successful Login Flow

1. **Navigate to signup page**: http://localhost:3000/signup
2. **Create test account**:
   - Email: test@example.com
   - Password: TestPassword123!
3. **Submit form** and observe:
   - Loading indicator appears
   - No timeout errors
   - Redirect to dashboard within 5 seconds
4. **Verify session persistence**:
   - Refresh the page (F5)
   - Should remain logged in (no redirect to signin)

**Expected Behavior:**
- ✅ Login completes within 3-5 seconds
- ✅ No "Session could not be established" error
- ✅ User redirected to dashboard
- ✅ Session persists across page refresh

#### Test 2: Session Verification Endpoint

**Using Browser DevTools:**

1. Open DevTools (F12) → Network tab
2. Log in to the application
3. Look for request to `/api/auth/session`
4. Verify response:
   - Status: 200 OK
   - Response body contains user data and token
   - Cookie header includes `better-auth.session.token`

**Using curl:**

```bash
# First, log in via browser to get cookie
# Then copy the cookie value and test:

curl -X GET http://localhost:8000/api/auth/session \
  -H "Cookie: better-auth.session.token=<your-token>" \
  -v
```

**Expected Response:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "test@example.com"
  },
  "expiresAt": 1771285287,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Test 3: Timeout Handling

**Simulate slow network:**

1. Open DevTools (F12) → Network tab
2. Enable network throttling: "Slow 3G"
3. Attempt to log in
4. Observe:
   - Loading indicator shows for up to 3 seconds
   - Session verification polls backend
   - Login completes successfully (no timeout)

**Expected Behavior:**
- ✅ Timeout set to 3000ms (3 seconds)
- ✅ Polling continues until session established
- ✅ No premature timeout errors

#### Test 4: Invalid Session Handling

**Test expired/invalid token:**

1. Log in successfully
2. Open DevTools → Application → Cookies
3. Delete `better-auth.session.token` cookie
4. Refresh page
5. Observe:
   - Redirect to signin page
   - No error messages (graceful handling)

**Expected Behavior:**
- ✅ Invalid session detected
- ✅ User redirected to signin
- ✅ No console errors

### Automated Testing

#### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run specific test file
pytest tests/test_auth_session.py

# Run with coverage
pytest --cov=src tests/
```

**Key test cases:**
- `test_get_session_with_valid_cookie`: Verify 200 response with user data
- `test_get_session_without_cookie`: Verify 401 response
- `test_get_session_with_expired_token`: Verify 401 response
- `test_get_session_with_invalid_signature`: Verify 401 response

#### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run specific test file
npm test -- session-wait.test.ts

# Run with coverage
npm test -- --coverage
```

**Key test cases:**
- `waitForSession`: Verify polling logic with 3000ms timeout
- `checkSession`: Verify API call includes credentials
- `getSession`: Verify retry logic on failure

## Debugging Guide

### Common Issues

#### Issue 1: "Session could not be established" Error

**Symptoms:**
- Login form submits successfully
- Loading indicator appears
- Error message after 3 seconds

**Debugging Steps:**

1. **Check backend logs:**
   ```bash
   # Backend terminal should show:
   INFO:     POST /api/auth/signin - 200 OK
   INFO:     GET /api/auth/session - 200 OK
   ```

2. **Check browser console:**
   ```javascript
   // Should see polling attempts:
   [Auth] Checking session... (attempt 1)
   [Auth] Checking session... (attempt 2)
   [Auth] Session established
   ```

3. **Verify cookie is set:**
   - DevTools → Application → Cookies
   - Look for `better-auth.session.token`
   - Should be HttpOnly, Secure (in production), SameSite=Lax

4. **Check CORS configuration:**
   ```python
   # backend/src/main.py
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:3000"],
       allow_credentials=True,  # MUST be True for cookies
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

**Solution:**
- Ensure `credentials: 'include'` in frontend fetch calls
- Verify CORS `allow_credentials=True` in backend
- Check `BETTER_AUTH_SECRET` matches in both frontend and backend

#### Issue 2: Session Endpoint Returns 401

**Symptoms:**
- Login succeeds but session check fails
- 401 Unauthorized from `/api/auth/session`

**Debugging Steps:**

1. **Verify JWT token format:**
   ```bash
   # Decode token (use jwt.io or jwt-cli)
   # Token should have:
   # - userId field
   # - email field
   # - exp (expiration) field
   ```

2. **Check token expiration:**
   ```python
   # Backend logs should show:
   import jwt
   payload = jwt.decode(token, SECRET, algorithms=["HS256"])
   print(f"Token expires at: {payload['exp']}")
   ```

3. **Verify secret key:**
   ```bash
   # Both .env files should have identical secret:
   echo $BETTER_AUTH_SECRET
   ```

**Solution:**
- Regenerate JWT token with correct secret
- Ensure token expiration is 7 days (604800 seconds)
- Verify user exists in database

#### Issue 3: Timeout Too Short

**Symptoms:**
- Timeout occurs before backend responds
- Works on fast network, fails on slow network

**Debugging Steps:**

1. **Measure backend response time:**
   ```bash
   # Use curl with timing:
   curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8000/api/auth/session

   # curl-format.txt:
   time_total: %{time_total}s
   ```

2. **Check bcrypt cost factor:**
   ```python
   # backend/src/auth/password.py
   # Cost factor should be 12 (takes ~2 seconds)
   bcrypt.hashpw(password, bcrypt.gensalt(rounds=12))
   ```

**Solution:**
- Increase timeout in `session-wait.ts`: `maxWait: 3000` → `maxWait: 5000`
- Consider reducing bcrypt cost factor for development (not production)

### Debug Logging

**Enable verbose logging:**

**Backend:**
```python
# backend/src/main.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

**Frontend:**
```typescript
// frontend/lib/auth/logger.ts
export const DEBUG = true;
```

**View logs:**
- Backend: Terminal running uvicorn
- Frontend: Browser DevTools → Console

## Performance Benchmarks

### Expected Timings

| Operation | Target | Acceptable | Unacceptable |
|-----------|--------|------------|--------------|
| Login (fast network) | <2s | <3s | >5s |
| Login (slow network) | <3s | <5s | >10s |
| Session verification | <500ms | <1s | >2s |
| Page load (authenticated) | <1s | <2s | >3s |

### Measuring Performance

**Using Browser DevTools:**

1. Open DevTools → Network tab
2. Clear network log
3. Perform login
4. Check timing for `/api/auth/session`:
   - Waiting (TTFB): Should be <500ms
   - Content Download: Should be <50ms

**Using curl:**

```bash
# Measure session endpoint performance
for i in {1..10}; do
  curl -w "Time: %{time_total}s\n" -o /dev/null -s \
    -H "Cookie: better-auth.session.token=<token>" \
    http://localhost:8000/api/auth/session
done
```

## Deployment Testing

### Pre-Deployment Checklist

- [ ] All unit tests pass (`pytest` and `npm test`)
- [ ] Manual testing completed (all 4 test scenarios)
- [ ] No console errors in browser
- [ ] Session persists across page refresh
- [ ] Timeout errors eliminated
- [ ] Performance benchmarks met
- [ ] Environment variables configured for production
- [ ] CORS configured for production domains

### Production Environment Variables

**Backend (Hugging Face Spaces):**
```bash
DATABASE_URL=<neon-production-url>
BETTER_AUTH_SECRET=<production-secret-min-32-chars>
BETTER_AUTH_URL=https://your-backend.hf.space
FRONTEND_URL=https://your-app.vercel.app
```

**Frontend (Vercel):**
```bash
NEXT_PUBLIC_API_URL=https://your-backend.hf.space
BETTER_AUTH_URL=https://your-backend.hf.space
BETTER_AUTH_SECRET=<same-as-backend>
```

### Post-Deployment Verification

1. **Test production login:**
   - Navigate to https://your-app.vercel.app/signin
   - Log in with test account
   - Verify no timeout errors

2. **Check production logs:**
   - Hugging Face Spaces: View logs in dashboard
   - Vercel: View logs in deployment dashboard

3. **Monitor error rates:**
   - Should see zero "Session could not be established" errors
   - Login success rate should be >95%

## Additional Resources

### Related Documentation

- [spec.md](./spec.md) - Feature specification
- [plan.md](./plan.md) - Implementation plan
- [research.md](./research.md) - Technical research findings
- [data-model.md](./data-model.md) - Session entity definitions
- [contracts/session-endpoint.yaml](./contracts/session-endpoint.yaml) - API contract

### External References

- [Better Auth Documentation](https://better-auth.com/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [HttpOnly Cookies (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#restrict_access_to_cookies)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

## Support

If you encounter issues not covered in this guide:

1. Check existing GitHub issues
2. Review backend and frontend logs
3. Verify environment variables are correct
4. Test with network throttling disabled
5. Create new GitHub issue with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser console logs
   - Backend logs
   - Environment (OS, browser, Node/Python versions)
