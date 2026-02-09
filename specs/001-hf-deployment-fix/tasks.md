# Tasks: Fix Hugging Face Space Deployment Authentication

**Input**: Design documents from `/specs/001-hf-deployment-fix/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No tests requested in feature specification - this is infrastructure work (CI/CD workflow)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Target File**: `.github/workflows/deploy-backend.yml` (GitHub Actions workflow)
- **Backend Directory**: `backend/` (source code to be deployed)
- **Documentation**: `specs/001-hf-deployment-fix/` (planning artifacts)

---

## Phase 1: Setup (Prerequisites Verification)

**Purpose**: Verify all prerequisites are in place before workflow modification

- [X] T001 Verify HF_TOKEN secret exists in GitHub repository secrets at Settings → Secrets → Actions
- [X] T002 Verify Hugging Face Space repository exists and is accessible at the configured URL
- [X] T003 Verify backend directory exists in repository with deployable code
- [X] T004 Verify current workflow file exists at .github/workflows/deploy-backend.yml (or create if missing)

**Checkpoint**: All prerequisites verified - ready to implement deployment workflow

---

## Phase 2: User Story 1 - Automated Deployment Trigger (Priority: P1) 🎯 MVP

**Goal**: Enable automatic deployment of backend to Hugging Face Space when code is pushed to main branch, with CLI installation, authentication, file sync, and git push working correctly.

**Independent Test**: Push a commit to main branch and verify GitHub Actions workflow completes successfully with backend deployed to Hugging Face Space (all steps green, Space shows updated code).

### Implementation for User Story 1

- [X] T005 [US1] Add workflow trigger configuration in .github/workflows/deploy-backend.yml (on push to main, paths: backend/**)
- [X] T006 [US1] Add checkout step using actions/checkout@v4 in .github/workflows/deploy-backend.yml
- [X] T007 [US1] Add Python setup step using actions/setup-python@v5 with version 3.11 in .github/workflows/deploy-backend.yml
- [X] T008 [US1] Add Hugging Face CLI installation step (pip install huggingface_hub) in .github/workflows/deploy-backend.yml
- [X] T009 [US1] Add CLI installation verification step (huggingface-cli --version) in .github/workflows/deploy-backend.yml
- [X] T010 [US1] Add authentication step (huggingface-cli login --token ${{ secrets.HF_TOKEN }}) in .github/workflows/deploy-backend.yml
- [X] T011 [US1] Add authentication verification step (huggingface-cli whoami) in .github/workflows/deploy-backend.yml
- [X] T012 [US1] Add Space repository clone step (git clone with HTTPS URL) in .github/workflows/deploy-backend.yml
- [X] T013 [US1] Add file sync step (rsync -av --delete --exclude='.git' backend/ hf-space/) in .github/workflows/deploy-backend.yml
- [X] T014 [US1] Add git user configuration step (git config user.name and user.email) in .github/workflows/deploy-backend.yml
- [X] T015 [US1] Add git commit step (git add . && git commit with descriptive message) in .github/workflows/deploy-backend.yml
- [X] T016 [US1] Add git push step (git push origin main) in .github/workflows/deploy-backend.yml
- [X] T017 [US1] Add environment variables section (HF_SPACE_REPO, BACKEND_DIR, PYTHON_VERSION) in .github/workflows/deploy-backend.yml
- [X] T018 [US1] Configure workflow permissions (contents: read) in .github/workflows/deploy-backend.yml

**Checkpoint**: At this point, User Story 1 should be fully functional - pushing to main triggers deployment, all steps complete successfully, Space shows updated backend code

---

## Phase 3: User Story 2 - Deployment Status Visibility (Priority: P2)

**Goal**: Add clear status messages and error reporting to each deployment step so developers can easily diagnose issues from GitHub Actions logs.

**Independent Test**: Trigger a deployment (both successful and failed scenarios) and verify GitHub Actions logs show clear status messages for each step with descriptive error messages on failure.

### Implementation for User Story 2

- [X] T019 [US2] Add step names with clear descriptions for each workflow step in .github/workflows/deploy-backend.yml
- [X] T020 [US2] Add echo statements for CLI installation progress in .github/workflows/deploy-backend.yml
- [X] T021 [US2] Add echo statements for authentication progress in .github/workflows/deploy-backend.yml
- [X] T022 [US2] Add echo statements for file sync progress (files being copied) in .github/workflows/deploy-backend.yml
- [X] T023 [US2] Add echo statements for git operations progress (commit hash, push status) in .github/workflows/deploy-backend.yml
- [X] T024 [US2] Add deployment success summary with Space URL and commit hash in .github/workflows/deploy-backend.yml
- [X] T025 [US2] Add error handling with descriptive messages for CLI installation failures in .github/workflows/deploy-backend.yml
- [X] T026 [US2] Add error handling with descriptive messages for authentication failures in .github/workflows/deploy-backend.yml
- [X] T027 [US2] Add error handling with descriptive messages for file sync failures in .github/workflows/deploy-backend.yml
- [X] T028 [US2] Add error handling with descriptive messages for git push failures in .github/workflows/deploy-backend.yml

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - deployment succeeds with clear logging, failures show specific error messages

---

## Phase 4: User Story 3 - Token Permission Validation (Priority: P3)

**Goal**: Add pre-deployment validation to verify HF_TOKEN has correct permissions before attempting deployment, preventing authentication failures with clear error messages.

**Independent Test**: Run workflow with valid token (succeeds), then with invalid/insufficient token (fails with clear permission error before attempting deployment).

### Implementation for User Story 3

- [X] T029 [US3] Add token validation step before authentication (check token format starts with hf_) in .github/workflows/deploy-backend.yml
- [X] T030 [US3] Add token permission check step (verify write access to Space) in .github/workflows/deploy-backend.yml
- [X] T031 [US3] Add clear error message for missing HF_TOKEN secret in .github/workflows/deploy-backend.yml
- [X] T032 [US3] Add clear error message for invalid token format in .github/workflows/deploy-backend.yml
- [X] T033 [US3] Add clear error message for insufficient token permissions in .github/workflows/deploy-backend.yml

**Checkpoint**: All user stories should now be independently functional - deployment works, logging is clear, token validation prevents auth failures

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements, optimizations, and validation

- [X] T034 [P] Add pip package caching using actions/cache@v3 for faster CLI installation in .github/workflows/deploy-backend.yml
- [X] T035 [P] Add shallow clone optimization (--depth 1) for Space repository in .github/workflows/deploy-backend.yml
- [X] T036 [P] Add workflow_dispatch trigger for manual deployment testing in .github/workflows/deploy-backend.yml
- [X] T037 [P] Update quickstart.md with actual workflow configuration and troubleshooting based on implementation
- [ ] T038 Test complete workflow end-to-end with manual trigger (workflow_dispatch)
- [ ] T039 Test workflow with actual code push to main branch
- [ ] T040 Verify workflow completes within 5-minute performance target
- [ ] T041 Verify Space rebuilds automatically after successful push
- [ ] T042 Test failure scenarios (invalid token, network timeout, missing backend directory)
- [ ] T043 Verify error messages are clear and actionable for each failure mode
- [X] T044 Document actual HF_SPACE_REPO URL in workflow file or repository README
- [X] T045 Create ADR for HTTPS Token Authentication decision using /sp.adr command

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **User Story 1 (Phase 2)**: Depends on Setup completion - BLOCKS all other user stories
- **User Story 2 (Phase 3)**: Depends on User Story 1 completion (adds logging to existing steps)
- **User Story 3 (Phase 4)**: Depends on User Story 1 completion (adds validation before existing steps)
- **Polish (Phase 5)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup - No dependencies on other stories (MVP)
- **User Story 2 (P2)**: Depends on User Story 1 (enhances existing workflow steps with logging)
- **User Story 3 (P3)**: Depends on User Story 1 (adds validation before existing workflow)

**Note**: US2 and US3 both enhance US1, so US1 must be complete first. However, US2 and US3 could theoretically be implemented in parallel after US1 is done, but since they modify the same file, sequential implementation is safer.

### Within Each User Story

**User Story 1 (Sequential - same file)**:
- Workflow structure (trigger, checkout, Python setup) → CLI installation → Authentication → File sync → Git operations → Environment variables
- Each step builds on the previous step in the workflow file

**User Story 2 (Sequential - enhances US1 steps)**:
- Add logging to each existing step in order
- Add error handling to each existing step in order

**User Story 3 (Sequential - adds validation before US1)**:
- Add validation steps before authentication
- Add error messages for validation failures

### Parallel Opportunities

- **Setup Phase**: T001, T002, T003 can be verified in parallel (different systems)
- **Polish Phase**: T034, T035, T036, T037 can be implemented in parallel (independent optimizations)
- **Testing Phase**: T038-T043 should be run sequentially (each test depends on previous fixes)

**Limited Parallelism**: Since all implementation tasks modify the same file (.github/workflows/deploy-backend.yml), most tasks must be sequential to avoid merge conflicts.

---

## Parallel Example: Setup Phase

```bash
# Verify all prerequisites in parallel:
Task: "Verify HF_TOKEN secret exists in GitHub repository secrets"
Task: "Verify Hugging Face Space repository exists and is accessible"
Task: "Verify backend directory exists in repository"
```

## Parallel Example: Polish Phase

```bash
# Add optimizations in parallel (different sections of workflow):
Task: "Add pip package caching using actions/cache@v3"
Task: "Add shallow clone optimization (--depth 1)"
Task: "Add workflow_dispatch trigger for manual testing"
Task: "Update quickstart.md with actual configuration"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (verify prerequisites)
2. Complete Phase 2: User Story 1 (core deployment workflow)
3. **STOP and VALIDATE**: Test User Story 1 independently
   - Push test commit to main branch
   - Verify workflow completes successfully
   - Verify Space shows updated backend code
   - Verify workflow completes in under 5 minutes
