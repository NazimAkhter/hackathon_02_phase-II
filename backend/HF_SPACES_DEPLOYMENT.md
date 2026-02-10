# Hugging Face Spaces Backend Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the FastAPI backend to Hugging Face Spaces.

**Space URL**: https://huggingface.co/spaces/NazimBotExpert/todo-app

**Deployment Method**: Automatic via GitHub Actions CI/CD

---

## Prerequisites

1. **Hugging Face Account**: https://huggingface.co/join
2. **Hugging Face Space Created**: `NazimBotExpert/todo-app`
3. **GitHub Repository**: Connected with HF_TOKEN secret
4. **Neon PostgreSQL Database**: Production instance configured

---

## Step 1: Configure Hugging Face Space Secrets

Navigate to your Space settings: https://huggingface.co/spaces/NazimBotExpert/todo-app/settings

### Required Environment Variables

Click on **"Repository secrets"** and add the following:

#### 1. BETTER_AUTH_SECRET
```
Value: YMUQqkzlCJ0cCGRWx5lWKB081cETI/yqIwuixAMY9qbRGR+vXlXsgTy4Sx5oj7H41BynG1pI6NzzgjdFWhqpDQ==
```
**Critical**: This MUST match the frontend BETTER_AUTH_SECRET exactly for JWT validation to work.

#### 2. DATABASE_URL
```
Value: postgresql://neondb_owner:npg_3ELxRU9gdine@ep-fragrant-poetry-ahunsmfz-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```
**Note**: This is your Neon PostgreSQL production connection string.

#### 3. ENVIRONMENT
```
Value: production
```
**Purpose**: Enables production mode with secure cookies and optimized settings.

#### 4. FRONTEND_URL
```
Value: https://your-app.vercel.app
```
**Action Required**: Replace with your actual Vercel frontend URL after frontend deployment.
**Purpose**: CORS configuration to allow frontend requests.

#### 5. BETTER_AUTH_URL
```
Value: https://nazimbotexpert-todo-app.hf.space
```
**Purpose**: Backend URL for authentication callbacks and session management.

---

## Step 2: Verify Space Configuration

### Check README.md Metadata

Your Space's README.md should have this header:

```yaml
---
title: Todo Backend API
emoji: 📝
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
license: mit
---
```

**Status**: ✅ Already configured in backend/README.md

### Check Dockerfile

Your Dockerfile should expose port 7860 and run Uvicorn:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src ./src
COPY migrations ./migrations/

EXPOSE 7860

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "7860"]
```

**Status**: ✅ Already configured in backend/Dockerfile

---

## Step 3: Deploy via GitHub Actions

### Automatic Deployment

The backend deploys automatically when you push to the `main` branch with changes in the `backend/` directory.

**Workflow File**: `.github/workflows/deploy-backend.yml`

### Manual Deployment

To trigger a manual deployment:

1. Go to: https://github.com/NazimAkhter/hackathon_02_phase-II/actions
2. Select "Deploy Backend to Hugging Face Spaces"
3. Click "Run workflow"
4. Select branch: `main`
5. Click "Run workflow"

### Deployment Process

The workflow will:
1. ✅ Checkout repository
2. ✅ Install Hugging Face CLI
3. ✅ Authenticate with HF_TOKEN
4. ✅ Clone Space repository
5. ✅ Sync backend files
6. ✅ Commit and push changes
7. ✅ Verify deployment

**Expected Duration**: 2-5 minutes

---

## Step 4: Verify Deployment

### 1. Check Space Build Status

Visit: https://huggingface.co/spaces/NazimBotExpert/todo-app

**Build Status Indicators:**
- 🟢 **Running**: Space is live and accessible
- 🟡 **Building**: Space is rebuilding (wait 2-3 minutes)
- 🔴 **Error**: Check build logs for errors

### 2. Test Health Check Endpoint

```bash
curl https://nazimbotexpert-todo-app.hf.space/
```

**Expected Response:**
```json
{
  "status": "ok",
  "environment": "production",
  "version": "1.0.0",
  "cors_origins": ["https://your-app.vercel.app"],
  "message": "Task Management API is running"
}
```

### 3. Test API Documentation

Visit: https://nazimbotexpert-todo-app.hf.space/docs

**Expected**: Interactive Swagger UI with all API endpoints

### 4. Test Authentication Endpoint

```bash
curl -X POST https://nazimbotexpert-todo-app.hf.space/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "name": "Test User"
  }'
