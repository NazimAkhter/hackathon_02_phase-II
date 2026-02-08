# Deployment Execution Checklist

**Feature**: 006-deployment-cicd
**Status**: Setup Complete - Ready for Platform Deployment
**Last Updated**: 2026-02-09

## ✅ Phase 1: Setup Complete

All automated setup tasks have been completed:

- [X] **T001** - frontend/vercel.json configuration verified
- [X] **T002** - frontend/.env.example has all required variables
- [X] **T003** - backend/Dockerfile updated to port 7860
- [X] **T004** - backend/.env.example has all required variables
- [X] **T005** - Git repository status verified
- [X] **Bonus** - backend/.dockerignore created
- [X] **Bonus** - Changes committed to Git

**Git Commit**: `f6ff49e` - "Configure deployment infrastructure for Vercel and HF Spaces"

---

## 🚀 Phase 2: Manual Deployment Steps

The following phases require access to deployment platforms. Follow this checklist:

### Prerequisites Verification

Before proceeding, ensure you have:

- [ ] Vercel account with login access
- [ ] Hugging Face account with Spaces enabled
- [ ] GitHub repository pushed to remote (if not already)
- [ ] BETTER_AUTH_SECRET value from frontend/.env.local
- [ ] Neon PostgreSQL production DATABASE_URL
- [ ] ~30-45 minutes for complete deployment

---

### User Story 1: Frontend Deployment to Vercel (15-20 min)

**Goal**: Deploy Next.js frontend to Vercel with automatic CI/CD

#### Step 1: Deploy to Vercel

- [ ] **T006** - Go to https://vercel.com/new (or use Vercel MCP if available)
- [ ] Import GitHub repository: `github.com/NazimAkhter/hackathon_02_phase-II`
- [ ] Configure project:
  - Framework Preset: **Next.js**
  - Root Directory: **frontend**
  - Build Command: **npm run build** (auto-detected)
  - Output Directory: **.next** (auto-detected)
  - Install Command: **npm install** (auto-detected)
- [ ] Click **Deploy** (initial deployment)

**Expected**: Deployment starts, may take 2-3 minutes for first build

#### Step 2: Configure Environment Variables

While deployment runs or after it completes:

- [ ] **T007** - Go to Project → Settings → Environment Variables
- [ ] **T008** - Add `BETTER_AUTH_SECRET`:
  - Name: `BETTER_AUTH_SECRET`
  - Value: (paste from frontend/.env.local)
  - Environments: ✅ Production, ✅ Preview
  - Click **Save**

- [ ] **T009** - Add `DATABASE_URL`:
  - Name: `DATABASE_URL`
  - Value: (paste Neon connection string)
  - Environments: ✅ Production, ✅ Preview
  - Click **Save**

- [ ] **T010** - Add `NEXT_PUBLIC_API_URL`:
  - Name: `NEXT_PUBLIC_API_URL`
  - Value: `https://placeholder-backend.hf.space` (temporary, will update later)
  - Environments: ✅ Production, ✅ Preview
  - Click **Save**

- [ ] **T011** - Add `NODE_ENV`:
  - Name: `NODE_ENV`
  - Value: `production`
  - Environments: ✅ Production, ✅ Preview
  - Click **Save**

**Note**: After adding environment variables, Vercel may automatically redeploy. If not, trigger a redeploy.

#### Step 3: Verify Frontend Deployment

- [ ] **T012** - Check deployment status: Go to **Deployments** tab
- [ ] Verify build completed successfully (green checkmark)
- [ ] Click on deployment to get production URL
- [ ] **Record Production URL**: `https://________________________.vercel.app`
- [ ] Open production URL in browser
- [ ] Verify landing page loads without errors
- [ ] Check browser console (F12) - should have no critical errors
- [ ] Verify preview deployments are enabled (Settings → Git)

**Expected Result**:
- ✅ Frontend is live at Vercel URL
- ✅ Application loads but API calls will fail (backend not deployed yet)
- ✅ Preview deployments enabled for pull requests

---

### User Story 2: Backend Deployment to Hugging Face Spaces (15-20 min)

**Goal**: Deploy FastAPI backend to HF Spaces with automatic rebuilds

#### Step 1: Create Hugging Face Space

- [ ] **T013** - Go to https://huggingface.co/new-space
- [ ] Configure Space:
  - **Space name**: `todo-backend-api` (or your choice)
  - **License**: MIT
  - **Space SDK**: **Docker** ⚠️ (important!)
  - **Visibility**: Public (or Private)
- [ ] Click **Create Space**

**Expected**: Empty Space created, waiting for repository link

#### Step 2: Link GitHub Repository

- [ ] **T014** - In Space, go to **Settings** → **Repository**
- [ ] Click **Link a GitHub repository**
- [ ] Select repository: `NazimAkhter/hackathon_02_phase-II`
- [ ] Configure sync:
  - **Branch**: `main` (or `006-deployment-cicd` if deploying from feature branch)
  - **Path**: `backend/` (monorepo subdirectory)
  - **Auto-rebuild**: ✅ Enable