4. Deploy/demo if ready (MVP complete!)

### Incremental Delivery

1. Complete Setup → Prerequisites verified
2. Add User Story 1 → Test independently → Deploy/Demo (MVP - core deployment works!)
3. Add User Story 2 → Test independently → Deploy/Demo (enhanced logging and error reporting)
4. Add User Story 3 → Test independently → Deploy/Demo (token validation prevents auth failures)
5. Add Polish → Final optimizations and documentation
6. Each story adds value without breaking previous stories

### Sequential Implementation (Recommended)

Since all tasks modify the same workflow file, sequential implementation is recommended:

1. Complete Setup phase (verify prerequisites)
2. Implement User Story 1 completely (T005-T018)
3. Test User Story 1 thoroughly
4. Implement User Story 2 completely (T019-T028)
5. Test User Story 2 thoroughly
6. Implement User Story 3 completely (T029-T033)
7. Test User Story 3 thoroughly
8. Add Polish improvements (T034-T045)

---

## Task Summary

**Total Tasks**: 45 tasks across 5 phases

**Task Breakdown by Phase**:
- Phase 1 (Setup): 4 tasks
- Phase 2 (User Story 1 - MVP): 14 tasks
- Phase 3 (User Story 2): 10 tasks
- Phase 4 (User Story 3): 5 tasks
- Phase 5 (Polish): 12 tasks

