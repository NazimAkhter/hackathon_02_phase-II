# Data Model: Enhanced UI with Post-Signin Routing Fix

**Feature**: 004-ui-enhancement-routing
**Date**: 2026-01-22
**Type**: UI/Frontend Enhancement (No Database Changes)

## Overview

This feature is a **frontend-only enhancement** with no database schema modifications. This document describes:
- UI component hierarchy and relationships
- Frontend state models (React state, not database entities)
- Navigation flow states
- Client-side validation rules

**Note**: The `users` and `tasks` database tables remain unchanged from Spec 002. All enhancements occur in the presentation layer.

---

## UI Component Hierarchy

### Application Structure

```
App (Next.js 16 App Router)
│
├── middleware.ts (Route Protection)
│   └── Validates JWT token before rendering protected routes
│
├── app/layout.tsx (Root Layout)
│   └── AuthProvider (Client Component - Session Management)
│       ├── Manages global authentication state
│       ├── Provides auth context to children
│       └── Handles auto-redirects for authenticated/unauthenticated users
│
├── app/(auth)/signin/page.tsx (Public Route)
│   ├── SigninForm (React Hook Form)
│   ├── LoadingSpinner (during submission)
│   ├── ErrorMessage (on failure)
│   └── Auto-redirect to /dashboard on success
│
├── app/(auth)/signup/page.tsx (Public Route)
│   ├── SignupForm (React Hook Form)
│   ├── LoadingSpinner (during submission)
│   ├── ErrorMessage (on failure)
│   └── Auto-redirect to /dashboard on success
│
└── app/dashboard/page.tsx (Protected Route)
    ├── DashboardLayout (Responsive Container)
    ├── TaskProvider (Task State Management)
    │   ├── TaskList (Main Container)
    │   │   ├── TaskSkeleton (Loading State)
    │   │   ├── TaskItem[] (Individual Tasks)
    │   │   │   ├── Checkbox (Toggle Completion)
    │   │   │   ├── TaskTitle (Editable Text)
    │   │   │   ├── TaskActions (Edit/Delete Buttons)
    │   │   │   └── LoadingSpinner (Pending State)
    │   │   ├── TaskForm (Create/Edit Modal)
    │   │   │   ├── Input (Title Field)
    │   │   │   ├── Button (Submit)
    │   │   │   └── LoadingSpinner (Submitting)
    │   │   └── EmptyState (No Tasks)
    │   └── ErrorMessage (API Errors)
    └── Header (User Info + Logout)
```

### Component Relationships

```
AuthProvider (Global State)
  ↓ provides
SessionContext { user, isAuthenticated, isLoading, checkAuth, signout }
  ↓ consumed by
All Pages (via useAuth hook)

TaskProvider (Feature State)
  ↓ provides
TaskContext { tasks, isLoading, error, fetchTasks, createTask, updateTask, deleteTask }
  ↓ consumed by
Dashboard Components (via useTasks hook)
```

---

## State Models

### 1. Authentication State (Global)

**Managed by**: `AuthProvider.tsx` (React Context)
**Scope**: Application-wide

```typescript
interface SessionState {
  // User Information
  user: User | null;              // Current authenticated user or null

  // Authentication Status
  isAuthenticated: boolean;       // True if user has valid JWT token
  isLoading: boolean;             // True during auth check (prevents flicker)

  // Error State
  error: string | null;           // Auth-related errors (e.g., "Session expired")

  // Actions
  checkAuth: () => Promise<void>; // Validate token and refresh user data
  signout: () => Promise<void>;   // Clear session and redirect to signin
  signin: (credentials: SigninData) => Promise<SigninResult>;
  signup: (credentials: SignupData) => Promise<SignupResult>;
}

interface User {
  id: string;                     // UUID from database
  email: string;                  // User's email address
  name?: string;                  // Optional display name
  created_at: string;             // ISO timestamp
}

interface SigninData {
  email: string;
  password: string;
}

interface SignupData {
  email: string;
  password: string;
  name?: string;
}

interface SigninResult {
  success: boolean;
  user?: User;
  error?: string;
}

interface SignupResult {
  success: boolean;
  user?: User;
  error?: string;
}
```

**State Transitions**:
```
Initial → Loading (checking token)
  ↓
Loading → Authenticated (token valid, user data fetched)
       → Unauthenticated (no token or invalid)

Authenticated → Unauthenticated (signout or token expired)

Unauthenticated → Loading (attempting signin/signup)
                → Authenticated (signin/signup success)
                → Error (signin/signup failure)
```

