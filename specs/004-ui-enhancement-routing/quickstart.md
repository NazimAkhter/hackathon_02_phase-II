# Quickstart: Enhanced UI Development

**Feature**: 004-ui-enhancement-routing
**Date**: 2026-01-22
**Purpose**: Developer setup guide for implementing UI enhancements and post-signin routing

## Overview

This guide walks you through setting up and implementing the Enhanced UI feature from scratch. Follow these steps in order to ensure proper configuration and a smooth development experience.

---

## Prerequisites

Before starting, ensure you have:

- ✅ **Node.js 20+** installed (`node --version`)
- ✅ **npm or pnpm** installed
- ✅ **Frontend** dev server can run (`npm run dev` in `/frontend`)
- ✅ **Backend API** running on port 8000 (from Spec 002)
- ✅ **Database** configured (Neon PostgreSQL with users/tasks tables)
- ✅ **Git** repository initialized with branch `004-ui-enhancement-routing`

### Verify Existing Setup

```bash
# Check Node.js version
node --version  # Should be v20.x or higher

# Check that backend is running
curl http://localhost:8000  # Should return health check response

# Check that frontend can start
cd frontend
npm run dev  # Should start on port 3000

# Check database connection (from backend directory)
cd ../backend
source venv/bin/activate
python -c "from src.db.connection import get_session; next(get_session())"
# Should not error
```

---

## Phase 0: Installation and Configuration

### Step 1: Install shadcn/ui

shadcn/ui is a copy-paste component library built on Radix UI primitives. It integrates seamlessly with Tailwind CSS.

```bash
cd frontend

# Initialize shadcn/ui
npx shadcn@latest init
```

**When prompted, select**:
- ✅ **TypeScript**: Yes
- ✅ **Style**: Default
- ✅ **Base color**: Slate (professional, neutral)
- ✅ **CSS variables**: Yes (for theme customization)
- ✅ **Where is your global CSS file?**: `app/globals.css`
- ✅ **Configure import alias**: `@/*` (default)

This creates:
- `components/ui/` directory (for shadcn components)
- `lib/utils.ts` (utility functions)
- Updates `tailwind.config.ts` with shadcn theme

### Step 2: Install Required Components

Install all UI components needed for the feature:

```bash
# Core components (buttons, forms, cards)
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add label

# Interactive components (dialogs, loading states)
npx shadcn@latest add dialog
npx shadcn@latest add skeleton
npx shadcn@latest add checkbox

# Advanced components (dropdowns, menus)
npx shadcn@latest add dropdown-menu

# Optional: Additional components for future enhancements
# npx shadcn@latest add toast  # For notification system
# npx shadcn@latest add select  # For dropdown selects
```

### Step 3: Verify Installation

```bash
# Check that components were installed
ls components/ui

# Expected output:
# button.tsx
# card.tsx
# input.tsx
# label.tsx
# dialog.tsx
# skeleton.tsx
# checkbox.tsx
# dropdown-menu.tsx
```

### Step 4: Update Tailwind Config (Optional Customizations)

Edit `tailwind.config.ts` to add custom animations:

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Add custom transition durations
      transitionDuration: {
        '250': '250ms',  // Smooth hover transitions
      },
      // Add custom keyframes
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      // Add custom animations
      animation: {
        'fade-in': 'fade-in 300ms ease-out',
        'slide-up': 'slide-up 200ms ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## Phase 1: Fix Auth Routing (P1 - MVP)

**Goal**: Automatically redirect users to dashboard after signin/signup.

### Step 1: Create Middleware for Route Protection

```bash
# Create middleware file at frontend root
touch middleware.ts
```

**Implement middleware**:

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get JWT token from cookie
  const token = request.cookies.get('better-auth.session.token')?.value;

  // Define protected routes
  const protectedRoutes = ['/dashboard'];
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));

  // Redirect unauthenticated users to signin
  if (isProtected && !token) {
    const returnUrl = encodeURIComponent(pathname + request.nextUrl.search);
    return NextResponse.redirect(
      new URL(`/signin?returnUrl=${returnUrl}`, request.url)
    );
  }

  // Allow request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};
