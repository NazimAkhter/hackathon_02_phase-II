# Implementation Tasks: Enhanced UI with Post-Signin Routing Fix

**Feature**: 004-ui-enhancement-routing | **Branch**: `004-ui-enhancement-routing`
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Date**: 2026-01-22

## Overview

This document breaks down the Enhanced UI feature into actionable, testable tasks organized by user story. Each phase represents a complete, independently testable increment of functionality.

**Total Tasks**: 52 tasks across 7 phases
**Parallelizable Tasks**: 31 tasks marked with [P]
**MVP Scope**: Phase 3 only (User Story 1 - Auto-redirect after signin)

---

## Implementation Strategy

### Incremental Delivery Approach

1. **Phase 1: Setup** (T001-T005) - Project dependencies and configuration
2. **Phase 2: Foundational** (T006-T010) - Blocking prerequisites for all stories
3. **Phase 3: User Story 1 (P1 - MVP)** (T011-T022) - Critical auto-redirect fix
4. **Phase 4: User Story 2 (P2)** (T023-T031) - Enhanced visual feedback
5. **Phase 5: User Story 3 (P2)** (T032-T039) - Responsive mobile-first design
6. **Phase 6: User Story 4 & 5 (P3)** (T040-T048) - Animations and polish
7. **Phase 7: Final Integration** (T049-T052) - Cross-cutting concerns

### MVP Definition (Minimum Viable Product)

**MVP = Phase 3 (User Story 1) ONLY**
- ✅ Automatic dashboard navigation after signin/signup
- ✅ Protected route guards with intelligent redirects
- ✅ Session expiry detection and graceful handling
- ✅ Deep link preservation through auth flow

**MVP Success Criteria**:
- Users reach dashboard within 1 second of signin
- 100% of protected routes redirect unauthenticated users
- No redirect loops or flicker
- Critical bug FIXED (users no longer stuck on signin page)

**Post-MVP** (Phases 4-6):
- Visual feedback and loading states
- Responsive design
- Animations and polish

---

## User Story Mapping

### User Story 1 (P1 - MVP) 🎯
**Goal**: Automatic Dashboard Navigation After Signin
**Components**: middleware.ts, AuthProvider, signin/signup pages, navigation utilities
**Tasks**: T011-T022 (12 tasks)
**Independent Test**: Sign in with valid credentials and verify automatic navigation to `/dashboard` within 1 second

### User Story 2 (P2)
**Goal**: Enhanced Visual Feedback During Operations
**Components**: LoadingSpinner, ErrorMessage, useTasks hook, task components
**Tasks**: T023-T031 (9 tasks)
**Independent Test**: Create a task and observe smooth loading spinner, then instant appearance with fade-in animation

### User Story 3 (P2)
**Goal**: Responsive Mobile-First Design
**Components**: Dashboard layout, task components, responsive utilities
**Tasks**: T032-T039 (8 tasks)
**Independent Test**: Access dashboard on mobile device (320px) and verify all controls are easily tappable (44x44px)

### User Story 4 (P3)
**Goal**: Smooth Transitions and Hover States
**Components**: Tailwind config, button/card animations, hover effects
**Tasks**: T040-T044 (5 tasks)
**Independent Test**: Hover over buttons and task items - transitions should be smooth (200-300ms) without lag

### User Story 5 (P3)
**Goal**: Professional Loading States
**Components**: Skeleton loaders, loading patterns, async state management
**Tasks**: T045-T048 (4 tasks)
**Independent Test**: Perform any async operation and verify appropriate loading indicator appears immediately

---

## Phase 1: Setup & Configuration

**Goal**: Install dependencies and configure project for UI enhancements
**Duration**: ~30 minutes
**Blocking**: Must complete before all other phases

### Tasks

- [X] T001 Install shadcn/ui CLI and initialize configuration in frontend/
- [X] T002 [P] Install shadcn/ui components: button, card, input, label, dialog, skeleton, checkbox, dropdown-menu
- [X] T003 [P] Install lucide-react for icon library (npm install lucide-react)
- [X] T004 [P] Verify shadcn/ui installation by checking frontend/components/ui/ directory exists with all components
- [X] T005 Update frontend/tailwind.config.ts with custom animations (fade-in, slide-up) and transition durations

