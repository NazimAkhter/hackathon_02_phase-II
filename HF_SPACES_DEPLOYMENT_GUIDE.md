# Hugging Face Spaces Backend Deployment Guide

**Status**: Ready for Deployment
**Date**: 2026-02-09
**Repository**: https://github.com/NazimAkhter/hackathon_02_phase-II

---

## Pre-Deployment Checklist

### Files Verified and Ready

- [X] `backend/Dockerfile` - Configured for port 7860
- [X] `backend/requirements.txt` - All dependencies listed
- [X] `backend/.env.example` - Environment variables documented
- [X] `backend/.dockerignore` - Excludes unnecessary files
- [X] `backend/src/main.py` - FastAPI app with CORS configured
- [X] `backend/src/config.py` - Environment-based configuration
- [X] GitHub repository pushed to main branch

### Required Information

You will need these values during deployment:

1. **BETTER_AUTH_SECRET** (from frontend/.env.local):
   ```
   YMUQqkzlCJ0cCGRWx5lWKB081cETI/yqIwuixAMY9qbRGR+vXlXsgTy4Sx5oj7H41BynG1pI6NzzgjdFWhqpDQ==
   ```

2. **DATABASE_URL** (from frontend/.env.local):
   ```
   postgresql://neondb_owner:npg_3ELxRU9gdine@ep-fragrant-poetry-ahunsmfz-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```

3. **FRONTEND_URL** (placeholder for now, update after frontend deployment):
   ```
   https://placeholder-frontend.vercel.app
   ```

---

## Step-by-Step Deployment Instructions

### Task T013: Create Hugging Face Space

1. Go to: https://huggingface.co/new-space

2. Configure the Space:
   - **Owner**: Select your account (NazimAkhter)
   - **Space name**: `todo-backend-api` (or choose your preferred name)
   - **License**: MIT
   - **Space SDK**: **Docker** ⚠️ (CRITICAL - Must select Docker!)
   - **Visibility**: Public (recommended) or Private (if preferred)

3. Click **Create Space**

4. You will see an empty Space with instructions to push code

**Expected Result**: Space created, showing "No application file" or similar message

---

### Task T014: Link GitHub Repository

**Option A: Web Interface (Recommended)**

1. In your newly created Space, go to **Settings** (gear icon in top-right)

2. Scroll to **Repository** section

3. Click **Link a GitHub repository**

4. Select repository: `NazimAkhter/hackathon_02_phase-II`

5. Configure sync settings:
   - **Branch**: `main`
   - **Path**: `backend/` (important for monorepo structure)
   - **Auto-rebuild**: ✅ Enable (rebuild on every push to main)

6. Click **Save**

**Expected Result**: Space starts building from GitHub repository

**Option B: Git Push Method (Alternative)**

If you prefer to push directly:

```bash
# Add Hugging Face remote
cd /mnt/e/GIAIC/Quarter-04/hackathon_02/hackathon_02_phase-II
git remote add space https://huggingface.co/spaces/NazimAkhter/todo-backend-api

# Push backend directory
git subtree push --prefix backend space main
```

---

### Tasks T015-T019: Configure Environment Variables

While the build is running, configure environment variables:

1. In your Space, go to **Settings** → **Variables and Secrets**

2. Add the following variables one by one:

#### Variable 1: BETTER_AUTH_SECRET

- **Name**: `BETTER_AUTH_SECRET`
- **Value**: `YMUQqkzlCJ0cCGRWx5lWKB081cETI/yqIwuixAMY9qbRGR+vXlXsgTy4Sx5oj7H41BynG1pI6NzzgjdFWhqpDQ==`
- **Type**: ⚠️ Mark as **Secret** (important!)
- Click **Add**

⚠️ **CRITICAL**: This value MUST match the frontend exactly for JWT authentication to work.

#### Variable 2: DATABASE_URL

