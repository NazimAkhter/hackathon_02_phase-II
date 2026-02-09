# Quickstart: Deployment & CI/CD Setup

**Feature**: 006-deployment-cicd
**Date**: 2026-02-09
**Estimated Time**: 30-45 minutes for complete setup

## Overview

This guide walks through deploying the Todo Full-Stack application to production:
- **Frontend**: Vercel (using MCP integration)
- **Backend**: Hugging Face Spaces (Docker container)
- **Database**: Neon PostgreSQL (production instance)
- **CI/CD**: Automatic deployments via GitHub

## Prerequisites

Before starting, ensure you have:

- ✅ GitHub repository with frontend and backend code
- ✅ Vercel account with appropriate permissions
- ✅ Hugging Face account with Spaces enabled
- ✅ Neon PostgreSQL production database provisioned
- ✅ BETTER_AUTH_SECRET generated and available
- ✅ Application tested and working in local development
- ✅ Claude Code with Vercel MCP integration configured

## Phase 1: Frontend Deployment to Vercel (15-20 minutes)

### Step 1.1: Prepare Frontend Configuration

**Create `frontend/vercel.json`** (if not exists):
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

**Verify `frontend/.env.example`**:
```bash
BETTER_AUTH_SECRET=your-secret-here
NEXT_PUBLIC_API_URL=https://your-backend.hf.space
DATABASE_URL=postgresql://user:pass@host/db
NODE_ENV=production
```

### Step 1.2: Deploy Frontend via Vercel MCP

**Using Claude Code**:
```
Deploy frontend to Vercel using MCP integration
- Repository: github.com/[username]/[repo]
- Root directory: frontend
- Framework: Next.js
- Branch: main
```

**Or manually via Vercel Dashboard**:
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure project:
   - Framework Preset: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
4. Click "Deploy"

### Step 1.3: Configure Frontend Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables:

**Production** (and Preview):
```
BETTER_AUTH_SECRET=<your-generated-secret>
NEXT_PUBLIC_API_URL=<will-set-after-backend-deployment>
DATABASE_URL=<neon-production-connection-string>
NODE_ENV=production
```

**Notes**:
- Keep BETTER_AUTH_SECRET private and secure
- NEXT_PUBLIC_API_URL will be updated after backend deployment
- DATABASE_URL should use production Neon instance
- Click "Add" for each variable
- Select "Production" and "Preview" environments

### Step 1.4: Verify Frontend Deployment

1. **Check build status**: Vercel Dashboard → Deployments
2. **Access deployment**: Click on deployment URL
3. **Verify application loads**: Should see landing page
4. **Check browser console**: No critical errors
5. **Note the production URL**: `https://[your-app].vercel.app`

**Expected Outcome**: Frontend is live but backend API calls will fail until backend is deployed.

---

## Phase 2: Backend Deployment to Hugging Face Spaces (15-20 minutes)

### Step 2.1: Prepare Backend Configuration

**Create/Update `backend/Dockerfile`**:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose HF Spaces port
EXPOSE 7860

# Run FastAPI with uvicorn
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "7860"]
```

**Verify `backend/.env.example`**:
```bash
BETTER_AUTH_SECRET=your-secret-here
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
ENVIRONMENT=production
FRONTEND_URL=https://your-app.vercel.app
PORT=7860
```

**Update `backend/src/config.py`** to read PORT from environment:
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # ... existing settings ...
    PORT: int = 7860  # HF Spaces port
    FRONTEND_URL: str  # For CORS
```

### Step 2.2: Create Hugging Face Space

1. Go to https://huggingface.co/new-space
2. Configure Space:
   - **Space name**: `todo-backend-api` (or your choice)
   - **License**: MIT (or appropriate)
   - **Space SDK**: Docker
   - **Visibility**: Public (or Private if preferred)
3. Click "Create Space"

### Step 2.3: Link GitHub Repository

**In HF Space Settings**:
1. Go to Settings → Repository
2. Click "Link a GitHub repository"
3. Select your repository
4. Configure:
   - **Branch**: `main`
   - **Path**: `backend/` (if monorepo)
   - **Auto-rebuild**: Enable
5. Save configuration