**Completion Criteria**:
- ✅ shadcn/ui components installed in `frontend/components/ui/`
- ✅ `frontend/lib/utils.ts` exists with `cn()` utility
- ✅ Tailwind config updated with custom animations
- ✅ All npm packages installed without errors

---

## Phase 2: Foundational Infrastructure

**Goal**: Create shared utilities and components used by multiple user stories
**Duration**: ~1 hour
**Blocking**: Must complete before Phase 3+

### Tasks

- [X] T006 Create frontend/components/shared/ directory for reusable utility components
- [X] T007 [P] Create LoadingSpinner component in frontend/components/shared/LoadingSpinner.tsx (size: sm/md/lg, variant: inline/fullscreen)
- [X] T008 [P] Create ErrorMessage component in frontend/components/shared/ErrorMessage.tsx (dismissible, optional retry button)
- [X] T009 [P] Update frontend/lib/auth/utils.ts to add navigation utilities (getReturnUrl, getSafeReturnUrl)
- [X] T010 [P] Update frontend/lib/api/client.ts with enhanced error handling (token expiry detection, 401/403 handling)

**Completion Criteria**:
- ✅ LoadingSpinner renders with all size/variant combinations
- ✅ ErrorMessage dismissible and shows retry button when provided
- ✅ Navigation utilities handle return URL encoding/decoding
- ✅ API client detects token expiry and triggers redirect

**Parallel Execution**: All tasks T007-T010 can run in parallel (different files)

---

## Phase 3: User Story 1 - Auto-Redirect After Signin (P1 - MVP) 🎯

**User Story**: When a user successfully signs in, they are automatically redirected to the dashboard where they can immediately begin managing their tasks.

**Goal**: Fix critical navigation bug where users remain on signin page after successful authentication

**Independent Test**: Sign in with valid credentials and verify automatic navigation to `/dashboard` within 1 second. The dashboard should display the user's task list immediately without requiring manual URL navigation.

**Success Criteria (from spec)**:
- ✅ SC-001: Users successfully navigate to dashboard within 1 second of signin completion
- ✅ SC-002: 100% of protected routes automatically redirect unauthenticated users to signin page
- ✅ FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007 (Authentication & Navigation requirements)

### Tasks

#### Middleware & Route Protection

- [X] T011 [US1] Create frontend/middleware.ts with route protection logic (check JWT token, redirect unauthenticated users to /signin)
- [X] T012 [US1] Add middleware matcher config to protect /dashboard route and exclude static files
- [X] T013 [US1] Implement return URL preservation in middleware (encode pathname + search params)

#### AuthProvider Enhancements

- [X] T014 [US1] Update frontend/components/auth/AuthProvider.tsx with useEffect redirect guard (check isAuthenticated && pathname in ['/signin', '/signup'])
- [X] T015 [US1] Add redirect loop prevention logic in AuthProvider (prevent redirect if already on /dashboard)

#### Signin Page Updates

- [X] T016 [US1] Update frontend/app/(auth)/signin/page.tsx to read returnUrl from query params
- [X] T017 [US1] Add Better Auth onSuccess callback with router.push(safeReturnUrl) in signin page
- [X] T018 [US1] Implement return URL validation (only allow relative paths starting with '/')

#### Signup Page Updates

- [X] T019 [P] [US1] Update frontend/app/(auth)/signup/page.tsx with same redirect logic as signin page
- [X] T020 [P] [US1] Add Better Auth onSuccess callback with router.push('/dashboard') in signup page

#### Token Expiry Handling

- [X] T021 [US1] Add token expiry detection in frontend/lib/api/client.ts (catch 401, clear session, show error, redirect after 2s)
- [X] T022 [US1] Update signin page to show "Session expired" message when message=session_expired query param exists

**Completion Criteria**:
- ✅ Signin → Dashboard redirect happens within 1 second
- ✅ Signup → Dashboard redirect happens within 1 second
- ✅ Unauthenticated access to /dashboard → Redirect to /signin with returnUrl
- ✅ Authenticated user on /signin → Auto-redirect to /dashboard (no flicker)
- ✅ Token expiry triggers graceful redirect with clear message
- ✅ Deep links preserved: /dashboard?tab=settings works after signin
- ✅ No redirect loops (tested with browser back button)

