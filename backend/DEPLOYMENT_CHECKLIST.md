# Backend Deployment Checklist

## Pre-Deployment Checklist

### 1. Code Readiness
- [x] FastAPI application tested locally
- [x] All dependencies listed in requirements.txt with versions
- [x] Dockerfile configured for port 7860
- [x] README.md has Hugging Face Spaces metadata
- [x] .gitignore excludes .env and secrets
- [x] Environment variables documented

### 2. Hugging Face Space Setup
- [ ] Space created: `NazimBotExpert/todo-app`
- [ ] Space visibility set (public/private)
- [ ] Space SDK set to: `docker`
- [ ] Space app_port set to: `7860`

### 3. Environment Variables Configuration
Navigate to: https://huggingface.co/spaces/NazimBotExpert/todo-app/settings

Set the following secrets:

- [ ] **BETTER_AUTH_SECRET**
  ```
  YMUQqkzlCJ0cCGRWx5lWKB081cETI/yqIwuixAMY9qbRGR+vXlXsgTy4Sx5oj7H41BynG1pI6NzzgjdFWhqpDQ==
  ```
  ⚠️ Must match frontend exactly

- [ ] **DATABASE_URL**
  ```
  postgresql://neondb_owner:npg_3ELxRU9gdine@ep-fragrant-poetry-ahunsmfz-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
  ```

- [ ] **ENVIRONMENT**
  ```
  production
  ```

- [ ] **FRONTEND_URL**
  ```
  https://your-app.vercel.app
  ```
  ⚠️ Update after frontend deployment

- [ ] **BETTER_AUTH_URL**
  ```
  https://nazimbotexpert-todo-app.hf.space
  ```

### 4. GitHub Actions Setup
- [ ] HF_TOKEN added to GitHub repository secrets
  - Go to: https://github.com/NazimAkhter/hackathon_02_phase-II/settings/secrets/actions
  - Create token at: https://huggingface.co/settings/tokens
  - Token needs: `write` access to Spaces

---

## Deployment Checklist

### Option A: Automatic Deployment (Recommended)

- [ ] Merge changes to `main` branch
- [ ] GitHub Actions workflow triggers automatically
- [ ] Monitor workflow: https://github.com/NazimAkhter/hackathon_02_phase-II/actions
- [ ] Wait for "Deploy Backend to Hugging Face Spaces" to complete (2-5 min)

### Option B: Manual Deployment

- [ ] Go to: https://github.com/NazimAkhter/hackathon_02_phase-II/actions
- [ ] Select "Deploy Backend to Hugging Face Spaces"
- [ ] Click "Run workflow"
- [ ] Select branch: `main`
- [ ] Click "Run workflow"
- [ ] Monitor progress

---

## Post-Deployment Verification

### 1. Check Space Build Status
- [ ] Visit: https://huggingface.co/spaces/NazimBotExpert/todo-app
- [ ] Status shows: 🟢 Running (not 🟡 Building or 🔴 Error)
- [ ] Build logs show no errors

### 2. Test Health Check
```bash
curl https://nazimbotexpert-todo-app.hf.space/
```

Expected response:
```json
{
  "status": "ok",
  "environment": "production",
  "version": "1.0.0",
  "cors_origins": ["https://your-app.vercel.app"],
  "message": "Task Management API is running"
}
```

- [ ] Health check returns 200 OK
- [ ] Response contains "status": "ok"
- [ ] Environment is "production"
- [ ] CORS origins includes frontend URL

### 3. Test API Documentation
- [ ] Visit: https://nazimbotexpert-todo-app.hf.space/docs
- [ ] Swagger UI loads successfully
- [ ] All endpoints visible (auth, tasks)
- [ ] Can expand and view endpoint details

### 4. Test Authentication Endpoints

**Signup Test:**
```bash
curl -X POST https://nazimbotexpert-todo-app.hf.space/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "name": "Test User"
  }'
```

- [ ] Returns 201 Created
- [ ] Response includes user data
- [ ] Set-Cookie header present

**Signin Test:**
```bash
curl -X POST https://nazimbotexpert-todo-app.hf.space/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

- [ ] Returns 200 OK
- [ ] Response includes user data
- [ ] Set-Cookie header present

**Session Test:**
```bash
curl https://nazimbotexpert-todo-app.hf.space/api/auth/session
```

- [ ] Returns 401 Unauthorized (expected without cookie)

### 5. Test CORS Configuration
```bash
curl -H "Origin: https://your-app.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://nazimbotexpert-todo-app.hf.space/api/auth/signup \
     -i
