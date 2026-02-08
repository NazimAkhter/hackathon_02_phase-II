# Quick Start Guide: Frontend Interface & Integration

**Feature**: 003-frontend-ui-integration
**Date**: 2026-01-19
**Prerequisites**: Backend API (Spec 2) and Better Auth (Spec 1) must be running

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Development Workflow](#development-workflow)
4. [Testing Guide](#testing-guide)
5. [Troubleshooting](#troubleshooting)
6. [Deployment Checklist](#deployment-checklist)

---

## Prerequisites

### System Requirements
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (or yarn/pnpm equivalent)
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+

### Required Services
1. **Backend API** (Spec 2): Running on `http://localhost:8000`
   - All 6 task endpoints operational
   - CORS enabled for `http://localhost:3000`
   - Database migrations applied

2. **Better Auth** (Spec 1): Configured and operational
   - JWT token generation working
   - Shared `BETTER_AUTH_SECRET` configured
   - User signup/signin endpoints functional

### Verify Prerequisites

**1. Check Backend API**:
```bash
curl http://localhost:8000/docs
# Should return FastAPI Swagger documentation
```

**2. Check Node.js version**:
```bash
node --version
# Should show v18.0.0 or higher
```

---

## Initial Setup

### Step 1: Project Initialization

Create the frontend directory and initialize Next.js project:

```bash
cd /mnt/e/GIAIC/Quarter-04/hackathon_02/phase-II
mkdir -p frontend
cd frontend

# Initialize Next.js with TypeScript and Tailwind CSS
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

**Prompts during setup**:
- ✅ Would you like to use TypeScript? → **Yes**
- ✅ Would you like to use ESLint? → **Yes**
- ✅ Would you like to use Tailwind CSS? → **Yes**
- ✅ Would you like to use App Router? → **Yes**
- ✅ Would you like to customize the default import alias? → **No**

### Step 2: Install Dependencies

```bash
# Production dependencies
npm install react-hook-form better-auth

# Development dependencies
npm install --save-dev @types/react @types/node jest @testing-library/react @testing-library/jest-dom @playwright/test
```

**Dependencies Installed**:
- `react-hook-form`: Form validation and state management
- `better-auth`: Authentication integration with backend
- `jest`: Unit testing framework
- `@testing-library/react`: React component testing utilities
- `@playwright/test`: E2E testing framework

### Step 3: Environment Configuration

Create `.env.local` file in `frontend/` directory:

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your_shared_secret_here_min_32_chars

# Optional: Enable debug logging
NEXT_PUBLIC_DEBUG=true
```

**Important**:
- `BETTER_AUTH_SECRET` MUST match the backend's secret (from Spec 1 and Spec 2)
- Never commit `.env.local` to version control (add to `.gitignore`)

### Step 4: Update `.gitignore`

Ensure `.env.local` is excluded:

```bash
# frontend/.gitignore
.env.local
.env*.local
node_modules/
.next/
out/
```

### Step 5: Configure Tailwind CSS

Update `tailwind.config.js` for responsive breakpoints:

```javascript
// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        // Responsive breakpoints matching spec
        'xs': '320px',   // Mobile minimum
        'sm': '375px',   // Mobile standard
        'md': '768px',   // Tablet
        'lg': '1024px',  // Desktop
        'xl': '1280px',  // Large desktop
      },
    },
  },
  plugins: [],
}
```

### Step 6: TypeScript Configuration

Update `tsconfig.json` for strict type checking:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "allowJs": true,
    "incremental": true,
    "paths": {
      "@/*": ["./*"]
    },
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## Development Workflow

### Phase 1: Authentication Pages

**Goal**: Implement login and signup pages with Better Auth integration

**Tasks**:
1. Create `AuthContext` provider
2. Implement login page (`app/login/page.tsx`)
3. Implement signup page (`app/signup/page.tsx`)
4. Add Better Auth configuration

**Test**:
```bash
npm run dev
# Navigate to http://localhost:3000/login
# Try signup with new user
# Verify JWT token stored and redirect to dashboard
```

**Acceptance Criteria**:
- [ ] User can navigate to /login and /signup
- [ ] Forms validate email format and password length (min 8 chars)
- [ ] Successful login redirects to /dashboard
- [ ] JWT token stored securely (httpOnly cookie via Better Auth)
- [ ] Form errors display clearly

---

### Phase 2: API Client Infrastructure

**Goal**: Build API client with automatic JWT injection

**Tasks**:
1. Create `lib/api/client.ts` (APIClient class)
2. Create `lib/api/types.ts` (TypeScript interfaces)
3. Create `lib/api/tasks.ts` (Task CRUD methods)
4. Implement error handling for 401/403/500

**Test**:
```bash
# In browser console after login
import { apiClient } from '@/lib/api/client'
await apiClient.listTasks('user-uuid-here')
# Should return task array with Authorization header
```

**Acceptance Criteria**:
- [ ] API client automatically includes Authorization header
- [ ] 401 responses trigger logout and redirect to /login
- [ ] 403 responses display "Permission denied" message
- [ ] Network errors display "Unable to connect" message
- [ ] All methods typed with TypeScript interfaces

---

### Phase 3: Dashboard Layout

**Goal**: Create authenticated dashboard page with header and layout

**Tasks**:
1. Create `app/dashboard/layout.tsx` (with auth guard)
2. Create `components/layout/Header.tsx` (with user email and logout button)
3. Create `components/layout/EmptyState.tsx`
4. Implement responsive layout with Tailwind

**Test**:
```bash
npm run dev
# Navigate to http://localhost:3000/dashboard
# Should redirect to /login if not authenticated
# After login, should see header with email and logout button
```

**Acceptance Criteria**:
- [ ] Unauthenticated users redirected to /login
- [ ] Header displays user email from JWT
- [ ] Logout button clears session and redirects to /login
- [ ] Layout responsive on mobile (375px), tablet (768px), desktop (1024px+)
- [ ] Empty state displays when no tasks exist

---

### Phase 4: Task Components

**Goal**: Implement all task CRUD operations with UI components

**Tasks**:
1. Create `components/tasks/TaskList.tsx`
2. Create `components/tasks/TaskItem.tsx` (with checkbox, edit, delete)
3. Create `components/tasks/TaskCreateForm.tsx`
4. Create `components/tasks/TaskEditForm.tsx` (inline editing)
5. Create `components/tasks/TaskDeleteConfirm.tsx` (confirmation dialog)
6. Implement `hooks/useTasks.ts` for state management

**Test**:
```bash
npm run dev
# Login and navigate to dashboard
# Test each CRUD operation:
# 1. Add new task → verify appears at top of list
# 2. Toggle completion → verify strikethrough applied
# 3. Edit task → verify inline editing works
# 4. Delete task → verify confirmation dialog and removal
```

**Acceptance Criteria**:
- [ ] Task list fetches and displays all user tasks on load (within 2 seconds)
- [ ] Add task form validates title (1-500 characters)
- [ ] Checkbox toggles completion status with immediate UI update
- [ ] Edit button switches to inline form with Save/Cancel buttons
- [ ] Delete button shows confirmation dialog before deletion
- [ ] All operations update UI within 1 second
- [ ] Failed operations display error messages with retry button
- [ ] Loading spinners shown during API requests
- [ ] Action buttons disabled during requests (prevent double-submit)

---

### Phase 5: Integration & Polish

**Goal**: Final testing, bug fixes, and polish

**Tasks**:
1. Run E2E tests with Playwright
2. Test responsive design on all breakpoints
3. Test error scenarios (network failure, token expiry, invalid input)
4. Fix any bugs found
5. Add loading states and transitions
6. Verify all 43 functional requirements met

**Test**:
```bash
# Run unit tests
npm test

# Run E2E tests
npx playwright test

# Manual testing checklist in browser DevTools:
# - Mobile viewport (375px width)
# - Tablet viewport (768px width)
# - Desktop viewport (1024px+ width)
# - Network throttling (Slow 3G)
# - Token expiration (modify JWT exp in localStorage)
```

**Acceptance Criteria**:
- [ ] All unit tests pass (components, hooks, API client)
- [ ] All E2E tests pass (signup → login → CRUD → logout)
- [ ] Responsive on all breakpoints (mobile/tablet/desktop)
- [ ] Touch targets 44x44px on mobile
- [ ] Error handling works for all failure modes
- [ ] Loading states display correctly
- [ ] No console errors or warnings
- [ ] All 43 functional requirements validated

---

## Testing Guide

### Unit Tests (Jest + React Testing Library)

**Setup Jest**:

Create `jest.config.js`:
```javascript
// frontend/jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

module.exports = createJestConfig(customJestConfig)
```

Create `jest.setup.js`:
```javascript
// frontend/jest.setup.js
import '@testing-library/jest-dom'
```

**Run Unit Tests**:
```bash
npm test
# or
npm test -- --watch  # Watch mode
```

**Example Unit Test**:
```typescript
// __tests__/unit/components/TaskItem.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { TaskItem } from '@/components/tasks/TaskItem'

describe('TaskItem', () => {
  const mockTask = {
    id: '123',
    user_id: '456',
    title: 'Test task',
    completed: false,
    created_at: '2026-01-19T10:00:00Z',
    updated_at: '2026-01-19T10:00:00Z',
  }

  it('should render task title', () => {
    render(<TaskItem task={mockTask} onToggle={jest.fn()} onEdit={jest.fn()} onDelete={jest.fn()} />)
    expect(screen.getByText('Test task')).toBeInTheDocument()
  })

  it('should call onToggle when checkbox clicked', () => {
    const onToggle = jest.fn()
    render(<TaskItem task={mockTask} onToggle={onToggle} onEdit={jest.fn()} onDelete={jest.fn()} />)

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    expect(onToggle).toHaveBeenCalledWith('123')
  })
})
```

---

### Integration Tests

Test API client with mocked fetch:

```typescript
// __tests__/integration/api/client.test.ts
import { APIClient } from '@/lib/api/client'

describe('APIClient', () => {
  let client: APIClient
  const mockToken = 'mock_jwt_token'
  const userId = '550e8400-e29b-41d4-a716-446655440000'

  beforeEach(() => {
    global.fetch = jest.fn()
    client = new APIClient('http://localhost:8000', () => mockToken)
  })

  it('should include Authorization header', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    await client.listTasks(userId)

    expect(global.fetch).toHaveBeenCalledWith(
      `http://localhost:8000/api/${userId}/tasks`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockToken}`,
        }),
      })
    )
  })

  it('should throw APIError on 401', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ detail: 'Unauthorized' }),
    })

    await expect(client.listTasks(userId)).rejects.toThrow('API Error 401')
  })
})
```

---

### E2E Tests (Playwright)

**Setup Playwright**:
```bash
npx playwright install
```

Create `playwright.config.ts`:
```typescript
// frontend/playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './__tests__/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true,
  },
})
```

**Run E2E Tests**:
```bash
npx playwright test
# or with UI
npx playwright test --ui
```

**Example E2E Test**:
```typescript
// __tests__/e2e/user-journey.spec.ts
import { test, expect } from '@playwright/test'

