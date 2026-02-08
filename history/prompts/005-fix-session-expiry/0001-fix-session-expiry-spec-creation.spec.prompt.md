---
id: 0001
title: fix-session-expiry-spec-creation
stage: spec
date: 2026-01-22
surface: agent
model: claude-sonnet-4-5-20250929
feature: 005-fix-session-expiry
branch: 005-fix-session-expiry
user: system
command: /sp.specify
labels: ["session-management", "authentication", "bug-fix", "specification"]
links:
  spec: specs/005-fix-session-expiry/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/005-fix-session-expiry/spec.md
  - specs/005-fix-session-expiry/checklists/requirements.md
tests:
  - Quality validation checklist completed (all items passing)
---

## Prompt

Todo App - Fix Session Expiry & Authentication Flow

Target audience: Debugging authentication state management and session persistence
Focus: Resolve "session expired" error on signin → dashboard navigation

Problem statement:
- User signs in successfully but gets "session expired" message on dashboard
- Session/JWT token not persisting between page navigation
- Authentication state lost during route transitions
- Token possibly not stored or retrieved correctly

Success criteria:
- User signs in and reaches dashboard WITHOUT "session expired" error
- JWT token persists across page navigations and refreshes
- Authentication state maintained throughout user session
- Token accessible to API client for Authorization headers
- Session remains valid for full 7-day duration (unless explicitly logged out)
- Protected routes work correctly without false expiry messages

Root causes to investigate:
- Cookie storage configuration (httpOnly, sameSite, path, domain settings)
- Better Auth session creation vs JWT token issuance timing
- Token retrieval logic on dashboard mount
- Middleware checking session before token is set
- Cookie not being sent with navigation requests
- Clock skew causing immediate token expiry
- BETTER_AUTH_SECRET mismatch between frontend and backend

Constraints:
- Must work with existing Better Auth setup from Spec 1
- Must integrate with FastAPI JWT verification from Spec 2
- Cannot change API endpoint structure
- Timeline: Critical blocker - highest priority

Critical fixes needed:
- Verify Better Auth cookie configuration (secure, httpOnly, sameSite, path)
- Ensure JWT token written to cookie BEFORE redirect to dashboard
- Add token persistence check after signin (wait for cookie to be set)
- Implement proper session validation on protected routes
- Fix timing issue between authentication and navigation
- Add token refresh mechanism if near expiry
- Debug cookie transmission during client-side navigation

Not fixing (out of scope):
- Token refresh on backend
- Remember me functionality
- Session across multiple devices
- Logout from all devices

## Response snapshot

Created comprehensive specification for session expiry bug fix following Spec-Driven Development methodology:

1. **Branch Creation**: Successfully created feature branch `005-fix-session-expiry` using create-new-feature.sh script

2. **Specification Development**:
   - Developed 4 prioritized user stories (P1-P3) covering signin flow, page refresh, protected routes, and cross-navigation
   - Defined 12 functional requirements focused on session establishment, validation, and error handling
   - Established 7 measurable success criteria focused on user experience
   - Identified 6 edge cases including browser compatibility, time sync, and race conditions
   - Documented constraints, assumptions, dependencies, and out-of-scope items

3. **Quality Validation & Iteration**:
   - Created quality validation checklist at specs/005-fix-session-expiry/checklists/requirements.md
   - Initial validation FAILED due to extensive implementation details (JWT, cookies, Better Auth, FastAPI, Next.js)
   - Performed comprehensive revision to remove all technology-specific references
   - Abstracted implementation details to generic concepts:
     - "JWT token" → "authenticated session" / "session credential"
     - "httpOnly cookie" → "secure session storage"
     - "Better Auth" → "authentication library"
     - "Next.js App Router" → "frontend framework"
     - "FastAPI" → "backend"
   - Final validation PASSED all 14 checklist items

4. **Key Improvements**:
   - Made specification technology-agnostic and readable by non-technical stakeholders
   - Maintained testability while removing implementation prescriptions
   - Focused on user-facing outcomes rather than technical mechanisms
   - Preserved all functional requirements in business language

## Outcome

- ✅ Impact: Created technology-agnostic specification for critical authentication bug fix, ready for planning phase
- 🧪 Tests: Quality checklist validation completed (14/14 items passing)
- 📁 Files: 2 files created (spec.md, checklists/requirements.md)
- 🔁 Next prompts: `/sp.clarify` (if clarifications needed) or `/sp.plan` (to create implementation plan)
- 🧠 Reflection: Successfully balanced bug fix specification requirements with SDD principles. Initial spec was too implementation-focused (common for bug fixes where technical context is known), but iterative refinement produced a business-focused, technology-agnostic specification suitable for stakeholder review while maintaining testability.

## Evaluation notes (flywheel)

- Failure modes observed: Initial specification leaked implementation details due to bug fix context involving known technologies. Required full revision to abstract away JWT, cookies, Better Auth, Next.js, FastAPI references.
- Graders run and results (PASS/FAIL): Quality validation checklist - Initial: FAIL (4/14 items), Final: PASS (14/14 items)
- Prompt variant (if applicable): Standard /sp.specify workflow with integrated quality validation
- Next experiment (smallest change to try): For future bug fix specs, start with more abstract language patterns to avoid initial implementation detail leakage