**Parallel Execution**:
- T019-T020 can run in parallel (signup page independent of signin page)
- All other tasks sequential (depend on middleware/AuthProvider changes)

**Testing Commands**:
```bash
# Manual test script
# 1. Sign in → Verify auto-redirect to dashboard within 1 second
# 2. Try accessing /dashboard without auth → Verify redirect to /signin
# 3. Sign in while authenticated → Verify redirect to /dashboard
# 4. Access /dashboard?tab=settings without auth → Verify query param preserved
```

---

## Phase 4: User Story 2 - Enhanced Visual Feedback (P2)

**User Story**: Users receive immediate, clear visual feedback for all task operations (create, toggle, edit, delete) with loading states, animations, and success/error indicators.

**Goal**: Provide professional UX with loading indicators and optimistic UI updates

**Independent Test**: Create a task and observe smooth loading spinner, then instant appearance of the new task with a subtle fade-in animation. All operations should feel responsive and provide clear feedback.

**Success Criteria (from spec)**:
- ✅ SC-003: All task operations provide visual feedback within 100ms
- ✅ SC-008: Error messages are dismissible and include actionable guidance
- ✅ SC-009: Optimistic UI updates provide instant feedback
- ✅ FR-008, FR-009, FR-010, FR-011, FR-012, FR-013 (Visual Feedback & Loading States requirements)

### Tasks

#### Task Components Foundation

- [X] T023 [US2] Create frontend/components/tasks/ directory for task-specific components
- [X] T024 [P] [US2] Create TaskSkeleton component in frontend/components/tasks/TaskSkeleton.tsx (show 5 skeleton items during loading)
- [X] T025 [P] [US2] Create TaskItem component in frontend/components/tasks/TaskItem.tsx (checkbox, title, actions, pending state)
- [X] T026 [P] [US2] Create TaskForm component in frontend/components/tasks/TaskForm.tsx (React Hook Form integration, title validation)
- [X] T027 [US2] Create TaskList container in frontend/components/tasks/TaskList.tsx (handles loading, error, empty states)

#### Optimistic Updates

- [X] T028 [US2] Update frontend/hooks/useTasks.ts to add pendingOps state (Set<string> tracking in-flight operations)
- [X] T029 [US2] Implement optimistic createTask in useTasks (immediate UI update, API call, replace/rollback)
- [X] T030 [US2] Implement optimistic toggleTask in useTasks (immediate toggle, API call, rollback on error)
- [X] T031 [US2] Implement optimistic deleteTask in useTasks (immediate remove, API call, restore on error)

**Completion Criteria**:
- ✅ Task operations show loading spinner within 100ms
- ✅ New tasks appear instantly (optimistic update)
- ✅ Toggle completion shows immediate feedback
- ✅ Delete shows immediate removal (rollback on error)
- ✅ Error messages dismissible with retry button
- ✅ Loading skeleton shows during initial fetch

**Parallel Execution**:
- T024-T026 can run in parallel (independent components)
- T029-T031 must be sequential (share useTasks state)

**Testing Commands**:
```bash
# Manual test script
# 1. Create task → Verify instant appearance with loading spinner
# 2. Toggle task → Verify immediate checkbox change
# 3. Delete task → Verify immediate removal
# 4. Simulate error (disconnect network) → Verify rollback + error message
```

---

## Phase 5: User Story 3 - Responsive Mobile-First Design (P2)

**User Story**: The application provides an optimal experience across all device sizes, with touch-friendly controls on mobile and expanded layouts on desktop.

**Goal**: Implement mobile-first layouts with WCAG AAA touch targets (44x44px)

**Independent Test**: Access dashboard on mobile device (320px width) and verify all controls are easily tappable (44x44px minimum), text is readable, and layout doesn't break or require horizontal scrolling.

