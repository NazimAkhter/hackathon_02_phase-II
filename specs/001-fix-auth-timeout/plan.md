# Implementation Plan: Fix Authentication Session Timeout

**Branch**: `001-fix-auth-timeout` | **Date**: 2026-02-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-fix-auth-timeout/spec.md`

## Summary

Fix authentication session timeout errors that prevent users from logging in. The primary issue is that the frontend cannot verify session establishment after successful authentication, causing "Session could not be established" errors. The solution involves fixing timeout handling, implementing API-based session verification compatible with HttpOnly cookies, and ensuring reliable session persistence across page reloads.

**Technical Approach**:
1. Replace client-side cookie detection with API-based session verification
2. Increase timeout duration to accommodate backend response times (bcrypt operations)
3. Implement backend session endpoint to verify HttpOnly cookies
4. Add retry logic for session verification to handle timing issues

## Technical Context

**Language/Version**:
- Frontend: TypeScript 5.x with Next.js 16.1.6, React 19.2.3
- Backend: Python 3.11+ with FastAPI

**Primary Dependencies**:
- Frontend: Better Auth 1.4.15, React Hook Form 7.71.1, Tailwind CSS 4.x
- Backend: FastAPI, SQLModel, PyJWT, bcrypt, Neon PostgreSQL driver

**Storage**: Neon Serverless PostgreSQL (existing - no schema changes required)

**Testing**:
- Frontend: Manual browser testing with DevTools
- Backend: pytest for API endpoint tests
- Integration: End-to-end authentication flow testing

**Target Platform**:
- Frontend: Vercel (Next.js deployment)
- Backend: Hugging Face Spaces (Docker container)
- Browser: Modern browsers with cookie support

**Project Type**: Web application (frontend + backend)

**Performance Goals**:
- Authentication completion within 5 seconds for 95% of users
- Session verification within 1 second
- Zero timeout errors under normal network conditions

**Constraints**:
- Must work with existing Better Auth configuration
- Cannot modify authentication backend architecture
- Must maintain HttpOnly cookie security (XSS protection)
- Must work in deployed production environment
- Timeout handling must not degrade UX

**Scale/Scope**:
- Multi-user application (existing user base)
- Critical path: login flow affects all users
- 3 main components to modify: session detection, timeout handling, backend endpoint

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ I. Agentic Development Workflow
**Status**: PASS
- Specification created via `/sp.specify`
- Implementation plan via `/sp.plan` (this document)
- Will break into tasks via `/sp.tasks`
- Agents used: auth-security-architect (session handling), nextjs-ui-builder (frontend fixes)

### ✅ II. Security-First Architecture
**Status**: PASS
- Maintains HttpOnly cookie security (prevents XSS attacks)
- JWT token validation enforced on backend
- Session endpoint verifies token signature and expiration
- No authentication bypass introduced
- User ID validation maintained in all endpoints

**Security Enhancements**:
- HttpOnly cookies prevent JavaScript access to JWT tokens
- Backend session endpoint validates tokens before returning user data
- Timeout handling does not create security vulnerabilities

### ✅ III. RESTful API Design Standards
**Status**: PASS
- New endpoint follows REST conventions: `GET /api/auth/session`
- Returns 200 OK with session data when authenticated
- Returns 401 Unauthorized when no valid session
- Consistent JSON response format
- Proper HTTP status codes

### ✅ IV. Stateless JWT Authentication
**Status**: PASS
- Uses existing Better Auth JWT implementation
- Shared secret `BETTER_AUTH_SECRET` maintained
- JWT tokens contain user ID, email, expiration
- Backend verifies token signature on session endpoint
- 7-day token expiration enforced

**Implementation Notes**:
- HttpOnly cookies automatically included in requests
- Frontend cannot read cookies directly (security feature)
- Backend session endpoint provides session verification

### ✅ V. Multi-User Persistent Storage
**Status**: PASS (No Changes Required)
- No database schema changes needed
- Existing `users` table sufficient
- Session data derived from JWT tokens (stateless)
- No new tables or migrations required

### Summary
**All constitution principles satisfied**. This is a bug fix that enhances security (maintains HttpOnly cookies) while improving reliability (fixes timeout issues). No architectural changes or principle violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-fix-auth-timeout/
├── spec.md              # Feature specification
├── plan.md              # This file (implementation plan)
├── research.md          # Phase 0: Technical research findings
├── data-model.md        # Phase 1: Session state model
├── contracts/           # Phase 1: API contracts
│   └── session-endpoint.yaml  # GET /api/auth/session contract
└── tasks.md             # Phase 2: Implementation tasks (via /sp.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   └── auth.py          # MODIFY: Add GET /session endpoint
│   ├── auth/
│   │   └── jwt.py           # EXISTING: JWT verification (reuse)
│   ├── models/
│   │   └── user.py          # EXISTING: User model (no changes)
│   └── schemas/
│       └── auth.py          # EXISTING: Auth schemas (no changes)
└── tests/
    └── test_auth_session.py # NEW: Session endpoint tests

frontend/
├── lib/
│   └── auth/
│       ├── session-wait.ts  # MODIFY: API-based session check
│       ├── utils.ts         # MODIFY: Call backend session endpoint
│       └── logger.ts        # EXISTING: Debug logging (no changes)
├── components/
│   └── auth/
│       └── AuthProvider.tsx # MODIFY: Increase timeout, use new check
└── app/
    └── (auth)/
        ├── signin/          # EXISTING: Login page (no changes)
        └── signup/          # EXISTING: Signup page (no changes)
```

