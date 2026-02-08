---
description: "Implementation tasks for Authentication & User Management System"
---

# Tasks: Authentication & User Management System

**Input**: Design documents from `/specs/001-auth-user-management/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Tests are OPTIONAL - only included if explicitly requested. This specification does NOT request tests.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `frontend/src/`, `frontend/tests/`
- Paths shown below use frontend structure per plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create frontend directory structure per plan.md (src/app, src/components, src/lib, src/types, tests/)
- [X] T002 Initialize Next.js 16+ project with TypeScript and App Router in frontend/
- [X] T003 [P] Install Better Auth dependencies (better-auth, bcryptjs, jsonwebtoken, zod) in frontend/package.json
- [X] T004 [P] Configure TypeScript compiler options for Next.js 16+ in frontend/tsconfig.json
- [X] T005 [P] Create .env.example with BETTER_AUTH_SECRET and NODE_ENV template in frontend/
- [X] T006 [P] Create .env.local with generated BETTER_AUTH_SECRET (use openssl rand -base64 64) in frontend/
- [X] T007 [P] Add .env.local to .gitignore to prevent secrets from being committed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T008 Create environment variable validation schema using Zod in frontend/src/lib/env.ts
- [X] T009 [P] Define TypeScript types for User, JWT, AuthSession in frontend/src/types/auth.ts
- [X] T010 [P] Configure Better Auth with JWT plugin in frontend/src/lib/auth/better-auth.ts
- [X] T011 [P] Implement email validation helper (RFC 5322 regex) in frontend/src/lib/auth/validation.ts
- [X] T012 [P] Implement password validation helper (min 8 chars, letters+numbers) in frontend/src/lib/auth/validation.ts
- [X] T013 [P] Create rate limiting middleware (5 attempts per 15 min) in frontend/src/lib/auth/rate-limit.ts
- [X] T014 [P] Create JWT verification utility for Spec 2 export in frontend/src/lib/auth/jwt-utils.ts
- [X] T015 [P] Create AuthErrorDisplay component for error messages in frontend/src/components/auth/AuthErrorDisplay.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - New User Account Creation (Priority: P1) 🎯 MVP

**Goal**: Users can create accounts with email/password and receive JWT token in httpOnly cookie

**Independent Test**: Submit email/password via signup form, verify JWT token in httpOnly cookie contains user_id and email with 7-day expiration

### Implementation for User Story 1

- [X] T016 [P] [US1] Create SignupForm component with email/password inputs in frontend/components/auth/SignupForm.tsx
- [X] T017 [P] [US1] Create signup page UI using SignupForm component in frontend/app/(auth)/signup/page.tsx
- [X] T018 [US1] Implement POST /api/auth/signup route handler in frontend/app/api/auth/signup/route.ts
- [X] T019 [US1] Add email validation to signup route (RFC 5322 format check) in frontend/app/api/auth/signup/route.ts
- [X] T020 [US1] Add password validation to signup route (min 8 chars check) in frontend/app/api/auth/signup/route.ts
- [X] T021 [US1] Integrate Better Auth JWT token generation in signup route in frontend/app/api/auth/signup/route.ts
- [X] T022 [US1] Configure httpOnly cookie with Secure and SameSite flags in signup route in frontend/app/api/auth/signup/route.ts
- [X] T023 [US1] Return 201 Created with user response (exclude password_hash) in frontend/app/api/auth/signup/route.ts
- [X] T024 [US1] Add error handling for duplicate email (409 Conflict) in frontend/app/api/auth/signup/route.ts
- [X] T025 [US1] Add error handling for validation failures (400 Bad Request) in frontend/app/api/auth/signup/route.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Returning User Authentication (Priority: P1)

**Goal**: Existing users can sign in with credentials and receive fresh JWT token

**Independent Test**: Create user via signup, then use credentials to signin, verify fresh JWT token with 7-day expiration

### Implementation for User Story 2

- [X] T026 [P] [US2] Create SigninForm component with email/password inputs in frontend/components/auth/SigninForm.tsx
- [X] T027 [P] [US2] Create signin page UI using SigninForm component in frontend/app/(auth)/signin/page.tsx
- [X] T028 [US2] Implement POST /api/auth/signin route handler in frontend/app/api/auth/signin/route.ts
- [X] T029 [US2] Add email/password validation to signin route in frontend/app/api/auth/signin/route.ts
- [X] T030 [US2] Integrate Better Auth authentication (verify password hash) in signin route in frontend/app/api/auth/signin/route.ts
- [X] T031 [US2] Apply rate limiting middleware to signin route (5 attempts per 15 min) in frontend/app/api/auth/signin/route.ts
- [X] T032 [US2] Generate fresh JWT token with 7-day expiration in signin route in frontend/app/api/auth/signin/route.ts
- [X] T033 [US2] Set httpOnly cookie with token in frontend/app/api/auth/signin/route.ts
- [X] T034 [US2] Return 200 OK with user response and lastSignInAt timestamp in frontend/app/api/auth/signin/route.ts
- [X] T035 [US2] Add generic error message for invalid credentials (401 Unauthorized "Invalid email or password") in frontend/app/api/auth/signin/route.ts
- [X] T036 [US2] Add rate limit exceeded error (429 Too Many Requests) in frontend/app/api/auth/signin/route.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Token-Based API Authorization (Priority: P2)

**Goal**: Export JWT verification utilities for FastAPI backend integration (Spec 2)

**Independent Test**: Decode JWT token using exported utilities, verify userId and email extraction, confirm signature validation with BETTER_AUTH_SECRET

### Implementation for User Story 3

- [X] T037 [P] [US3] Document JWT payload structure (userId, email, iat, exp) in frontend/lib/auth/jwt-utils.ts
- [X] T038 [P] [US3] Export JWT token decoding example for FastAPI in frontend/lib/auth/jwt-utils.ts
- [X] T039 [P] [US3] Document BETTER_AUTH_SECRET requirement for backend in frontend/README.md
- [X] T040 [P] [US3] Create example FastAPI JWT verification code snippet in frontend/docs/backend-integration.md
- [X] T041 [P] [US3] Document Cookie extraction for Authorization header in frontend/docs/backend-integration.md

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T042 [P] Add inline code comments for Better Auth configuration in frontend/lib/auth/better-auth.ts
- [X] T043 [P] Add JSDoc comments for validation helpers in frontend/lib/auth/validation.ts
- [X] T044 [P] Update frontend/README.md with setup instructions from quickstart.md
- [X] T045 [P] Add error logging for authentication events (signup, signin, failures) in signup/signin routes
- [X] T046 [P] Create frontend/docs/security.md documenting httpOnly, Secure, SameSite cookie flags
- [X] T047 [P] Verify environment variable validation fails gracefully with clear error messages in frontend/lib/env.ts
- [X] T048 Run manual validation against quickstart.md instructions (signup flow, signin flow, cookie verification)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P1 → P2)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on User Story 1 (both are independent auth flows)
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Documentation task, no dependencies on US1/US2

### Within Each User Story

- SignupForm and signup page can be built in parallel
- SigninForm and signin page can be built in parallel
- Route handlers must be implemented after form components exist
- Error handling added incrementally to route handlers
- Documentation tasks can run in parallel with implementation

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T003, T004, T005, T006, T007)
- All Foundational tasks marked [P] can run in parallel (T009-T015 within Phase 2)
- Once Foundational phase completes:
  - User Story 1 (T016-T025) can run in parallel with User Story 2 (T026-T036)
  - User Story 3 (T037-T041) can run in parallel with US1 and US2
- All Polish tasks marked [P] can run in parallel (T042-T047)

---

## Parallel Example: User Story 1

```bash
# After Foundational phase complete, launch in parallel:
Task: "Create SignupForm component in frontend/src/components/auth/SignupForm.tsx" (T016)
Task: "Create signup page UI in frontend/src/app/(auth)/signup/page.tsx" (T017)

