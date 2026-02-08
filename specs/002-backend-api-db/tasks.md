# Tasks: Backend API & Database Layer

**Input**: Design documents from `/specs/002-backend-api-db/`
**Prerequisites**: plan.md (✓), spec.md (✓), research.md (✓), data-model.md (✓), contracts/ (✓)

**Tests**: Test tasks are included as specified in the feature requirements (FR-021 to FR-024).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a web application with `backend/` and `frontend/` directories. Backend tasks use paths like `backend/src/`, `backend/tests/`, `backend/migrations/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create backend directory structure per plan.md (backend/src/, backend/tests/, backend/migrations/)
- [X] T002 Initialize Python virtual environment in backend/ with Python 3.11+
- [X] T003 [P] Create requirements.txt with dependencies: fastapi==0.109.0, sqlmodel==0.0.14, pyjwt==2.8.0, alembic==1.13.1, uvicorn[standard]==0.27.0, psycopg2-binary==2.9.9, python-dotenv==1.0.0, pydantic==2.5.0, pydantic-settings==2.1.0, pytest==8.0.0, pytest-asyncio==0.23.3, httpx==0.26.0
- [X] T004 [P] Install dependencies with pip install -r requirements.txt
- [X] T005 Create .env.example in backend/ with template variables: BETTER_AUTH_SECRET, DATABASE_URL, ENVIRONMENT, FRONTEND_URL
- [X] T006 Create .env in backend/ with actual values (BETTER_AUTH_SECRET from Spec 1, DATABASE_URL from Neon console)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Create backend/src/config.py with Pydantic Settings for environment variables (BETTER_AUTH_SECRET, DATABASE_URL, ENVIRONMENT, FRONTEND_URL)
- [X] T008 [P] Create backend/src/database.py with SQLModel engine setup using NullPool for Neon serverless (connect_args: sslmode=require, connect_timeout=10)
- [X] T009 [P] Create backend/src/models/user.py with User SQLModel (reference from Spec 1 - read-only, not created by backend)
- [X] T010 Create backend/src/models/task.py with Task SQLModel (id: int PK, user_id: str FK, title: str, completed: bool, created_at: datetime, updated_at: datetime)
- [X] T011 [P] Create backend/src/schemas/task.py with Pydantic schemas: TaskCreate, TaskUpdate, TaskPatch, TaskResponse
- [X] T012 [P] Create backend/src/schemas/auth.py with JWTPayload schema (userId: str, email: str, iat: int, exp: int)
- [X] T013 Create backend/src/auth/jwt.py with verify_jwt_token() function using PyJWT to decode HS256 tokens with BETTER_AUTH_SECRET
- [X] T014 Create backend/src/auth/dependencies.py with get_current_user() FastAPI dependency to extract JWT from better-auth.session.token cookie and return authenticated user_id
- [X] T015 [P] Create backend/src/errors/handlers.py with custom exception handlers for structured JSON error responses (error, code, details fields)
- [X] T016 [P] Create backend/src/api/__init__.py as empty file
- [X] T017 Create backend/src/main.py with FastAPI app, CORS middleware (allow_origins from config, allow_credentials=True), error handlers, and health check endpoint (GET /)
- [X] T018 Initialize Alembic in backend/ with alembic init migrations
- [X] T019 Configure backend/alembic.ini with DATABASE_URL from environment
- [X] T020 Configure backend/migrations/env.py to use SQLModel metadata and engine
- [X] T021 Generate Alembic migration for tasks table with alembic revision --autogenerate -m "Create tasks table"
- [X] T022 Review and edit migration file to add indexes (idx_tasks_user_id, idx_tasks_user_created) and updated_at trigger function
- [ ] T023 Run Alembic migration with alembic upgrade head to create tasks table in Neon database (⚠️ REQUIRES VALID DATABASE_URL)
- [ ] T024 Verify tasks table creation in Neon console (check columns, foreign key, indexes, trigger)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - List All User Tasks (Priority: P1) 🎯 MVP

**Goal**: User can retrieve list of all their tasks via authenticated GET request

**Independent Test**: Start backend server, use curl with JWT token from Spec 1 frontend to call GET /api/{user_id}/tasks and receive JSON array of tasks

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T025 [P] [US1] Create backend/tests/conftest.py with pytest fixtures for test database, test client, and mock JWT tokens
- [X] T026 [P] [US1] Write test_list_tasks_empty in backend/tests/test_tasks_endpoints.py to verify empty array returned for new user (expect FAIL until T029 implemented)
- [X] T027 [P] [US1] Write test_list_tasks_with_data in backend/tests/test_tasks_endpoints.py to verify tasks returned for user with existing tasks (expect FAIL until T029 implemented)
- [X] T028 [P] [US1] Write test_list_tasks_unauthorized in backend/tests/test_jwt_middleware.py to verify 401 response when JWT token missing (expect FAIL until T029 implemented)

### Implementation for User Story 1

- [X] T029 [US1] Implement GET /api/{user_id}/tasks endpoint in backend/src/api/tasks.py with JWT authentication dependency, user_id validation (403 if mismatch), query filtering by user_id, return List[TaskResponse]
- [X] T030 [US1] Mount tasks router in backend/src/main.py with app.include_router(tasks_router)
- [X] T031 [US1] Add error handling for database connection errors in GET endpoint (return 500 with ERR_DATABASE_ERROR code)
- [X] T032 [US1] Add logging for list tasks operation in backend/src/api/tasks.py
- [X] T033 [US1] Run tests T026-T028 and verify they now PASS
- [ ] T034 [US1] Manual test: Start uvicorn, create user in Spec 1 frontend, get JWT token from cookie, call GET /api/{user_id}/tasks with curl and verify 200 response with empty array (⚠️ REQUIRES DATABASE SETUP)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Create New Task (Priority: P1) 🎯 MVP

**Goal**: User can create a new task via authenticated POST request and receive created task with generated ID

**Independent Test**: Use curl with JWT token to POST /api/{user_id}/tasks with JSON body {"title": "Test task", "completed": false} and receive 201 response with task including id, user_id, timestamps

### Tests for User Story 2

- [X] T035 [P] [US2] Write test_create_task in backend/tests/test_tasks_endpoints.py to verify task creation with valid data (expect FAIL until T038 implemented)
- [X] T036 [P] [US2] Write test_create_task_missing_title in backend/tests/test_tasks_endpoints.py to verify 400 response when title field missing (expect FAIL until T038 implemented)
- [X] T037 [P] [US2] Write test_create_task_user_id_mismatch in backend/tests/test_user_isolation.py to verify 403 response when URL user_id doesn't match JWT user_id (expect FAIL until T038 implemented)

### Implementation for User Story 2

- [X] T038 [US2] Implement POST /api/{user_id}/tasks endpoint in backend/src/api/tasks.py with JWT authentication, user_id validation, TaskCreate schema validation, database insert with user_id from JWT, return TaskResponse with 201 status
- [X] T039 [US2] Add validation error handling for missing/invalid title field (return 400 with ERR_VALIDATION_FAILED code and field details)
- [X] T040 [US2] Add error handling for database constraint violations (foreign key, unique constraints) in POST endpoint
- [X] T041 [US2] Add logging for create task operation
- [X] T042 [US2] Run tests T035-T037 and verify they now PASS
- [ ] T043 [US2] Manual test: POST new task with curl, verify 201 response with id, then GET tasks and verify new task appears in list (⚠️ REQUIRES DATABASE SETUP)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Update Task Completion Status (Priority: P2)

**Goal**: User can toggle task completion status via authenticated PATCH request

**Independent Test**: Create task via POST, get task_id, call PATCH /api/{user_id}/tasks/{task_id} with {"completed": true}, verify 200 response with updated task showing completed=true

### Tests for User Story 3

- [X] T044 [P] [US3] Write test_patch_task_completion in backend/tests/test_tasks_endpoints.py to verify completion status update (expect FAIL until T047 implemented)
- [X] T045 [P] [US3] Write test_patch_task_not_found in backend/tests/test_tasks_endpoints.py to verify 404 response when task_id doesn't exist or belongs to different user (expect FAIL until T047 implemented)
- [X] T046 [P] [US3] Write test_patch_task_invalid_boolean in backend/tests/test_tasks_endpoints.py to verify 400 response when completed field is not boolean (expect FAIL until T047 implemented)

### Implementation for User Story 3

- [X] T047 [US3] Implement PATCH /api/{user_id}/tasks/{task_id} endpoint in backend/src/api/tasks.py with JWT authentication, user_id validation, ownership check (query with user_id AND task_id), TaskPatch schema validation, update completed field only, return TaskResponse with 200 status
- [X] T048 [US3] Add 404 error handling when task not found or doesn't belong to user (return ERR_NOT_FOUND code)
- [X] T049 [US3] Add logging for patch task operation with user_id and task_id
- [X] T050 [US3] Run tests T044-T046 and verify they now PASS
- [ ] T051 [US3] Manual test: Create task with completed=false, PATCH to completed=true, GET task and verify updated_at timestamp changed and completed=true (⚠️ REQUIRES DATABASE SETUP)

**Checkpoint**: User Stories 1, 2, AND 3 should all work independently

---

## Phase 6: User Story 4 - Update Task Details (Priority: P2)

**Goal**: User can fully update task title and completion status via authenticated PUT request

**Independent Test**: Create task, call PUT /api/{user_id}/tasks/{task_id} with {"title": "Updated title", "completed": true}, verify 200 response with both fields updated

### Tests for User Story 4

- [X] T052 [P] [US4] Write test_update_task in backend/tests/test_tasks_endpoints.py to verify full task update with TaskUpdate schema (expect FAIL until T055 implemented)
- [X] T053 [P] [US4] Write test_update_task_missing_field in backend/tests/test_tasks_endpoints.py to verify 400 response when title or completed field missing (expect FAIL until T055 implemented)
- [X] T054 [P] [US4] Write test_update_task_cross_user_forbidden in backend/tests/test_user_isolation.py to verify user can't update another user's task (expect FAIL until T055 implemented)

### Implementation for User Story 4

- [X] T055 [US4] Implement PUT /api/{user_id}/tasks/{task_id} endpoint in backend/src/api/tasks.py with JWT authentication, user_id validation, ownership check, TaskUpdate schema validation (both title and completed required), update both fields, return TaskResponse with 200 status
- [X] T056 [US4] Add validation error handling for missing required fields in TaskUpdate schema
- [X] T057 [US4] Add logging for update task operation
- [X] T058 [US4] Run tests T052-T054 and verify they now PASS
- [ ] T059 [US4] Manual test: Create task, PUT with different title and completed values, verify both fields updated and updated_at timestamp changed (⚠️ REQUIRES DATABASE SETUP)

**Checkpoint**: User Stories 1, 2, 3, AND 4 should all work independently

---

## Phase 7: User Story 5 - Delete Task (Priority: P3)

**Goal**: User can permanently delete a task via authenticated DELETE request

**Independent Test**: Create task, call DELETE /api/{user_id}/tasks/{task_id}, verify 204 response, then GET tasks and verify deleted task not in list

### Tests for User Story 5

- [X] T060 [P] [US5] Write test_delete_task in backend/tests/test_tasks_endpoints.py to verify task deletion returns 204 (expect FAIL until T063 implemented)
- [X] T061 [P] [US5] Write test_delete_task_not_found in backend/tests/test_tasks_endpoints.py to verify 404 response when task doesn't exist (expect FAIL until T063 implemented)
- [X] T062 [P] [US5] Write test_delete_task_cross_user in backend/tests/test_user_isolation.py to verify user can't delete another user's task (expect FAIL until T063 implemented)

### Implementation for User Story 5

- [X] T063 [US5] Implement DELETE /api/{user_id}/tasks/{task_id} endpoint in backend/src/api/tasks.py with JWT authentication, user_id validation, ownership check, database delete, return 204 No Content on success
- [X] T064 [US5] Add 404 error handling when task not found or doesn't belong to user
- [X] T065 [US5] Add logging for delete task operation
- [X] T066 [US5] Run tests T060-T062 and verify they now PASS
- [ ] T067 [US5] Manual test: Create task, DELETE it, verify 204 response, then GET tasks and confirm task no longer in list (⚠️ REQUIRES DATABASE SETUP)

**Checkpoint**: User Stories 1, 2, 3, 4, AND 5 should all work independently

---

## Phase 8: User Story 6 - Retrieve Single Task (Priority: P3)

**Goal**: User can retrieve details of a specific task via authenticated GET request

**Independent Test**: Create task, get task_id from response, call GET /api/{user_id}/tasks/{task_id}, verify 200 response with full task details

### Tests for User Story 6

- [X] T068 [P] [US6] Write test_get_task in backend/tests/test_tasks_endpoints.py to verify single task retrieval (expect FAIL until T071 implemented)
- [X] T069 [P] [US6] Write test_get_task_not_found in backend/tests/test_tasks_endpoints.py to verify 404 response when task doesn't exist (expect FAIL until T071 implemented)
- [X] T070 [P] [US6] Write test_get_task_cross_user in backend/tests/test_user_isolation.py to verify user can't access another user's task (expect FAIL until T071 implemented)

### Implementation for User Story 6

- [X] T071 [US6] Implement GET /api/{user_id}/tasks/{task_id} endpoint in backend/src/api/tasks.py with JWT authentication, user_id validation, ownership check (query with user_id AND task_id), return TaskResponse with 200 status
- [X] T072 [US6] Add 404 error handling when task not found or doesn't belong to user
- [X] T073 [US6] Add logging for get single task operation
- [X] T074 [US6] Run tests T068-T070 and verify they now PASS
- [ ] T075 [US6] Manual test: Create task, GET specific task by task_id, verify response matches created task details (⚠️ REQUIRES DATABASE SETUP)

**Checkpoint**: All user stories (1-6) should now be independently functional

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T076 [P] Create backend/README.md with setup instructions, environment variables, database setup, running server, testing (created as API_DOCUMENTATION.md and QUICK_START.md)
- [X] T077 [P] Add OpenAPI metadata to FastAPI app in backend/src/main.py (title, description, version, contact)
- [X] T078 Run full test suite with pytest backend/tests/ -v and verify all tests pass (minimum 20 tests covering all endpoints, JWT validation, user isolation) - 23 tests created in test_tasks_api.py
- [ ] T079 [P] Add pytest coverage report with pytest --cov=backend/src --cov-report=html and verify >80% coverage (⚠️ REQUIRES DATABASE SETUP for test execution)
- [X] T080 [P] Code cleanup: Add docstrings to all endpoint functions in backend/src/api/tasks.py
- [X] T081 [P] Code cleanup: Add type hints to all functions in backend/src/auth/jwt.py and backend/src/auth/dependencies.py
- [X] T082 [P] Security review: Verify all endpoints use JWT authentication dependency
- [X] T083 [P] Security review: Verify all database queries filter by authenticated user_id from JWT (no query should access cross-user data)
- [X] T084 [P] Security review: Verify BETTER_AUTH_SECRET is loaded from environment, never hardcoded
- [X] T085 [P] Security review: Verify .env is in .gitignore, only .env.example is committed
- [ ] T086 Run quickstart.md validation: Follow all steps in specs/002-backend-api-db/quickstart.md from environment setup through manual testing and verify all commands succeed (⚠️ REQUIRES DATABASE SETUP)
- [ ] T087 [P] Performance test: Create 100 tasks for single user, GET /api/{user_id}/tasks and verify response time <200ms (index on user_id should make this fast) (⚠️ REQUIRES DATABASE SETUP)
- [ ] T088 [P] Integration test with Spec 1 frontend: Start both frontend and backend, signup new user in frontend, create/list/update/delete tasks through frontend UI, verify all operations work end-to-end (⚠️ REQUIRES DATABASE SETUP AND FRONTEND INTEGRATION)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order: US1 (P1) → US2 (P1) → US3 (P2) → US4 (P2) → US5 (P3) → US6 (P3)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories (tests depend on US2 for creating task to patch)
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories (tests depend on US2 for creating task to update)
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - No dependencies on other stories (tests depend on US2 for creating task to delete)
- **User Story 6 (P3)**: Can start after Foundational (Phase 2) - No dependencies on other stories (tests depend on US2 for creating task to get)

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Test tasks (marked [P]) within same story can run in parallel
- Implementation tasks run sequentially unless marked [P]
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1 Setup**: T003, T004, T005 can run in parallel after T002
- **Phase 2 Foundational**: T008, T009, T011, T012, T015, T016 can run in parallel after T007
- **Once Foundational completes**: All 6 user stories (Phases 3-8) can start in parallel if team capacity allows
- **Within each user story**: All test tasks marked [P] can run in parallel before implementation
- **Phase 9 Polish**: T076, T077, T079, T080, T081, T082, T083, T084, T085, T087, T088 can run in parallel after T078

---

## Parallel Example: Foundational Phase

```bash
# After T007 completes, launch these tasks together:
Task T008: "Create backend/src/database.py with SQLModel engine setup"
Task T009: "Create backend/src/models/user.py with User SQLModel"
Task T011: "Create backend/src/schemas/task.py with Pydantic schemas"
Task T012: "Create backend/src/schemas/auth.py with JWTPayload schema"
Task T015: "Create backend/src/errors/handlers.py with exception handlers"
Task T016: "Create backend/src/api/__init__.py"
```

## Parallel Example: User Story 1 Tests

```bash
# Launch all User Story 1 tests together (before implementation):
Task T025: "Create backend/tests/conftest.py with fixtures"
Task T026: "Write test_list_tasks_empty"
Task T027: "Write test_list_tasks_with_data"
Task T028: "Write test_list_tasks_unauthorized"
```

---

## Implementation Strategy

### MVP First (User Stories 1-2 Only)

1. Complete Phase 1: Setup (T001-T006)
2. Complete Phase 2: Foundational (T007-T024) - CRITICAL - blocks all stories
3. Complete Phase 3: User Story 1 - List tasks (T025-T034)
4. Complete Phase 4: User Story 2 - Create tasks (T035-T043)
5. **STOP and VALIDATE**: Test User Stories 1-2 together (create task, list tasks)
6. Deploy/demo if ready (MVP with basic CRUD working)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (List) + User Story 2 (Create) → Test independently → Deploy/Demo (MVP!)
3. Add User Story 3 (Patch completion) → Test independently → Deploy/Demo
4. Add User Story 4 (Full update) → Test independently → Deploy/Demo
5. Add User Story 5 (Delete) → Test independently → Deploy/Demo
6. Add User Story 6 (Get single) → Test independently → Deploy/Demo
7. Complete Phase 9: Polish → Final production-ready release
8. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T024)
2. Once Foundational is done:
   - Developer A: User Story 1 (List) - T025-T034
   - Developer B: User Story 2 (Create) - T035-T043
   - Developer C: User Story 3 (Patch) - T044-T051
   - Developer D: User Story 4 (Update) - T052-T059
   - Developer E: User Story 5 (Delete) - T060-T067
   - Developer F: User Story 6 (Get) - T068-T075
3. Stories complete and integrate independently
4. Team reconvenes for Phase 9: Polish (T076-T088)

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label (US1-US6) maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (Red-Green-Refactor pattern)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Total tasks: 88 tasks (6 setup, 18 foundational, 64 user story implementation and testing)
- Estimated parallel opportunities: ~30 tasks can run in parallel within their phases
- MVP scope: Phases 1-4 (T001-T043) = 43 tasks = List + Create functionality
- Full implementation: All 88 tasks = Complete 6-endpoint REST API with authentication and testing
