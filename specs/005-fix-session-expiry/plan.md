# Implementation Plan: Session Expiry & Authentication Flow Fix

**Branch**: `005-fix-session-expiry` | **Date**: 2026-01-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-fix-session-expiry/spec.md`

**Note**: This is a bug fix plan focused on resolving session persistence issues during signin → dashboard navigation.

## Summary

**Primary Requirement**: Fix "session expired" error occurring when users signin successfully but immediately see authentication errors on the dashboard page.

**Root Cause**: Session credentials are not properly persisting between page navigation, causing the authenticated state to be lost during the signin → dashboard transition.

**Technical Approach**: This is a diagnostic and remediation plan that will:
1. Audit existing session storage configuration and timing
2. Fix race conditions where dashboard loads before session is fully established
3. Implement proper session validation with retry logic
4. Add comprehensive error logging for future debugging
5. Validate session persistence across all navigation patterns

**Impact**: Restores critical authentication flow, enabling users to access the application after signing in.

## Technical Context

**Language/Version**:
- Frontend: TypeScript 5.x with Next.js 16.1.3 (App Router), React 19.2.3
- Backend: Python 3.11+ with FastAPI

**Primary Dependencies**:
- Frontend: Better Auth 1.4.15 (authentication library), React Hook Form 7.71.1
- Backend: FastAPI, SQLModel, jose (JWT), passlib (password hashing)
- Database: Neon Serverless PostgreSQL (existing - no changes required)

**Storage**:
- Session credentials stored in browser cookies (httpOnly, secure, sameSite attributes)
- Cookie name: `better-auth.session.token` (currently configured)
- 7-day expiration period (no changes)

**Testing**:
- Manual testing: Signin flow validation, page refresh persistence, navigation testing
- Browser DevTools: Network tab (cookie inspection), Application tab (storage inspection)
- Console logging: Comprehensive debug output for auth flow tracing
- Integration testing: End-to-end signin → dashboard → API call flow

**Target Platform**:
- Frontend: Modern browsers (Chrome, Firefox, Safari, Edge) supporting httpOnly cookies
- Backend: Linux server running FastAPI with Uvicorn
- Development: localhost (both frontend and backend)
- Production: Separate domains with appropriate CORS and cookie configurations

**Project Type**: Web application (frontend + backend monorepo)

**Performance Goals**:
- Signin to dashboard transition: < 3 seconds (including session establishment)
- Session validation check: < 100ms (synchronous cookie read + decode)
- Zero authentication false-positives during valid sessions

**Constraints**:
- Cannot change API endpoint structure (Feature 002 constraint)
- Cannot modify JWT token structure or backend validation logic (Feature 001/002 constraint)
- Must maintain compatibility with existing Better Auth configuration
- Session expiration period remains 7 days (constitution requirement)
- No library upgrades (Better Auth, Next.js versions fixed)

**Scale/Scope**:
- Bug fix scope: Session storage and retrieval mechanism only
- No new features: Authentication library, token structure, or backend logic unchanged
- Files impacted: ~5-8 frontend files (signin handler, session utils, dashboard mount, middleware)
- Testing scope: Complete signin→dashboard flow + refresh + navigation patterns

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle IV: Stateless JWT Authentication

**Status**: ✅ PASS (with clarification)

- JWT tokens with 7-day expiry: ✅ Already implemented
- Shared BETTER_AUTH_SECRET: ✅ Existing configuration (verify match during Phase 0)
- Token in Authorization header: ✅ Already implemented for API calls
- Backend token verification: ✅ Already implemented in Feature 002
- Failed authentication returns 401: ✅ Already implemented

**Clarification**: This bug fix does NOT change the JWT authentication architecture. It fixes the session credential **storage and retrieval** mechanism to ensure tokens persist correctly across page navigation.

### Principle II: Security-First Architecture

**Status**: ✅ PASS

- JWT validation on every API call: ✅ Already enforced (no changes)
- User data isolation: ✅ Already enforced (no changes)
- Secrets in environment variables: ✅ Already configured (verify during Phase 0)
- httpOnly cookies: ✅ Will verify configuration during Phase 0

**No security regressions**: This fix improves security by ensuring sessions work correctly, preventing users from being unexpectedly logged out (which could lead to workarounds like storing tokens insecurely).

### Principle I: Agentic Development Workflow

**Status**: ✅ PASS

- Specification created via `/sp.specify`: ✅ Completed
- Implementation plan via `/sp.plan`: ✅ This document
- Tasks breakdown via `/sp.tasks`: ⏳ Next phase
- Implementation via specialized agents: ⏳ Will use `auth-security-architect` and `nextjs-ui-builder`

### Principle V: Multi-User Persistent Storage

**Status**: ✅ PASS (N/A for this fix)

- No database schema changes required
- Session persistence uses browser storage (cookies), not database
- Database access patterns unchanged

### Principle III: RESTful API Design Standards

**Status**: ✅ PASS (N/A for this fix)

- No API endpoint changes required
- Existing endpoints unchanged
- This fix addresses client-side session management only

**Constitution Check Result**: ✅ ALL GATES PASS - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/005-fix-session-expiry/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output: Configuration audit findings
├── contracts/           # Phase 1 output: Session validation flow diagrams
│   └── session-flow-diagram.md
├── quickstart.md        # Phase 1 output: Testing and validation guide
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
frontend/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── signin/route.ts         # MODIFY: Add session establishment wait
│   │       └── signup/route.ts         # VERIFY: Check for same issue
│   ├── dashboard/
│   │   ├── page.tsx                    # MODIFY: Add session validation on mount
│   │   └── layout.tsx                  # VERIFY: Check middleware timing
│   └── signin/
│       └── page.tsx                    # MODIFY: Update redirect timing
├── lib/
│   └── auth/
│       ├── utils.ts                    # MODIFY: Enhanced session validation
│       ├── jwt-utils.ts                # VERIFY: Token decode functions
│       └── validation.ts               # MODIFY: Add retry logic
├── hooks/
│   └── useAuth.ts                      # MODIFY: Enhanced session hooks
├── middleware.ts                       # MODIFY: Fix timing for protected routes
└── .env.local                          # VERIFY: BETTER_AUTH_SECRET matches backend

backend/
├── .env                                # VERIFY: BETTER_AUTH_SECRET matches frontend
└── src/
    └── api/
        └── auth.py                     # VERIFY: Cookie configuration (no changes expected)
```

**Structure Decision**: Web application (Option 2) - Existing structure is appropriate for this bug fix. Changes are localized to frontend session management utilities and signin/dashboard pages. Backend changes are configuration verification only (no code changes expected).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations detected** - All constitution principles are satisfied by this bug fix plan.
