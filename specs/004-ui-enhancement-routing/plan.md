# Implementation Plan: Enhanced UI with Post-Signin Routing Fix

**Branch**: `004-ui-enhancement-routing` | **Date**: 2026-01-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-ui-enhancement-routing/spec.md`

## Summary

This feature enhances the existing Todo application UI with automatic post-authentication routing, professional loading states, responsive mobile-first design, and polished animations. The critical P1 requirement fixes the current issue where users remain on the signin page after successful authentication instead of being automatically redirected to the dashboard. Additional P2/P3 enhancements provide visual feedback, responsive layouts, and smooth transitions to create a production-ready user experience.

**Technical Approach**: Implement dual navigation strategy (Better Auth onSuccess callback + useEffect redirect guard) for reliable post-signin routing. Integrate shadcn/ui component library for polished UI elements. Use CSS transitions for animations (upgrade to Framer Motion only if complex interactions required). Leverage React Context for state management with optimistic UI updates. Create Next.js middleware for route protection. Follow mobile-first development approach with Tailwind breakpoints.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 16+ (App Router)
**Primary Dependencies**: Next.js 16.1.3, React 19.2.3, Better Auth 1.4.15, React Hook Form 7.71.1, Tailwind CSS 4.x, shadcn/ui components
**Storage**: Neon PostgreSQL (existing - no schema changes required)
**Testing**: Manual testing with responsive design preview at breakpoints (320px, 768px, 1024px, 1440px)
**Target Platform**: Web (Chrome/Firefox/Safari latest 2 versions, iOS Safari, Chrome Android)
**Project Type**: Web application (frontend enhancement only - no backend changes)
**Performance Goals**:
- Auto-redirect to dashboard < 1 second after signin
- Navigation transitions < 200ms
- Loading indicators appear within 100ms
- Animations maintain 60fps (no jank)
- Initial dashboard load < 2 seconds on 4G

**Constraints**:
- No breaking changes to existing API contracts
- Must work with existing JWT authentication (Better Auth)
- Cannot modify backend endpoints (Spec 002)
- Must maintain backward compatibility with existing task management features
- WCAG 2.1 Level AA minimum (touch targets 44x44px)

**Scale/Scope**:
- 8 page/component files to modify
- 3 new utility components (Loading, ErrorMessage, ProtectedRoute)
- 1 new middleware file
- 10-15 shadcn/ui components to install
- 24 functional requirements across 4 priority levels

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Agentic Development Workflow ✅
- ✅ Specification created via `/sp.specify` (completed)
- ✅ Implementation plan via `/sp.plan` (this document)
- ✅ Tasks will be generated with `/sp.tasks` (next phase)
- ✅ Implementation via specialized agents (`nextjs-ui-builder` primarily)
- ✅ ADR documentation for significant decisions (routing strategy, UI library choice)

### Principle II: Security-First Architecture ✅
- ✅ **JWT validation unchanged** - no security modifications required
- ✅ **Route protection via middleware** - enforces authentication before dashboard access
- ✅ **User isolation maintained** - UI changes don't affect backend authorization
- ✅ **No credential handling** - authentication flows already implemented in Spec 001
- ✅ **Protected routes** - middleware redirects unauthenticated users to `/signin`
- ✅ **Session expiry handling** - graceful redirect with "Session expired" message

**Security Impact**: This feature ENHANCES security UX by making authentication state more visible and preventing users from accessing protected content without proper auth. No security regressions.

### Principle III: RESTful API Design Standards ✅
- ✅ **No API changes required** - this is a frontend-only enhancement
- ✅ **Existing endpoints unchanged** - all task CRUD operations remain identical
- ✅ **API client updated** - automatic JWT token injection (already implemented)
- ✅ **Error handling improved** - better UX for 401/403 responses

**API Impact**: Zero changes to API contracts. UI improvements around error handling and loading states enhance API consumption UX.

### Principle IV: Stateless JWT Authentication ✅
- ✅ **Better Auth integration unchanged** - uses existing JWT implementation
- ✅ **Token transmission via Authorization header** - already implemented
- ✅ **httpOnly cookies** - managed by Better Auth (Spec 001)
- ✅ **7-day token expiry** - already configured
- ✅ **Session validation** - middleware checks token validity before route access

**Auth Impact**: No changes to authentication mechanism. UI layer adds navigation guards and better session state visualization.

### Principle V: Multi-User Persistent Storage ✅
- ✅ **No database schema changes** - uses existing `users` and `tasks` tables
- ✅ **No ORM changes** - SQLModel backend unchanged
- ✅ **Data isolation maintained** - user-specific filtering via existing API

**Storage Impact**: Zero database changes. This is purely a UI enhancement feature.

### Additional Gates

**Responsive UI (MANDATORY)** ✅
- ✅ Mobile-first development approach (start with 320px)
- ✅ Tailwind breakpoints: `sm:` (768px), `md:` (1024px), `lg:` (1440px)
- ✅ Touch targets 44x44px minimum (WCAG AAA)
- ✅ Testing at 4 breakpoints (320px, 768px, 1024px, 1440px)

**Complete User Journey** ✅
- ✅ Signup → Auto-redirect to dashboard
- ✅ Signin → Auto-redirect to dashboard
- ✅ Dashboard → Task management with loading/error states
- ✅ Logout → Redirect to signin page

**Constitution Compliance**: ✅ **ALL GATES PASSED** - No violations, no complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/004-ui-enhancement-routing/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output - UI library evaluation, animation strategy
├── data-model.md        # Phase 1 output - UI component hierarchy (no DB changes)
├── quickstart.md        # Phase 1 output - Developer setup for UI enhancement
├── contracts/           # Phase 1 output - Component prop interfaces, navigation flows
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
frontend/
├── app/
│   ├── (auth)/                     # [EXISTING] Route group for signin/signup
│   │   ├── signin/page.tsx         # [MODIFY] Add auto-redirect if authenticated
│   │   └── signup/page.tsx         # [MODIFY] Add auto-redirect if authenticated
│   ├── dashboard/                  # [EXISTING] Protected route
│   │   └── page.tsx                # [MODIFY] Add loading states, enhanced task UI
│   ├── api/                        # [EXISTING] Auth routes - NO CHANGES
│   ├── layout.tsx                  # [MODIFY] Add AuthProvider with redirect logic
│   └── page.tsx                    # [EXISTING] Landing page - minimal changes
├── components/                     # [EXISTING] UI components
│   ├── ui/                         # [NEW] shadcn/ui components
│   │   ├── button.tsx              # [CREATE] shadcn Button component
│   │   ├── card.tsx                # [CREATE] shadcn Card component
│   │   ├── input.tsx               # [CREATE] shadcn Input component
│   │   ├── skeleton.tsx            # [CREATE] shadcn Skeleton loader
│   │   ├── dialog.tsx              # [CREATE] shadcn Dialog/Modal
│   │   └── ...                     # [CREATE] Additional shadcn components as needed
│   ├── auth/                       # [EXISTING] Auth-related components
│   │   └── AuthProvider.tsx        # [MODIFY] Add redirect logic in checkAuth()
│   ├── tasks/                      # [NEW] Task-specific UI components
│   │   ├── TaskList.tsx            # [CREATE] Enhanced task list with animations
│   │   ├── TaskItem.tsx            # [CREATE] Individual task with hover effects
│   │   ├── TaskForm.tsx            # [CREATE] Task creation/edit form
│   │   └── TaskSkeleton.tsx        # [CREATE] Loading skeleton for task list
│   └── shared/                     # [NEW] Shared utility components
│       ├── LoadingSpinner.tsx      # [CREATE] Reusable loading indicator
│       ├── ErrorMessage.tsx        # [CREATE] Dismissible error display
│       └── ProtectedRoute.tsx      # [CREATE] HOC for route protection
├── hooks/                          # [EXISTING] Custom React hooks
│   ├── useTasks.ts                 # [MODIFY] Add optimistic updates, error handling
│   └── useAuth.ts                  # [MODIFY] Add redirect helpers
├── lib/                            # [EXISTING] Utility libraries
│   ├── auth/
│   │   └── utils.ts                # [MODIFY] Add redirect utilities
│   └── api/
│       └── client.ts               # [MODIFY] Enhanced error handling
├── middleware.ts                   # [CREATE] Route protection middleware
└── tailwind.config.ts              # [MODIFY] Add animation utilities, custom transitions

backend/
└── [NO CHANGES REQUIRED]           # Backend remains unchanged for this feature
```

