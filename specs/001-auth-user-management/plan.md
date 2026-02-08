# Implementation Plan: Authentication & User Management System

**Branch**: `001-auth-user-management` | **Date**: 2026-01-19 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-auth-user-management/spec.md`

## Summary

Implement JWT-based authentication system using Better Auth for Next.js 16+ frontend that generates tokens verifiable by FastAPI backend. The system enables user signup and signin flows with email/password credentials, issues JWT tokens with 7-day expiration containing user_id and email, and stores tokens in httpOnly cookies for XSS protection. The shared secret (BETTER_AUTH_SECRET) enables cryptographic token validation across frontend and backend services without database lookups.

**Primary Requirement**: Create authentication foundation for multi-user todo application with stateless JWT tokens that can be validated by external services.

**Technical Approach**: Use Better Auth library with JWT plugin in Next.js App Router to handle signup/signin, configure httpOnly cookies with security flags, export JWT verification utilities for FastAPI integration in Spec 2.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 16+, Node.js 20+
**Primary Dependencies**: Better Auth (JWT plugin), Next.js 16+, React 18+, bcrypt or Argon2
**Storage**: User credentials stored in Neon PostgreSQL (database setup deferred to Spec 2)
**Testing**: Jest + React Testing Library for components, Playwright for E2E auth flows
**Target Platform**: Web application (browser + Node.js runtime)
**Project Type**: Web application with frontend authentication (backend integration in Spec 2)
**Performance Goals**: Signup < 60s, Signin < 30s, token generation < 100ms
**Constraints**: 7-day token expiration (604800 seconds), httpOnly cookies only, BETTER_AUTH_SECRET must match across services
**Scale/Scope**: 100+ concurrent authentication requests, single-tenant JWT validation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Agentic Development Workflow

- ✅ **PASS**: Feature created via `/sp.specify`, plan via `/sp.plan`, will implement via specialized agents
- ✅ **PASS**: Implementation will use `nextjs-ui-builder` for frontend, `auth-security-architect` for security review
- ✅ **PASS**: Architectural decisions will be documented via `/sp.adr` (token storage, password hashing, cookie configuration)

### Principle II: Security-First Architecture

- ✅ **PASS**: JWT token validation enforces user data isolation (user_id in token)
- ✅ **PASS**: httpOnly cookies prevent XSS attacks (JavaScript cannot access tokens)
- ✅ **PASS**: Secure and SameSite flags prevent CSRF attacks
- ✅ **PASS**: BETTER_AUTH_SECRET stored in environment variables, never hardcoded
- ✅ **PASS**: Rate limiting (5 attempts per 15 minutes) prevents brute force attacks
- ✅ **PASS**: Generic error messages prevent email enumeration ("Invalid email or password")
- ⚠️ **DEFERRED**: Backend JWT validation deferred to Spec 2 (FastAPI implementation)
- ⚠️ **DEFERRED**: User ID matching in URLs deferred to Spec 2 (todo CRUD endpoints)

**Status**: PASS with deferred items (backend components in separate spec per modular design)

### Principle III: RESTful API Design Standards

- ✅ **PASS**: Authentication endpoints follow REST conventions:
  - `POST /api/auth/signup` - Create new user account (201 Created)
  - `POST /api/auth/signin` - Authenticate user (200 OK with token)
- ✅ **PASS**: Proper HTTP status codes: 200 (success), 201 (created), 400 (validation), 401 (auth failed), 409 (duplicate email)
- ✅ **PASS**: Consistent JSON response format with error details
- ⚠️ **DEFERRED**: Todo CRUD endpoints in Spec 2 (not part of authentication system)

**Status**: PASS (authentication endpoints only, todo endpoints in separate spec)

### Principle IV: Stateless JWT Authentication

- ✅ **PASS**: Better Auth configured with JWT plugin for token generation
- ✅ **PASS**: Shared secret BETTER_AUTH_SECRET used for token signing
- ✅ **PASS**: JWT tokens contain user_id, email, expiration timestamp (7 days)
- ✅ **PASS**: Tokens stored in httpOnly cookies (more secure than localStorage)
- ✅ **PASS**: Token expiry enforced at 7 days (604800 seconds)
- ⚠️ **DEFERRED**: Backend token verification in FastAPI (Spec 2)
- ⚠️ **FUTURE**: Refresh token mechanism (out of scope, documented in spec)

**Status**: PASS (frontend token generation complete, backend validation in Spec 2)

### Principle V: Multi-User Persistent Storage

- ⚠️ **DEFERRED**: User table creation in Neon PostgreSQL (database schema in Spec 2)
- ⚠️ **DEFERRED**: SQLModel ORM integration (backend implementation in Spec 2)
- ⚠️ **DEFERRED**: Database migrations (database setup in Spec 2)
- ✅ **PASS**: User entity defined in spec (email unique, password_hash, timestamps)

**Status**: DEFERRED (database implementation is backend concern, belongs in Spec 2)

### Technology Stack Compliance

- ✅ **PASS**: Next.js 16+ App Router (mandatory frontend framework)
- ✅ **PASS**: React 18+ with Server Components
- ✅ **PASS**: TypeScript for type safety
- ✅ **PASS**: Better Auth with JWT plugin (mandatory authentication library)
- ✅ **PASS**: bcrypt or Argon2 for password hashing (Better Auth default)
- ✅ **PASS**: Claude Code agents for implementation (no manual coding)

**Status**: PASS (all mandatory technologies used)

### Overall Constitution Compliance

**Status**: ✅ **PASS**

All principles complied with for authentication-specific scope. Database and backend API concerns correctly deferred to Spec 2 per modular architecture. No violations requiring complexity tracking justification.

## Project Structure

### Documentation (this feature)

```text
specs/001-auth-user-management/
├── plan.md              # This file (/sp.plan command output)
├── spec.md              # Feature specification (/sp.specify command output)
├── research.md          # Phase 0 output (Better Auth best practices, JWT configuration)
├── data-model.md        # Phase 1 output (User entity, JWT token structure)
├── quickstart.md        # Phase 1 output (setup instructions, env vars, testing)
├── contracts/           # Phase 1 output (auth API contracts)
│   └── auth-api.yaml    # OpenAPI spec for signup/signin endpoints
└── checklists/          # Quality validation
    └── requirements.md  # Spec quality checklist (completed)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/