**Persistence**: JWT token stored in httpOnly cookie (managed by Better Auth)

---

### 2. Task State (Feature-Scoped)

**Managed by**: `useTasks` hook (React Context)
**Scope**: Dashboard page and task-related components

```typescript
interface TaskState {
  // Task Data
  tasks: Task[];                  // Array of user's tasks

  // Loading State
  isLoading: boolean;             // True during initial fetch
  isRefreshing: boolean;          // True during background refetch

  // Error State
  error: string | null;           // Task operation errors

  // Pending Operations (for optimistic UI)
  pendingCreates: Set<string>;    // Temporary IDs of tasks being created
  pendingUpdates: Set<string>;    // IDs of tasks being updated
  pendingDeletes: Set<string>;    // IDs of tasks being deleted

  // Actions
  fetchTasks: () => Promise<void>;
  createTask: (title: string) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;  // Convenience method for completion toggle
  deleteTask: (id: string) => Promise<void>;

  // Error Recovery
  retryLastOperation: () => Promise<void>;
  dismissError: () => void;
}

interface Task {
  id: string;                     // UUID from database
  user_id: string;                // Foreign key to users table
  title: string;                  // Task description (1-200 characters)
  completed: boolean;             // Completion status
  created_at: string;             // ISO timestamp
  updated_at: string;             // ISO timestamp

  // Client-side only (not in database)
  _optimistic?: boolean;          // True if pending server confirmation
  _tempId?: string;               // Temporary ID for optimistic creates
}
```

**State Transitions**:
```
Initial → Loading (fetching tasks)
  ↓
Loading → Loaded (tasks fetched successfully)
       → Error (fetch failed)

Loaded → Refreshing (background refetch)
      → Creating (optimistic create)
      → Updating (optimistic update)
      → Deleting (optimistic delete)

Creating → Loaded (server confirms)
        → Error + Rollback (server rejects)

Updating → Loaded (server confirms)
        → Error + Rollback (server rejects)

Deleting → Loaded (server confirms)
        → Error + Rollback (server rejects)

Error → Loaded (retry success)
     → Dismissed (user dismisses error)
```

**Optimistic Update Pattern**:
1. Immediately update local state (user sees change instantly)
2. Mark operation as pending (show loading indicator on item)
3. Send API request in background
4. On success: Replace optimistic update with server data
5. On failure: Rollback local change + show error message + offer retry

---

### 3. Form State (Component-Scoped)

**Managed by**: React Hook Form
**Scope**: Individual form components (signin, signup, task create/edit)

```typescript
// Signin/Signup Form State
interface AuthFormState {
  email: string;                  // Input value
  password: string;               // Input value
  name?: string;                  // Signup only

  // Form Status (managed by React Hook Form)
  isSubmitting: boolean;          // True during API call
  isValid: boolean;               // True if validation passes
  isDirty: boolean;               // True if user has made changes

  // Validation Errors
  errors: {
    email?: string;               // "Please enter a valid email"
    password?: string;            // "Password must be at least 8 characters"
    name?: string;                // "Name is required"
  };
}

// Task Create/Edit Form State
interface TaskFormState {
  title: string;                  // Input value (1-200 characters)

  // Form Status
  isSubmitting: boolean;          // True during API call
  isValid: boolean;               // True if validation passes

  // Validation Errors
  errors: {
    title?: string;               // "Title is required" or "Max 200 characters"
  };
}
```

---

### 4. UI State (Local Component State)

**Managed by**: `useState` in individual components
**Scope**: Per-component

```typescript
// Dashboard Page UI State
interface DashboardUIState {
  isTaskFormOpen: boolean;        // Modal open/closed
  editingTaskId: string | null;   // ID of task being edited (null if creating new)
  showDeleteConfirm: string | null; // ID of task awaiting delete confirmation
}

// Task List UI State
interface TaskListUIState {
  hoveredTaskId: string | null;   // For hover effects
  focusedTaskId: string | null;   // For keyboard navigation
}

// Responsive UI State (derived from window.innerWidth)
interface ResponsiveState {
  isMobile: boolean;              // < 768px
  isTablet: boolean;              // 768px - 1024px
  isDesktop: boolean;             // >= 1024px

  // Touch device detection
  isTouchDevice: boolean;         // True if supports touch events
}
```

