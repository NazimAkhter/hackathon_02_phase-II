# Tasks: Fix Authentication Session Timeout

**Input**: Design documents from `/specs/001-fix-auth-timeout/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/session-endpoint.yaml

**Tests**: Tests are NOT explicitly requested in the specification. Manual testing will be performed using quickstart.md guide.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a web application with:
- Backend: `backend/src/`
- Frontend: `frontend/`
- Tests: `backend/tests/` and `frontend/__tests__/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify environment and dependencies for authentication fix

- [x] T001 Verify backend environment variables in backend/.env (DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, FRONTEND_URL)
- [x] T002 [P] Verify frontend environment variables in frontend/.env.local (NEXT_PUBLIC_API_URL, BETTER_AUTH_URL, BETTER_AUTH_SECRET)
- [x] T003 [P] Verify backend dependencies installed (FastAPI, PyJWT, bcrypt, python-jose)
- [x] T004 [P] Verify frontend dependencies installed (better-auth@1.4.15, next@16.1.6, react@19.2.3)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement backend session endpoint that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Implement GET /api/auth/session endpoint in backend/src/api/auth.py
- [x] T006 Add JWT token verification logic to read HttpOnly cookie from request headers in backend/src/api/auth.py
- [x] T007 Add session response schema returning user data, token, and expiresAt in backend/src/api/auth.py
- [x] T008 Add 401 error handling for missing or invalid session cookies in backend/src/api/auth.py
- [x] T009 Verify CORS configuration allows credentials (allow_credentials=True) in backend/src/main.py

**Checkpoint**: Backend session endpoint ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Successful Login Without Timeout (Priority: P1) 🎯 MVP

**Goal**: Fix timeout errors during login by implementing API-based session verification with 3-second timeout

**Independent Test**: Log in with valid credentials and verify successful authentication within 5 seconds without "Session could not be established" error

### Implementation for User Story 1

- [x] T010 [P] [US1] Replace cookie detection with API-based session check in frontend/lib/auth/session-wait.ts
- [x] T011 [P] [US1] Implement defaultCheckSession() function to call GET /api/auth/session with credentials: 'include' in frontend/lib/auth/session-wait.ts
- [x] T012 [US1] Increase maxWait timeout from 1000ms to 3000ms in waitForSession() function in frontend/lib/auth/session-wait.ts
- [x] T013 [US1] Update polling interval to 50ms for faster session detection in frontend/lib/auth/session-wait.ts
- [x] T014 [US1] Update AuthProvider to use new 3000ms timeout in signin/signup flows in frontend/components/auth/AuthProvider.tsx
- [x] T015 [US1] Add loading state management during session establishment in frontend/components/auth/AuthProvider.tsx
- [x] T016 [US1] Update error messages to distinguish between timeout and authentication failures in frontend/components/auth/AuthProvider.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional - users can log in without timeout errors

---

## Phase 4: User Story 2 - Session Persistence Across Page Reloads (Priority: P2)

**Goal**: Maintain authenticated state across page refreshes by verifying session on app load

**Independent Test**: Log in successfully, refresh the page, and verify user remains authenticated without redirect to signin

### Implementation for User Story 2

- [x] T017 [US2] Implement getSession() function to verify existing session in frontend/lib/auth/utils.ts
- [x] T018 [US2] Add retry logic with 500ms delay if initial session check fails in frontend/lib/auth/utils.ts
- [x] T019 [US2] Call getSession() on AuthProvider mount to restore session from cookie in frontend/components/auth/AuthProvider.tsx
- [x] T020 [US2] Update authentication state based on session verification response in frontend/components/auth/AuthProvider.tsx
- [x] T021 [US2] Handle session expiration gracefully by redirecting to signin without error in frontend/components/auth/AuthProvider.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - login works and sessions persist

---

## Phase 5: User Story 3 - Graceful Handling of Network Delays (Priority: P3)

**Goal**: Provide appropriate feedback during slow network conditions and handle delays gracefully

**Independent Test**: Enable network throttling (Slow 3G), attempt login, and verify successful authentication with appropriate loading feedback

### Implementation for User Story 3

- [x] T022 [US3] Add exponential backoff to polling logic in waitForSession() in frontend/lib/auth/session-wait.ts
- [x] T023 [US3] Improve loading indicator visibility during authentication in frontend/components/auth/AuthProvider.tsx
- [x] T024 [US3] Add clear error messages for network timeout scenarios in frontend/components/auth/AuthProvider.tsx
- [x] T025 [US3] Implement retry button for failed authentication attempts in frontend/app/(auth)/signin/page.tsx
- [x] T026 [US3] Add debug logging for session verification timing in frontend/lib/auth/logger.ts

**Checkpoint**: All user stories should now be independently functional with graceful error handling

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and deployment readiness