```

### Step 2: Add Redirect Logic to AuthProvider

Edit `components/auth/AuthProvider.tsx`:

```typescript
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();  // Your existing hook

  // Redirect authenticated users away from signin/signup
  useEffect(() => {
    const publicAuthPages = ['/signin', '/signup'];

    if (!isLoading && isAuthenticated && publicAuthPages.includes(pathname)) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  return <>{children}</>;
}
```

### Step 3: Update Signin Page

Edit `app/(auth)/signin/page.tsx` to add onSuccess redirect:

```typescript
'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function SigninPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';

  const onSubmit = async (data: SigninData) => {
    setIsSubmitting(true);

    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (response.ok) {
      // PRIMARY REDIRECT (Better Auth onSuccess)
      const safeReturnUrl = returnUrl.startsWith('/') ? returnUrl : '/dashboard';
      router.push(safeReturnUrl);
    } else {
      const { error } = await response.json();
      setError(error);
    }

    setIsSubmitting(false);
  };

  // ... rest of component
}
```

### Step 4: Update Signup Page

Same changes as signin page:

```typescript
// app/(auth)/signup/page.tsx
const onSubmit = async (data: SignupData) => {
  // ... API call

  if (response.ok) {
    router.push('/dashboard');  // Redirect after successful signup
  }
};
```

### Step 5: Test Auth Routing

```bash
# Start frontend
npm run dev

# Manual tests:
# 1. Sign in → Should auto-redirect to dashboard within 1 second ✅
# 2. Try accessing /dashboard without auth → Should redirect to /signin ✅
# 3. Sign in while on /signin → Should redirect to /dashboard ✅
# 4. Access /dashboard?tab=settings without auth → Should preserve query param ✅
```

---

## Phase 2: UI Component Library (P2)

**Goal**: Set up reusable UI components for loading states and error handling.

### Step 1: Create LoadingSpinner Component

```bash
mkdir -p components/shared
touch components/shared/LoadingSpinner.tsx
```

```typescript
// components/shared/LoadingSpinner.tsx
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'inline' | 'fullscreen';
  label?: string;
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  variant = 'inline',
  label = 'Loading...',
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const spinner = (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
    </div>
  );

  if (variant === 'fullscreen') {
    return (
      <div className="flex h-screen items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}
```

### Step 2: Create ErrorMessage Component

```bash
touch components/shared/ErrorMessage.tsx
```

```typescript
// components/shared/ErrorMessage.tsx
import { X } from 'lucide-react';  // Icon library (install: npm install lucide-react)
import { Button } from '@/components/ui/button';

interface ErrorMessageProps {
  message: string;
  onDismiss: () => void;
  onRetry?: () => void;
  severity?: 'error' | 'warning' | 'info';
  className?: string;
}

export function ErrorMessage({
  message,
  onDismiss,
  onRetry,
  severity = 'error',
  className,
}: ErrorMessageProps) {
  const severityStyles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <div
      className={cn(
        'relative rounded-lg border p-4',
        severityStyles[severity],
        className
      )}
      role="alert"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={onDismiss}
          className="text-current hover:opacity-70"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-2"
        >
          Retry
        </Button>
      )}
    </div>
  );
}
```

### Step 3: Create TaskSkeleton Component

```bash
mkdir -p components/tasks
touch components/tasks/TaskSkeleton.tsx
```

```typescript
// components/tasks/TaskSkeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';

interface TaskSkeletonProps {
  count?: number;
  className?: string;
}