- [ ] Click **Save**

**Expected**: Space starts building from GitHub repository

#### Step 3: Configure Environment Variables

While build runs:

- [ ] **T015** - Go to Space **Settings** → **Variables and Secrets**

- [ ] **T016** - Add `BETTER_AUTH_SECRET`:
  - Name: `BETTER_AUTH_SECRET`
  - Value: (paste EXACT SAME value as frontend)
  - ⚠️ Mark as **Secret**
  - Click **Save**

- [ ] **T017** - Add `DATABASE_URL`:
  - Name: `DATABASE_URL`
  - Value: (paste Neon production connection string)
  - ⚠️ Mark as **Secret**
  - Click **Save**

- [ ] **T018** - Add `ENVIRONMENT`:
  - Name: `ENVIRONMENT`
  - Value: `production`
  - Click **Save**

- [ ] **T018** - Add `PORT`:
  - Name: `PORT`
  - Value: `7860`
  - Click **Save**

- [ ] **T019** - Add `FRONTEND_URL`:
  - Name: `FRONTEND_URL`
  - Value: `https://placeholder-frontend.vercel.app` (temporary, will update later)
  - Click **Save**

**Expected**: Variables saved, Space may restart automatically

#### Step 4: Verify Backend Deployment

- [ ] **T020** - Wait for build to complete (check **Logs** tab)
- [ ] Build should take 5-10 minutes for first deployment
- [ ] Once "Running" status appears, get Space URL
- [ ] **Record Space URL**: `https://________________________.hf.space`
- [ ] Open Space URL in browser
- [ ] Verify health check returns JSON: `{"status":"ok","environment":"production",...}`
- [ ] **T021** - Open API docs: `https://[your-space].hf.space/docs`
- [ ] Verify Swagger UI loads with all endpoints
- [ ] Check that health check response shows database connection

**Expected Result**:
- ✅ Backend is live at HF Space URL
- ✅ Health check endpoint working
- ✅ API documentation accessible
- ✅ Database connection established

---

### User Story 3: Environment Configuration (5 min)

**Goal**: Connect frontend and backend with correct production URLs

**Dependencies**: US1 and US2 must be complete

#### Step 1: Update Frontend Environment

- [ ] **T022** - Go to Vercel Project → Settings → Environment Variables
- [ ] Find `NEXT_PUBLIC_API_URL` variable
- [ ] Click **Edit**
- [ ] Update value to actual HF Space URL: `https://[your-space].hf.space`
- [ ] Save changes
- [ ] **T026** - Trigger redeploy:
  - Go to **Deployments** tab
  - Click on latest deployment
  - Click **Redeploy**
  - Or: Make empty commit and push to trigger rebuild

#### Step 2: Update Backend Environment & CORS

- [ ] **T023** - Go to HF Space → Settings → Variables and Secrets
- [ ] Find `FRONTEND_URL` variable
- [ ] Click **Edit**
- [ ] Update value to actual Vercel URL: `https://[your-app].vercel.app`
- [ ] Save changes

#### Step 3: Update Backend CORS Configuration

- [ ] **T024** - Open `backend/src/main.py` or `backend/src/config.py`
- [ ] Locate CORS middleware configuration
- [ ] Update `allow_origins` to include:
  ```python
  allow_origins=[
      "https://[your-app].vercel.app",     # Your production URL
      "https://*.vercel.app",               # Preview deployments
      "http://localhost:3000",              # Local development
  ]
  ```
- [ ] **T025** - Commit and push changes:
  ```bash
  git add backend/src/main.py
  git commit -m "Configure CORS for production Vercel URL"
  git push origin main
  ```
- [ ] HF Space will automatically rebuild (5-10 min)

#### Step 4: Verify Connection

- [ ] Wait for both redeployments to complete
- [ ] Open frontend production URL
- [ ] Open browser DevTools (F12) → Console tab
- [ ] Navigate through the application
- [ ] **Verify no CORS errors**
- [ ] **Verify API calls succeeding** (Network tab shows 200 responses)

**Expected Result**:
- ✅ Frontend uses correct backend URL
- ✅ Backend allows frontend domain
- ✅ No CORS errors in browser
- ✅ API communication working

---

### User Story 4: CI/CD Validation (5 min)

**Goal**: Verify automatic deployments on GitHub push

**Dependencies**: US1, US2, US3 complete

#### Test Automatic Deployments

- [ ] **T027** - Verify Vercel GitHub integration:
  - Vercel Project → Settings → Git
  - Confirm **Production Branch**: `main`
  - Confirm **Preview Deployments**: Enabled