```

**Expected**: 201 Created with user data and Set-Cookie header

---

## Step 5: Update Frontend Configuration

After backend deployment, update your frontend environment variables:

**File**: `frontend/.env.local`

```env
BETTER_AUTH_URL=https://nazimbotexpert-todo-app.hf.space
BETTER_AUTH_SECRET=YMUQqkzlCJ0cCGRWx5lWKB081cETI/yqIwuixAMY9qbRGR+vXlXsgTy4Sx5oj7H41BynG1pI6NzzgjdFWhqpDQ==
```

**Then redeploy frontend to Vercel.**

---

## Step 6: Update Backend FRONTEND_URL

After frontend is deployed to Vercel:

1. Get your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Update HF Space secret `FRONTEND_URL` with the Vercel URL
3. Restart the Space (or trigger a new deployment)

---

## Troubleshooting

### Issue: Space Build Fails

**Check Build Logs:**
https://huggingface.co/spaces/NazimBotExpert/todo-app/logs

**Common Causes:**
- Missing dependencies in requirements.txt
- Syntax errors in Python code
- Port mismatch (must be 7860)
- Missing environment variables

**Solution:**
1. Review error message in build logs
2. Fix the issue in your code
3. Push to main branch to trigger rebuild

### Issue: Health Check Returns 500 Error

**Possible Causes:**
- Database connection failed
- Missing environment variables
- Invalid DATABASE_URL format

**Solution:**
1. Verify all environment variables are set in Space secrets
2. Test DATABASE_URL connection string
3. Check Space logs for detailed error messages

### Issue: CORS Errors from Frontend

**Symptoms:**
- Frontend can't connect to backend
- Browser console shows CORS errors

**Solution:**
1. Verify FRONTEND_URL is set correctly in Space secrets
2. Ensure FRONTEND_URL matches your Vercel deployment URL exactly
3. Restart Space after updating FRONTEND_URL

### Issue: Authentication Fails

**Symptoms:**
- JWT validation errors
- "Invalid token" messages

**Solution:**
1. Verify BETTER_AUTH_SECRET is identical in frontend and backend
2. Check that cookies are being set (httpOnly, Secure in production)
3. Ensure BETTER_AUTH_URL points to the correct backend URL

---

## Production URLs

### Backend (Hugging Face Spaces)
- **API Base**: https://nazimbotexpert-todo-app.hf.space
- **Health Check**: https://nazimbotexpert-todo-app.hf.space/
- **API Docs**: https://nazimbotexpert-todo-app.hf.space/docs
- **ReDoc**: https://nazimbotexpert-todo-app.hf.space/redoc

### Frontend (Vercel)
- **URL**: https://your-app.vercel.app (update after deployment)

### Database (Neon PostgreSQL)
- **Host**: ep-fragrant-poetry-ahunsmfz-pooler.c-3.us-east-1.aws.neon.tech
- **Database**: neondb
- **Connection**: Pooled (serverless-optimized)

---

## Security Checklist

- ✅ BETTER_AUTH_SECRET is strong and matches frontend
- ✅ DATABASE_URL uses SSL (sslmode=require)
- ✅ Environment variables stored in HF Spaces secrets (not in code)
- ✅ .env file excluded from Git (.gitignore)
- ✅ CORS restricted to specific frontend origin
- ✅ Secure flag enabled on cookies in production
- ✅ httpOnly cookies prevent XSS attacks
- ✅ JWT tokens have expiration times

---

## Monitoring and Maintenance

### Check Space Status
Visit: https://huggingface.co/spaces/NazimBotExpert/todo-app

### View Logs
Visit: https://huggingface.co/spaces/NazimBotExpert/todo-app/logs

### Restart Space
If needed, restart from Space settings or trigger new deployment.

### Update Dependencies
1. Update `backend/requirements.txt`
2. Push to main branch
3. GitHub Actions will auto-deploy

---

## Next Steps

1. ✅ Backend deployed to Hugging Face Spaces
2. ⏳ Deploy frontend to Vercel
3. ⏳ Update FRONTEND_URL in backend Space secrets
4. ⏳ Test end-to-end authentication flow
5. ⏳ Verify CORS configuration
6. ⏳ Test all API endpoints from frontend

---

## Support

- **GitHub Repository**: https://github.com/NazimAkhter/hackathon_02_phase-II
- **Hugging Face Space**: https://huggingface.co/spaces/NazimBotExpert/todo-app
- **Documentation**: See backend/API_DOCUMENTATION.md

---

**Last Updated**: 2026-02-10
**Deployment Status**: ✅ CI/CD Configured and Ready
