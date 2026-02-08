/**
 * Component Prop Interfaces
 *
 * This file defines TypeScript interfaces for all UI components in the
 * Enhanced UI feature (004-ui-enhancement-routing). These contracts ensure
 * type safety and serve as documentation for component APIs.
 *
 * Feature: 004-ui-enhancement-routing
 * Date: 2026-01-22
 */

// ============================================================================
// Task Management Components
// ============================================================================

/**
 * TaskItem - Individual task card/row in the task list
 *
 * Displays a single task with completion checkbox, title, and action buttons.
 * Shows loading state while operations are pending.
 *
 * @example
 * <TaskItem
 *   task={task}
 *   onToggle={handleToggle}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   isPending={pendingOps.has(task.id)}
 * />
 */
export interface TaskItemProps {
  /** Task data to display */
  task: Task;

  /** Called when user toggles completion checkbox */
  onToggle: (id: string) => Promise<void>;

  /** Called when user clicks edit button - opens edit modal */
  onEdit: (id: string) => void;

  /** Called when user clicks delete button - may show confirmation */
  onDelete: (id: string) => Promise<void>;

  /** True if an operation is pending on this task (shows loading spinner) */
  isPending: boolean;

  /** Optional CSS class names for styling */
  className?: string;
}

/**
 * TaskList - Container for all tasks with loading and empty states
 *
 * Renders task skeleton during loading, empty state when no tasks,
 * or list of TaskItem components when tasks are available.
 *
 * @example
 * <TaskList
 *   tasks={tasks}
 *   isLoading={isLoading}
 *   error={error}
 *   onCreateTask={handleCreate}
 *   onToggleTask={handleToggle}
 *   onEditTask={handleEdit}
 *   onDeleteTask={handleDelete}
 *   pendingOps={pendingOps}
 * />
 */
export interface TaskListProps {
  /** Array of tasks to display */
  tasks: Task[];

  /** True during initial fetch (shows skeleton) */
  isLoading: boolean;

  /** Error message to display (null if no error) */
  error: string | null;

  /** Called when user creates a new task */
  onCreateTask: (title: string) => Promise<void>;

  /** Called when user toggles task completion */
  onToggleTask: (id: string) => Promise<void>;

  /** Called when user edits a task */
  onEditTask: (id: string, title: string) => Promise<void>;

  /** Called when user deletes a task */
  onDeleteTask: (id: string) => Promise<void>;

  /** Set of task IDs with pending operations */
  pendingOps: Set<string>;

  /** Optional CSS class names for styling */
  className?: string;
}

/**
 * TaskForm - Modal/dialog for creating or editing tasks
 *
 * Used for both task creation (initialValue undefined) and editing
 * (initialValue provided). Integrates with React Hook Form for validation.
 *
 * @example
 * // Create mode
 * <TaskForm
 *   onSubmit={handleCreate}
 *   onCancel={handleClose}
 *   isSubmitting={isSubmitting}
 * />
 *
 * // Edit mode
 * <TaskForm
 *   initialValue={task.title}
 *   onSubmit={handleUpdate}
 *   onCancel={handleClose}
 *   isSubmitting={isSubmitting}
 * />
 */
export interface TaskFormProps {
  /** Initial value for edit mode (undefined for create mode) */
  initialValue?: string;

  /** Called when form is submitted with valid data */
  onSubmit: (title: string) => Promise<void>;

  /** Called when user cancels form (closes modal) */
  onCancel: () => void;

  /** True while API request is in progress (disables form) */
  isSubmitting: boolean;

  /** Optional form title (default: "Add Task" or "Edit Task") */
  title?: string;

  /** Optional CSS class names for styling */
  className?: string;
}

/**
 * TaskSkeleton - Loading placeholder for task list
 *
 * Shows skeleton loaders to indicate content structure while
 * tasks are being fetched from the API.
 *
 * @example
 * <TaskSkeleton count={5} />
 */
export interface TaskSkeletonProps {
  /** Number of skeleton items to show (default: 5) */
  count?: number;

  /** Optional CSS class names for styling */
  className?: string;
}

// ============================================================================
// Shared UI Components
// ============================================================================