- [ ] **T028** - Verify HF Space GitHub sync:
  - HF Space → Settings → Repository
  - Confirm **Branch**: `main`
  - Confirm **Auto-rebuild**: Enabled

- [ ] **T029** - Test automatic deployment:
  - Make small change (e.g., update README.md)
  - Commit: `git commit -m "Test automatic deployment"`
  - Push: `git push origin main`
  - Wait 2-3 minutes
  - **Verify Vercel** shows new deployment
  - **Verify HF Space** shows rebuild triggered
  - Check both deployments complete successfully

**Expected Result**:
- ✅ Vercel deploys automatically on push to main
- ✅ HF Space rebuilds automatically on push to main
- ✅ Test deployment successful
- ✅ CI/CD pipeline working

---

### User Story 5: Integration Testing (5-10 min)

**Goal**: Validate complete user journey in production

**Dependencies**: All previous stories complete

#### Complete User Journey Test

- [ ] **T030** - Test user signup:
  - Go to `https://[your-app].vercel.app/signup`
  - Create new test account
  - Verify redirect to dashboard
  - ✅ Signup working

- [ ] **T031** - Test user signin:
  - Sign out
  - Sign in with test account
  - Verify JWT token in browser (Application → Cookies)
  - Verify dashboard loads
  - ✅ Signin working

- [ ] **T032** - Test task creation:
  - Click "Add Task" or similar
  - Create new task with title and description
  - Verify task appears in list immediately
  - ✅ Create working

- [ ] **T033** - Test task update:
  - Click on task to edit
  - Update title or description
  - Save changes
  - Verify changes persist after page refresh
  - ✅ Update working

- [ ] **T034** - Test task deletion:
  - Select task to delete
  - Confirm deletion
  - Verify task removed from list
  - Verify not in database (check count)
  - ✅ Delete working

- [ ] **T035** - Verify no CORS errors:
  - Keep browser DevTools Console open
  - Perform all operations above
  - **Confirm zero CORS errors**
  - ✅ CORS configured correctly

- [ ] **T036** - Verify production health:
  - Open `https://[your-space].hf.space/`
  - Verify response shows:
    - `"environment": "production"`
    - `"status": "ok"`
    - Database connection info
  - ✅ Health check working

**Expected Result**:
- ✅ Complete user journey functional
- ✅ All CRUD operations working
- ✅ No errors in browser console
- ✅ Production application fully operational

---

### Final Validation (5 min)

#### Security Validation

- [ ] **T037** - Run security check:
  ```bash
  git log --all -S "BETTER_AUTH_SECRET"
  ```
  - Verify NO results (secret not in history)
  - If found, secret was committed - needs fixing!
  - ✅ No secrets in Git

#### Documentation

- [ ] **T038** - Document production URLs:
  - **Frontend**: `https://________________________.vercel.app`
  - **Backend API**: `https://________________________.hf.space`
  - **API Docs**: `https://________________________.hf.space/docs`
  - **Health Check**: `https://________________________.hf.space/`

- [ ] **T039** - Update project README:
  - Add "Deployment" section
  - Include production URLs
  - Note deployment platforms used
  - Commit changes

- [ ] **T040** - Create deployment report:
  - Document deployment completion date
  - Note any issues encountered
  - Record deployment times (frontend, backend)
  - List environment variables configured
  - Confirm rollback procedure understood

**Expected Result**:
- ✅ Security validated
- ✅ Documentation complete
- ✅ Deployment report created

---

## ✅ Deployment Complete Checklist

When all tasks above are checked:

- [ ] Frontend deployed to Vercel with production URL
- [ ] Backend deployed to HF Spaces with production URL
- [ ] Environment variables configured on both platforms
- [ ] CORS configured to allow frontend domain
- [ ] Automatic CI/CD working on GitHub push
- [ ] Complete user journey tested and functional
- [ ] No CORS errors in production
- [ ] No secrets exposed in Git repository
- [ ] Production URLs documented
- [ ] README updated with deployment information

**Deployment Status**: 🎉 **PRODUCTION READY**

---

## 🔄 Rollback Procedures

### If Frontend Issues Occur

1. Go to Vercel Dashboard → Deployments
2. Find previous successful deployment
3. Click **Promote to Production**
4. Instant rollback (no rebuild)

### If Backend Issues Occur

1. Identify problematic commit: `git log`
2. Revert commit: `git revert <commit-hash>`
3. Push to main: `git push origin main`
4. HF Space automatically rebuilds (5-10 min)

---

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **HF Spaces Docs**: https://huggingface.co/docs/hub/spaces
- **Quickstart Guide**: `specs/006-deployment-cicd/quickstart.md`
- **Task Details**: `specs/006-deployment-cicd/tasks.md`
- **Contracts**: `specs/006-deployment-cicd/contracts/`

---

**Last Updated**: 2026-02-09
**Feature Branch**: 006-deployment-cicd
**Commit**: f6ff49e
