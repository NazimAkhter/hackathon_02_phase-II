# Technical Research & Decisions: Frontend Interface & Integration

**Feature**: 003-frontend-ui-integration
**Date**: 2026-01-19
**Status**: Complete

## Overview

This document captures all technical decisions made during the planning phase for the Frontend Interface & Integration feature. Each decision includes the chosen approach, alternatives considered, and rationale for the choice.

---

## Decision 1: State Management Strategy

### Chosen Approach: React Context API

**Implementation Details**:
- Create `AuthContext` for authentication state (user info, JWT token status, login/logout functions)
- Create `TaskContext` for task management state (task list, loading states, CRUD operations)
- Wrap application root with context providers in `app/layout.tsx`
- Custom hooks (`useAuth`, `useTasks`) to consume contexts

**Rationale**:
- **Simplicity**: React Context is built-in, no additional dependencies or learning curve
- **Sufficient for MVP**: Application has moderate state complexity (auth + tasks)
- **Predictable data flow**: Props drilling avoided without introducing complex state management patterns
- **Performance**: React 18+ Context with `useMemo` and `useCallback` provides good enough performance for this use case
- **Team familiarity**: Standard React pattern, easy for developers to understand and maintain

### Alternatives Considered

**Zustand**:
- Pros: Lightweight (1KB), simple API, good TypeScript support
- Cons: Additional dependency, learning curve for team, overkill for this feature's state complexity
- Rejected because: React Context provides sufficient capabilities without external dependencies

**Redux Toolkit**:
- Pros: Industry standard, excellent DevTools, great for large applications
- Cons: Significant boilerplate, steep learning curve, overkill for 2 contexts (auth + tasks)
- Rejected because: Too complex for the application's state management needs

**Jotai/Recoil**:
- Pros: Atomic state management, fine-grained reactivity
- Cons: Additional dependencies, newer libraries with smaller ecosystems
- Rejected because: Atomic state management unnecessary when contexts can be cleanly separated

---

## Decision 2: HTTP Client Library

### Chosen Approach: Native Fetch API with Custom Wrapper

**Implementation Details**:
```typescript
// lib/api/client.ts
class APIClient {
  private baseURL: string
  private getToken: () => string | null

  constructor(baseURL: string, getToken: () => string | null) {
    this.baseURL = baseURL
    this.getToken = getToken
  }

  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = this.getToken()
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      // Handle errors (401 → redirect, 403 → error message, etc.)
      throw new APIError(response.status, await response.json())
    }

    return response.json()
  }
}
```

**Rationale**:
- **Native browser API**: No external dependencies, reduces bundle size
- **JWT injection**: Centralized Authorization header logic in one place
- **Error handling**: Unified error handling for 401/403/500 responses
- **TypeScript support**: Full type safety with generics
- **Modern standard**: Fetch API is well-supported in all target browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

### Alternatives Considered

**Axios**:
- Pros: Rich feature set (interceptors, automatic JSON transformation, timeout support), battle-tested
- Cons: Additional 13KB dependency, more features than needed
- Rejected because: Native fetch provides all required functionality (request/response interceptors can be implemented in wrapper)

**SWR/React Query**:
- Pros: Built-in caching, automatic refetching, optimistic updates, request deduplication
- Cons: Adds complexity for simple CRUD operations, learning curve
- Rejected because: Caching and advanced features are out of scope for MVP (FR-038 to FR-041 only require loading states)

**GraphQL Client (Apollo/urql)**:
- Pros: Declarative data fetching, strong typing
- Cons: Backend uses REST (Spec 2), not GraphQL
- Rejected because: Incompatible with existing FastAPI RESTful backend

---

## Decision 3: Form Handling & Validation

### Chosen Approach: React Hook Form

**Implementation Details**:
- Use `useForm` hook for form state management
- Built-in validation with rules (required, minLength, maxLength, pattern)
- Integration with TypeScript for type-safe form data
- Example usage:
```typescript
const { register, handleSubmit, formState: { errors } } = useForm<TaskFormData>({
  defaultValues: { title: '' }
})

<input
  {...register('title', {
    required: 'Task title is required',
    minLength: { value: 1, message: 'Title cannot be empty' },
    maxLength: { value: 500, message: 'Title too long (max 500 characters)' }
  })}
/>
{errors.title && <ErrorMessage>{errors.title.message}</ErrorMessage>}
```