export function TaskSkeleton({ count = 5, className }: TaskSkeletonProps) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-lg border p-4"
        >
          <Skeleton className="h-5 w-5 rounded" />  {/* Checkbox */}
          <Skeleton className="h-4 flex-1" />        {/* Title */}
          <Skeleton className="h-8 w-16" />          {/* Action button */}
        </div>
      ))}
    </div>
  );
}
```

---

## Phase 3: Responsive Design (P2)

**Goal**: Implement mobile-first layouts that adapt to tablet and desktop.

### Step 1: Update Dashboard Layout

Edit `app/dashboard/page.tsx`:

```typescript
// app/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8">
      {/* Mobile: Full width, Desktop: Max 800px centered */}
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="mb-6 text-2xl font-bold md:text-3xl">My Tasks</h1>

        <TaskList />
      </div>
    </div>
  );
}
```

### Step 2: Make Buttons Touch-Friendly

Update button sizes in forms:

```typescript
// Example: Signin form button
<Button
  type="submit"
  className="min-h-[44px] w-full"  // WCAG AAA touch target
  disabled={isSubmitting}
>
  {isSubmitting ? 'Signing in...' : 'Sign In'}
</Button>
```

### Step 3: Test Responsive Layouts

```bash
# Chrome DevTools device emulation
# Test at these breakpoints:
# - 320px (iPhone SE - minimum)
# - 768px (iPad - tablet)
# - 1024px (MacBook - desktop)
# - 1440px (iMac - large desktop)