**Structure Decision**: Web application (Option 2) - Frontend-only modifications. The existing Next.js 16 App Router structure with `(auth)` route groups, `app/` directory, and component library (`components/`) provides the foundation. We'll add shadcn/ui component library under `components/ui/` following shadcn conventions. Task-specific components will be organized under `components/tasks/` for clarity. New middleware file at root level follows Next.js 13+ middleware conventions.

## Complexity Tracking

> **No violations detected** - Constitution Check passed all gates. This section intentionally left empty.

---

## Phase 0: Research & Decision Documentation

### Research Tasks

1. **Routing Strategy Evaluation** (FR-001, FR-002, FR-004)
   - Research: Compare Better Auth onSuccess callback vs useEffect redirect guard
   - Research: Next.js middleware capabilities for route protection
   - Research: Deep link preservation patterns (return URL after signin)
   - **Decision needed**: Single strategy or dual redundant approach?

2. **UI Component Library Selection** (FR-008 to FR-024)
   - Research: shadcn/ui component quality, customization, bundle size
   - Research: Custom Tailwind component development effort vs library adoption
   - Research: Accessibility compliance (WCAG AA) in shadcn/ui components
   - **Decision needed**: shadcn/ui vs custom Tailwind components?

3. **Animation Strategy** (FR-020 to FR-023)
   - Research: CSS transitions performance (hardware acceleration)
   - Research: Framer Motion bundle size and tree-shaking capabilities
   - Research: Animation complexity requirements for this feature
   - **Decision needed**: CSS transitions vs Framer Motion?