```

- [ ] Response includes `access-control-allow-origin` header
- [ ] Response includes `access-control-allow-credentials: true`
- [ ] Origin matches frontend URL

### 6. Run Automated Verification Script
```bash
cd backend
chmod +x verify-hf-deployment.sh
./verify-hf-deployment.sh
```

- [ ] All tests pass
- [ ] No red ❌ errors in output

---

## Frontend Integration Checklist

### 1. Update Frontend Environment Variables
File: `frontend/.env.local`

```env
BETTER_AUTH_URL=https://nazimbotexpert-todo-app.hf.space
BETTER_AUTH_SECRET=YMUQqkzlCJ0cCGRWx5lWKB081cETI/yqIwuixAMY9qbRGR+vXlXsgTy4Sx5oj7H41BynG1pI6NzzgjdFWhqpDQ==
```

- [ ] BETTER_AUTH_URL updated to HF Spaces URL
- [ ] BETTER_AUTH_SECRET matches backend

### 2. Deploy Frontend to Vercel
- [ ] Push frontend changes to repository
- [ ] Vercel auto-deploys (or trigger manual deploy)
- [ ] Get production URL (e.g., https://your-app.vercel.app)

### 3. Update Backend FRONTEND_URL
- [ ] Go to: https://huggingface.co/spaces/NazimBotExpert/todo-app/settings
- [ ] Update `FRONTEND_URL` secret with Vercel URL
- [ ] Restart Space (or trigger new deployment)

### 4. Test End-to-End Flow
- [ ] Open frontend in browser
- [ ] Sign up with new account
- [ ] Verify redirect after signup
- [ ] Sign in with account
- [ ] Verify authentication works
- [ ] Create a task
- [ ] Verify task appears in list
- [ ] Check browser console for errors
- [ ] Check Network tab for CORS errors

---

## Troubleshooting Checklist

### Space Build Fails
- [ ] Check build logs: https://huggingface.co/spaces/NazimBotExpert/todo-app/logs
- [ ] Verify all files synced correctly
- [ ] Check Dockerfile syntax
- [ ] Verify requirements.txt has all dependencies
- [ ] Check for Python syntax errors

### Health Check Returns 500
- [ ] Verify DATABASE_URL is set correctly
- [ ] Check DATABASE_URL format (must include sslmode=require)
- [ ] Verify BETTER_AUTH_SECRET is set
- [ ] Check Space logs for error details
- [ ] Test database connection from local machine

### CORS Errors
- [ ] Verify FRONTEND_URL matches Vercel URL exactly
- [ ] Check for trailing slashes (should not have)
- [ ] Verify ENVIRONMENT is set to "production"
- [ ] Restart Space after updating FRONTEND_URL
- [ ] Check browser console for specific CORS error

### Authentication Fails
- [ ] Verify BETTER_AUTH_SECRET matches frontend
- [ ] Check that cookies are being set (Network tab)
- [ ] Verify Secure flag is set in production
- [ ] Check BETTER_AUTH_URL is correct
- [ ] Test with curl to isolate frontend vs backend issue

---

## Success Criteria

All items below must be checked:

- [ ] Space is running (🟢 status)
- [ ] Health check returns 200 OK
- [ ] API docs accessible
- [ ] Authentication endpoints working
- [ ] CORS configured correctly
- [ ] Frontend can connect to backend
- [ ] Users can sign up and sign in
- [ ] Tasks can be created and retrieved
- [ ] No errors in Space logs
- [ ] No CORS errors in browser console

---

## Production URLs

**Backend (Hugging Face Spaces):**
- Base URL: https://nazimbotexpert-todo-app.hf.space
- API Docs: https://nazimbotexpert-todo-app.hf.space/docs
- Health: https://nazimbotexpert-todo-app.hf.space/

**Frontend (Vercel):**
- URL: https://your-app.vercel.app (update after deployment)

**Database (Neon PostgreSQL):**
- Host: ep-fragrant-poetry-ahunsmfz-pooler.c-3.us-east-1.aws.neon.tech
- Database: neondb

---

## Rollback Plan

If deployment fails:

1. [ ] Check GitHub Actions logs for error
2. [ ] Revert last commit if needed: `git revert HEAD`
3. [ ] Push revert to trigger new deployment
4. [ ] Or manually rollback in HF Spaces UI

---

**Deployment Date:** _____________
**Deployed By:** _____________
**Status:** [ ] Success [ ] Failed [ ] Partial

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________