**Structure Decision**: Web application structure (Option 2) with existing backend and frontend directories. This is a bug fix that modifies existing authentication flow components without adding new features or modules.

## Complexity Tracking

> **No violations** - All constitution principles satisfied. This section is empty.

## Phase 0: Research & Discovery

### Research Questions

1. **HttpOnly Cookie Behavior**: How do HttpOnly cookies work with JavaScript and why can't they be read via `document.cookie`?
2. **Better Auth Session Management**: How does Better Auth expect session verification to work with HttpOnly cookies?
3. **Timeout Best Practices**: What are appropriate timeout values for authentication flows considering backend processing time?
4. **Session Verification Patterns**: What are standard patterns for verifying sessions when cookies are HttpOnly?

### Research Findings

See [research.md](./research.md) for detailed findings.

**Key Discoveries**:
- HttpOnly cookies are NOT accessible via JavaScript (security feature)
- Better Auth expects API-based session verification, not cookie reading
- Backend bcrypt operations take ~2 seconds, requiring 3+ second timeout
- Standard pattern: Frontend makes API call, browser includes HttpOnly cookie automatically

## Phase 1: Design & Contracts

### Data Model

See [data-model.md](./data-model.md) for complete entity definitions.

**Key Entities**:
- **User Session**: Session identifier, user data, expiration time, authentication status
- **Authentication State**: Current auth status (unauthenticated, authenticating, authenticated, error)

### API Contracts

See [contracts/](./contracts/) for OpenAPI specifications.

**New Endpoint**:
- `GET /api/auth/session`: Verify session from HttpOnly cookie, return user data

**Modified Behavior**:
- Frontend session detection: API call instead of cookie check
- Timeout handling: 1000ms → 3000ms
- Retry logic: Single retry on session verification failure

### Quick Start Guide

See [quickstart.md](./quickstart.md) for development setup and testing instructions.

## Phase 2: Implementation Tasks

Tasks will be generated via `/sp.tasks` command after plan approval.

**Expected Task Categories**:
1. Backend: Implement session endpoint
2. Frontend: Fix session detection logic
3. Frontend: Update timeout configuration
4. Testing: End-to-end authentication flow
5. Documentation: Update authentication guides

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Timeout still too short for slow networks | Users on slow connections cannot log in | Medium | Make timeout configurable, add retry logic |
| Session endpoint performance issues | Slow session verification | Low | Use efficient JWT verification, add caching |
| Browser compatibility with HttpOnly cookies | Some browsers may not support | Very Low | HttpOnly is standard, all modern browsers support |
| Deployment issues (environment variables) | Session endpoint fails in production | Low | Validate configuration before deployment |

## Success Metrics

**Acceptance Criteria** (from spec):
- ✅ 95% of login attempts complete within 5 seconds without timeout errors
- ✅ Zero "Session could not be established" errors during normal flows
- ✅ 100% session persistence across page refreshes
- ✅ Authentication timeout errors reduced to zero for users with <3s latency

**Monitoring**:
- Track login success rate (target: 98%)
- Measure average authentication time (target: <3 seconds)
- Monitor timeout error occurrences (target: 0)
- Track support tickets related to login issues (target: 100% reduction)

## Dependencies

**External**:
- Hugging Face Spaces operational (backend hosting)
- Vercel operational (frontend hosting)
- Neon PostgreSQL operational (database)

**Internal**:
- Existing Better Auth configuration functional
- JWT token generation working correctly
- CORS configuration allowing frontend-backend communication

**Blockers**:
- None identified - all dependencies currently satisfied

## Rollout Plan

**Phase 1: Backend Deployment**
1. Deploy session endpoint to Hugging Face Spaces
2. Verify endpoint responds correctly (manual testing)
3. Confirm HttpOnly cookies are being read

**Phase 2: Frontend Deployment**
1. Deploy frontend changes to Vercel
2. Monitor for any new errors in production
3. Verify login flow works end-to-end

**Phase 3: Validation**
1. Manual testing across different browsers
2. Test with slow network conditions (throttling)
3. Verify session persistence across page reloads
4. Monitor error rates and user feedback

**Rollback Plan**:
- Frontend: Revert to previous Vercel deployment
- Backend: Revert to previous Hugging Face Space commit
- Both can be rolled back independently if needed

## Notes

**Implementation Status**: This plan documents the approach for a fix that has already been partially implemented. The backend session endpoint exists, and frontend changes have been deployed. This plan serves as documentation and will guide any remaining work or refinements.

**Related Documentation**:
- `AUTH_TIMEOUT_FIX_COMPLETE.md`: Detailed fix documentation
- `AUTH_FIX_VERIFICATION.md`: Backend verification report
- `FRONTEND_TESTING_GUIDE.md`: Manual testing instructions
