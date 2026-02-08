---
id: 0002
title: Auth System Implementation Plan
stage: plan
date: 2026-01-19
surface: agent
model: claude-sonnet-4-5-20250929
feature: 001-auth-user-management
branch: 001-auth-user-management
user: system
command: /sp.plan
labels: ["implementation-plan", "better-auth", "jwt", "next-js", "security", "design", "architecture"]
links:
  spec: specs/001-auth-user-management/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/001-auth-user-management/plan.md
  - specs/001-auth-user-management/research.md
  - specs/001-auth-user-management/data-model.md
  - specs/001-auth-user-management/contracts/auth-api.yaml
  - specs/001-auth-user-management/quickstart.md
tests:
  - none
---

## Prompt

Create: Better Auth configuration, JWT plugin setup, signup/signin routes, environment variable schema

Decisions needing documentation:
- Token storage method (cookies vs localStorage) - choose httpOnly cookies for security
- Token expiry duration (7 days vs 30 days) - use 7 days per Constitution
- Password hashing algorithm - use Better Auth default (bcrypt/argon2)

Testing strategy:
- Verify JWT token structure contains user_id and email
- Test token expiration enforcement
- Validate BETTER_AUTH_SECRET is loaded from environment
- Confirm tokens can be decoded with same secret

Technical details:
- Install Better Auth with JWT plugin enabled
- Configure Next.js API routes for /api/auth/signup and /api/auth/signin
- Set httpOnly, sameSite, and secure flags on cookies
- Export JWT verification utility for Spec 2 backend
- Follow phases: Setup → Configuration → Route Implementation → Token Validation

## Response snapshot

Created comprehensive implementation plan with complete Phase 0 research and Phase 1 design artifacts:

**Plan.md Summary:**
- Technical Context: TypeScript 5.x, Next.js 16+, Better Auth with JWT plugin
- Constitution Check: ✅ PASS - All 5 principles complied with (database/backend deferred to Spec 2)
- Project Structure: Web application (frontend only), detailed file tree with 15+ files
- Performance Goals: Signup < 60s, Signin < 30s, token generation < 100ms
- Constraints: 7-day token expiration, httpOnly cookies only, shared BETTER_AUTH_SECRET

**Research.md (Phase 0):**
- 6 research decisions documented with rationale and alternatives
- Decision 1: Better Auth with JWT plugin (vs NextAuth, custom JWT, SaaS)
- Decision 2: httpOnly + Secure + SameSite=Lax cookies (XSS + CSRF protection)
- Decision 3: JWT payload structure (userId, email, iat, exp)
- Decision 4: bcrypt cost factor 12 password hashing (Better Auth default)
- Decision 5: In-memory rate limiting (5 attempts per 15 minutes)
- Decision 6: Zod schema for environment variable validation
- Best practices, dependencies, integration points, risks documented

**Data-model.md (Phase 1):**
- 3 entities defined: User, JWT Token, Authentication Session
- User entity: id (UUID), email (unique), passwordHash (bcrypt), timestamps
- JWT Token: userId, email, iat, exp (stateless, not stored in DB)
- Validation rules: email RFC 5322, password min 8 chars with letters+numbers
- TypeScript interfaces for all entities
- State transition diagrams for signup/signin flows
- Error cases with HTTP status codes (400, 401, 409, 429)
- Database schema (PostgreSQL) for Spec 2 integration

**Contracts/auth-api.yaml (Phase 1):**
- OpenAPI 3.0 specification for auth endpoints
- POST /api/auth/signup: Create user (201 Created + httpOnly cookie)
- POST /api/auth/signin: Authenticate user (200 OK + httpOnly cookie)
- Request/response schemas with examples
- Error responses (400, 401, 409, 429, 500)
- Security scheme: cookieAuth (httpOnly cookie)
- Detailed HTTP headers (Set-Cookie with all security flags)

**Quickstart.md (Phase 1):**
- Complete setup instructions (prerequisites, installation, configuration)
- Step-by-step environment variable setup (BETTER_AUTH_SECRET generation)
- Directory structure creation commands
- Better Auth configuration code examples
- TypeScript type definitions
- Implementation checklist (5 phases)
- Testing instructions (unit, E2E, manual)
- Debugging guide (4 common issues with solutions)
- Security checklist (10 items)
- Spec 2 integration guide (FastAPI JWT verification)
- Resources and next steps

## Outcome

- ✅ Impact: Complete implementation plan created with constitution check, research decisions, data model, API contracts, and quickstart guide. All design artifacts ready for task generation.
- 🧪 Tests: Testing strategy defined (Jest unit tests, Playwright E2E, manual verification)
- 📁 Files: 5 files created (plan.md, research.md, data-model.md, auth-api.yaml, quickstart.md)
- 🔁 Next prompts: `/sp.tasks` to generate implementation tasks from plan, `/sp.adr` to document architectural decisions (token storage, cookie configuration, rate limiting)
- 🧠 Reflection: Plan successfully balances frontend auth implementation with deferred backend concerns. Constitution check passed with no violations. Modular architecture (Spec 1 = frontend, Spec 2 = backend) enables independent development. Research phase resolved all technical unknowns. Design phase produced complete API contracts and data models. Quickstart provides clear developer onboarding path.

## Evaluation notes (flywheel)

- Failure modes observed: None - all phases completed successfully
- Graders run and results (PASS/FAIL): PASS - Constitution check passed (5/5 principles), research resolved all unknowns, data model complete with TypeScript interfaces, OpenAPI contract valid, quickstart comprehensive
- Prompt variant (if applicable): Standard /sp.plan workflow with user-provided technical details (Better Auth, JWT, cookies, testing strategy)
- Next experiment (smallest change to try): Generate tasks with /sp.tasks and validate that task breakdown aligns with 5-phase implementation checklist in quickstart.md