4. **State Management Approach** (FR-011 - Optimistic UI)
   - Research: React Context performance with optimistic updates
   - Research: Zustand bundle size and API complexity
   - Research: Optimistic UI rollback patterns
   - **Decision needed**: React Context vs Zustand?

5. **Loading State Patterns** (FR-008 to FR-013)
   - Research: Skeleton loaders vs spinners (UX best practices)
   - Research: Suspense boundaries for async components
   - Research: Loading timeout thresholds (when to show "Still loading...")
   - **Decision needed**: Skeleton vs spinner, timeout values?

6. **Responsive Design Implementation** (FR-014 to FR-019)
   - Research: Tailwind 4.x mobile-first breakpoints
   - Research: Touch target sizing best practices (WCAG AAA 44x44px)
   - Research: Viewport-specific layout patterns
   - **Decision needed**: Breakpoint values, layout switching strategy?

### Expected Outputs

**File**: `research.md`

**Structure**:
```markdown
# Research: Enhanced UI with Post-Signin Routing Fix

## Decision 1: Routing Strategy
**Chosen**: Dual approach (Better Auth onSuccess + useEffect guard)
**Rationale**: Defense-in-depth ensures redirect happens even if onSuccess fails
**Alternatives**: Single strategy (less reliable), middleware-only (can't preserve client state)
**Implementation**: Better Auth onSuccess for happy path, useEffect for edge cases

## Decision 2: UI Component Library
**Chosen**: shadcn/ui
**Rationale**: Production-ready accessibility, fully customizable, zero runtime cost
**Alternatives**: Custom Tailwind (high dev effort), Radix UI (more configuration)
**Implementation**: Copy shadcn components into project, customize with Tailwind

[...continue for all research tasks...]
```

---

## Phase 1: Design & Contracts

### Prerequisites
- `research.md` completed with all decisions documented
- ADR created for significant architectural decisions (routing strategy, UI library choice)

### 1. Data Model (`data-model.md`)

**Note**: No database entities for this feature - this section documents UI component hierarchy and state models.

#### UI Component Hierarchy

```typescript
// Component tree (not database entities)
AuthenticatedApp
├── middleware (route protection)
├── AuthProvider (session state)
│   ├── SigninPage (with auto-redirect)
│   ├── SignupPage (with auto-redirect)
│   └── DashboardPage (protected)
│       ├── TaskList (with loading/error states)
│       │   ├── TaskSkeleton (loading state)
│       │   ├── TaskItem[] (individual tasks)
│       │   │   └── TaskActions (edit/delete buttons)
│       │   └── TaskForm (create/edit)
│       └── ErrorMessage (dismissible errors)
```

#### State Models

```typescript
// Session State (managed by AuthProvider)
interface SessionState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  checkAuth: () => Promise<void>;
  signout: () => Promise<void>;
}

// Task State (managed by useTasks hook)
interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  createTask: (title: string) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

// UI State (local component state)
interface UIState {
  isFormOpen: boolean;
  editingTaskId: string | null;
  optimisticTasks: Task[];  // For optimistic updates
  pendingActions: Set<string>;  // Track in-flight operations
}
```

