# CORS Configuration Fix - Action Required

**Issue**: Frontend cannot communicate with backend due to CORS mismatch
**Status**: Code fix deployed, environment variable configuration needed

---

## Problem Summary

The backend API is currently only allowing requests from `http://localhost:3000` (development), but your production frontend is deployed at:
```
https://hackathon-02-phase-ii-lac.vercel.app
```

This causes CORS (Cross-Origin Resource Sharing) errors, preventing the frontend from making API calls to the backend.

---

## Solution Applied

### Code Fix (Completed) ✅
- **Commit**: e3b94cb
- **File**: `backend/src/config.py`
- **Change**: Updated CORS configuration to use `FRONTEND_URL` environment variable

### Environment Variable Configuration (Required) ⚠️

You need to add the `FRONTEND_URL` environment variable to your Hugging Face Space.

---

## Step-by-Step Instructions

### Option 1: Via Hugging Face Web Interface (Recommended)

1. **Navigate to Space Settings**
   - Go to: https://huggingface.co/spaces/NazimBotExpert/todo-app
   - Click on **"Settings"** tab at the top

2. **Add Environment Variable**
   - Scroll down to **"Repository secrets"** section
   - Click **"New secret"** button
   - Enter the following:
     - **Name**: `FRONTEND_URL`
     - **Value**: `https://hackathon-02-phase-ii-lac.vercel.app`
   - Click **"Add secret"**

3. **Restart Space**
   - After adding the secret, the Space should automatically rebuild
   - If not, click **"Factory reboot"** button in Settings
   - Wait 2-3 minutes for the Space to restart

### Option 2: Via Hugging Face CLI

```bash
# Install Hugging Face CLI (if not already installed)
pip install huggingface_hub

# Login to Hugging Face
huggingface-cli login

# Add the environment variable
huggingface-cli repo-secrets add \
  --repo-type space \
  --repo NazimBotExpert/todo-app \
  FRONTEND_URL https://hackathon-02-phase-ii-lac.vercel.app

# Restart the Space
huggingface-cli space restart NazimBotExpert/todo-app
```

---

## Verification Steps

### 1. Check Backend CORS Configuration

After the Space restarts, verify the CORS configuration:

```bash
curl -s https://nazimbotexpert-todo-app.hf.space/ | grep cors_origins
```

**Expected Output**:
```json
"cors_origins": ["https://hackathon-02-phase-ii-lac.vercel.app"]
```

**Current Output** (before fix):
```json
"cors_origins": ["http://localhost:3000"]
```

### 2. Test CORS Preflight Request

Test if the backend accepts requests from your frontend:

```bash
curl -X OPTIONS https://nazimbotexpert-todo-app.hf.space/api/auth/signin \
  -H "Origin: https://hackathon-02-phase-ii-lac.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -v 2>&1 | grep -i "access-control"
```

**Expected Output**:
```
< access-control-allow-origin: https://hackathon-02-phase-ii-lac.vercel.app
< access-control-allow-credentials: true
< access-control-allow-methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
```

### 3. Test Frontend Connection

Open your frontend in a browser:
```
https://hackathon-02-phase-ii-lac.vercel.app
```

**Before Fix**:
- Browser console shows CORS errors
- Signup/signin forms don't work
- API requests fail

**After Fix**:
- No CORS errors in console
- Signup/signin forms work
- API requests succeed

---

## Current Environment Variables in Hugging Face Space

Based on the health check response, your Space currently has these secrets configured:
- ✅ `BETTER_AUTH_SECRET` (JWT signing secret)
- ✅ `DATABASE_URL` (Neon PostgreSQL connection)
- ✅ `ENVIRONMENT` (set to "production")
- ✅ `PORT` (set to 7860)
- ❌ `FRONTEND_URL` (MISSING - needs to be added)

---

## Why This Fix is Necessary

### CORS Security Model

Browsers enforce the Same-Origin Policy, which prevents JavaScript from making requests to a different domain unless the server explicitly allows it via CORS headers.

**Your Setup**:
- Frontend: `https://hackathon-02-phase-ii-lac.vercel.app` (Vercel)
- Backend: `https://nazimbotexpert-todo-app.hf.space` (Hugging Face)

These are different origins (different domains), so CORS must be configured.

### What Happens Without CORS Fix