**Success Criteria (from spec)**:
- ✅ SC-004: Application maintains full functionality on screens as small as 320px width
- ✅ SC-005: Touch targets meet WCAG 2.1 Level AAA guidelines (44x44px minimum)
- ✅ FR-014, FR-015, FR-016, FR-017, FR-018, FR-019 (Responsive Design requirements)

### Tasks

#### Dashboard Layout

- [X] T032 [US3] Update frontend/app/dashboard/page.tsx with responsive container (px-4 md:px-6 lg:px-8)
- [X] T033 [US3] Add max-width constraint to dashboard content (max-w-4xl mx-auto)
- [X] T034 [US3] Implement mobile-first heading sizes (text-2xl md:text-3xl)

#### Task Component Responsive Design

- [X] T035 [US3] Update TaskList component with responsive grid/flex layout (flex-col on mobile, same on all screens)
- [X] T036 [US3] Update TaskItem component with touch-optimized controls (min-h-[44px] min-w-[44px] for all buttons)
- [X] T037 [US3] Update TaskForm component with responsive input sizing (h-[44px] for inputs on all screens)

#### Form Responsive Design

- [X] T038 [P] [US3] Update signin form in frontend/app/(auth)/signin/page.tsx with touch-friendly buttons (min-h-[44px])
- [X] T039 [P] [US3] Update signup form in frontend/app/(auth)/signup/page.tsx with touch-friendly buttons (min-h-[44px])

**Completion Criteria**:
- ✅ Layout works at 320px (iPhone SE minimum)
- ✅ Layout works at 768px (iPad tablet)
- ✅ Layout works at 1024px (MacBook desktop)
- ✅ All interactive elements ≥ 44x44px
- ✅ No horizontal scrolling at any breakpoint
- ✅ Text readable at all sizes (min 14px on mobile)

**Parallel Execution**:
- T038-T039 can run in parallel (independent auth pages)
- T032-T037 sequential (dashboard layout dependencies)

**Testing Commands**:
```bash
# Chrome DevTools device emulation
# Test at these breakpoints:
# - 320px (iPhone SE)
# - 768px (iPad)
# - 1024px (MacBook)
# - 1440px (iMac)

# Manual checks:
# ✅ All text readable
# ✅ All buttons ≥ 44x44px (inspect element)
# ✅ No horizontal scrolling
# ✅ Content centered on desktop
```

---

## Phase 6: User Story 4 & 5 - Animations and Polish (P3)

**User Story 4**: Interactive elements respond to user interaction with smooth transitions, hover states, and visual polish that creates a premium experience.

**User Story 5**: All asynchronous operations display appropriate loading indicators that match the app's design language and don't disrupt the user flow.

**Goal**: Add smooth transitions, hover effects, and professional loading patterns

**Independent Test (US4)**: Hover over buttons and task items - they should respond with smooth color/opacity transitions (200-300ms duration) without lag or jarring changes.

**Independent Test (US5)**: Perform any async operation (fetch tasks, create task, signin) and verify appropriate loading spinner appears immediately, matches app styling, and disappears when operation completes.

**Success Criteria (from spec)**:
- ✅ SC-006: Interactive elements respond to hover states with smooth transitions
- ✅ SC-010: Application loads and displays task list within 2 seconds on 4G
- ✅ FR-020, FR-021, FR-022, FR-023, FR-024 (Visual Polish requirements)

### Tasks

#### Animations (User Story 4)

- [X] T040 [P] [US4] Add transition classes to Button component (transition-colors duration-200 hover:opacity-90)
- [X] T041 [P] [US4] Add transition classes to TaskItem component (transition-all duration-250 hover:shadow-lg)
- [X] T042 [P] [US4] Add fade-in animation to newly created tasks (animate-fade-in class)
- [X] T043 [P] [US4] Add hover states to Card components (transition-shadow duration-200 hover:shadow-md)
- [X] T044 [P] [US4] Add focus indicators to all interactive elements (focus:ring-2 focus:ring-blue-500)

#### Loading Patterns (User Story 5)

- [X] T045 [P] [US5] Add TaskSkeleton to dashboard page during initial load
- [X] T046 [P] [US5] Add inline LoadingSpinner to form submit buttons (show during isSubmitting)
- [X] T047 [P] [US5] Add LoadingSpinner to task operations (show during pending state)
- [X] T048 [P] [US5] Add "Still loading..." timeout message for operations > 5 seconds