# Then sequentially:
Task: "Implement signup route handler" (T018-T025)
```

---

## Parallel Example: All User Stories

```bash
# After Foundational phase complete, launch all 3 user stories in parallel:
Team Member A: Implement User Story 1 (T016-T025) - Signup flow
Team Member B: Implement User Story 2 (T026-T036) - Signin flow
Team Member C: Implement User Story 3 (T037-T041) - Documentation
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T007)
2. Complete Phase 2: Foundational (T008-T015) - CRITICAL, blocks all stories
3. Complete Phase 3: User Story 1 (T016-T025) - Signup flow
4. **STOP and VALIDATE**: Test signup independently (submit form, verify JWT cookie)
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (T001-T015)
2. Add User Story 1 → Test independently → Deploy/Demo (MVP = Signup!)
3. Add User Story 2 → Test independently → Deploy/Demo (Signup + Signin!)
4. Add User Story 3 → Test independently → Deploy/Demo (Complete auth system!)
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T015)
2. Once Foundational is done:
   - Developer A: User Story 1 (T016-T025)
   - Developer B: User Story 2 (T026-T036)
   - Developer C: User Story 3 (T037-T041)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- No tests included (not requested in specification)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Task Summary

- **Total Tasks**: 48
- **Setup (Phase 1)**: 7 tasks
- **Foundational (Phase 2)**: 8 tasks (BLOCKING)
- **User Story 1 (P1)**: 10 tasks
- **User Story 2 (P1)**: 11 tasks
- **User Story 3 (P2)**: 5 tasks
- **Polish (Phase 6)**: 7 tasks

**Parallel Opportunities**: 29 tasks marked [P] can run in parallel within their phase

**Independent Testing**:
- US1: Submit signup form → Verify JWT cookie with user_id
- US2: Submit signin form → Verify fresh JWT cookie with 7-day expiration
- US3: Decode JWT token → Verify userId extraction and signature validation

**Suggested MVP Scope**: Complete Phase 1 + Phase 2 + Phase 3 (User Story 1 only) = Tasks T001-T025 (25 tasks)
