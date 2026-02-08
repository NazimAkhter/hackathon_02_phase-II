---
id: 0002
title: session-expiry-fix-implementation-plan
stage: plan
date: 2026-01-22
surface: agent
model: claude-sonnet-4-5-20250929
feature: 005-fix-session-expiry
branch: 005-fix-session-expiry
user: system
command: /sp.plan
labels: ["authentication", "bug-fix", "session-management", "implementation-plan", "debugging"]
links:
  spec: specs/005-fix-session-expiry/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/005-fix-session-expiry/plan.md
  - specs/005-fix-session-expiry/research.md
  - specs/005-fix-session-expiry/contracts/session-validation-contract.md
  - specs/005-fix-session-expiry/quickstart.md
tests:
  - Constitution Check: All 5 principles passed
  - Configuration audit strategy defined
  - Session validation contract specified
  - 10 test procedures documented in quickstart guide
---

## Prompt

User input included detailed debugging strategy and technical implementation guidance:

Create: Debug checklist, authentication flow diagram, cookie configuration audit, token lifecycle validation, comprehensive error logging

Decisions needing documentation:
- Cookie storage location (which domain/path) - verify matches app domain
- Session validation timing (before vs after navigation) - add delay if needed
- Token retrieval method (document.cookie vs Better Auth API) - use Better Auth getSession()
- Error recovery strategy (auto-retry vs manual login) - implement auto-retry once

Debugging strategy (sequential):
1. Verify BETTER_AUTH_SECRET matches in .env files (frontend and backend)
2. Check Better Auth cookie settings in config (sameSite: 'lax', path: '/')
3. Inspect browser cookies after signin (check JWT token present and not expired)
4. Add console.logs to trace: signin success → token creation → cookie set → navigation → dashboard mount → token retrieval
5. Test JWT token decode in browser console (check exp claim)
6. Verify middleware doesn't run before cookie is set
7. Check if useEffect dependencies causing premature session check

Testing strategy:
- Test signin → wait 2 seconds → navigate to dashboard (should work)
- Test signin → immediate navigate (identify if timing issue)
- Verify cookie persists after page refresh
- Check Authorization header contains valid token on first API call
- Test with browser DevTools: Network tab for cookies, Application tab for storage
- Validate JWT expiry timestamp is 7 days in future (not past)

Technical fixes to implement:
- Add await for session establishment before router.push()
- Configure Better Auth cookies: { sameSite: 'lax', path: '/', secure: true }
- Implement getSession() check on dashboard mount with loading state
- Add error boundary with specific handling for auth errors
- Create session validator utility with detailed error messages
- Add retry logic: if session invalid, wait 500ms and check again
- Implement comprehensive logging for auth flow debugging
- Follow phases: Environment Audit → Cookie Configuration → Timing Fix → Session Validation → Error Handling → End-to-End Testing

## Response snapshot

Created comprehensive implementation plan for session expiry bug fix with complete Phase 0 and Phase 1 artifacts:

**Phase 0: Research & Diagnosis**
1. Configuration audit findings documented in research.md
2. Five key research areas investigated:
   - Environment variable verification (BETTER_AUTH_SECRET consistency)
   - Cookie configuration audit (httpOnly, sameSite, path, Max-Age attributes)
   - Session validation timing (race condition analysis)
   - Token retrieval method selection (document.cookie vs Better Auth SDK)
   - Error recovery strategy (auto-retry with exponential backoff)
3. Session flow diagram with detailed timing-critical sections
4. Sequential debugging strategy (7 steps from environment to useEffect)
5. Performance considerations and timing budget analysis

**Phase 1: Design & Contracts**
1. Session validation contract (session-validation-contract.md):
   - Function contracts: getSession(), getTokenFromCookie(), validateSession()
   - Signin flow contract with waitForSession() polling mechanism
   - Dashboard mount contract with retry logic
   - Middleware contract (updated for timing)
   - Error message contract (query parameters)
   - Logging contract (structured debug output)
   - Performance contracts (timing budgets)
   - Test contracts (unit and integration)

2. Quickstart testing guide (quickstart.md):
   - 10 detailed test procedures (environment check to cross-page navigation)
   - Browser DevTools debugging commands
   - Common issues and solutions
   - Success criteria checklist
   - Debug console commands reference

**Technical Context Defined**:
- Languages: TypeScript 5.x (frontend), Python 3.11+ (backend)
- Dependencies: Better Auth 1.4.15, Next.js 16.1.3, React 19.2.3, FastAPI
- Storage: Browser cookies (better-auth.session.token, 7-day expiry)
- Testing: Manual + DevTools + console logging
- Performance: < 3s signin→dashboard, < 100ms session validation
- Constraints: No API changes, no JWT structure changes, no library upgrades

**Constitution Check**: ✅ All 5 principles passed
- Principle I (Agentic Workflow): Following SDD process
- Principle II (Security-First): No security regressions
- Principle III (RESTful API): No endpoint changes
- Principle IV (JWT Auth): Fixes storage/retrieval only
- Principle V (Persistent Storage): N/A for this fix

**Project Structure**:
- Frontend files to modify: 5-8 files (signin, dashboard, auth utils, middleware)
- Backend files to verify: 2 files (auth.py for cookies, .env for secret)
- No database schema changes required

## Outcome

- ✅ Impact: Complete implementation plan ready for task breakdown, with diagnostic strategy, technical contracts, and comprehensive testing procedures
- 🧪 Tests: 10 test procedures defined in quickstart guide, covering environment audit, cookie configuration, signin flow, race conditions, token validation, and cross-page navigation
- 📁 Files: 4 planning artifacts created (plan.md, research.md, session-validation-contract.md, quickstart.md)
- 🔁 Next prompts: `/sp.tasks` to break down plan into atomic implementation tasks
- 🧠 Reflection: Successfully translated user's detailed debugging strategy into structured implementation plan. Key insight: This is a timing/race condition bug, not an architectural issue - fix requires retry logic and session confirmation before navigation, not authentication system redesign. User-provided debugging sequence was invaluable for creating targeted research document.

## Evaluation notes (flywheel)

- Failure modes observed: None - plan creation successful. User input was exceptionally detailed with specific debugging steps and technical fixes, which accelerated planning phase.
- Graders run and results (PASS/FAIL): Constitution Check - PASS (5/5 principles), Technical Context - PASS (all required fields specified), Phase 0 Research - PASS (all unknowns resolved), Phase 1 Contracts - PASS (validation contract and quickstart complete)
- Prompt variant (if applicable): Standard /sp.plan workflow enhanced with user-provided debugging strategy and technical implementation guidance
- Next experiment (smallest change to try): For future bug fix plans, consider creating simplified "diagnostic checklist" artifact in addition to full research document for quicker validation in production
