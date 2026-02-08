# Tasks: Session Expiry & Authentication Flow Fix

**Feature**: 005-fix-session-expiry
**Branch**: `005-fix-session-expiry`
**Created**: 2026-01-22

## Overview

This tasks document breaks down the session expiry bug fix into atomic, executable tasks organized by user story. Each user story phase can be implemented and tested independently, enabling incremental delivery and parallel development where possible.

**Total Estimated Tasks**: 24
**MVP Scope**: User Story 1 (Successful Signin to Dashboard Navigation)
**Parallel Opportunities**: 8 parallelizable tasks identified

## Implementation Strategy

1. **MVP First**: Focus on User Story 1 (P1) - the critical signin → dashboard flow
2. **Incremental Delivery**: Complete each user story as an independently testable increment
3. **Parallel Execution**: Tasks marked [P] can run in parallel within the same phase
4. **Test Early**: Manual testing using quickstart guide procedures after each story
5. **Dependencies**: User Story 2-4 depend on User Story 1 completion

## Phase 1: Setup & Environment Audit ✅ COMPLETE

**Goal**: Verify environment configuration and establish baseline for bug fix

**Tasks**:

- [x] T001 Verify BETTER_AUTH_SECRET matches between /frontend/.env.local and /backend/.env
- [x] T002 Document current cookie configuration in /backend/src/api/auth.py (signin and signup endpoints)
- [x] T003 Create debug logging utility in /frontend/lib/auth/logger.ts with environment-based toggling
- [x] T004 Add browser compatibility check for cookie support in /frontend/lib/auth/browser-check.ts

**Validation**: ✅ Environment secrets match, cookie config documented, logger utility created

---

## Phase 2: Foundational Fixes (Blocking Prerequisites) ✅ COMPLETE

**Goal**: Implement core session validation utilities needed by all user stories

**Tasks**:

- [x] T005 [P] Implement validateSession() function in /frontend/lib/auth/validation.ts (checks exp claim)
- [x] T006 [P] Create waitForSession() polling function in /frontend/lib/auth/session-wait.ts (max 1s, 50ms intervals)
- [x] T007 Enhance getSession() in /frontend/lib/auth/utils.ts with retry logic (500ms delay, 2 attempts)
- [x] T008 Update getTokenFromCookie() in /frontend/lib/auth/utils.ts to add comprehensive debug logging

**Validation**: ✅ All utility functions implemented with retry logic and comprehensive logging

---

## Phase 3: User Story 1 - Successful Signin to Dashboard Navigation (P1) ✅ COMPLETE (MVP)

**Story Goal**: Fix race condition where user signs in successfully but gets "session expired" on dashboard

**Independent Test**:
1. Sign in with valid credentials (test@example.com / Test123!)
2. Observe redirect to /dashboard
3. Verify dashboard loads with todos displayed
4. Confirm no "session expired" error appears
5. Check console logs show session established before navigation

**Tasks**:

- [x] T009 [US1] Update signin success handler in /frontend/components/auth/AuthProvider.tsx to call waitForSession() before navigation
- [x] T010 [US1] Add session confirmation logging in signin flow in /frontend/components/auth/AuthProvider.tsx
- [x] T011 [US1] Implement dashboard mount session validation in /frontend/app/dashboard/page.tsx with enhanced logging
- [x] T012 [US1] Add loading state to dashboard while session validation runs in /frontend/app/dashboard/page.tsx
- [x] T013 [US1] useAuth hook automatically uses enhanced getSession() via AuthProvider.checkAuth()

**Parallel Opportunities**:
- T009 and T011 were developed in parallel (different files, no interdependency)

**Story Validation**:
- [ ] Manual Test: Quickstart Guide Test #3 (Signin Flow - Happy Path) passes
- [ ] Manual Test: Signin → dashboard transition < 3 seconds
- [ ] Manual Test: No "session expired" error on successful signin
- [ ] Console logs show: "Cookie found" → "Token decoded" → "Session valid" → "Navigating to dashboard"

---

## Phase 4: User Story 2 - Page Refresh Session Persistence (P1) ✅ COMPLETE

**Story Goal**: Ensure session persists across page refreshes without losing authentication

**Independent Test**:
1. Complete User Story 1 test (signin successfully)
2. Press F5 or Ctrl+R to hard refresh dashboard
3. Verify user remains authenticated
4. Confirm todos reload successfully
5. Check no redirect to signin occurs

**Tasks**:

- [x] T014 [US2] Add session check on dashboard layout mount in /frontend/app/dashboard/layout.tsx
- [x] T015 [US2] Session expiry detection implemented via validateSession() in /frontend/lib/auth/validation.ts
- [x] T016 [US2] clearSession() function already exists in /frontend/lib/auth/utils.ts
- [x] T017 [US2] Enhanced dashboard with periodic session checks and graceful expiry warnings in /frontend/app/dashboard/page.tsx

