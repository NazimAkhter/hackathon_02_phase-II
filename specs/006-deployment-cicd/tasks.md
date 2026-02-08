# Implementation Tasks: Deployment & CI/CD – Todo Full-Stack App

**Feature**: 006-deployment-cicd
**Branch**: `006-deployment-cicd`
**Generated**: 2026-02-09
**Total Estimated Time**: 30-45 minutes for complete deployment

## Task Summary

- **Total Tasks**: 26
- **User Story 1 (P1)**: 7 tasks (Frontend Deployment to Vercel)
- **User Story 2 (P1)**: 7 tasks (Backend Deployment to Hugging Face Spaces)
- **User Story 3 (P2)**: 4 tasks (Environment Configuration Management)
- **User Story 4 (P2)**: 3 tasks (Automatic Deployment Pipeline)
- **User Story 5 (P3)**: 5 tasks (Frontend-Backend Communication)

**Parallelization Opportunities**: Tasks marked with [P] can be executed in parallel with other [P] tasks in the same phase.

**MVP Scope**: User Story 1 + User Story 2 (minimum viable deployment - frontend and backend live)

---

## Dependencies

### Story Completion Order

```
Phase 1: Setup
   ↓
Phase 2: User Story 1 (P1) - Frontend Deployment ←┐
   ↓                                                ├─ Can run in parallel
Phase 2: User Story 2 (P1) - Backend Deployment  ←┘
   ↓
Phase 3: User Story 3 (P2) - Environment Configuration (requires both deployments)
   ↓
Phase 4: User Story 4 (P2) - CI/CD Pipeline (builds on deployments)
   ↓
Phase 5: User Story 5 (P3) - Integration Validation (final validation)
```

### Task Dependencies

- **User Story 1** and **User Story 2** are independent and can be executed in parallel
- **User Story 3** depends on both US1 and US2 completion
- **User Story 4** can run after US1 and US2 (auto-deployment is already configured by platforms)
- **User Story 5** requires all previous stories complete

---

## Phase 1: Setup & Prerequisites

**Goal**: Prepare deployment configuration files and verify prerequisites

**Duration**: 5 minutes

**Tasks**:

- [X] T001 [P] Create frontend/vercel.json configuration file per vercel-config.yaml contract
- [X] T002 [P] Verify frontend/.env.example has all required environment variables documented
- [X] T003 [P] Update backend/Dockerfile to expose port 7860 for Hugging Face Spaces
- [X] T004 [P] Verify backend/.env.example has all required environment variables documented
- [X] T005 Verify GitHub repository is up to date with latest code changes

**Acceptance Criteria**:
- ✅ frontend/vercel.json exists with correct Next.js configuration
- ✅ frontend/.env.example lists: BETTER_AUTH_SECRET, NEXT_PUBLIC_API_URL, DATABASE_URL, NODE_ENV
- ✅ backend/Dockerfile exposes port 7860
- ✅ backend/.env.example lists: BETTER_AUTH_SECRET, DATABASE_URL, ENVIRONMENT, FRONTEND_URL, PORT
- ✅ Git status clean (or intentional uncommitted changes)

---

## Phase 2: User Story 1 (P1) - Frontend Deployment to Vercel

**Goal**: Deploy Next.js frontend to Vercel with automatic CI/CD from GitHub

**Story**: As a developer, I need the Next.js frontend automatically deployed to Vercel so that users can access the application through a public URL without manual deployment steps.

**Independent Test**: Push code to main branch, verify Vercel deployment succeeds, access deployed URL to confirm application loads correctly.

**Duration**: 15-20 minutes

**Tasks**:

- [ ] T006 [US1] Deploy frontend to Vercel using MCP integration (or Vercel Dashboard) with repository github.com/[username]/[repo] and root directory frontend/
- [ ] T007 [US1] Configure Vercel project settings: Framework=Next.js, Build Command="npm run build", Output Directory=".next"
- [ ] T008 [US1] Add BETTER_AUTH_SECRET environment variable in Vercel Dashboard → Settings → Environment Variables (Production + Preview)
- [ ] T009 [US1] Add DATABASE_URL environment variable in Vercel Dashboard (Production + Preview)
- [ ] T010 [US1] Add NEXT_PUBLIC_API_URL environment variable (temporarily set to placeholder URL)
- [ ] T011 [US1] Add NODE_ENV=production environment variable (Production + Preview)
- [ ] T012 [US1] Verify frontend deployment success: Check build logs, access production URL, confirm landing page loads