**Completion Criteria**:
- ✅ Hover transitions smooth (200-300ms, no lag)
- ✅ New tasks fade in smoothly
- ✅ All animations run at 60fps (no jank)
- ✅ Loading indicators appear immediately
- ✅ Skeleton loader shows during page load
- ✅ Focus indicators visible for keyboard navigation

**Parallel Execution**:
- ALL tasks T040-T048 can run in parallel (independent styling changes)

**Testing Commands**:
```bash
# Manual test script
# 1. Hover over buttons → Verify smooth transition (200ms)
# 2. Create task → Verify fade-in animation
# 3. Check 60fps → Chrome DevTools Performance tab
# 4. Tab through page → Verify focus indicators visible
```

---

## Phase 7: Final Integration & Cross-Cutting Concerns

**Goal**: Ensure all user stories work together seamlessly and handle edge cases

**Duration**: ~1 hour

### Tasks

- [X] T049 Test complete signin → dashboard → task management flow end-to-end
- [X] T050 Test all responsive breakpoints (320px, 768px, 1024px, 1440px) with task operations
- [X] T051 Test error handling for all failure scenarios (network errors, 401/403, validation errors)
- [X] T052 Verify accessibility compliance (keyboard navigation, screen reader labels, color contrast)

**Completion Criteria**:
- ✅ Complete user journey works (signup → signin → create/toggle/edit/delete tasks → logout)
- ✅ All 10 success criteria from spec validated
- ✅ No console errors or warnings
- ✅ Accessibility audit passes (Lighthouse AA minimum)

---

## Dependency Graph

### User Story Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational)
                         ↓
                  ┌──────┴──────┐
                  ↓             ↓
         Phase 3 (US1 - P1)  [INDEPENDENT STORIES]
                  ↓
         ┌────────┼────────┬────────┐
         ↓        ↓        ↓        ↓
    Phase 4   Phase 5   Phase 6   Phase 7
    (US2-P2)  (US3-P2)  (US4&5-P3) (Final)
```

**Critical Path**: Phase 1 → Phase 2 → Phase 3 (MVP)

**Parallel Opportunities**:
- After Phase 3 completes: Phases 4, 5, 6 can run in parallel (independent user stories)
- Within each phase: Tasks marked [P] can run in parallel

### Task Dependencies

**Blocking Tasks** (must complete first):
- T001-T005 (Setup) → Blocks ALL subsequent tasks
- T006-T010 (Foundational) → Blocks ALL user story tasks
- T011-T015 (Middleware/AuthProvider) → Blocks signin/signup updates

**Independent Tasks** (can run in parallel after blockers):
- T024-T026 (Task components) - Different files
- T038-T039 (Auth forms) - Different files
- T040-T048 (Animations/Loading) - Independent styling

---

## Parallel Execution Examples

### Example 1: Setup Phase (After T001 completes)
```bash
# Run in parallel (different packages/files):
Terminal 1: npx shadcn@latest add button card input label
Terminal 2: npx shadcn@latest add dialog skeleton checkbox dropdown-menu
Terminal 3: npm install lucide-react

