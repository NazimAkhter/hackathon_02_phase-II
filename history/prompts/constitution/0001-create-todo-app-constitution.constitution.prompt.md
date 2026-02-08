---
id: 0001
title: Create Todo App Constitution
stage: constitution
date: 2026-01-19
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: master
user: system
command: /sp.constitution
labels: ["constitution", "governance", "principles", "security", "authentication", "rest-api", "jwt", "multi-user"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - none
---

## Prompt

Project: Todo Full-Stack Web Application
Core principles:

Agentic development workflow (no manual coding)
Security-first with user data isolation
RESTful API design standards
Stateless JWT-based authentication
Multi-user support with persistent storage

Key standards:

All code generated via Claude Code and Spec-Kit Plus
JWT tokens for authentication (7-day expiry)
RESTful conventions for all endpoints
User_id validation: URL matches JWT token
HTTPS-only in production
Environment-based secrets management

Constraints:

Frontend: Next.js 16+ (App Router)
Backend: Python FastAPI
Database: Neon Serverless PostgreSQL
ORM: SQLModel
Auth: Better Auth with JWT plugin
Shared secret: BETTER_AUTH_SECRET across services
All 6 API endpoints required (GET, POST, PUT, DELETE, PATCH)

Success criteria:

Complete user journey: signup → login → manage tasks → logout
All 5 basic CRUD operations functional
Each user sees only their own tasks
401 responses for unauthenticated requests
JWT verification on every API call
Responsive UI (mobile, tablet, desktop)
Zero authentication bypass vulnerabilities
Database properly normalized with foreign keys

## Response snapshot

Created comprehensive project constitution v1.0.0 with 5 core principles:

I. Agentic Development Workflow - All code via Claude Code/Spec-Kit Plus, no manual coding
II. Security-First Architecture - User data isolation at every layer, JWT validation mandatory
III. RESTful API Design Standards - 6 required endpoints with proper HTTP semantics
IV. Stateless JWT Authentication - Better Auth with 7-day expiry, shared secret validation
V. Multi-User Persistent Storage - Neon PostgreSQL with 3NF normalization, foreign keys

Added sections:
- Technology Stack Constraints (mandatory/prohibited technologies)
- Authentication & Authorization Standards (signup/signin/validation flows)
- Success Criteria & Acceptance Gates (deployment blockers)

Constitution includes:
- Detailed JWT token validation flow (10 steps)
- Database schema requirements (users + todos tables)
- All 6 required API endpoints with RESTful conventions
- Security gates that block deployment if violated
- Responsive UI requirements (mobile/tablet/desktop)
- Governance procedures for amendments

Version: 1.0.0
Ratified: 2026-01-19
Last Amended: 2026-01-19

## Outcome

- ✅ Impact: Constitution v1.0.0 created with 5 core principles, 3 additional sections, and comprehensive governance framework. All templates verified for compatibility.
- 🧪 Tests: No automated tests - constitution is governance document
- 📁 Files: 1 file created (.specify/memory/constitution.md)
- 🔁 Next prompts: `/sp.specify` to create feature specification following constitution principles, `/sp.plan` to generate implementation plan with constitution check
- 🧠 Reflection: Constitution provides strong security guarantees (user isolation, JWT validation, no bypass routes) and clear technical constraints. All principles are testable and enforceable. Templates already aligned with constitution structure.

## Evaluation notes (flywheel)

- Failure modes observed: None - constitution creation successful on first attempt
- Graders run and results (PASS/FAIL): PASS - All placeholders filled, no bracket tokens remaining, version format correct (1.0.0), dates ISO format (2026-01-19), principles declarative and testable
- Prompt variant (if applicable): Standard `/sp.constitution` command with detailed project requirements
- Next experiment (smallest change to try): Validate constitution enforcement during first feature implementation to ensure principles are practical and complete