#### Validation Rules

**Navigation Guards**:
- Authenticated users on `/signin` or `/signup` → auto-redirect to `/dashboard`
- Unauthenticated users on `/dashboard` → redirect to `/signin` with return URL
- Expired token → redirect to `/signin` with "Session expired" message

**Form Validation** (React Hook Form + Zod):
- Task title: 1-200 characters, required
- Email: valid email format, required
- Password: min 8 characters, required

**Loading State Transitions**:
- Default → Loading (100ms max delay)
- Loading → Success (with fade-in animation)
- Loading → Error (with error message + retry button)

### 2. API Contracts (`contracts/`)

**Note**: No new API endpoints - this documents component prop interfaces and navigation contracts.

#### Component Interfaces (`contracts/components.ts`)

```typescript
// TaskItem.tsx props
interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => Promise<void>;
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
  isPending: boolean;  // Show loading state
}

// TaskForm.tsx props
interface TaskFormProps {
  initialValue?: string;
  onSubmit: (title: string) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

// ErrorMessage.tsx props
interface ErrorMessageProps {
  message: string;
  onDismiss: () => void;
  onRetry?: () => void;  // Optional retry action
}

// LoadingSpinner.tsx props
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'inline' | 'fullscreen';
}

// ProtectedRoute.tsx props
interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;  // Show while checking auth
  redirectTo?: string;  // Default: '/signin'
}
```

#### Navigation Flows (`contracts/navigation.md`)

**Flow 1: Successful Signin**
```
User on /signin
  ↓ [submit credentials]
POST /api/auth/signin (200 OK)
  ↓ [Better Auth onSuccess callback]
router.push('/dashboard')
  ↓ [middleware validates token]
Dashboard renders
  ↓ [useEffect calls fetchTasks]
Task list appears (with fade-in)
```

**Flow 2: Protected Route Access (Unauthenticated)**
```
User navigates to /dashboard
  ↓ [middleware runs]
getTokenFromCookie() → null
  ↓ [redirect with return URL]
/signin?returnUrl=/dashboard
  ↓ [after signin]
Redirect to /dashboard
```

**Flow 3: Expired Token**
```
User on /dashboard
  ↓ [API request]
GET /api/{user_id}/tasks (401 Unauthorized)
  ↓ [API client error handler]
Clear expired token
  ↓ [show error + redirect]
/signin?message=session_expired
```

**Flow 4: Optimistic Task Creation**
```
User clicks "Add Task"
  ↓ [immediate UI update]
Task appears in list (optimistic)
  ↓ [API call in background]
POST /api/{user_id}/tasks
  ↓ [on success]
Replace optimistic task with server task
  ↓ [on error]
Remove optimistic task + show error + retry button
```

### 3. Developer Quickstart (`quickstart.md`)

```markdown
# Quickstart: Enhanced UI Development

## Prerequisites
- Node.js 20+ installed
- Frontend dev server running (`npm run dev` in `/frontend`)
- Backend API running on port 8000 (from Spec 002)

## Installation

### 1. Install shadcn/ui CLI
\`\`\`bash
cd frontend
npx shadcn@latest init
# Follow prompts:
# - TypeScript: Yes
# - Style: Default
# - Base color: Slate
# - CSS variables: Yes
\`\`\`

### 2. Install Required Components
\`\`\`bash
npx shadcn@latest add button card input dialog skeleton
npx shadcn@latest add dropdown-menu checkbox label
\`\`\`

### 3. Verify Installation
\`\`\`bash
ls components/ui  # Should show button.tsx, card.tsx, etc.
\`\`\`

## Development Workflow

### Phase 1: Fix Auth Routing (P1 - MVP)
1. Create middleware: `touch middleware.ts`
2. Modify AuthProvider: Add redirect logic in `checkAuth()`
3. Update signin page: Add `onSuccess` redirect
4. Update signup page: Add `onSuccess` redirect
5. Test: Signin → Auto-redirect to dashboard within 1 second

### Phase 2: Loading States (P2)
1. Create LoadingSpinner component
2. Add skeleton loader for task list
3. Update useTasks: Add loading states
4. Test: Loading indicators appear within 100ms

### Phase 3: Responsive Design (P2)
1. Update TaskList: Mobile-first layout
2. Add Tailwind breakpoints: `sm:`, `md:`, `lg:`
3. Test at breakpoints: 320px, 768px, 1024px, 1440px

### Phase 4: Animations & Polish (P3)
1. Add Tailwind transitions to buttons/cards
2. Add fade-in animation for task creation
3. Add hover states with smooth transitions
4. Test: Animations run at 60fps

## Testing Checklist

- [ ] Signin → Dashboard redirect < 1 second
- [ ] Unauthenticated /dashboard → Signin redirect
- [ ] Loading spinners appear within 100ms
- [ ] Task list renders on mobile (320px)
- [ ] Touch targets ≥ 44x44px
- [ ] Animations smooth (no jank)
- [ ] Error messages dismissible + retry works

## Troubleshooting

**Issue**: Redirect not working after signin
**Fix**: Check Better Auth onSuccess callback + useEffect redirect logic

**Issue**: Token not attached to API requests
**Fix**: Verify getTokenFromCookie() returns valid JWT

**Issue**: Layout breaks on mobile
**Fix**: Use mobile-first Tailwind classes (no `sm:` prefix for base)
```