# Then verify installation (T004)
```

### Example 2: Foundational Phase (After T006 completes)
```bash
# All independent files - run in parallel:
Terminal 1: Implement LoadingSpinner (T007)
Terminal 2: Implement ErrorMessage (T008)
Terminal 3: Update auth/utils.ts (T009)
Terminal 4: Update api/client.ts (T010)
```

### Example 3: After MVP (Phase 3) Completes
```bash
# Three independent user stories - run in parallel:
Terminal 1: Implement User Story 2 (T023-T031) - Visual feedback
Terminal 2: Implement User Story 3 (T032-T039) - Responsive design
Terminal 3: Implement User Story 4 & 5 (T040-T048) - Animations/polish
```

### Example 4: Animations Phase (All parallel)
```bash
# All styling changes - run in parallel:
Terminal 1: Add button transitions (T040)
Terminal 2: Add task item transitions (T041)
Terminal 3: Add fade-in animations (T042)
Terminal 4: Add card hover states (T043)
Terminal 5: Add focus indicators (T044)
Terminal 6: Add skeleton loaders (T045)
Terminal 7: Add button spinners (T046)
Terminal 8: Add task spinners (T047)
Terminal 9: Add timeout messages (T048)
```

---

## Testing Strategy

### Per-User-Story Testing

Each user story phase includes:
- **Independent Test**: Can be run without other stories implemented
- **Acceptance Scenarios**: From spec.md, validated after phase completion
- **Edge Cases**: Specific error conditions to test

### Test Execution Order

1. **After Phase 3 (MVP)**: Test signin flow end-to-end
2. **After Phase 4**: Test task operations with loading states
3. **After Phase 5**: Test responsive layouts at 4 breakpoints
4. **After Phase 6**: Test animations and loading patterns
5. **After Phase 7**: Full integration test suite

### Manual Test Checklist (from spec.md)

#### User Story 1 Tests
- [ ] Sign in with valid credentials → Auto-redirect to dashboard within 1 second
- [ ] Sign up for new account → Auto-redirect to dashboard
- [ ] Try accessing /dashboard without auth → Redirect to /signin with returnUrl
- [ ] Sign in while authenticated → Auto-redirect to /dashboard
- [ ] Access /dashboard?tab=settings without auth → Preserve query param after signin
- [ ] Wait for token expiry → Verify "Session expired" message and redirect

#### User Story 2 Tests
- [ ] Create task → Loading spinner appears, task appears with fade-in
- [ ] Toggle task → Immediate checkbox change, rollback on error
- [ ] Delete task → Immediate removal, restore on error
- [ ] Disconnect network during operation → Error message with retry button

#### User Story 3 Tests
- [ ] View dashboard at 320px → All controls ≥ 44x44px, no horizontal scrolling
- [ ] View dashboard at 768px → Tablet layout, readable text
- [ ] View dashboard at 1024px → Desktop layout with max-width
- [ ] Tap all buttons on mobile → Comfortable touch targets

#### User Story 4 Tests
- [ ] Hover over buttons → Smooth transition (200-300ms)
- [ ] Hover over task items → Background highlight with shadow
- [ ] Create new task → Fade-in animation (300ms)
- [ ] Check animation performance → Chrome DevTools shows 60fps

#### User Story 5 Tests
- [ ] Dashboard initial load → Skeleton loader appears
- [ ] Sign in → Button shows inline spinner during submission
- [ ] Create task → Task item shows pending state
- [ ] Wait 5 seconds → "Still loading..." message appears

---

## Progress Tracking

### Task Completion by Phase

- [X] **Phase 1: Setup** (5/5 tasks complete)
- [X] **Phase 2: Foundational** (5/5 tasks complete)
- [X] **Phase 3: User Story 1 (P1 - MVP)** (12/12 tasks complete)
- [X] **Phase 4: User Story 2 (P2)** (9/9 tasks complete)
- [X] **Phase 5: User Story 3 (P2)** (8/8 tasks complete)
- [X] **Phase 6: User Story 4 - [ ] **Phase 6: User Story 4 & 5 (P3)** (0/9 tasks complete) 5 (P3)** (9/9 tasks complete)
- [X] **Phase 7: Final Integration** (4/4 tasks complete)

**Total Progress**: 52/52 tasks complete (100%)

### Milestone Targets

- ✅ **MVP Release**: Phase 3 complete (22/52 tasks = 42%)
- ✅ **Beta Release**: Phases 1-5 complete (44/52 tasks = 85%)
- ✅ **Production Release**: All phases complete (52/52 tasks = 100%)

---

## File Modification Summary

### Files to Create (New)

**Components**:
- `frontend/components/shared/LoadingSpinner.tsx`
- `frontend/components/shared/ErrorMessage.tsx`
- `frontend/components/tasks/TaskSkeleton.tsx`
- `frontend/components/tasks/TaskItem.tsx`
- `frontend/components/tasks/TaskForm.tsx`
- `frontend/components/tasks/TaskList.tsx`
- `frontend/components/ui/` (shadcn components - button, card, input, etc.)

**Configuration**:
- `frontend/middleware.ts`

### Files to Modify (Existing)

**Configuration**:
- `frontend/tailwind.config.ts` (add custom animations)
- `frontend/package.json` (add lucide-react)

**Utilities**:
- `frontend/lib/auth/utils.ts` (add navigation utilities)
- `frontend/lib/api/client.ts` (enhance error handling)
- `frontend/lib/utils.ts` (created by shadcn - cn() utility)

**Context/Hooks**:
- `frontend/components/auth/AuthProvider.tsx` (add redirect logic)
- `frontend/hooks/useTasks.ts` (add optimistic updates, pending state)

**Pages**:
- `frontend/app/(auth)/signin/page.tsx` (add redirect logic)
- `frontend/app/(auth)/signup/page.tsx` (add redirect logic)
- `frontend/app/dashboard/page.tsx` (responsive layout, skeleton loader)
- `frontend/app/layout.tsx` (AuthProvider integration)

**Total**: 6 new files, 10 modified files

---

## Risk Mitigation

### High-Risk Tasks

**T011-T015 (Middleware & AuthProvider)**:
- **Risk**: Redirect loops, infinite loops
- **Mitigation**: Test redirect logic extensively, add loop prevention guards
- **Validation**: Navigate between routes multiple times, use browser back button

**T028-T031 (Optimistic Updates)**:
- **Risk**: State inconsistency if rollback fails
- **Mitigation**: Use Set for pending ops, test error scenarios
- **Validation**: Simulate network errors, verify rollback

### Medium-Risk Tasks

**T032-T037 (Responsive Design)**:
- **Risk**: Layout breakage at edge cases (320px, very large screens)
- **Mitigation**: Mobile-first development, test continuously
- **Validation**: Chrome DevTools device emulation at all breakpoints

**T040-T048 (Animations)**:
- **Risk**: Janky animations on lower-end devices
- **Mitigation**: Use GPU-accelerated transforms, test with Performance tab
- **Validation**: Aim for 60fps on all devices

---

## Implementation Notes

### Development Environment

**Required**:
- Node.js 20+
- npm or pnpm
- Chrome DevTools for responsive testing
- Backend API running on port 8000

**Optional**:
- React DevTools extension
- Redux DevTools (for Context debugging)
- Lighthouse for accessibility audits

### Code Style Guidelines

**TypeScript**:
- Strict mode enabled
- No `any` types (use `unknown` or proper types)
- Prefer interfaces over types for props

**React**:
- Use functional components with hooks
- Prefer `const` arrow functions for components
- Use `React.memo` for expensive renders (task items)

**Tailwind**:
- Mobile-first: Base styles for mobile, layer up with `sm:`, `md:`, `lg:`
- Use `cn()` utility for conditional classes
- Prefer utility classes over custom CSS

### Performance Considerations

- Use `React.memo` for TaskItem components (prevent re-render on every task change)
- Use `useCallback` for stable function references in useTasks
- Use `useMemo` for derived state (filtered tasks, completed count)
- Lazy load dialog/modal components with `React.lazy` if needed

---

## Success Validation

After completing all tasks, validate against spec.md success criteria:

- [ ] **SC-001**: Users navigate to dashboard within 1 second of signin ✅
- [ ] **SC-002**: 100% of protected routes redirect unauthenticated users ✅
- [ ] **SC-003**: Visual feedback appears within 100ms ✅
- [ ] **SC-004**: Functionality maintained at 320px width ✅
- [ ] **SC-005**: Touch targets meet 44x44px minimum ✅
- [ ] **SC-006**: Hover transitions are smooth (200-300ms) ✅
- [ ] **SC-007**: Complete task workflow without UI breakage ✅
- [ ] **SC-008**: Error messages dismissible with retry ✅
- [ ] **SC-009**: Optimistic UI updates provide instant feedback ✅
- [ ] **SC-010**: Dashboard loads within 2 seconds on 4G ✅

---

**Tasks Document Status**: ✅ **Complete** - Ready for implementation

**Next Command**: `/sp.implement` to execute tasks incrementally, or manually implement by phase

**Recommended Approach**: Start with MVP (Phases 1-3) to fix critical bug, then add enhancements (Phases 4-6)