- **Name**: `DATABASE_URL`
- **Value**: `postgresql://neondb_owner:npg_3ELxRU9gdine@ep-fragrant-poetry-ahunsmfz-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
- **Type**: ⚠️ Mark as **Secret** (important!)
- Click **Add**

#### Variable 3: ENVIRONMENT

- **Name**: `ENVIRONMENT`
- **Value**: `production`
- **Type**: Public (not secret)
- Click **Add**

#### Variable 4: PORT

- **Name**: `PORT`
- **Value**: `7860`
- **Type**: Public (not secret)
- Click **Add**

Note: This is the standard Hugging Face Spaces port (already configured in Dockerfile)

#### Variable 5: FRONTEND_URL

- **Name**: `FRONTEND_URL`
- **Value**: `https://placeholder-frontend.vercel.app`
- **Type**: Public (not secret)
- Click **Add**

⚠️ **Important**: This is a placeholder. After deploying the frontend to Vercel, you MUST update this value with the actual Vercel URL.

**Expected Result**: All 5 environment variables configured, Space may restart automatically

---

### Tasks T020-T021: Verify Deployment

#### Wait for Build Completion

1. Go to **Logs** tab in your Space

2. Watch the build process (should take 5-10 minutes for first deployment)

3. Look for these key log messages:
   - `Successfully built [image-id]`
   - `Starting Task Management API in production mode`
   - `Application startup complete`

4. Once you see **"Running"** status, the deployment is complete

#### Test Health Check Endpoint

1. Get your Space URL (should be something like):
   ```
   https://nazimakhter-todo-backend-api.hf.space
   ```

2. Open the URL in your browser

3. You should see a JSON response like:
   ```json
   {
     "status": "ok",
     "environment": "production",
     "version": "1.0.0",
     "cors_origins": ["https://placeholder-frontend.vercel.app"],
     "message": "Task Management API is running"
   }
   ```

4. Verify the response shows:
   - ✅ `"status": "ok"`
   - ✅ `"environment": "production"`
   - ✅ CORS origins includes your placeholder URL

#### Test API Documentation

1. Open: `https://[your-space].hf.space/docs`

2. You should see Swagger UI with all API endpoints:
   - ✅ Health check (GET /)
   - ✅ Auth endpoints (POST /api/auth/signup, POST /api/auth/signin)
   - ✅ Task endpoints (GET/POST /api/users/{user_id}/todos)

3. Open: `https://[your-space].hf.space/redoc`

4. You should see ReDoc documentation

**Expected Result**:
- ✅ Backend is live at HF Space URL
- ✅ Health check returns 200 OK with correct JSON
- ✅ API documentation accessible at /docs and /redoc
- ✅ Build logs show no errors

---

## Record Your Deployment Information

After successful deployment, record these values:

```
Backend URL: https://________________________________.hf.space
API Docs:    https://________________________________.hf.space/docs
Health Check: https://________________________________.hf.space/
Build Time:   ________ minutes (for reference)
```

---

## Next Steps (After Backend Deployment)

1. **Deploy Frontend to Vercel** (if not already done)
   - Follow the Vercel deployment checklist
   - Get the production Vercel URL

2. **Update FRONTEND_URL** in HF Space:
   - Go to Space Settings → Variables and Secrets
   - Edit `FRONTEND_URL` variable
   - Replace placeholder with actual Vercel URL
   - Space will restart automatically

3. **Update NEXT_PUBLIC_API_URL** in Vercel:
   - Go to Vercel Project → Settings → Environment Variables
   - Edit `NEXT_PUBLIC_API_URL`
   - Replace placeholder with actual HF Space URL
   - Redeploy the frontend

4. **Verify End-to-End Connection**:
   - Open frontend in browser
   - Check browser console (F12) - should be no CORS errors
   - Test signup/signin flow
   - Test task creation

---

## Troubleshooting Guide

### Build Fails

**Symptoms**: Build logs show errors, container doesn't start

**Solutions**:
1. Check Dockerfile syntax: `/mnt/e/GIAIC/Quarter-04/hackathon_02/hackathon_02_phase-II/backend/Dockerfile`
2. Verify requirements.txt is complete: `/mnt/e/GIAIC/Quarter-04/hackathon_02/hackathon_02_phase-II/backend/requirements.txt`
3. Check build logs in HF Spaces dashboard for specific error messages
4. Verify all Python imports are correct in `backend/src/main.py`