**Alternative: Direct Git Push**:
```bash
cd backend
git remote add hf https://huggingface.co/spaces/[username]/[space-name]
git push hf main
```

### Step 2.4: Configure Backend Environment Variables

In HF Space → Settings → Variables and Secrets:

Add the following secrets (all marked as "Secret"):
```
BETTER_AUTH_SECRET=<exact-same-as-frontend>
DATABASE_URL=postgresql://user:pass@neon.tech/db?sslmode=require&channel_binding=require
ENVIRONMENT=production
FRONTEND_URL=https://[your-app].vercel.app
PORT=7860
```

**Critical**: BETTER_AUTH_SECRET MUST match frontend exactly.

### Step 2.5: Trigger Build and Wait

1. **Initial build**: Automatically starts after linking repository
2. **Build time**: 5-10 minutes for first build
3. **Monitor logs**: HF Space Dashboard → Logs
4. **Check status**: Should show "Running" when complete

### Step 2.6: Verify Backend Deployment

1. **Access Space URL**: `https://[username]-[space-name].hf.space`
2. **Health check**: Visit root endpoint `/`
   - Should return JSON: `{"status":"ok","environment":"production",...}`
3. **API docs**: Visit `/docs`
   - Should show Swagger UI with all endpoints
4. **Test endpoint**: Try health check with curl:
   ```bash
   curl https://[your-space].hf.space/
   ```

**Expected Outcome**: Backend is live with all endpoints accessible.

---

## Phase 3: Connect Frontend to Backend (5 minutes)

### Step 3.1: Update Frontend Environment Variable

In Vercel Dashboard → Project → Settings → Environment Variables:

1. Find `NEXT_PUBLIC_API_URL`
2. Update value to: `https://[your-space].hf.space`
3. Select "Production" and "Preview" environments
4. Click "Save"

### Step 3.2: Redeploy Frontend

**Option A: Via Vercel Dashboard**:
1. Go to Deployments
2. Click "Redeploy" on latest deployment

**Option B: Via Git Push**:
```bash
git commit --allow-empty -m "Trigger redeploy with updated API URL"
git push origin main
```

### Step 3.3: Update Backend CORS Configuration

**In `backend/src/config.py` or `backend/src/main.py`**:

Ensure CORS allows your Vercel URL:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://[your-app].vercel.app",     # Production
        "https://*.vercel.app",               # Preview deployments
        "http://localhost:3000",              # Local dev
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
```

Commit and push to trigger backend rebuild:
```bash
git add backend/src/main.py
git commit -m "Update CORS for production frontend URL"
git push origin main
```

---

## Phase 4: End-to-End Validation (5-10 minutes)

### Step 4.1: Build Validation
- ✅ Frontend build completed without errors
- ✅ Backend Docker build completed without errors
- ✅ No TypeScript/Python errors in logs

### Step 4.2: Deployment Validation
- ✅ Frontend accessible at Vercel URL
- ✅ Backend accessible at HF Space URL
- ✅ Health check returns 200 OK
- ✅ API documentation loads at `/docs`

### Step 4.3: Environment Validation
- ✅ Frontend uses correct backend URL
- ✅ Backend connects to Neon database
- ✅ BETTER_AUTH_SECRET matches
- ✅ No CORS errors in browser console

### Step 4.4: Functional Validation

**Test complete user journey**:

1. **Sign Up**:
   - Go to `https://[your-app].vercel.app/signup`
   - Create new account
   - Verify redirect to dashboard

2. **Sign In**:
   - Sign out and sign in again
   - Verify JWT token received
   - Verify dashboard loads

3. **Create Task**:
   - Add new task
   - Verify it appears in list
   - Check browser Network tab: API call succeeds

4. **Update Task**:
   - Edit task title/description
   - Verify changes persist
   - Verify database update

5. **Delete Task**:
   - Delete a task
   - Verify removal from list
   - Verify database deletion

### Step 4.5: Security Validation
- ✅ No secrets in GitHub repository (run: `git log --all -S "BETTER_AUTH_SECRET"`)
- ✅ Environment variables only on platforms
- ✅ HTTPS enforced on all endpoints
- ✅ Authentication required for protected routes
- ✅ Users can only see their own data

---

## Phase 5: Enable Automatic Deployments (Already Configured)