test('complete user journey: signup → login → CRUD → logout', async ({ page }) => {
  // Signup
  await page.goto('/signup')
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'password123')
  await page.fill('input[name="confirmPassword"]', 'password123')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/dashboard')

  // Create task
  await page.fill('input[placeholder*="task"]', 'Buy groceries')
  await page.click('button:has-text("Add Task")')
  await expect(page.locator('text=Buy groceries')).toBeVisible()

  // Toggle completion
  await page.click('input[type="checkbox"]')
  await expect(page.locator('text=Buy groceries')).toHaveClass(/line-through/)

  // Edit task
  await page.click('button:has-text("Edit")')
  await page.fill('input[value="Buy groceries"]', 'Buy groceries and cook dinner')
  await page.click('button:has-text("Save")')
  await expect(page.locator('text=Buy groceries and cook dinner')).toBeVisible()

  // Delete task
  await page.click('button:has-text("Delete")')
  await page.click('button:has-text("Confirm")')
  await expect(page.locator('text=Buy groceries and cook dinner')).not.toBeVisible()

  // Logout
  await page.click('button:has-text("Logout")')
  await expect(page).toHaveURL('/login')
})

test('responsive design on mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/login')

  // Verify form is usable on mobile
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'password123')

  // Check touch target size (min 44x44px)
  const buttonBox = await page.locator('button[type="submit"]').boundingBox()
  expect(buttonBox!.width).toBeGreaterThanOrEqual(44)
  expect(buttonBox!.height).toBeGreaterThanOrEqual(44)
})
```

---

## Troubleshooting

### Common Issues

#### Issue 1: CORS Error - "Access-Control-Allow-Origin" missing

**Symptom**: Browser console shows CORS error when making API requests

**Solution**:
1. Verify backend CORS configuration includes frontend origin
2. Check backend logs for CORS middleware
3. Ensure `allow_credentials=True` is set
4. Restart backend server after CORS changes

```python
# Backend should have this in Spec 2:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