**Acceptance Criteria**:
- ✅ Frontend accessible at https://[your-app].vercel.app
- ✅ Application loads without build errors
- ✅ Environment variables configured (4 variables)
- ✅ Pull request preview deployments enabled automatically

**Parallel Execution Example**:
```bash
# All environment variable tasks (T008-T011) can be done simultaneously in Vercel Dashboard
# T012 must wait for T006-T011 to complete
```

---

## Phase 3: User Story 2 (P1) - Backend Deployment to Hugging Face Spaces

**Goal**: Deploy FastAPI backend to Hugging Face Spaces with automatic rebuilds from GitHub

**Story**: As a developer, I need the FastAPI backend automatically deployed to Hugging Face Spaces so that the frontend can communicate with the API endpoints without requiring local server setup.

**Independent Test**: Push backend code, verify HF Space builds successfully, access health check endpoint, confirm API documentation is accessible.

**Duration**: 15-20 minutes

**Tasks**:

- [ ] T013 [US2] Create new Hugging Face Space: Name="todo-backend-api", SDK="docker", Visibility="public"
- [ ] T014 [US2] Link GitHub repository to HF Space: Repository=[username]/[repo], Branch=main, Path=backend/
- [ ] T015 [US2] Enable auto-rebuild on push in HF Space settings
- [ ] T016 [US2] Add BETTER_AUTH_SECRET environment variable in HF Space → Settings → Variables (mark as Secret)
- [ ] T017 [US2] Add DATABASE_URL environment variable in HF Space (mark as Secret)
- [ ] T018 [US2] Add ENVIRONMENT=production and PORT=7860 environment variables in HF Space
- [ ] T019 [US2] Add FRONTEND_URL environment variable (temporarily set to placeholder)
- [ ] T020 [US2] Verify backend deployment success: Check build logs, access https://[username]-[space-name].hf.space/, confirm health check returns {"status":"ok"}
- [ ] T021 [US2] Verify API documentation accessible at https://[username]-[space-name].hf.space/docs

**Acceptance Criteria**:
- ✅ Backend accessible at https://[username]-[space-name].hf.space
- ✅ Health check endpoint returns 200 OK with status information
- ✅ Swagger UI loads at /docs with all API endpoints
- ✅ Database connection established (verified in health check response)
- ✅ Environment variables configured (5 variables)

**Parallel Execution Example**:
```bash
# All environment variable tasks (T016-T019) can be done simultaneously in HF Space dashboard
# T020-T021 must wait for T013-T019 to complete
```

---

## Phase 4: User Story 3 (P2) - Environment Configuration Management

**Goal**: Connect deployed frontend to deployed backend by updating environment variables

**Story**: As a developer, I need secure environment variable management across deployment platforms so that sensitive credentials are never exposed in the repository while the application functions correctly in production.

**Independent Test**: Verify all environment variables set correctly, confirm none in GitHub, validate application functions with production URLs.

**Duration**: 5 minutes

**Dependencies**: Requires US1 (T012) and US2 (T021) complete

**Tasks**:

- [ ] T022 [US3] Update NEXT_PUBLIC_API_URL in Vercel to actual HF Space URL: https://[username]-[space-name].hf.space
- [ ] T023 [US3] Update FRONTEND_URL in HF Space to actual Vercel URL: https://[your-app].vercel.app
- [ ] T024 [US3] Update backend/src/main.py or backend/src/config.py CORS configuration to allow Vercel domain and wildcard for previews
- [ ] T025 [US3] Commit CORS changes and push to GitHub to trigger backend rebuild
- [ ] T026 [US3] Trigger frontend redeploy in Vercel (or push empty commit) to load updated API URL

**Acceptance Criteria**:
- ✅ NEXT_PUBLIC_API_URL points to production HF Space
- ✅ FRONTEND_URL in backend matches Vercel production URL
- ✅ CORS allows: production Vercel URL, wildcard *.vercel.app, localhost:3000
- ✅ No CORS errors in browser console when accessing frontend