**Rationale**:
- **Performance**: Uncontrolled components with minimal re-renders
- **Built-in validation**: No need for separate validation library (FR-012: validate task title not empty)
- **TypeScript support**: Excellent type inference for form data
- **Small bundle size**: 8KB minified + gzipped
- **Developer experience**: Less boilerplate than native React controlled components
- **Error handling**: Automatic error state management per field

### Alternatives Considered

**Native React Controlled Components**:
- Pros: No dependencies, full control over form behavior
- Cons: Verbose (manual state management, validation, error handling), more re-renders
- Rejected because: Significant boilerplate for every form (login, signup, task create, task edit)

**Formik**:
- Pros: Popular library, comprehensive feature set
- Cons: Larger bundle (13KB), more re-renders than React Hook Form, less active development
- Rejected because: React Hook Form offers better performance and smaller footprint

**Zod + React Hook Form**:
- Pros: Schema-based validation with excellent TypeScript inference
- Cons: Additional dependency (Zod), more complex for simple validation needs
- Deferred: Can be added later if validation becomes more complex (e.g., password strength, email format)

---

## Decision 4: UI Component Library / Styling

### Chosen Approach: Tailwind CSS (Utility-First)

**Implementation Details**:
- Tailwind CSS v3+ for utility-first styling
- Custom components in `/components/ui` using Tailwind classes
- Responsive design with Tailwind breakpoints:
  - Mobile: default (320px+)
  - Tablet: `md:` (768px+)
  - Desktop: `lg:` (1024px+)
- Example component:
```tsx
<button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors">
  Add Task
</button>
```

**Rationale**:
- **Fast development**: Utility classes enable rapid prototyping
- **Responsive design**: Built-in responsive modifiers (sm:, md:, lg:)
- **Customizable**: Easy to match design system via `tailwind.config.js`
- **Tree-shaking**: PurgeCSS removes unused styles in production
- **No runtime cost**: CSS-only solution, no JavaScript bundle overhead
- **Control**: Full control over styling without component library constraints

### Alternatives Considered

**shadcn/ui (Tailwind + Radix UI)**:
- Pros: Pre-built accessible components, copy-paste approach (no NPM package), uses Tailwind
- Cons: More initial setup, components need customization for design
- **Decision**: Use shadcn/ui components selectively for complex UI (e.g., Dialog for delete confirmation, Dropdown for user menu) if time permits
- Rationale: Provides accessibility and complex interactions out-of-the-box

**Material-UI (MUI)**:
- Pros: Comprehensive component library, battle-tested, excellent documentation
- Cons: Large bundle size (300KB+), heavy JavaScript overhead, opinionated design system
- Rejected because: Performance constraints (FR-040: <2 second page load), hard to customize away from Material Design

**Chakra UI**:
- Pros: Great developer experience, built-in dark mode, accessible components
- Cons: Runtime CSS-in-JS (emotion), larger bundle than Tailwind
- Rejected because: Runtime overhead conflicts with performance goals

**CSS Modules**:
- Pros: Scoped styles, no naming conflicts, Next.js built-in support
- Cons: More verbose than utility classes, harder to maintain responsive styles
- Rejected because: Tailwind provides better developer velocity for responsive design

---

## Decision 5: API Client Architecture - JWT Injection Pattern

### Chosen Approach: Interceptor Pattern with Token Retrieval Function

**Implementation Details**:
```typescript
// lib/api/client.ts
export const createAPIClient = (getToken: () => string | null) => {
  return new APIClient(process.env.NEXT_PUBLIC_API_URL!, getToken)
}

// In AuthContext
const AuthProvider = ({ children }) => {
  const [token, setToken] = useState<string | null>(null)

  // Better Auth integration: read token from cookie or session
  useEffect(() => {
    const tokenFromAuth = betterAuth.getSession()?.token
    setToken(tokenFromAuth)
  }, [])

  const client = useMemo(() => createAPIClient(() => token), [token])

  return (
    <AuthContext.Provider value={{ token, setToken, client }}>
      {children}
    </AuthContext.Provider>
  )
}
```