- [ ] T027 [P] Manual testing: Complete all 4 test scenarios from quickstart.md (USER ACTION REQUIRED)
- [ ] T028 [P] Manual testing: Test with network throttling (Slow 3G) to verify timeout handling (USER ACTION REQUIRED)
- [ ] T029 [P] Manual testing: Verify session persistence across page refresh (USER ACTION REQUIRED)
- [ ] T030 [P] Manual testing: Test invalid session handling (delete cookie and refresh) (USER ACTION REQUIRED)
- [ ] T031 Verify production environment variables are configured in Vercel and Hugging Face Spaces (USER ACTION REQUIRED)
- [x] T032 [P] Update authentication documentation with new timeout values in relevant docs
- [x] T033 [P] Add performance monitoring for session verification endpoint
- [ ] T034 Deploy backend changes to Hugging Face Spaces and verify endpoint responds (USER ACTION REQUIRED)
- [ ] T035 Deploy frontend changes to Vercel and verify end-to-end authentication flow (USER ACTION REQUIRED)
- [ ] T036 Monitor production logs for timeout errors and authentication success rate (USER ACTION REQUIRED)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Foundational - No dependencies on other stories
  - User Story 2 (P2): Can start after Foundational - Builds on US1 but independently testable
  - User Story 3 (P3): Can start after Foundational - Enhances US1 but independently testable
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Uses same session endpoint as US1, independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Enhances US1 timeout handling, independently testable

### Within Each User Story

**User Story 1 (Login Fix)**:
- T010, T011 can run in parallel (different functions in same file)
- T012, T013 must follow T010, T011 (modify same functions)
- T014, T015, T016 must follow T012, T013 (depend on session-wait.ts changes)

**User Story 2 (Session Persistence)**:
- T017, T018 can run together (same file, different function)
- T019, T020, T021 must follow T017, T018 (use getSession function)

**User Story 3 (Network Delays)**:
- T022 modifies session-wait.ts (depends on US1 completion)
- T023, T024, T025, T026 can run in parallel (different files)

### Parallel Opportunities

- **Phase 1 Setup**: All tasks (T001-T004) marked [P] can run in parallel
- **Phase 2 Foundational**: T005-T008 are sequential (same file), T009 can run in parallel
- **Phase 3 User Story 1**: T010, T011 can run in parallel
- **Phase 6 Polish**: T027-T030, T032, T033 marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch parallel tasks for session-wait.ts:
Task T010: "Replace cookie detection with API-based session check"
Task T011: "Implement defaultCheckSession() function"

# Then sequential tasks for same file:
Task T012: "Increase maxWait timeout to 3000ms"
Task T013: "Update polling interval to 50ms"

# Then parallel tasks for AuthProvider.tsx:
Task T014: "Update AuthProvider to use new timeout"
Task T015: "Add loading state management"
Task T016: "Update error messages"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (verify environment)
2. Complete Phase 2: Foundational (implement backend session endpoint) - CRITICAL
3. Complete Phase 3: User Story 1 (fix login timeout)
4. **STOP and VALIDATE**: Test login flow independently using quickstart.md
5. Deploy to production if ready

**MVP Scope**: After Phase 3, users can successfully log in without timeout errors. This is the minimum viable fix.

### Incremental Delivery

1. **Foundation**: Complete Setup + Foundational → Backend session endpoint ready
2. **MVP (US1)**: Add User Story 1 → Test login flow → Deploy (Core fix complete!)
3. **Enhancement (US2)**: Add User Story 2 → Test session persistence → Deploy
4. **Polish (US3)**: Add User Story 3 → Test network delays → Deploy
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. **Together**: Complete Setup + Foundational (T001-T009)
2. **Once Foundational is done**:
   - Developer A: User Story 1 (T010-T016) - Core login fix
   - Developer B: User Story 2 (T017-T021) - Session persistence
   - Developer C: User Story 3 (T022-T026) - Network handling
3. Stories complete and integrate independently

**Recommended**: Implement sequentially (US1 → US2 → US3) for single developer to ensure each story is fully tested before moving to next.

---

## Notes

- **[P] tasks**: Different files or independent functions, no dependencies
- **[Story] label**: Maps task to specific user story for traceability
- **No database changes**: This is a bug fix that only modifies authentication flow logic
- **HttpOnly cookies**: Frontend cannot read cookies directly - must use API endpoint
- **Timeout values**: Increased from 1000ms to 3000ms to accommodate bcrypt operations (~2s)
- **Testing approach**: Manual testing using quickstart.md guide (no automated tests requested)
- **Deployment order**: Backend first (session endpoint), then frontend (session verification)
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Verify production environment variables before deployment

---

## Success Metrics (from spec.md)

After implementation, verify:

- ✅ 95% of login attempts complete within 5 seconds without timeout errors
- ✅ Zero "Session could not be established" errors during normal flows
- ✅ 100% session persistence across page refreshes
- ✅ Authentication timeout errors reduced to zero for users with <3s latency
- ✅ Average authentication time under 3 seconds