**Parallel Execution Example**:
```bash
# T022-T023 can be done simultaneously (platform configurations independent)
# T024-T025 must be sequential (code change → commit → push)
# T026 waits for T022-T025
```

---

## Phase 5: User Story 4 (P2) - Automatic Deployment Pipeline

**Goal**: Verify automatic deployments trigger on GitHub push for both platforms

**Story**: As a developer, I need automatic deployments triggered by GitHub pushes so that changes are immediately available in production without manual intervention.

**Independent Test**: Make small code change, push to main, verify both platforms automatically redeploy without manual steps.

**Duration**: 5 minutes (verification only)

**Dependencies**: Requires US1, US2, US3 complete

**Tasks**:

- [ ] T027 [US4] Verify Vercel GitHub integration: Check Vercel project settings show main branch for production deployments
- [ ] T028 [US4] Verify HF Space GitHub sync: Check HF Space settings show auto-rebuild enabled on main branch
- [ ] T029 [US4] Test automatic deployment: Make small README change, commit, push to main, verify both platforms rebuild automatically

**Acceptance Criteria**:
- ✅ Vercel automatically deploys on push to main branch
- ✅ Vercel creates preview deployments for pull requests
- ✅ HF Space automatically rebuilds on push to main branch
- ✅ Deployment logs show automatic triggers (not manual)
- ✅ Test deployment completes successfully for both platforms

**Note**: Automatic CI/CD is configured by platform integrations (T006-T015), this phase only validates it works.

---

## Phase 6: User Story 5 (P3) - Frontend-Backend Communication in Production

**Goal**: Validate complete end-to-end functionality in production environment

**Story**: As a developer, I need the deployed frontend to successfully communicate with the deployed backend so that all application features work end-to-end in production.

**Independent Test**: Use deployed frontend to create, read, update, delete tasks, confirm all API calls succeed with proper authentication.

**Duration**: 5-10 minutes

**Dependencies**: Requires all previous stories complete

**Tasks**:

- [ ] T030 [US5] Test user signup: Go to https://[your-app].vercel.app/signup, create account, verify redirect to dashboard
- [ ] T031 [US5] Test user signin: Sign out and sign in again, verify JWT token received and stored
- [ ] T032 [US5] Test task creation: Create new task, verify it appears in task list immediately
- [ ] T033 [US5] Test task updates: Edit task title/description, verify changes persist in database
- [ ] T034 [US5] Test task deletion: Delete task, verify removal from UI and database
- [ ] T035 [US5] Verify no CORS errors in browser DevTools console during all operations
- [ ] T036 [US5] Verify health check shows production environment and correct database connection

**Acceptance Criteria**:
- ✅ Complete user journey works: Signup → Signin → Create → Update → Delete
- ✅ All API calls return expected 200/201 status codes
- ✅ No CORS errors in browser console
- ✅ Frontend successfully communicates with backend API
- ✅ Authentication flow works (JWT tokens)
- ✅ Database operations complete successfully
- ✅ Users can only access their own data (security validation)

**Parallel Execution Example**:
```bash
# All test tasks (T030-T036) must be sequential (user journey flow)
# Can test multiple user accounts in parallel if desired
```

---

## Phase 7: Final Validation & Documentation

**Goal**: Complete deployment checklist and document production URLs

**Duration**: 5 minutes

**Tasks**:

- [ ] T037 Run security validation: git log --all -S "BETTER_AUTH_SECRET" to confirm no secrets in repository history
- [ ] T038 Document production URLs in deployment guide: Frontend URL, Backend API URL, API Docs URL, Health Check URL
- [ ] T039 Update project README with deployment information and production links
- [ ] T040 Create deployment success report: Document deployment times, any issues encountered, rollback procedure tested

**Acceptance Criteria**:
- ✅ No secrets found in Git history
- ✅ Production URLs documented
- ✅ README updated with deployment links
- ✅ Deployment report complete

---

## Implementation Strategy

### MVP First (Minimum Viable Product)

**MVP = User Story 1 + User Story 2**
- Get both frontend and backend deployed first
- Validate independent functionality
- Then iterate to add environment connections and validation

### Incremental Delivery Approach