**Rationale**:
- **Automatic token attachment**: All API calls automatically include Authorization header (FR-002)
- **Centralized logic**: Single place to manage token retrieval and header injection
- **Flexible**: Token retrieval function allows different sources (cookies, localStorage, memory)
- **Testable**: Easy to mock token for testing
- **Handles expiration**: 401 responses trigger token refresh or redirect to login

### Token Retrieval Strategy

**Better Auth httpOnly Cookies**:
- Better Auth stores JWT in `better-auth.session.token` httpOnly cookie
- Frontend cannot access httpOnly cookies directly via JavaScript
- **Solution**: Better Auth Client SDK provides `getSession()` method to read session from cookie via server-side route or middleware
- **Implementation**: Create API route `/app/api/auth/session/route.ts` that returns session info (including token for Authorization header)

**Alternative if Better Auth SDK handles this**:
- If Better Auth Client SDK automatically includes token in requests, we can simplify:
  - SDK manages token attachment transparently
  - Frontend only needs to call SDK methods
  - **Decision**: Research Better Auth SDK documentation during implementation to confirm token handling

---

## Decision 6: Authentication Context Provider Pattern

### Chosen Approach: React Context with Better Auth Integration

**Implementation Details**:
```typescript
// components/auth/AuthProvider.tsx
interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  apiClient: APIClient
}

export const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize Better Auth session on mount
  useEffect(() => {
    const session = betterAuth.getSession()
    if (session) {
      setUser({ id: session.userId, email: session.email })
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const session = await betterAuth.signIn({ email, password })
    setUser({ id: session.userId, email: session.email })
  }

  const logout = async () => {
    await betterAuth.signOut()
    setUser(null)
    router.push('/login')
  }

  const apiClient = createAPIClient(() => betterAuth.getToken())

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, signup, logout, apiClient }}>
      {children}
    </AuthContext.Provider>
  )
}
```

**Rationale**:
- **Centralized auth state**: Single source of truth for user authentication status
- **Better Auth integration**: Wraps Better Auth SDK methods for consistency
- **API client access**: Provides configured API client with automatic JWT injection
- **Loading state**: Prevents flicker during initial auth check
- **Automatic redirect**: Logout automatically redirects to login page

---

## Decision 7: Protected Route Implementation

### Chosen Approach: Layout-Based Auth Guard

**Implementation Details**:
```typescript
// app/dashboard/layout.tsx
export default function DashboardLayout({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return <Spinner />
  }

  if (!isAuthenticated) {
    return null // Will redirect in useEffect
  }

  return (
    <div>
      <Header />
      {children}
    </div>
  )
}
```

**Rationale**:
- **Next.js App Router pattern**: Uses layout files for shared authentication logic
- **Automatic protection**: All pages under `/dashboard` automatically protected
- **Redirect with original URL**: Preserves intended destination (FR-004)
- **Loading state**: Shows spinner during auth check to prevent flash of unauthenticated content
- **Reusable**: Can be applied to multiple protected routes

### Alternatives Considered

**Higher-Order Component (HOC)**:
- Pros: Reusable across pages
- Cons: Less idiomatic in Next.js App Router, more boilerplate
- Rejected because: Layout-based approach is more aligned with Next.js 13+ patterns

**Middleware**:
- Pros: Server-side protection, cannot be bypassed by client
- Cons: More complex setup, requires server-side session validation
- Deferred: Can add middleware for additional security layer in future iterations

---

## Decision 8: Loading State Management

### Chosen Approach: Component-Level State with React useState