#### Issue 2: 401 Unauthorized - "Could not validate credentials"

**Symptom**: All API requests return 401, even with valid login

**Possible Causes**:
1. JWT token not being sent in Authorization header
2. Token format incorrect (should be `Bearer <token>`)
3. `BETTER_AUTH_SECRET` mismatch between frontend and backend
4. Token expired (7-day expiry)

**Debugging Steps**:
```bash
# 1. Check token in browser DevTools
# Open Network tab → select API request → Headers → Authorization

# 2. Decode JWT token
# Copy token and decode at jwt.io to verify:
# - userId field exists
# - exp (expiration) is in the future
# - Signature is valid

# 3. Verify BETTER_AUTH_SECRET matches
# Frontend: .env.local
# Backend: .env
```

**Solution**:
- Ensure `BETTER_AUTH_SECRET` is identical in frontend and backend `.env` files
- Clear cookies and re-login to get fresh token
- Check API client is correctly including `Authorization: Bearer ${token}`

---

#### Issue 3: Tasks not displaying after creation

**Symptom**: Task created successfully (201 response) but doesn't appear in list

**Possible Causes**:
1. Frontend state not updated after creation
2. Task list not re-fetched
3. Task created for wrong user_id

**Solution**:
```typescript
// In createTask function, ensure state is updated:
const createTask = async (title: string) => {
  const newTask = await apiClient.createTask(userId, { title })
  setTasks([newTask, ...tasks])  // Add to front of list
  // OR refetch: await fetchTasks()
}
```