---

## Navigation Flow States

### 1. Signin Flow

```
State: "idle" (user on /signin page, not authenticated)
  ↓ [user submits credentials]
State: "submitting" (form disabled, spinner visible)
  ↓ [API call to /api/auth/signin]
State: "success" (token received, user data loaded)
  ↓ [Better Auth onSuccess callback fires]
State: "redirecting" (router.push('/dashboard'))
  ↓ [middleware validates token]
State: "authenticated_dashboard" (dashboard renders, fetching tasks)
```

**Error States**:
```
State: "submitting"
  ↓ [API returns 401]
State: "error" (show "Invalid credentials", enable retry)

State: "submitting"
  ↓ [Network error]
State: "error" (show "Connection failed. Please try again.", enable retry)
```

### 2. Protected Route Access (Unauthenticated)

```
State: "unauthenticated" (no token)
  ↓ [user navigates to /dashboard]
Middleware: "checking_token" (getTokenFromCookie())
  ↓ [token is null]
Middleware: "redirecting_to_signin" (redirect('/signin?returnUrl=/dashboard'))
  ↓ [router redirect]
State: "signin_page_with_return_url" (after signin, redirect back to /dashboard)
```

### 3. Token Expiry Mid-Session

```
State: "authenticated_dashboard" (user viewing task list)
  ↓ [user clicks "Add Task"]
State: "creating_task" (API call to POST /api/{user_id}/tasks)
  ↓ [API returns 401 Unauthorized - token expired]
API Client: "token_expired_detected" (error interceptor catches 401)
  ↓ [clear expired token]
API Client: "redirecting_to_signin" (redirect('/signin?message=session_expired'))
  ↓ [router redirect]
State: "signin_page_with_message" (show "Your session has expired. Please sign in again.")
```

### 4. Authenticated User on Signin Page (Redirect Loop Prevention)

```
State: "authenticated" (user has valid token)
  ↓ [user manually navigates to /signin]
AuthProvider useEffect: "detecting_authenticated_on_public_route"
  ↓ [isAuthenticated && pathname === '/signin']
AuthProvider: "redirecting_to_dashboard" (router.push('/dashboard'))
  ↓ [router redirect]
State: "authenticated_dashboard" (prevents user from seeing signin form)
```

**Guard Conditions**:
- Prevent redirect if already on dashboard (avoid loop)
- Check token validity before redirect (avoid redirect to dashboard with expired token)
- Only redirect from `/signin` and `/signup` (other public pages allowed)

---

## Client-Side Validation Rules

### Authentication Forms

**Signin Validation** (React Hook Form + Zod):
```typescript
const signinSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
});
```

**Signup Validation**:
```typescript
const signupSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
});
```

### Task Forms

**Task Create/Edit Validation**:
```typescript
const taskSchema = z.object({
  title: z
    .string()
    .min(1, 'Task title is required')
    .max(200, 'Task title must be less than 200 characters')
    .trim(),  // Remove leading/trailing whitespace
});
```

**Additional Validation Rules**:
- Empty strings after trim are rejected
- HTML/script tags are stripped (XSS prevention)
- Emoji allowed (Unicode support)

### Navigation Guards

**Middleware Validation**:
```typescript
// Protect routes from unauthenticated access
const protectedRoutes = ['/dashboard'];
const publicRoutes = ['/signin', '/signup', '/'];

// Check authentication status
const token = getTokenFromCookie(request);
const isAuthenticated = token !== null;

// Redirect logic
if (protectedRoutes.includes(pathname) && !isAuthenticated) {
  return redirect(`/signin?returnUrl=${encodeURIComponent(pathname)}`);
}

if (publicRoutes.includes(pathname) && isAuthenticated) {
  return redirect('/dashboard');
}
```

### Touch Target Validation (WCAG 2.1)

**Minimum Size Requirements**:
```css
/* All interactive elements must meet minimum touch target size */
.button, .checkbox, .link {
  min-height: 44px;  /* WCAG AAA guideline */
  min-width: 44px;
}

/* Checkboxes have smaller visual size but larger clickable area */
.checkbox-input {
  width: 24px;
  height: 24px;
  padding: 10px;  /* Total clickable: 44x44px */
}
```

---

## State Persistence