# Manual checks:
# ✅ All text readable (min 14px on mobile)
# ✅ All buttons ≥ 44x44px
# ✅ No horizontal scrolling at any breakpoint
# ✅ Content centered with max-width on desktop
```

---

## Phase 4: Loading States (P2)

**Goal**: Add professional loading indicators to all async operations.

### Step 1: Update useTasks Hook

Edit `hooks/useTasks.ts`:

```typescript
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingOps, setPendingOps] = useState<Set<string>>(new Set());

  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.get(`/api/${userId}/tasks`);
      setTasks(data);
    } catch (err) {
      setError('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  return { tasks, isLoading, error, pendingOps, fetchTasks };
}
```

### Step 2: Show Skeleton During Loading

```typescript
// In dashboard page
{isLoading ? (
  <TaskSkeleton count={5} />
) : tasks.length > 0 ? (
  <TaskList tasks={tasks} />
) : (
  <EmptyState />
)}
```

---

## Phase 5: Optimistic Updates (P2)

**Goal**: Instant UI feedback for task operations with rollback on errors.

### Implementation Pattern

```typescript
const createTask = async (title: string) => {
  const tempId = `temp-${Date.now()}`;
  const optimisticTask = {
    id: tempId,
    title,
    completed: false,
    _optimistic: true,
  };

  // 1. Immediate UI update
  setTasks(prev => [...prev, optimisticTask]);
  setPendingOps(prev => new Set(prev).add(tempId));

  try {
    // 2. API call in background
    const serverTask = await apiClient.post(`/api/${userId}/tasks`, { title });

    // 3. Replace optimistic with server response
    setTasks(prev => prev.map(t =>
      t.id === tempId ? serverTask : t
    ));
  } catch (error) {
    // 4. Rollback on error
    setTasks(prev => prev.filter(t => t.id !== tempId));
    setError('Failed to create task');
  } finally {
    setPendingOps(prev => {
      const newSet = new Set(prev);
      newSet.delete(tempId);
      return newSet;
    });
  }
};
```

---

## Phase 6: Animations & Polish (P3)

**Goal**: Add smooth transitions and hover effects.

### Add Tailwind Transitions

```typescript
// Button hover effect
<button className="transition-colors duration-200 hover:bg-blue-600">

// Task item hover effect
<div className="transition-all duration-250 hover:shadow-lg">

// Fade-in animation for new tasks
<div className="animate-fade-in">
```

---

## Testing Checklist

Use this checklist to verify each phase is working correctly:

### Auth Routing Tests
- [ ] Signin → Dashboard redirect < 1 second
- [ ] Signup → Dashboard redirect < 1 second
- [ ] Unauthenticated /dashboard → Signin redirect
- [ ] Authenticated user on /signin → Dashboard redirect
- [ ] Deep link preserved: /dashboard?tab=settings

### UI Component Tests
- [ ] LoadingSpinner renders in buttons
- [ ] ErrorMessage dismissible and shows retry button
- [ ] TaskSkeleton shows during initial load
- [ ] All shadcn/ui components render correctly

### Responsive Design Tests
- [ ] Layout works at 320px (mobile)
- [ ] Layout works at 768px (tablet)
- [ ] Layout works at 1024px (desktop)
- [ ] All touch targets ≥ 44x44px
- [ ] No horizontal scrolling at any breakpoint

### Loading State Tests
- [ ] Loading spinners appear within 100ms
- [ ] Skeleton loader shows during task fetch
- [ ] Button disabled during submission
- [ ] Loading state cleared after operation completes

### Optimistic Update Tests
- [ ] Task appears instantly when created
- [ ] Task removed if creation fails
- [ ] Toggle shows immediate feedback
- [ ] Error message shows on failure with retry

### Animation Tests
- [ ] Hover states smooth (200-300ms)
- [ ] New tasks fade in smoothly
- [ ] Transitions run at 60fps (no jank)
- [ ] Animations disabled on reduced motion preference

---

## Troubleshooting

### Issue: Redirect not working after signin

**Symptoms**: User remains on signin page after successful authentication.

**Fix**:
1. Check Better Auth onSuccess callback is firing
2. Verify router.push('/dashboard') is called
3. Check middleware validates token correctly
4. Check AuthProvider useEffect redirect guard

**Debug**:
```typescript
const onSubmit = async (data) => {
  const response = await fetch('/api/auth/signin', ...);
  if (response.ok) {
    console.log('[DEBUG] Signin successful, redirecting to dashboard');
    router.push('/dashboard');
  }
};
```

### Issue: Token not attached to API requests

**Symptoms**: All API calls return 401 Unauthorized.

**Fix**:
1. Verify `credentials: 'include'` in fetch options
2. Check cookie name matches Better Auth config
3. Verify httpOnly cookie is set after signin
4. Check CORS settings allow credentials

**Debug**:
```typescript
// In lib/api/client.ts
async function apiRequest(url: string, options: RequestInit) {
  console.log('[DEBUG] Making request with credentials:', options.credentials);

  const response = await fetch(url, {
    ...options,
    credentials: 'include',  // CRITICAL
  });

  console.log('[DEBUG] Response status:', response.status);
  return response;
}
```

### Issue: Layout breaks on mobile

**Symptoms**: Horizontal scrolling, text too small, buttons too small.

**Fix**:
1. Use mobile-first Tailwind classes (no `sm:` prefix for base)
2. Add `min-h-[44px]` to all interactive elements
3. Test at 320px width (minimum)
4. Use `container mx-auto px-4` for proper padding

**Debug**:
```bash
# Chrome DevTools
# 1. Open DevTools (F12)
# 2. Toggle device toolbar (Ctrl+Shift+M)
# 3. Select "iPhone SE" (320px)
# 4. Check for horizontal scrollbar
# 5. Use "Inspect element" to check button sizes
```

### Issue: shadcn/ui components not styled

**Symptoms**: Components render but have no styling.

**Fix**:
1. Verify `globals.css` imports Tailwind directives
2. Check `tailwind.config.ts` includes `components/ui/**` in content
3. Restart dev server after installing components
4. Clear `.next` cache: `rm -rf .next && npm run dev`

---

## Next Steps

After completing this quickstart:

1. **Review implementation** - Ensure all phases work correctly
2. **Run full test suite** - Check all items in testing checklist
3. **Create ADRs** - Document significant decisions:
   ```bash
   /sp.adr routing-strategy-dual-approach
   /sp.adr ui-library-shadcn-selection
   ```
4. **Generate tasks** - Run `/sp.tasks` to break down remaining work
5. **Implement** - Complete any remaining features from the spec

---

**Quickstart Status**: ✅ **Complete** - Ready for development
