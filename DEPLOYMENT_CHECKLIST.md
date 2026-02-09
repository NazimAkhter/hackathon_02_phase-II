# Deployment Checklist - Phase 2 & Phase 3

**Feature**: 006-deployment-cicd
**Date**: 2026-02-09
**Status**: Ready for Manual Deployment

---

## Prerequisites ✅

- [x] T001: frontend/vercel.json created
- [x] T002: frontend/.env.example documented
- [x] T003: backend/Dockerfile configured for port 7860
- [x] T004: backend/.env.example documented
- [x] T005: CORS configuration updated for Vercel preview deployments

**Note**: Git push pending - you need to push the CORS changes:
```bash
git push origin 006-deployment-cicd
```

---

## Phase 3: Backend Deployment (Hugging Face Spaces) - DO THIS FIRST

### Step 1: Create Hugging Face Space

1. Visit: https://huggingface.co/new-space
2. Configure:
   - **Space name**: `todo-backend-api`
   - **License**: Apache 2.0
   - **SDK**: Docker
   - **Hardware**: CPU basic (free)
   - **Visibility**: Public
3. Click **"Create Space"**

### Step 2: Connect GitHub Repository

1. In your new Space, go to **"Settings"** tab
2. Find **"Repository"** section
3. Click **"Link to GitHub"**
4. Authorize Hugging Face (if first time)
5. Select repository: `NazimAkhter/hackathon_02_phase-II`
6. Set branch: `main`
7. **IMPORTANT**: Set subdirectory: `backend/`
8. Enable **"Auto-rebuild on push"** ✓

### Step 3: Configure Environment Variables

In Space Settings → **"Variables and secrets"**, add:

```bash
# Secret Variables (check "Secret" box)
BETTER_AUTH_SECRET = [generate-new-64-char-secret]
DATABASE_URL = postgresql://neondb_owner:npg_3ELxRU9gdine@ep-fragrant-poetry-ahunsmfz-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Public Variables
ENVIRONMENT = production
PORT = 7860
FRONTEND_URL = https://placeholder.vercel.app
```

**Generate BETTER_AUTH_SECRET**:
```bash
openssl rand -base64 64
```

### Step 4: Wait for Build & Verify

- Build takes 5-10 minutes
- Monitor build logs in Space interface
- Once complete, verify:
  - [ ] Health check: `https://huggingface.co/spaces/[username]/todo-backend-api` returns `{"status":"ok"}`
  - [ ] API docs: `https://huggingface.co/spaces/[username]/todo-backend-api/docs` shows Swagger UI
  - [ ] Database connection shown in health check response

**Save your backend URL**: `https://huggingface.co/spaces/[username]/todo-backend-api`

---

## Phase 2: Frontend Deployment (Vercel)

### Step 1: Import Project to Vercel

1. Visit: https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select **GitHub** → `NazimAkhter/hackathon_02_phase-II`
4. Configure project:
   - **Project Name**: `todo-app-frontend` (or your choice)
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend/` ⚠️ CRITICAL
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

### Step 2: Add Environment Variables (Before First Deploy)

Click **"Environment Variables"** and add for **Production** AND **Preview**:

```bash
BETTER_AUTH_SECRET = [same-secret-as-backend]
DATABASE_URL = postgresql://neondb_owner:npg_3ELxRU9gdine@ep-fragrant-poetry-ahunsmfz-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
NEXT_PUBLIC_API_URL = https://huggingface.co/spaces/[username]/todo-backend-api
NODE_ENV = production
```

**IMPORTANT**: Use the actual HF Space URL from Phase 3 Step 4

### Step 3: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. Verify:
   - [ ] Build succeeds without errors
   - [ ] Landing page loads at `https://[project-name].vercel.app`
   - [ ] No console errors in browser DevTools

**Save your frontend URL**: `https://[project-name].vercel.app`

---

## Phase 4: Connect Frontend & Backend

### Step 1: Update Backend FRONTEND_URL

1. Go to your HF Space → **Settings** → **Variables and secrets**
2. Edit `FRONTEND_URL` variable
3. Change from `https://placeholder.vercel.app` to your actual Vercel URL
4. Save changes
5. Space will automatically rebuild (2-3 minutes)

### Step 2: Verify CORS Configuration

1. Open your Vercel frontend in browser
2. Open DevTools → Console
3. Try to sign up or sign in
4. Verify **NO CORS errors** appear

If CORS errors occur:
- Check FRONTEND_URL matches exactly (no trailing slash)
- Verify backend rebuild completed after updating FRONTEND_URL
- Check browser console for specific error message

---

## Phase 5: End-to-End Testing

### Test User Journey

1. **Signup**:
   - [ ] Go to `https://[your-app].vercel.app/signup`
   - [ ] Create new account
   - [ ] Verify redirect to dashboard

2. **Signin**:
   - [ ] Sign out
   - [ ] Sign in with created account
   - [ ] Verify JWT token stored (check DevTools → Application → Cookies)