### JWT Token (httpOnly Cookie)
- **Managed by**: Better Auth
- **Storage**: httpOnly cookie (secure, not accessible to JavaScript)
- **Lifetime**: 7 days
- **Renewal**: Automatic on signin/signup
- **Revocation**: On signout or token expiry

### UI Preferences (Not Implemented Yet)
*Future enhancement: LocalStorage for user preferences*
- Theme (light/dark mode)
- Task sort order
- Sidebar collapsed state

**Currently**: No client-side persistence beyond JWT token

---

## Data Relationships

### Frontend-Backend Relationship

```
Frontend State → API Request → Backend Database
                              ↓
Frontend State ← API Response ← Backend Database
```

**Example: Create Task Flow**
```
User action: Click "Add Task"
  ↓
Frontend: Create optimistic task (temp ID)
  ↓ useState update
Frontend: tasks = [...tasks, optimisticTask]
  ↓ API call
POST /api/{user_id}/tasks { "title": "New task" }
  ↓ Backend validation
Backend: Validate user_id from JWT, create record in `tasks` table
  ↓ Backend response
{ "id": "uuid-123", "title": "New task", "completed": false, ... }
  ↓ Frontend update
Frontend: Replace optimistic task with server response
  ↓ setState update
Frontend: tasks = tasks.map(t => t._tempId === tempId ? serverTask : t)
```

### User-Task Relationship (Database)

**Note**: This relationship is defined in the database (Spec 002), not modified by this feature.

```
users (1) ──── (many) tasks
  id ←───────── user_id (FK)
  email
  password_hash
  created_at
  updated_at
```

**Filtering**: All task operations filter by `user_id` from JWT token (enforced by backend)

---

## Component State Dependencies

### Dependency Graph

```
AuthProvider (root)
  ├─ provides: SessionContext
  │  ├─ consumed by: middleware.ts (route protection)
  │  ├─ consumed by: app/layout.tsx (conditional rendering)
  │  ├─ consumed by: app/(auth)/*/page.tsx (auto-redirect logic)
  │  └─ consumed by: app/dashboard/page.tsx (user info, signout)
  │
  └─ TaskProvider (dashboard-scoped)
     ├─ depends on: SessionContext.user (for API calls)
     ├─ provides: TaskContext
     │  ├─ consumed by: TaskList (render tasks)
     │  ├─ consumed by: TaskItem (toggle, edit, delete)
     │  └─ consumed by: TaskForm (create, update)
     │
     └─ UI Components (local state)
        ├─ LoadingSpinner (no dependencies)
        ├─ ErrorMessage (no dependencies)
        └─ TaskSkeleton (no dependencies)
```

**Initialization Order**:
1. AuthProvider mounts → checks token → sets `isAuthenticated`
2. If authenticated → renders children (including dashboard)
3. Dashboard mounts → TaskProvider initializes → calls `fetchTasks()`
4. Tasks load → TaskList renders → TaskItems appear

---

## Validation Summary

### Authentication Validation
- ✅ Email format (RFC 5322 compliant)
- ✅ Password strength (8+ chars, mixed case, number)
- ✅ Name length (1-100 characters)

### Task Validation
- ✅ Title required (1-200 characters)
- ✅ HTML/script stripping (XSS prevention)
- ✅ Whitespace trimming

### UI Validation
- ✅ Touch targets ≥ 44x44px (WCAG AAA)
- ✅ Color contrast ≥ 4.5:1 for text (WCAG AA)
- ✅ Focus indicators visible (keyboard navigation)
- ✅ ARIA labels on interactive elements

### Navigation Validation
- ✅ Token validity before rendering protected routes
- ✅ Redirect loop prevention (check current path)
- ✅ Return URL preservation (query param encoding)

---

## State Model Testing Strategy

### Unit Tests (React Testing Library)
- ✅ AuthProvider state transitions
- ✅ useTasks hook optimistic updates
- ✅ Form validation (React Hook Form)

### Integration Tests
- ✅ Signin → Dashboard flow (including redirect)
- ✅ Create task with optimistic UI (create → confirm → rollback on error)
- ✅ Token expiry → Signin redirect

### Manual Tests
- ✅ Responsive state at 4 breakpoints (320px, 768px, 1024px, 1440px)
- ✅ Touch target sizing on mobile devices
- ✅ Keyboard navigation (tab, enter, escape)

---

**Data Model Status**: ✅ **Complete** - Ready for contract definition