### Frontend (Vercel)
- ✅ Automatic deployment on push to `main`
- ✅ Preview deployments on pull requests
- ✅ No manual intervention required

### Backend (Hugging Face Spaces)
- ✅ Automatic rebuild on push to `main`
- ✅ Rebuild triggered by GitHub integration
- ✅ No manual intervention required

**Test automatic deployment**:
1. Make a small change (e.g., update README)
2. Commit and push to `main`
3. Verify both platforms rebuild automatically
4. Check deployment logs for success

---

## Troubleshooting

### Frontend Issues

**Build fails with dependency errors**:
```bash
# Locally test the build
cd frontend
npm install
npm run build
```

**Environment variables not loading**:
- Verify variables set in Vercel Dashboard
- Check variable names match exactly
- Ensure "Production" and "Preview" selected
- Redeploy after changing variables

**Application loads but API calls fail**:
- Check NEXT_PUBLIC_API_URL is correct
- Verify backend is running
- Check browser console for CORS errors
- Verify HTTPS (not HTTP) for API URL

### Backend Issues

**Docker build fails**:
```bash
# Locally test Docker build
cd backend
docker build -t test-backend .
docker run -p 7860:7860 test-backend
```

**Container fails to start**:
- Verify port 7860 is exposed in Dockerfile
- Check environment variables are set in HF Space
- Review HF Space logs for errors
- Ensure requirements.txt is complete

**Database connection fails**:
- Verify DATABASE_URL format
- Check Neon database is accessible
- Confirm SSL mode: `sslmode=require`
- Test connection locally first

**CORS errors**:
- Verify FRONTEND_URL in backend config
- Check CORS middleware allows Vercel domain
- Include wildcard for preview: `https://*.vercel.app`
- Clear browser cache and retry

### Integration Issues

**Authentication fails between frontend and backend**:
- **CRITICAL**: Verify BETTER_AUTH_SECRET is identical
- Check JWT token format in browser DevTools
- Verify token sent in Authorization header
- Check backend logs for token validation errors

**Different behavior in production vs development**:
- Verify environment variables match
- Check production uses production database
- Ensure HTTPS everywhere in production
- Review application logs for differences

---

## Rollback Procedures

### Frontend Rollback (Vercel)
1. Go to Vercel Dashboard → Deployments
2. Find previous successful deployment
3. Click "Promote to Production"
4. Confirm promotion
5. **Instant rollback** - no rebuild required

### Backend Rollback (Hugging Face)
1. Identify problematic commit in GitHub
2. Create revert commit:
   ```bash
   git revert <commit-hash>
   git push origin main
   ```
3. HF Space automatically rebuilds from reverted code
4. Wait 5-10 minutes for rebuild
5. Verify health check endpoint

---

## Post-Deployment Checklist

- [ ] Frontend accessible via Vercel production URL
- [ ] Backend accessible via HF Space URL
- [ ] Health check endpoint returns 200 OK
- [ ] API documentation loads correctly
- [ ] Complete user journey tested (signup, signin, CRUD)
- [ ] No CORS errors in browser console
- [ ] No secrets in GitHub repository
- [ ] Environment variables documented in .env.example
- [ ] Automatic deployments working for both platforms
- [ ] Preview deployments enabled for PRs
- [ ] Rollback procedure tested
- [ ] Deployment guide updated with actual URLs

---

## Production URLs Reference

**Frontend**: `https://[your-app-name].vercel.app`
**Backend API**: `https://[your-space-name].hf.space`
**API Docs**: `https://[your-space-name].hf.space/docs`
**Health Check**: `https://[your-space-name].hf.space/`

---

## Next Steps

1. **Monitor deployments**: Check logs regularly for first few days
2. **Set up alerts**: Configure notifications for deployment failures
3. **Document custom domain** (if needed in future)
4. **Performance testing**: Monitor response times
5. **User feedback**: Collect feedback on production experience

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Hugging Face Spaces**: https://huggingface.co/docs/hub/spaces
- **Neon Docs**: https://neon.tech/docs
- **FastAPI Deployment**: https://fastapi.tiangolo.com/deployment/
- **Next.js Deployment**: https://nextjs.org/docs/deployment