---

#### Issue 4: Redirect loop between /login and /dashboard

**Symptom**: Page redirects infinitely between login and dashboard

**Possible Causes**:
1. Auth state not properly initialized
2. Loading state not handled correctly
3. Auth check happening before session loaded

**Solution**:
```typescript
// In dashboard layout, handle loading state:
export default function DashboardLayout({ children }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <Spinner />  // Wait for auth check to complete
  }

  if (!isAuthenticated) {
    redirect('/login')
  }

  return children
}
```

---

#### Issue 5: Responsive design broken on mobile

**Symptom**: Layout overflows horizontally on mobile devices

**Solution**:
```tsx
// Add these classes to root container:
<div className="min-h-screen w-full overflow-x-hidden px-4">
  {children}
</div>

// Ensure all containers use responsive width:
<div className="w-full md:w-3/4 lg:w-1/2 mx-auto">
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (unit + E2E)
- [ ] No console errors or warnings in production build
- [ ] Environment variables configured for production
- [ ] Backend API URL updated to production endpoint
- [ ] CORS configured on backend for production frontend URL
- [ ] Error boundaries implemented for graceful error handling
- [ ] Loading states added for all async operations
- [ ] Responsive design validated on mobile/tablet/desktop
- [ ] Touch targets minimum 44x44px on mobile
- [ ] All 43 functional requirements validated

### Build Production Bundle

```bash
cd frontend
npm run build
```

**Expected Output**:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (5/5)
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    1.2 kB         85.3 kB
├ ○ /login                               2.5 kB         87.6 kB
├ ○ /signup                              2.5 kB         87.6 kB
└ ○ /dashboard                           3.8 kB         89.9 kB
```

### Start Production Server

```bash
npm start
# Server runs on http://localhost:3000
```

### Performance Validation

- [ ] Page load < 2 seconds (Lighthouse score)
- [ ] First Contentful Paint < 1 second
- [ ] Time to Interactive < 3 seconds
- [ ] Bundle size < 200KB gzipped
- [ ] No blocking resources

### Security Validation

- [ ] JWT tokens stored securely (httpOnly cookies)
- [ ] No sensitive data in localStorage
- [ ] HTTPS enabled in production
- [ ] CSP (Content Security Policy) headers configured
- [ ] No exposed secrets in client-side code

---

## Summary

This guide covers the complete development workflow from initial setup to production deployment. Follow each phase sequentially, validate acceptance criteria, and run tests frequently to ensure quality.

**Development Timeline** (estimated):
- Phase 1 (Auth Pages): 1-2 days
- Phase 2 (API Client): 1 day
- Phase 3 (Dashboard): 1 day
- Phase 4 (Task Components): 2-3 days
- Phase 5 (Integration): 1-2 days
- **Total**: 6-9 days

**Key Success Metrics**:
- All 43 functional requirements met
- Page load < 2 seconds
- UI updates < 1 second after user actions
- 100% test coverage for critical paths
- Zero security vulnerabilities

For additional help, refer to:
- [spec.md](./spec.md) - Feature requirements
- [plan.md](./plan.md) - Implementation plan
- [research.md](./research.md) - Technical decisions
- [data-model.md](./data-model.md) - Data structures
- [contracts/api-contract.md](./contracts/api-contract.md) - API specifications