3. **Task Operations**:
   - [ ] Create new task
   - [ ] Edit task title/description
   - [ ] Mark task as complete
   - [ ] Delete task

4. **API Validation**:
   - [ ] All API calls return 200/201 status codes
   - [ ] No CORS errors in console
   - [ ] Data persists after page refresh

### Health Check Validation

Visit backend health check: `https://huggingface.co/spaces/[username]/todo-backend-api`

Expected response:
```json
{
  "status": "ok",
  "environment": "production",
  "database": "connected",
  "timestamp": "2026-02-09T..."
}
```

---

## Phase 6: Automatic Deployment Verification

### Test GitHub Integration

1. Make a small change (e.g., update README)
2. Commit and push to `main` branch
3. Verify:
   - [ ] Vercel automatically deploys (check Vercel dashboard)
   - [ ] HF Space automatically rebuilds (check Space activity)
   - [ ] Both deployments succeed
   - [ ] Changes appear on production URLs

---

## Troubleshooting

### Backend Build Fails

**Check**:
- Dockerfile exposes port 7860
- requirements.txt includes all dependencies
- Environment variables are set correctly
- Subdirectory is set to `backend/`

**Solution**: Review build logs in HF Space interface

### Frontend Build Fails

**Check**:
- Root directory is set to `frontend/`
- All environment variables are configured
- NEXT_PUBLIC_API_URL is a valid URL
- No missing dependencies in package.json

**Solution**: Review build logs in Vercel dashboard

### CORS Errors

**Symptoms**: Browser console shows "CORS policy" errors

**Check**:
- FRONTEND_URL in backend matches Vercel URL exactly
- Backend has rebuilt after updating FRONTEND_URL
- No trailing slashes in URLs

**Solution**: Update FRONTEND_URL and wait for rebuild

### Authentication Fails

**Symptoms**: Login returns 401 or token errors

**Check**:
- BETTER_AUTH_SECRET is identical on both platforms
- Secret is exactly 64 characters (base64 encoded)
- No extra spaces or newlines in secret

**Solution**: Regenerate secret and update both platforms

### Database Connection Fails

**Symptoms**: Health check shows "database": "disconnected"

**Check**:
- DATABASE_URL format is correct
- Includes `sslmode=require&channel_binding=require`
- Neon database is accessible
- No firewall blocking connections

**Solution**: Verify DATABASE_URL and test connection

---

## Security Checklist

- [ ] No secrets committed to GitHub repository
- [ ] BETTER_AUTH_SECRET marked as "Secret" on both platforms
- [ ] DATABASE_URL marked as "Secret" on both platforms
- [ ] All environment variables configured on platforms only
- [ ] HTTPS enforced on all endpoints
- [ ] CORS properly configured (no wildcard `*` in production)

---

## Completion Criteria

### Phase 2 (Frontend) ✓
- [ ] T006: Frontend deployed to Vercel
- [ ] T007: Project settings configured (Next.js, build command, output dir)
- [ ] T008: BETTER_AUTH_SECRET added to Vercel
- [ ] T009: DATABASE_URL added to Vercel
- [ ] T010: NEXT_PUBLIC_API_URL added to Vercel
- [ ] T011: NODE_ENV=production added to Vercel
- [ ] T012: Deployment verified (build logs, production URL, landing page loads)

### Phase 3 (Backend) ✓
- [ ] T013: HF Space created (todo-backend-api, Docker, public)
- [ ] T014: GitHub repository linked (NazimAkhter/hackathon_02_phase-II, main, backend/)
- [ ] T015: Auto-rebuild enabled
- [ ] T016: BETTER_AUTH_SECRET added to HF Space (secret)
- [ ] T017: DATABASE_URL added to HF Space (secret)
- [ ] T018: ENVIRONMENT=production and PORT=7860 added
- [ ] T019: FRONTEND_URL added (placeholder initially)
- [ ] T020: Deployment verified (build logs, Space URL, health check)
- [ ] T021: API documentation accessible at /docs

### Phase 4 (Integration) ✓
- [ ] T022: NEXT_PUBLIC_API_URL updated in Vercel to actual HF Space URL
- [ ] T023: FRONTEND_URL updated in HF Space to actual Vercel URL
- [ ] T024: CORS configuration supports Vercel domain (already done in code)
- [ ] T025: CORS changes committed and pushed to GitHub
- [ ] T026: Frontend redeployed with updated API URL

---

## Production URLs

**Frontend**: `https://[your-project].vercel.app`
**Backend API**: `https://huggingface.co/spaces/[username]/todo-backend-api`
**API Docs**: `https://huggingface.co/spaces/[username]/todo-backend-api/docs`
**Health Check**: `https://huggingface.co/spaces/[username]/todo-backend-api/`

---

## Next Steps After Deployment

1. Update project README with production URLs
2. Test complete user journey end-to-end
3. Monitor deployment logs for any errors
4. Set up monitoring/alerting (optional)
5. Document rollback procedure
6. Create deployment success report

---

**Generated**: 2026-02-09
**Last Updated**: 2026-02-09