**Implementation Details**:
```typescript
const [isLoading, setIsLoading] = useState(false)

const handleAddTask = async (title: string) => {
  setIsLoading(true)
  try {
    const newTask = await apiClient.createTask(userId, { title })
    setTasks([newTask, ...tasks])
  } catch (error) {
    showError('Failed to add task')
  } finally {
    setIsLoading(false)
  }
}

return (
  <button disabled={isLoading}>
    {isLoading ? <Spinner /> : 'Add Task'}
  </button>
)
```

**Rationale**:
- **Simplicity**: No additional libraries needed
- **Granular control**: Each operation (create, update, delete) has independent loading state
- **Button disabling**: Prevents duplicate submissions (FR-031)
- **Visual feedback**: Shows spinner during API requests (FR-038, FR-039)

### Alternatives Considered

**React Suspense**:
- Pros: Declarative loading boundaries, works with Server Components
- Cons: Requires data fetching to throw promises (not compatible with standard async/await)
- Deferred: Can be adopted later if migrating to Next.js Server Components for data fetching

**Global loading state**:
- Pros: Single loading indicator for entire app
- Cons: Less granular feedback, cannot disable specific buttons
- Rejected because: User experience requires per-operation feedback (FR-031)

---

## Decision 9: Error Handling Strategy

### Chosen Approach: Global Error Boundary + Local Error States

**Implementation Details**:

**Global Error Boundary**:
```typescript
// components/layout/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }
    return this.props.children
  }
}
```

**Local Error States**:
```typescript
const [error, setError] = useState<string | null>(null)

const handleDelete = async (taskId: string) => {
  setError(null)
  try {
    await apiClient.deleteTask(userId, taskId)
    setTasks(tasks.filter(t => t.id !== taskId))
  } catch (err) {
    if (err.status === 401) {
      logout() // Token expired
    } else if (err.status === 403) {
      setError("You don't have permission to delete this task")
    } else {
      setError('Failed to delete task. Please try again.')
    }
  }
}
```

**Rationale**:
- **Defense in depth**: Global boundary catches unexpected errors, local states handle expected failures
- **User-friendly messages**: API errors mapped to clear messages (FR-028, FR-029)
- **Automatic logout**: 401 responses trigger redirect to login (FR-003)
- **Retry capability**: Error messages include retry buttons (FR-030)
- **Type-specific handling**: Different error types (network, auth, server) handled appropriately

---

## Decision 10: Responsive Design Breakpoints

### Chosen Approach: Mobile-First with Tailwind Breakpoints

**Breakpoints**:
- **Mobile**: 320px - 767px (default styles)
- **Tablet**: 768px - 1023px (`md:` prefix)
- **Desktop**: 1024px+ (`lg:` prefix)

**Implementation Example**:
```tsx
<div className="
  w-full px-4           /* Mobile: full width, 1rem padding */
  md:w-3/4 md:px-6      /* Tablet: 75% width, 1.5rem padding */
  lg:w-1/2 lg:px-8      /* Desktop: 50% width, 2rem padding */
  mx-auto               /* Center on all screens */
">
  <TaskList />
</div>
```

**Rationale**:
- **Mobile-first**: Ensures core functionality on smallest screens (FR-033)
- **Standard breakpoints**: Aligns with Tailwind defaults and industry standards
- **Progressive enhancement**: Adds layout improvements for larger screens
- **Touch-friendly**: 44x44px minimum touch targets on mobile (FR-037)

---

## Decision 11: Implementation Phases

### Phase 1: Authentication Pages
- Login page (`/login`)
- Signup page (`/signup`)
- AuthContext provider
- Better Auth integration
- Protected route guard

**Acceptance**: User can signup, login, and be redirected to dashboard

### Phase 2: API Client Infrastructure
- API client wrapper with JWT injection
- Error handling and 401/403 responses
- TypeScript types for Task entity
- useTasks hook for CRUD operations

**Acceptance**: API client successfully calls backend with JWT token

### Phase 3: Dashboard Layout
- Dashboard page (`/dashboard`)
- Header with user info and logout button
- Empty state component
- Responsive layout (mobile/tablet/desktop)

**Acceptance**: Authenticated user sees dashboard with header and empty state