1. **Deploy Both Platforms** (US1 + US2 in parallel)
   - Frontend live but can't reach backend yet
   - Backend live but not accessible from frontend
   - Both independently testable

2. **Connect Platforms** (US3)
   - Update environment variables
   - Configure CORS
   - Enable frontend-backend communication

3. **Validate Automation** (US4)
   - Confirm CI/CD working
   - Test automatic deployments

4. **End-to-End Validation** (US5)
   - Complete functional testing
   - Confirm production readiness

### Parallel Execution Opportunities

**Phase 2-3 Parallel**: User Story 1 and User Story 2 can run completely in parallel
- One developer/agent deploys frontend to Vercel
- Another developer/agent deploys backend to HF Spaces
- Reduces total deployment time by ~50%

**Within Each Story**: Environment variable configuration tasks can be done simultaneously
- Open multiple browser tabs
- Configure all variables at once
- Reduces configuration time

### Rollback Strategy

If any phase fails:

**Frontend Rollback**:
1. Vercel Dashboard → Deployments
2. Find previous successful deployment
3. Click "Promote to Production"
4. Instant rollback (no rebuild)

**Backend Rollback**:
1. GitHub: `git revert <commit-hash>`
2. Push to main branch
3. HF Space automatically rebuilds
4. Wait 5-10 minutes

---

## Testing Checklist

### Build Validation
- [ ] Frontend builds without errors/warnings
- [ ] Backend Docker image builds successfully
- [ ] All dependencies resolve correctly

### Deployment Validation
- [ ] Vercel deployment URL accessible
- [ ] HF Space deployment URL accessible
- [ ] Health check returns 200 OK
- [ ] API documentation loads

### Environment Validation
- [ ] Frontend uses correct backend URL
- [ ] Backend connects to Neon database
- [ ] BETTER_AUTH_SECRET matches across platforms
- [ ] CORS allows frontend domain

### Functional Validation
- [ ] User signup works
- [ ] User signin works
- [ ] Task creation works
- [ ] Task updates work
- [ ] Task deletion works
- [ ] No CORS errors

### Security Validation
- [ ] No secrets in GitHub repository
- [ ] Environment variables only on platforms
- [ ] HTTPS enforced on all endpoints
- [ ] Authentication required for protected routes

---

## Troubleshooting Guide

### Common Issues

**Frontend build fails**:
- Check package.json dependencies
- Run `npm install` locally to test
- Review Vercel build logs

**Backend container fails to start**:
- Verify Dockerfile exposes port 7860
- Check environment variables in HF Space
- Review HF Space build logs

**CORS errors**:
- Verify FRONTEND_URL in backend config
- Check CORS middleware includes Vercel domain
- Include wildcard for preview: `https://*.vercel.app`

**Database connection fails**:
- Verify DATABASE_URL format
- Check Neon database is accessible
- Confirm SSL mode: `sslmode=require`

**Authentication fails**:
- **CRITICAL**: Verify BETTER_AUTH_SECRET identical across platforms
- Check JWT token in browser DevTools
- Verify token sent in Authorization header

---

## Completion Criteria

**All tasks complete when**:
- [ ] Frontend deployed to Vercel production URL
- [ ] Backend deployed to HF Space production URL
- [ ] Environment variables configured on both platforms
- [ ] Automatic CI/CD working for both platforms
- [ ] Complete user journey tested and working
- [ ] No secrets in GitHub repository
- [ ] Production URLs documented
- [ ] Deployment report created

**Time to Completion**: 30-45 minutes total (with parallel execution)

---

## Notes

- **No new code required**: This feature configures deployment infrastructure for existing application
- **No database migrations**: Schema unchanged, only deployment configuration
- **No new API endpoints**: Leverages existing health check and API documentation
- **Platform-native CI/CD**: No custom GitHub Actions workflow files needed
- **Manual testing**: No automated test suite (per specification)

**Agent Assignment**:
- `vercel-deployment-specialist`: User Story 1 tasks
- `hf-spaces-backend-deployer`: User Story 2 tasks
- `deployment-ops-engineer`: User Stories 3-5 coordination

---

**Generated by**: `/sp.tasks` command
**Next Step**: Begin implementation starting with Setup phase (T001-T005)