1. Frontend makes API request (e.g., signup)
2. Browser sends preflight OPTIONS request
3. Backend responds with CORS headers
4. Browser checks if frontend origin is allowed
5. **If not allowed**: Browser blocks the request (CORS error)
6. **If allowed**: Browser allows the request to proceed

### Current State

**Backend CORS Config**: `["http://localhost:3000"]`
**Frontend Origin**: `https://hackathon-02-phase-ii-lac.vercel.app`
**Result**: ❌ BLOCKED (origins don't match)

### After Fix

**Backend CORS Config**: `["https://hackathon-02-phase-ii-lac.vercel.app"]`
**Frontend Origin**: `https://hackathon-02-phase-ii-lac.vercel.app`
**Result**: ✅ ALLOWED (origins match)

---

## Troubleshooting

### Issue 1: Space doesn't restart after adding secret

**Solution**:
1. Go to Space Settings
2. Click "Factory reboot" button
3. Wait 2-3 minutes for rebuild

### Issue 2: CORS still blocked after adding FRONTEND_URL

**Check**:
1. Verify secret name is exactly `FRONTEND_URL` (case-sensitive)
2. Verify value is exactly `https://hackathon-02-phase-ii-lac.vercel.app` (no trailing slash)
3. Check Space logs for startup messages showing CORS configuration
4. Clear browser cache and hard refresh (Ctrl+Shift+R)

### Issue 3: Multiple frontend URLs needed (preview deployments)

If you have multiple Vercel preview deployments, you can set multiple URLs separated by commas:

```
FRONTEND_URL=https://hackathon-02-phase-ii-lac.vercel.app,https://hackathon-02-phase-ii-preview.vercel.app
```

Then update `config.py` to split by comma:
```python
@property
def allowed_origins(self) -> List[str]:
    origins = []

    if self.ENVIRONMENT == "development":
        origins.extend(["http://localhost:3000", "http://127.0.0.1:3000"])

    # Split FRONTEND_URL by comma for multiple origins
    if self.FRONTEND_URL:
        frontend_urls = [url.strip() for url in self.FRONTEND_URL.split(",")]
        origins.extend(frontend_urls)

    return origins
```

---

## Testing Checklist

After adding the FRONTEND_URL environment variable:

- [ ] Space restarted successfully
- [ ] Health check shows correct CORS origins
- [ ] CORS preflight request succeeds
- [ ] Frontend loads without errors
- [ ] Signup form works
- [ ] Signin form works
- [ ] Task creation works
- [ ] Task list displays
- [ ] Task updates work
- [ ] Task deletion works

---

## Additional Notes

### Security Considerations

- ✅ Only specific frontend origin is allowed (not wildcard `*`)
- ✅ Credentials (cookies) are allowed for JWT authentication
- ✅ HTTPS enforced in production
- ✅ Environment variable keeps configuration separate from code

### Performance Impact

- No performance impact - CORS is checked by browser, not server
- Preflight OPTIONS requests are cached by browser
- Minimal overhead for CORS header validation

### Alternative Solutions (Not Recommended)

1. **Wildcard CORS** (`allow_origins=["*"]`):
   - ❌ Security risk - allows any website to call your API
   - ❌ Cannot use credentials (cookies) with wildcard
   - ❌ Not suitable for production

2. **Proxy through frontend**:
   - ❌ Adds complexity and latency
   - ❌ Requires Next.js API routes
   - ❌ Defeats purpose of separate backend

3. **Same domain deployment**:
   - ❌ Requires custom domain setup
   - ❌ More complex deployment
   - ❌ Not necessary for this use case

---

## Summary

**Action Required**: Add `FRONTEND_URL` environment variable to Hugging Face Space

**Steps**:
1. Go to https://huggingface.co/spaces/NazimBotExpert/todo-app/settings
2. Add secret: `FRONTEND_URL` = `https://hackathon-02-phase-ii-lac.vercel.app`
3. Restart Space
4. Verify CORS configuration
5. Test frontend functionality

**Expected Result**: Frontend can successfully communicate with backend API

**Time Required**: 5 minutes (including Space restart)

---

## Need Help?

If you encounter issues after following these steps:
1. Check Space build logs for errors
2. Verify environment variable is set correctly
3. Test CORS with curl commands provided above
4. Check browser console for specific error messages
