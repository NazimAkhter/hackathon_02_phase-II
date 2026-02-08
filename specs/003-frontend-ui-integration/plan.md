# Implementation Plan: Frontend Interface & Integration

**Branch**: `003-frontend-ui-integration` | **Date**: 2026-01-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-frontend-ui-integration/spec.md`

**Note**: This template is filled in by the `/sp.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a responsive Next.js 16+ frontend UI that enables end users to manage personal todo tasks via web browser. The application integrates with Better Auth (Spec 1) for JWT authentication and FastAPI backend (Spec 2) for task management. Technical approach uses React Context for state management, native fetch API with wrapper for HTTP calls including JWT injection, React Hook Form for form validation, and Tailwind CSS for styling. Implementation follows phases: Auth Pages → API Client → Dashboard Layout → Task Components → Integration & Polish.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 16+ (App Router)
**Primary Dependencies**: Next.js 16+, React 18+, React Hook Form, Tailwind CSS, Better Auth Client SDK
**Storage**: Client-side session storage for JWT tokens (httpOnly cookies managed by Better Auth), no local database
**Testing**: Jest with React Testing Library for unit/integration tests, Playwright for E2E tests
**Target Platform**: Web browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
**Project Type**: Web application (frontend-only, consumes FastAPI backend from Spec 2)
**Performance Goals**: <2 second page load, <1 second UI updates after user actions, 60fps scrolling
**Constraints**: Mobile-first responsive (320px minimum width), requires internet connectivity (no offline mode), JWT token auto-attachment to all API calls
**Scale/Scope**: 6 user stories (MVP = 2), 43 functional requirements, 3 viewport breakpoints (mobile/tablet/desktop), 6 API integration points

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Agentic Development Workflow ✅ PASS
- Frontend implementation follows SDD workflow: spec created via `/sp.specify`, plan via `/sp.plan`, tasks via `/sp.tasks`
- Implementation will use nextjs-ui-builder agent for UI components and pages
- Architectural decisions documented in this plan (research.md)
- PHRs will be created for all implementation steps

### Principle II: Security-First Architecture ✅ PASS
- JWT token validation enforced: all API calls include Authorization header with Bearer token
- User isolation: authenticated user_id from JWT used to filter all data via backend endpoints
- Frontend redirects to login page for 401 Unauthorized responses
- Frontend displays error message for 403 Forbidden responses (user ID mismatch)
- Tokens stored in httpOnly cookies (managed by Better Auth) - not exposed to JavaScript
- No secrets hardcoded in frontend code

### Principle III: RESTful API Design Standards ✅ PASS (Backend responsibility)
- Frontend consumes existing RESTful endpoints from Spec 2 (Backend API)
- All 6 HTTP methods properly used: GET (list/fetch), POST (create), PATCH (toggle completion), PUT (full update), DELETE (remove)
- Frontend respects HTTP status codes and handles errors appropriately

### Principle IV: Stateless JWT Authentication ✅ PASS
- Better Auth integration from Spec 1 provides JWT tokens with 7-day expiry
- Shared BETTER_AUTH_SECRET used by backend for token verification
- Frontend attaches JWT in Authorization header: `Bearer <token>`
- Token expiry handled gracefully: 401 responses trigger redirect to login
- Token managed by Better Auth Client SDK (httpOnly cookie storage)

### Principle V: Multi-User Persistent Storage ✅ PASS (Backend responsibility)
- Frontend does not manage persistent storage directly
- All data operations delegated to FastAPI backend (Spec 2) which enforces user isolation
- Frontend displays data fetched from backend filtered by authenticated user_id

**Overall Status**: ✅ ALL PRINCIPLES SATISFIED

**Notes**: Frontend layer inherits security guarantees from Better Auth (Spec 1) and Backend API (Spec 2). Constitution compliance primarily enforced at backend layer. Frontend's responsibility is proper token handling and API integration.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (/sp.plan command)
├── data-model.md        # Phase 1 output (/sp.plan command)
├── quickstart.md        # Phase 1 output (/sp.plan command)
├── contracts/           # Phase 1 output (/sp.plan command)
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
frontend/
├── app/                      # Next.js 16 App Router
│   ├── layout.tsx           # Root layout with auth provider
│   ├── page.tsx             # Home/landing page
│   ├── login/
│   │   └── page.tsx         # Login page (Better Auth integration)
│   ├── signup/
│   │   └── page.tsx         # Signup page (Better Auth integration)
│   ├── dashboard/
│   │   ├── layout.tsx       # Dashboard layout with auth guard
│   │   └── page.tsx         # Task list page (main UI)
│   └── api/                 # API route handlers (if needed)
│       └── auth/            # Better Auth routes
├── components/
│   ├── auth/
│   │   ├── AuthProvider.tsx      # Auth context provider
│   │   ├── ProtectedRoute.tsx    # Auth guard HOC
│   │   ├── LoginForm.tsx         # Login form component
│   │   └── SignupForm.tsx        # Signup form component
│   ├── tasks/
│   │   ├── TaskList.tsx          # Task list container
│   │   ├── TaskItem.tsx          # Individual task component
│   │   ├── TaskCreateForm.tsx    # Add task form
│   │   ├── TaskEditForm.tsx      # Edit task inline form
│   │   └── TaskDeleteConfirm.tsx # Delete confirmation dialog
│   ├── layout/
│   │   ├── Header.tsx            # App header with user info and logout
│   │   ├── EmptyState.tsx        # Empty task list message
│   │   └── ErrorBoundary.tsx     # Global error boundary
│   └── ui/                       # Reusable UI components
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Checkbox.tsx
│       ├── Spinner.tsx
│       └── ErrorMessage.tsx
├── lib/
│   ├── api/
│   │   ├── client.ts             # API client wrapper with JWT injection
│   │   ├── tasks.ts              # Task API methods (CRUD)
│   │   └── types.ts              # TypeScript types for API responses
│   ├── auth/
│   │   ├── better-auth.ts        # Better Auth configuration
│   │   └── utils.ts              # Auth helper functions
│   └── utils/
│       ├── validation.ts         # Form validation helpers
│       └── formatting.ts         # Data formatting utilities
├── hooks/
│   ├── useAuth.ts               # Auth context hook
│   ├── useTasks.ts              # Task management hook (fetch, create, update, delete)
│   └── useErrorHandler.ts       # Error handling hook
├── types/
│   ├── task.ts                  # Task entity types
│   └── user.ts                  # User session types
├── styles/
│   └── globals.css              # Tailwind CSS imports and global styles
├── public/                      # Static assets
├── __tests__/
│   ├── unit/
│   │   ├── components/          # Component unit tests
│   │   └── lib/                 # Library function tests
│   ├── integration/
│   │   └── api/                 # API client integration tests
│   └── e2e/
│       └── user-flows.spec.ts   # Playwright E2E tests
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── .env.local                   # Environment variables (API URL, Better Auth config)
```

**Structure Decision**: Web application with frontend-only implementation using Next.js 16 App Router architecture. Backend (Spec 2) is separate and already implemented. Frontend follows standard Next.js conventions with `/app` directory for pages/routes, `/components` for UI, `/lib` for utilities/API client, and `/hooks` for React hooks. Testing organized by type (unit/integration/e2e).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: No violations detected. All constitution principles satisfied.