### 4. Update Agent Context

After creating all design artifacts:

```bash
.specify/scripts/bash/update-agent-context.sh claude
```

This will update `CLAUDE.md` with new technologies added for this feature (shadcn/ui, Next.js middleware patterns).

---

## Phase 1 Completion Checklist

- [ ] `research.md` created with all 6 decisions documented
- [ ] `data-model.md` created with UI component hierarchy and state models
- [ ] `contracts/` directory created with component interfaces and navigation flows
- [ ] `quickstart.md` created with developer setup instructions
- [ ] Agent context updated via `update-agent-context.sh`
- [ ] Constitution Check re-validated (confirm no violations after design)

---

## Next Steps (Post-Planning)

**After this `/sp.plan` command completes**:

1. **Review the plan** - Ensure all technical decisions are sound
2. **Create ADRs** - Document significant decisions:
   - `/sp.adr routing-strategy-dual-approach`
   - `/sp.adr ui-library-shadcn-selection`
3. **Generate tasks** - Run `/sp.tasks` to break down into actionable items
4. **Implement** - Run `/sp.implement` or manually execute tasks

**Implementation Phases** (for `/sp.tasks` command):

1. **Phase 1: Auth Flow Fix** (P1 - MVP)
   - Create middleware.ts for route protection
   - Modify AuthProvider with redirect logic
   - Update signin/signup pages with auto-redirect
   - Test signin → dashboard flow

2. **Phase 2: UI Component Library** (P2)
   - Install and configure shadcn/ui
   - Create reusable Button, Card, Input components
   - Create LoadingSpinner and ErrorMessage components
   - Test component rendering

3. **Phase 3: Dashboard Layout** (P2)
   - Restructure dashboard with Card containers
   - Add responsive grid layout
   - Implement mobile-first breakpoints
   - Test at 4 viewport sizes

4. **Phase 4: Enhanced Task Components** (P2)
   - Create TaskList with loading/error states
   - Create TaskItem with hover effects
   - Create TaskForm with React Hook Form
   - Add task skeleton loader

5. **Phase 5: Optimistic Updates** (P2)
   - Modify useTasks hook for optimistic updates
   - Add rollback logic for failed operations
   - Test create/toggle/delete with optimistic UI

6. **Phase 6: Animations & Polish** (P3)
   - Add CSS transitions to interactive elements
   - Add fade-in animations for task operations
   - Add hover states with smooth transitions
   - Test 60fps animation performance

7. **Phase 7: Navigation Testing** (Final)
   - End-to-end test: Signup → Dashboard
   - End-to-end test: Signin → Dashboard
   - Test protected route redirects
   - Test expired token handling
   - Test deep link preservation

**Estimated Complexity**: Medium (24 functional requirements, 8 file modifications, 10+ component creations)

---

## Architectural Decision Records (ADRs)

### Required ADRs for This Feature

1. **ADR: Dual Routing Strategy for Post-Signin Navigation**
   - **Decision**: Use both Better Auth onSuccess callback AND useEffect redirect guard
   - **Context**: Need reliable navigation after authentication
   - **Consequences**: Slight code duplication, but defense-in-depth ensures redirect happens
   - **Alternatives**: Single strategy (less reliable), middleware-only (loses client state)