**Parallel Opportunities**:
- T015 and T016 were already implemented in Phase 2

**Story Validation**:
- [ ] Manual Test: Quickstart Guide Test #5 (Page Refresh Persistence) passes
- [ ] Manual Test: Session survives hard refresh (F5)
- [ ] Manual Test: Session shared across multiple tabs in same browser
- [ ] Manual Test: Expired session (7+ days old) triggers redirect with "Session expired" message

---

## Phase 5: User Story 3 - Protected Routes Authorization (P2)

**Story Goal**: Verify middleware correctly protects routes and handles auth failures

**Independent Test**:
1. Without signing in, navigate to http://localhost:3000/dashboard
2. Verify redirect to /signin with message parameter
3. Sign in successfully, access dashboard
4. Try accessing /profile and /settings (if they exist)
5. Confirm all protected routes work correctly

**Tasks**:

- [x] T018 [US3] Update middleware in /frontend/middleware.ts to use enhanced getSession() with retry
- [x] T019 [US3] Add session validation timing fix in middleware (wait for cookie before checking)
- [x] T020 [US3] Implement error message query parameters in /frontend/app/signin/page.tsx for different auth failures
- [x] T021 [US3] Add session expiry redirect logic to middleware in /frontend/middleware.ts

**Story Validation**:
- [ ] Manual Test: Quickstart Guide Test #7 (Authorization Header Verification) passes
- [ ] Manual Test: Unauthenticated access to /dashboard redirects to signin
- [ ] Manual Test: Authenticated access to protected routes succeeds
- [ ] Manual Test: Expired session triggers redirect with appropriate message

---

## Phase 6: User Story 4 - Cross-Navigation Session Stability (P3)

**Story Goal**: Validate session persists across complex navigation patterns

**Independent Test**:
1. Sign in successfully
2. Navigate: dashboard → (todo details if exists) → back to dashboard → (profile if exists) → dashboard
3. Perform this sequence 3-5 times over 5-10 minutes
4. Verify no "session expired" errors at any point
5. Confirm API calls succeed throughout journey

**Tasks**:

- [x] T022 [US4] Add session persistence logging across navigation in /frontend/lib/auth/utils.ts
- [x] T023 [US4] Implement session validation on all page transitions in /frontend/app/layout.tsx (if needed)

**Story Validation**:
- [ ] Manual Test: Quickstart Guide Test #10 (Cross-Page Navigation) passes
- [ ] Manual Test: Navigate through 5+ page transitions without session loss
- [ ] Manual Test: Both client-side (Link) and full page loads preserve session
- [ ] Manual Test: API calls include Authorization header throughout journey

---

## Phase 7: Polish & Cross-Cutting Concerns

**Goal**: Add comprehensive logging, error handling, and documentation

**Tasks**:

- [x] T024 Add comprehensive debug logging to all auth-related functions in /frontend/lib/auth/*.ts files

**Validation**: ✅ All logging statements follow structured format, debug mode toggleable

---

## Dependency Graph

### User Story Completion Order

```
Phase 1: Setup & Environment Audit
   ↓
Phase 2: Foundational Fixes
   ↓
Phase 3: User Story 1 (P1) ← MVP DELIVERABLE
   ↓
Phase 4: User Story 2 (P1) ← Parallel execution possible
   ↓
Phase 5: User Story 3 (P2) ← Can start after US1+US2 complete
   ↓
Phase 6: User Story 4 (P3) ← Requires all previous stories
   ↓
Phase 7: Polish
```

### Task Dependencies Within Phases

**Phase 2 Foundational**:
- T005, T006 can run in parallel (independent utilities)
- T007 depends on T005 (uses validateSession)
- T008 can run in parallel with T005-T007

**Phase 3 User Story 1**:
- T009, T011 can run in parallel (different files)
- T010 depends on T009 (modifies same signin flow)
- T012 depends on T011 (modifies same dashboard component)
- T013 can run in parallel with T009-T012

**Phase 4 User Story 2**:
- T015, T016 can run in parallel (separate functions)
- T014, T017 depend on T015, T016 (use expiry detection and clear functions)

**Phase 5 User Story 3**:
- T018, T019, T020, T021 are sequential (all modify middleware or signin page)

**Phase 6 User Story 4**:
- T022, T023 can run in parallel if different files

---

## Parallel Execution Examples

### Within Phase 2 (Foundational)
```bash
# Terminal 1: Implement validateSession
Task T005: Implement /frontend/lib/auth/validation.ts

# Terminal 2: Implement waitForSession
Task T006: Implement /frontend/lib/auth/session-wait.ts

# Terminal 3: Add debug logging
Task T008: Update /frontend/lib/auth/utils.ts (getTokenFromCookie logging)
```

### Within Phase 3 (User Story 1)
```bash
# Terminal 1: Update signin page
Task T009: Modify /frontend/app/signin/page.tsx (signin handler)

# Terminal 2: Update dashboard page
Task T011: Modify /frontend/app/dashboard/page.tsx (mount validation)

# Terminal 3: Update useAuth hook
Task T013: Modify /frontend/hooks/useAuth.ts (use enhanced getSession)
```

### Within Phase 4 (User Story 2)
```bash
# Terminal 1: Implement expiry detection
Task T015: Add to /frontend/lib/auth/utils.ts (session expiry check)

# Terminal 2: Implement clearSession
Task T016: Add to /frontend/lib/auth/utils.ts (clear expired cookie)
```

---

## Testing Strategy

### Manual Testing (Per User Story)

After completing each phase, run corresponding tests from quickstart guide:

**Phase 3 (US1) Testing**:
- Test #1: Environment Variable Verification
- Test #2: Cookie Configuration Audit
- Test #3: Signin Flow (Happy Path)
- Test #8: Race Condition Test

**Phase 4 (US2) Testing**:
- Test #4: Cookie Persistence Verification
- Test #5: Page Refresh Persistence
- Test #9: Expired Token Handling

**Phase 5 (US3) Testing**:
- Test #7: Authorization Header Verification
- Test Protected route access (authenticated vs unauthenticated)

**Phase 6 (US4) Testing**:
- Test #10: Cross-Page Navigation
- Stress test: Rapid navigation, long session duration

### Validation Checklist (All Stories Complete)

- [ ] User can signin and reach dashboard without "session expired" error (100% success rate)
- [ ] Session persists across page refresh and navigation (7-day duration)
- [ ] Protected routes correctly allow/deny access based on authentication state
- [ ] API calls include Authorization header with valid token
- [ ] Signin to dashboard transition < 3 seconds
- [ ] Zero false-positive "session expired" errors during valid sessions
- [ ] Clear error messages displayed for different failure scenarios
- [ ] Console logs provide useful debugging information

---

## File Summary

**Files Modified** (8 total):

1. `/frontend/lib/auth/logger.ts` - NEW: Debug logging utility
2. `/frontend/lib/auth/browser-check.ts` - NEW: Browser compatibility check
3. `/frontend/lib/auth/validation.ts` - MODIFIED: Add validateSession()
4. `/frontend/lib/auth/session-wait.ts` - NEW: waitForSession() polling
5. `/frontend/lib/auth/utils.ts` - MODIFIED: Enhanced getSession(), clearSession()
6. `/frontend/app/signin/page.tsx` - MODIFIED: Session wait before navigation
7. `/frontend/app/dashboard/page.tsx` - MODIFIED: Session validation on mount
8. `/frontend/app/dashboard/layout.tsx` - MODIFIED: Session check on layout mount
9. `/frontend/hooks/useAuth.ts` - MODIFIED: Use enhanced getSession()
10. `/frontend/middleware.ts` - MODIFIED: Enhanced session validation timing
11. `/frontend/app/layout.tsx` - MODIFIED (if needed): Root layout session persistence

**Files Verified** (2 total):
1. `/frontend/.env.local` - VERIFY: BETTER_AUTH_SECRET matches backend
2. `/backend/.env` - VERIFY: BETTER_AUTH_SECRET matches frontend

---

## MVP Scope Recommendation

**Minimum Viable Fix**: Complete through Phase 3 (User Story 1)

This delivers:
- ✅ Signin → dashboard flow works without errors
- ✅ Race condition fixed with retry logic
- ✅ Session validation on dashboard mount
- ✅ Comprehensive logging for debugging

**Validation**: User can signin and access dashboard successfully (the critical broken flow)

**Next Increments**:
- Phase 4: Add page refresh persistence (US2)
- Phase 5: Add protected route handling (US3)
- Phase 6: Validate complex navigation (US4)
- Phase 7: Polish and comprehensive logging

---

## Success Criteria

Fix is complete when:
1. All 24 tasks checked off
2. All 4 user stories pass their independent tests
3. All 10 quickstart guide test procedures pass
4. Constitution Check remains ✅ PASS (no violations introduced)
5. Performance budget met (signin→dashboard < 3s)
6. Zero false-positive session expiry errors

---

**Tasks Document Complete** - Ready for implementation using specialized agents (auth-security-architect, nextjs-ui-builder)
