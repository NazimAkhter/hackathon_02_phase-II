---
id: 0003
title: session-expiry-fix-tasks-breakdown
stage: tasks
date: 2026-01-22
surface: agent
model: claude-sonnet-4-5-20250929
feature: 005-fix-session-expiry
branch: 005-fix-session-expiry
user: system
command: /sp.tasks
labels: ["task-breakdown", "implementation", "user-stories", "bug-fix", "authentication"]
links:
  spec: specs/005-fix-session-expiry/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/005-fix-session-expiry/tasks.md
tests:
  - Task format validation: All 24 tasks follow checklist format
  - User story mapping: 4 user stories mapped to task phases
  - Parallel opportunities: 8 parallelizable tasks identified
  - MVP scope: Phase 3 (User Story 1) designated
---

## Prompt

User input: (empty - no additional instructions provided)

Default /sp.tasks workflow executed:
1. Load spec.md (4 user stories with priorities P1, P1, P2, P3)
2. Load plan.md (technical context, file structure, constraints)
3. Load research.md (5 configuration audit areas, debugging strategy)
4. Load contracts/session-validation-contract.md (function specifications)
5. Load quickstart.md (10 test procedures)
6. Generate tasks organized by user story per SDD methodology

## Response snapshot

Created comprehensive task breakdown for session expiry bug fix with 24 atomic tasks organized into 7 phases:

**Phase Structure**:
1. **Phase 1: Setup & Environment Audit** (4 tasks)
   - Environment variable verification (BETTER_AUTH_SECRET)
   - Cookie configuration documentation
   - Debug logging utility creation
   - Browser compatibility check

2. **Phase 2: Foundational Fixes** (4 tasks - blocking prerequisites)
   - validateSession() function (checks exp claim)
   - waitForSession() polling function (1s max, 50ms intervals)
   - Enhanced getSession() with retry logic (500ms delay)
   - Enhanced getTokenFromCookie() with debug logging
   - **Parallel**: T005, T006, T008 can run simultaneously

3. **Phase 3: User Story 1 - Signin to Dashboard (P1)** (5 tasks - MVP)
   - Update signin handler with waitForSession() before navigation
   - Add session confirmation logging
   - Dashboard mount session validation with enhanced logging
   - Loading state during session validation
   - Update useAuth hook to use enhanced getSession()
   - **Parallel**: T009 + T011 + T013 can run simultaneously
   - **Independent Test**: Signin → dashboard works without "session expired" error

4. **Phase 4: User Story 2 - Page Refresh Persistence (P1)** (4 tasks)
   - Session check on dashboard layout mount
   - Session expiry detection (exp < now check)
   - clearSession() function to remove expired cookies
   - Dashboard expired session handling
   - **Parallel**: T015 + T016 can run simultaneously
   - **Independent Test**: Page refresh preserves session

5. **Phase 5: User Story 3 - Protected Routes (P2)** (4 tasks)
   - Middleware update with enhanced getSession()
   - Session validation timing fix in middleware
   - Error message query parameters implementation
   - Session expiry redirect logic
   - **Independent Test**: Protected routes work correctly

6. **Phase 6: User Story 4 - Cross-Navigation (P3)** (2 tasks)
   - Session persistence logging across navigation
   - Session validation on page transitions
   - **Independent Test**: Complex navigation preserves session

7. **Phase 7: Polish** (1 task)
   - Comprehensive debug logging across all auth functions

**Task Breakdown Statistics**:
- Total tasks: 24
- Parallelizable tasks: 8 (marked with [P])
- User story tasks: 15 (marked with [US1], [US2], [US3], [US4])
- Setup/foundational tasks: 8
- Polish tasks: 1

**Files Modified**: 11 frontend files
**Files Verified**: 2 environment files (frontend + backend .env)

**Dependency Graph**:
```
Setup (Phase 1)
  ↓
Foundational (Phase 2)
  ↓
US1: Signin Flow (Phase 3) ← MVP
  ↓
US2: Page Refresh (Phase 4) ← Can parallel with US3
  ↓
US3: Protected Routes (Phase 5)
  ↓
US4: Cross-Navigation (Phase 6)
  ↓
Polish (Phase 7)
```

**MVP Scope**: Phase 3 (User Story 1) - Fixes the critical signin → dashboard flow

**Testing Strategy**:
- Manual tests from quickstart guide mapped to each phase
- Independent test criteria defined for each user story
- Validation checklist with 8 success criteria

**Format Compliance**:
✅ All 24 tasks follow strict checklist format:
- [x] Checkbox: `- [ ]`
- [x] Task ID: T001-T024 sequential
- [x] [P] marker: 8 parallelizable tasks marked
- [x] [Story] label: 15 user story tasks labeled [US1]-[US4]
- [x] Description: Clear action with file path
- [x] Example: `- [ ] T009 [US1] Update signin success handler in /frontend/app/signin/page.tsx to call waitForSession() before navigation`

## Outcome

- ✅ Impact: Complete task breakdown ready for implementation, organized by user story for independent delivery and testing
- 🧪 Tests: 10 quickstart guide tests mapped to phases, independent test criteria for each of 4 user stories
- 📁 Files: 1 file created (tasks.md with 24 tasks across 7 phases)
- 🔁 Next prompts: Begin implementation using specialized agents - `/sp.implement` or invoke auth-security-architect and nextjs-ui-builder agents for task execution
- 🧠 Reflection: Successfully organized bug fix as user stories despite being a technical fix. Key insight: Even bug fixes can be decomposed into user-facing value increments (US1: signin works, US2: refresh works, US3: routes protected, US4: navigation stable). This enables iterative delivery and early validation.

## Evaluation notes (flywheel)

- Failure modes observed: None - task generation successful. All tasks follow required checklist format.
- Graders run and results (PASS/FAIL): Format Validation - PASS (24/24 tasks correct format), User Story Mapping - PASS (4 stories → 7 phases), Dependency Graph - PASS (clear completion order), Parallel Opportunities - PASS (8 tasks identified), MVP Scope - PASS (Phase 3 designated)
- Prompt variant (if applicable): Standard /sp.tasks workflow with user story-based organization for bug fix
- Next experiment (smallest change to try): For future bug fixes, consider adding "smoke test" tasks between phases to validate each increment before proceeding (fail-fast approach)