**Task Breakdown by User Story**:
- Setup: 4 tasks (prerequisites)
- US1 (P1): 14 tasks (core deployment workflow)
- US2 (P2): 10 tasks (logging and error reporting)
- US3 (P3): 5 tasks (token validation)
- Polish: 12 tasks (optimizations and documentation)

**Parallel Opportunities**: 7 tasks marked [P] (Setup verification, Polish optimizations)

**Independent Test Criteria**:
- US1: Push to main → workflow succeeds → Space updated (MVP complete)
- US2: Trigger deployment → logs show clear status messages → errors are descriptive
- US3: Run with invalid token → clear permission error before deployment attempt

**Suggested MVP Scope**: Phase 1 (Setup) + Phase 2 (User Story 1) = 18 tasks

**Estimated Implementation Time**:
- MVP (US1): 2-3 hours (core workflow implementation)
- US2: 1-2 hours (add logging and error handling)
- US3: 1 hour (add token validation)
- Polish: 1-2 hours (optimizations and testing)
- **Total**: 5-8 hours for complete implementation

---

## Notes

- All tasks modify single file: `.github/workflows/deploy-backend.yml`
- Sequential implementation recommended (same file, avoid conflicts)
- No tests requested in spec (infrastructure work, not application code)
- Workflow validation happens through GitHub Actions execution logs
- Each user story checkpoint includes independent testing criteria
- MVP (User Story 1) delivers core value: automated deployment works
- US2 and US3 are enhancements that improve observability and error prevention
- Commit after each logical group of tasks (e.g., after each user story phase)
- Stop at any checkpoint to validate story independently before proceeding