### Container Starts But Health Check Fails

**Symptoms**: Build succeeds, but accessing Space URL returns error

**Solutions**:
1. Verify port 7860 is exposed in Dockerfile (already configured)
2. Check environment variables are set in Space settings
3. Review startup command in Dockerfile: `uvicorn src.main:app --host 0.0.0.0 --port 7860`
4. Check Space logs for application errors

### Database Connection Fails

**Symptoms**: Health check works but database operations fail

**Solutions**:
1. Verify `DATABASE_URL` is correctly set in Space settings
2. Check Neon database is accessible (test from local machine)
3. Confirm SSL mode is configured: `sslmode=require&channel_binding=require`
4. Check Space logs for specific database errors

### CORS Errors (After Frontend Connection)

**Symptoms**: Frontend can't access backend, browser shows CORS errors

**Solutions**:
1. Verify `FRONTEND_URL` in Space settings matches actual Vercel URL
2. Check CORS configuration in `backend/src/config.py` - it should automatically use `FRONTEND_URL`
3. Ensure Vercel URL is using HTTPS (required for httpOnly cookies)
4. For Vercel preview deployments, you may need to add wildcard: `https://*.vercel.app`

---

## Rollback Procedure

If deployment causes issues:

1. **Identify problematic commit**:
   ```bash
   git log --oneline
   ```

2. **Revert the commit**:
   ```bash
   git revert <commit-hash>
   ```

3. **Push to main**:
   ```bash
   git push origin main
   ```

4. HF Space will automatically rebuild from the reverted code (5-10 minutes)

---

## Security Validation

Before marking deployment complete, verify:

- [ ] No secrets in Git history:
  ```bash
  git log --all -S "BETTER_AUTH_SECRET"
  ```
  Should return no results

- [ ] All secrets marked as "Secret" in HF Spaces settings
- [ ] DATABASE_URL uses SSL mode (`sslmode=require`)
- [ ] CORS only allows specific origins (no wildcards in production)
- [ ] Health check doesn't expose sensitive information

---

## Automatic CI/CD

Your deployment is now configured for automatic updates:

- ✅ Every push to `main` branch triggers automatic rebuild on HF Spaces
- ✅ Build takes 5-10 minutes
- ✅ Zero-downtime deployment (old version runs until new one is ready)
- ✅ Logs available in Space dashboard
- ✅ Automatic HTTPS enabled by HF Spaces

---

## Support Resources

- **HF Spaces Documentation**: https://huggingface.co/docs/hub/spaces
- **Docker Spaces Guide**: https://huggingface.co/docs/hub/spaces-sdks-docker
- **Quickstart Guide**: `/mnt/e/GIAIC/Quarter-04/hackathon_02/hackathon_02_phase-II/specs/006-deployment-cicd/quickstart.md`
- **Task Details**: `/mnt/e/GIAIC/Quarter-04/hackathon_02/hackathon_02_phase-II/specs/006-deployment-cicd/tasks.md`

---

## Deployment Status Checklist

Use this checklist to track your progress:

- [ ] **T013** - Created HF Space with Docker SDK
- [ ] **T014** - Linked GitHub repository to Space
- [ ] **T015** - Added `BETTER_AUTH_SECRET` (marked as Secret)
- [ ] **T016** - Added `DATABASE_URL` (marked as Secret)
- [ ] **T017** - Added `ENVIRONMENT=production`
- [ ] **T018** - Added `PORT=7860`
- [ ] **T019** - Added `FRONTEND_URL` (placeholder)
- [ ] **T020** - Build completed successfully
- [ ] **T021** - Verified health check returns 200 OK
- [ ] **T021** - Verified /docs shows API documentation
- [ ] Recorded Space URL in documentation
- [ ] No CORS errors in test requests
- [ ] Database connection working

---

**Last Updated**: 2026-02-09
**Repository**: https://github.com/NazimAkhter/hackathon_02_phase-II
**Feature**: 006-deployment-cicd