/**
 * LoadingSpinner - Reusable loading indicator
 *
 * Used in buttons, forms, and page loads. Supports different sizes
 * and variants (inline vs fullscreen).
 *
 * @example
 * // Inline button spinner
 * <LoadingSpinner size="sm" variant="inline" />
 *
 * // Fullscreen page spinner
 * <LoadingSpinner size="lg" variant="fullscreen" />
 */
export interface LoadingSpinnerProps {
  /** Spinner size (default: 'md') */
  size?: 'sm' | 'md' | 'lg';

  /** Display variant (default: 'inline') */
  variant?: 'inline' | 'fullscreen';

  /** Optional label for screen readers */
  label?: string;

  /** Optional CSS class names for styling */
  className?: string;
}

/**
 * ErrorMessage - Dismissible error notification
 *
 * Displays error messages with optional retry button.
 * User can dismiss the message manually.
 *
 * @example
 * <ErrorMessage
 *   message="Failed to create task. Please try again."
 *   onDismiss={handleDismiss}
 *   onRetry={handleRetry}
 * />
 */
export interface ErrorMessageProps {
  /** Error message text to display */
  message: string;

  /** Called when user dismisses the error */
  onDismiss: () => void;

  /** Optional retry handler (shows retry button if provided) */
  onRetry?: () => void;

  /** Error severity (affects styling) */
  severity?: 'error' | 'warning' | 'info';

  /** Optional CSS class names for styling */
  className?: string;
}

/**
 * ProtectedRoute - Higher-order component for route protection
 *
 * Wraps protected content and redirects unauthenticated users to signin.
 * Shows fallback content while checking authentication status.
 *
 * @example
 * <ProtectedRoute fallback={<LoadingSpinner />} redirectTo="/signin">
 *   <DashboardContent />
 * </ProtectedRoute>
 */
export interface ProtectedRouteProps {
  /** Content to show when authenticated */
  children: React.ReactNode;

  /** Content to show while checking auth (default: spinner) */
  fallback?: React.ReactNode;

  /** Redirect destination for unauthenticated users (default: '/signin') */
  redirectTo?: string;

  /** Optional CSS class names for wrapper */
  className?: string;
}

// ============================================================================
// Auth Components
// ============================================================================

/**
 * SigninForm - User signin form with validation
 *
 * Integrates with React Hook Form and Better Auth. Shows loading
 * state during submission and error messages on failure.
 *
 * @example
 * <SigninForm
 *   onSuccess={handleSigninSuccess}
 *   onError={handleSigninError}
 * />
 */
export interface SigninFormProps {
  /** Called on successful signin (before redirect) */
  onSuccess?: (user: User) => void;

  /** Called on signin failure */
  onError?: (error: string) => void;

  /** Optional CSS class names for styling */
  className?: string;
}

/**
 * SignupForm - User registration form with validation
 *
 * Similar to SigninForm but includes name field. Validates password
 * strength and shows requirements.
 *
 * @example
 * <SignupForm
 *   onSuccess={handleSignupSuccess}
 *   onError={handleSignupError}
 * />
 */
export interface SignupFormProps {
  /** Called on successful signup (before redirect) */
  onSuccess?: (user: User) => void;

  /** Called on signup failure */
  onError?: (error: string) => void;

  /** Optional CSS class names for styling */
  className?: string;
}

// ============================================================================
// Layout Components
// ============================================================================

/**
 * DashboardLayout - Responsive container for dashboard content
 *
 * Provides responsive padding, max-width constraints, and mobile-first
 * layout structure for dashboard content.
 *
 * @example
 * <DashboardLayout>
 *   <Header />
 *   <TaskList />
 * </DashboardLayout>
 */
export interface DashboardLayoutProps {
  /** Dashboard content */
  children: React.ReactNode;

  /** Optional header content */
  header?: React.ReactNode;

  /** Optional CSS class names for styling */
  className?: string;
}

/**
 * Header - App header with user info and navigation
 *
 * Shows user email, optional avatar, and signout button.
 * Responsive design with mobile hamburger menu.
 *
 * @example
 * <Header user={user} onSignout={handleSignout} />
 */
export interface HeaderProps {
  /** Current user data */
  user: User | null;

  /** Called when user clicks signout */
  onSignout: () => Promise<void>;

  /** Optional CSS class names for styling */
  className?: string;
}

// ============================================================================
// Data Types (Referenced by Components)
// ============================================================================