│   │   │       ├── signup/
│   │   │       │   └── route.ts         # POST /api/auth/signup handler
│   │   │       └── signin/
│   │   │           └── route.ts         # POST /api/auth/signin handler
│   │   ├── (auth)/
│   │   │   ├── signup/
│   │   │   │   └── page.tsx             # Signup page UI
│   │   │   └── signin/
│   │   │       └── page.tsx             # Signin page UI
│   │   └── layout.tsx                   # Root layout
│   ├── components/
│   │   └── auth/
│   │       ├── SignupForm.tsx           # Signup form component
│   │       ├── SigninForm.tsx           # Signin form component
│   │       └── AuthErrorDisplay.tsx     # Error message component
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── better-auth.ts           # Better Auth configuration
│   │   │   ├── jwt-utils.ts             # JWT verification utilities (for Spec 2 export)
│   │   │   └── validation.ts            # Email/password validation helpers
│   │   └── env.ts                       # Environment variable schema validation
│   └── types/
│       └── auth.ts                      # TypeScript types for auth entities
├── tests/
│   ├── integration/
│   │   ├── auth-signup.test.ts          # Signup flow integration tests
│   │   └── auth-signin.test.ts          # Signin flow integration tests
│   └── e2e/
│       └── auth-journey.spec.ts         # Playwright E2E tests for complete auth flow
├── .env.local                           # Local environment variables (gitignored)
├── .env.example                         # Example environment variables template
└── package.json                         # Dependencies: better-auth, jwt, bcrypt
```

**Structure Decision**: Web application structure (Option 2) selected. This feature implements only the frontend authentication system using Next.js App Router. Backend directory and database integration deferred to Spec 2 per modular architecture principle. Frontend-only implementation allows independent development and testing of JWT token generation before backend FastAPI integration.

## Complexity Tracking

> No constitution violations - table intentionally left empty.

All principles complied with. Deferred items (database, backend validation) are correctly scoped to future specifications and do not represent violations. Modular architecture (frontend auth separate from backend validation) is intentional design decision documented in ADR.