### Phase 4: Task Components
- Task list component
- Task item component with checkbox (toggle completion)
- Task create form (add new task)
- Task edit form (inline editing)
- Task delete confirmation dialog

**Acceptance**: All CRUD operations functional with immediate UI updates

### Phase 5: Integration & Polish
- Loading states for all operations
- Error messages for failed operations
- Responsive design validation on all breakpoints
- E2E testing with Playwright
- Final bug fixes

**Acceptance**: All 43 functional requirements met, responsive on all devices

---

## Testing Strategy

### Unit Tests (Jest + React Testing Library)
- Component rendering and interactions
- Form validation logic
- API client error handling
- Auth context state management

### Integration Tests
- JWT token attachment to API calls
- Redirect behavior for 401/403 responses
- Task CRUD operations with API client
- Form submission and validation

### E2E Tests (Playwright)
- Complete user journey: signup → login → add task → edit → delete → logout
- Responsive design on mobile, tablet, desktop viewports
- Error handling for network failures
- Session expiration and redirect to login

### Manual Testing Checklist
- [ ] Mobile viewport (375px): All features functional, touch targets 44x44px
- [ ] Tablet viewport (768px): Optimal layout, no horizontal scrolling
- [ ] Desktop viewport (1024px+): Full feature set, proper spacing
- [ ] Cross-browser: Chrome, Firefox, Safari, Edge
- [ ] JWT token automatically attached to all API calls
- [ ] Unauthorized users redirected to login
- [ ] Error messages display for failed operations
- [ ] Task operations update UI within 1 second

---

## Environment Variables

**Required in `.env.local`**:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000          # FastAPI backend URL
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000  # Better Auth endpoint
BETTER_AUTH_SECRET=<shared-secret>                 # Same as backend
```

---

## Dependencies

**Production**:
```json
{
  "next": "^16.0.0",
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "react-hook-form": "^7.48.0",
  "better-auth": "^1.0.0",
  "typescript": "^5.3.0"
}
```

**Development**:
```json
{
  "@types/react": "^18.0.0",
  "@types/node": "^20.0.0",
  "tailwindcss": "^3.4.0",
  "postcss": "^8.4.0",
  "autoprefixer": "^10.4.0",
  "jest": "^29.7.0",
  "@testing-library/react": "^14.1.0",
  "@testing-library/jest-dom": "^6.1.0",
  "playwright": "^1.40.0"
}
```

---

## Open Questions for Implementation

1. **Better Auth Token Access**: Does Better Auth Client SDK provide direct access to JWT token for Authorization header, or do we need a server-side route to extract it from httpOnly cookie?
   - **Action**: Review Better Auth documentation during implementation
   - **Fallback**: Create `/api/auth/session` route to return token

2. **UI Library Selection**: Use Tailwind only or add shadcn/ui for complex components (Dialog, Dropdown)?
   - **Decision**: Start with Tailwind only, add shadcn/ui components if time permits and complexity justifies it
   - **Rationale**: MVP prioritizes functionality over polish

3. **Backend API CORS Configuration**: Has backend enabled CORS for frontend origin?
   - **Action**: Verify with backend implementation (Spec 2)
   - **Assumption**: Backend has CORS middleware configured for `http://localhost:3000` (development)

4. **User ID in API Calls**: How is user_id obtained for API endpoint paths `/api/{user_id}/tasks`?
   - **Source**: JWT token payload contains `userId` field (from Spec 1)
   - **Implementation**: Decode JWT token client-side to extract user_id or use Better Auth SDK's `getSession().userId`

---

## Summary

All major technical decisions have been documented with clear rationale. The chosen approaches prioritize:
1. **Simplicity**: Native browser APIs and React patterns over heavy libraries
2. **Performance**: Minimal bundle size, fast page loads, responsive UI
3. **Security**: Automatic JWT injection, auth guards, proper error handling
4. **Developer velocity**: Tailwind utility classes, React Hook Form, TypeScript
5. **Maintainability**: Clear separation of concerns, reusable components, standard patterns

Next step: Create data-model.md, contracts/, and quickstart.md to complete planning phase.