/**
 * Task - Task entity from API
 *
 * Matches backend Task model with additional client-side fields
 * for optimistic updates.
 */
export interface Task {
  /** UUID from database */
  id: string;

  /** Foreign key to users table */
  user_id: string;

  /** Task description (1-200 characters) */
  title: string;

  /** Completion status */
  completed: boolean;

  /** ISO timestamp */
  created_at: string;

  /** ISO timestamp */
  updated_at: string;

  // Client-side only (not in database)
  /** True if pending server confirmation */
  _optimistic?: boolean;

  /** Temporary ID for optimistic creates */
  _tempId?: string;
}

/**
 * User - User entity from API
 *
 * Matches backend User model (excludes password_hash for security).
 */
export interface User {
  /** UUID from database */
  id: string;

  /** User's email address */
  email: string;

  /** Optional display name */
  name?: string;

  /** ISO timestamp */
  created_at: string;

  /** ISO timestamp */
  updated_at: string;
}

/**
 * SigninData - Request payload for signin
 */
export interface SigninData {
  email: string;
  password: string;
}

/**
 * SignupData - Request payload for signup
 */
export interface SignupData {
  email: string;
  password: string;
  name?: string;
}

/**
 * SigninResult - Response from signin API
 */
export interface SigninResult {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * SignupResult - Response from signup API
 */
export interface SignupResult {
  success: boolean;
  user?: User;
  error?: string;
}

// ============================================================================
// Context Types (Provided by Providers)
// ============================================================================

/**
 * SessionContext - Global authentication context
 *
 * Provided by AuthProvider, consumed via useAuth() hook.
 */
export interface SessionContext {
  /** Current authenticated user (null if not authenticated) */
  user: User | null;

  /** True if user has valid JWT token */
  isAuthenticated: boolean;

  /** True during auth check (prevents flicker) */
  isLoading: boolean;

  /** Auth-related errors (e.g., "Session expired") */
  error: string | null;

  /** Validate token and refresh user data */
  checkAuth: () => Promise<void>;

  /** Clear session and redirect to signin */
  signout: () => Promise<void>;

  /** Authenticate user with credentials */
  signin: (credentials: SigninData) => Promise<SigninResult>;

  /** Register new user with credentials */
  signup: (credentials: SignupData) => Promise<SignupResult>;
}

/**
 * TaskContext - Task management context
 *
 * Provided by TaskProvider (dashboard-scoped), consumed via useTasks() hook.
 */
export interface TaskContext {
  /** Array of user's tasks */
  tasks: Task[];

  /** True during initial fetch */
  isLoading: boolean;

  /** True during background refetch */
  isRefreshing: boolean;

  /** Task operation errors */
  error: string | null;

  /** Temporary IDs of tasks being created */
  pendingCreates: Set<string>;

  /** IDs of tasks being updated */
  pendingUpdates: Set<string>;

  /** IDs of tasks being deleted */
  pendingDeletes: Set<string>;

  /** Fetch all tasks from API */
  fetchTasks: () => Promise<void>;

  /** Create new task with optimistic update */
  createTask: (title: string) => Promise<void>;

  /** Update task with optimistic update */
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;

  /** Toggle task completion with optimistic update */
  toggleTask: (id: string) => Promise<void>;

  /** Delete task with optimistic update */
  deleteTask: (id: string) => Promise<void>;

  /** Retry last failed operation */
  retryLastOperation: () => Promise<void>;

  /** Dismiss current error message */
  dismissError: () => void;
}

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * useAuth - Hook return type for authentication
 *
 * Re-exports SessionContext for consumption in components.
 */
export type UseAuthReturn = SessionContext;

/**
 * useTasks - Hook return type for task management
 *
 * Re-exports TaskContext for consumption in components.
 */
export type UseTasksReturn = TaskContext;

/**
 * useResponsive - Hook return type for responsive state
 *
 * Provides current breakpoint information for conditional rendering.
 */
export interface UseResponsiveReturn {
  /** True if viewport < 768px */
  isMobile: boolean;

  /** True if viewport 768px-1024px */
  isTablet: boolean;

  /** True if viewport >= 1024px */
  isDesktop: boolean;

  /** True if device supports touch events */
  isTouchDevice: boolean;

  /** Current viewport width in pixels */
  width: number;
}