2. **ADR: shadcn/ui Component Library Adoption**
   - **Decision**: Use shadcn/ui for all UI components instead of custom Tailwind
   - **Context**: Need production-ready, accessible components quickly
   - **Consequences**: Additional dependencies, but saves development time and ensures WCAG compliance
   - **Alternatives**: Custom Tailwind (high effort), Radix UI (more config), Material UI (not Tailwind-native)

3. **ADR: CSS Transitions Over Framer Motion**
   - **Decision**: Use native CSS transitions for animations (upgrade to Framer Motion only if needed)
   - **Context**: Animation requirements are simple (fades, hovers, basic transitions)
   - **Consequences**: Less bundle size, better performance, but limited to simple animations
   - **Alternatives**: Framer Motion (overkill for current needs), GSAP (jQuery-style API)

4. **ADR: React Context for State Management**
   - **Decision**: Continue using React Context with optimistic updates (no Zustand)
   - **Context**: State management needs are simple (auth state + task list)
   - **Consequences**: No additional dependencies, but manual optimization needed
   - **Alternatives**: Zustand (adds dependency), Redux (massive overkill), Jotai (similar to Context)

**Command to create ADRs** (after planning):
```bash
/sp.adr routing-strategy-dual-approach
/sp.adr ui-library-shadcn-selection
```

---

## Risk Analysis

### High-Risk Areas

1. **Redirect Loop Risk** (FR-001, FR-004)
   - **Risk**: Infinite redirect between /signin and /dashboard if auth state incorrectly detected
   - **Mitigation**: Add redirect guard in middleware, check auth state before redirect
   - **Test**: Navigate between routes multiple times, verify no loops

2. **Token Expiry During Session** (FR-007)
   - **Risk**: User's token expires while using dashboard, causing sudden logouts
   - **Mitigation**: Implement graceful error handling with "Session expired" message
   - **Test**: Manually expire token, trigger API call, verify redirect + message

3. **Mobile Layout Breakage** (FR-014 to FR-019)
   - **Risk**: Complex layouts may break on small screens (320px)
   - **Mitigation**: Mobile-first development, test at minimum width continuously
   - **Test**: Chrome DevTools device emulation at 320px, 375px, 414px

4. **Animation Performance** (FR-020 to FR-023)
   - **Risk**: Heavy animations cause jank on lower-end devices
   - **Mitigation**: Use hardware-accelerated transforms (translate, scale), avoid layout thrashing
   - **Test**: Chrome DevTools Performance tab, aim for 60fps

### Medium-Risk Areas

1. **shadcn/ui Customization** (FR-008 to FR-024)
   - **Risk**: shadcn components may not match design system perfectly
   - **Mitigation**: Customize Tailwind theme, override component styles
   - **Test**: Visual regression testing

2. **Deep Link Preservation** (FR-005)
   - **Risk**: Return URL query param may be lost during redirects
   - **Mitigation**: Encode return URL, test with multiple redirect hops
   - **Test**: Navigate to /dashboard?tab=settings while unauthenticated, verify redirect back

### Low-Risk Areas

1. **Backward Compatibility** (No breaking changes)
   - **Risk**: UI changes break existing task management functionality
   - **Mitigation**: Thorough manual testing of all CRUD operations
   - **Test**: Complete user journey (signup → signin → create/toggle/edit/delete tasks)

---

## Success Criteria (from Spec)

All 10 success criteria from the spec must be validated:

- [ ] **SC-001**: Users navigate to dashboard within 1 second of signin
- [ ] **SC-002**: 100% of protected routes redirect unauthenticated users
- [ ] **SC-003**: Visual feedback appears within 100ms
- [ ] **SC-004**: Functionality maintained at 320px width
- [ ] **SC-005**: Touch targets meet 44x44px minimum
- [ ] **SC-006**: Hover transitions are smooth (200-300ms, no lag)
- [ ] **SC-007**: Complete task workflow without UI breakage
- [ ] **SC-008**: Error messages are dismissible with retry option
- [ ] **SC-009**: Optimistic UI updates provide instant feedback
- [ ] **SC-010**: Dashboard loads within 2 seconds on 4G

---

**Plan Status**: ✅ **Phase 1 Design Complete** - Ready for `/sp.tasks` command

**Next Command**: `/sp.tasks` to generate actionable task breakdown with test cases
