# ADR-0002: API-Based Session Verification Approach

> **Scope**: This ADR documents the architectural decision to use API-based session verification instead of client-side cookie reading for authentication state management with HttpOnly cookies.

- **Status:** Accepted
- **Date:** 2026-02-10
- **Feature:** 001-fix-auth-timeout
- **Context:** The authentication timeout issue stems from the frontend attempting to read HttpOnly cookies via `document.cookie` to verify session establishment. This approach is fundamentally incompatible with HttpOnly cookies, which are designed to be inaccessible to JavaScript as a security measure against XSS attacks. The existing implementation assumed cookies could be read client-side, causing session verification to always fail and timeout after 1 second, preventing users from logging in successfully.

<!-- Significance checklist (ALL must be true to justify this ADR)
     1) Impact: YES - Affects authentication architecture across frontend and backend
     2) Alternatives: YES - Multiple approaches considered (localStorage, disabling HttpOnly, etc.)
     3) Scope: YES - Cross-cutting concern affecting all authenticated routes and user sessions
-->

## Decision

Implement API-based session verification where the backend provides a dedicated endpoint for session validation:

- **Backend Endpoint**: `GET /api/auth/session` that reads HttpOnly cookie from request headers
- **Cookie Handling**: Browser automatically includes HttpOnly cookie in requests when `credentials: 'include'` is set
- **JWT Verification**: Backend verifies JWT signature, expiration, and user existence before returning session data
- **Frontend Polling**: Frontend polls session endpoint (50ms intervals, 3000ms max timeout) to detect session establishment
- **Response Format**: Returns user data, token, and expiration timestamp on success; 401 on invalid/missing session
- **Timeout Configuration**: Increased from 1000ms to 3000ms to accommodate backend bcrypt operations (~2 seconds)
- **Retry Logic**: Single retry with 500ms delay if initial session check fails due to timing issues

## Consequences

### Positive

- **Security Maintained**: HttpOnly cookies prevent XSS attacks from stealing JWT tokens - JavaScript cannot access the token even if malicious code executes
- **Better Auth Compatibility**: Aligns with Better Auth's intended architecture for session management with HttpOnly cookies
- **Reliable Session Verification**: Backend has authoritative access to cookies via request headers, eliminating client-side detection failures
- **Industry Best Practice**: API-based session verification is the standard pattern for HttpOnly cookie authentication
- **No Token Exposure**: JWT tokens never exposed to client-side JavaScript, reducing attack surface
- **Stateless Authentication**: Maintains JWT stateless approach - no session storage in database required
- **CORS Compliance**: Works correctly with cross-origin requests when `allow_credentials=True` is configured

### Negative

- **Additional API Endpoint**: Requires implementing and maintaining `GET /api/auth/session` endpoint
- **Network Overhead**: Session verification requires HTTP round-trip instead of local cookie check (adds ~100-500ms latency)
- **CORS Dependency**: Requires proper CORS configuration with `allow_credentials=True` - misconfiguration breaks authentication
- **Polling Complexity**: Frontend must implement polling logic with timeout and retry handling
- **Backend Load**: Every session check hits the backend (though JWT verification is fast, ~10ms)
- **Debugging Complexity**: Session issues require checking both frontend polling logic and backend cookie handling

## Alternatives Considered

### Alternative 1: Client-Side Cookie Reading via `document.cookie`

**Approach**: Read HttpOnly cookie directly in JavaScript to verify session establishment.

**Why Rejected**:
- **Technically Impossible**: HttpOnly cookies are explicitly designed to be inaccessible to JavaScript via `document.cookie`
- **Security Feature**: Attempting to bypass this would require disabling HttpOnly, which is an unacceptable security risk
- **Browser Enforcement**: All modern browsers enforce HttpOnly restriction - no workaround exists

### Alternative 2: Store JWT in localStorage Instead of HttpOnly Cookies

**Approach**: Store JWT token in browser localStorage and read it directly in JavaScript for session verification.

**Why Rejected**:
- **XSS Vulnerability**: localStorage is accessible to any JavaScript code, including malicious scripts injected via XSS attacks
- **Security Downgrade**: Removes the primary security benefit of HttpOnly cookies
- **Industry Anti-Pattern**: Storing authentication tokens in localStorage is considered a security vulnerability by OWASP
- **Better Auth Incompatibility**: Would require reconfiguring Better Auth to not use HttpOnly cookies

### Alternative 3: Disable HttpOnly Flag on Session Cookie

**Approach**: Configure Better Auth to set session cookies without HttpOnly flag, allowing JavaScript access.

**Why Rejected**:
- **Unacceptable Security Risk**: Exposes JWT tokens to XSS attacks
- **Violates Security Best Practices**: HttpOnly is a critical security control for authentication tokens
- **Regulatory Concerns**: May violate security compliance requirements (PCI-DSS, SOC 2, etc.)
- **Better Auth Default**: Better Auth uses HttpOnly by default for good reason - disabling it defeats the purpose

### Alternative 4: Session Storage in Frontend State Only (No Persistence)

**Approach**: Store session data only in React state without verifying against backend cookie.

**Why Rejected**:
- **No Persistence**: Session lost on page refresh, requiring re-login
- **Unreliable**: Frontend state can be out of sync with actual backend session
- **Poor UX**: Users would need to log in again after every page refresh
- **Security Gap**: No way to verify session is still valid on backend

## References

- Feature Spec: [specs/001-fix-auth-timeout/spec.md](../../specs/001-fix-auth-timeout/spec.md)
- Implementation Plan: [specs/001-fix-auth-timeout/plan.md](../../specs/001-fix-auth-timeout/plan.md)
- Research Document: [specs/001-fix-auth-timeout/research.md](../../specs/001-fix-auth-timeout/research.md) (Decision 1)
- API Contract: [specs/001-fix-auth-timeout/contracts/session-endpoint.yaml](../../specs/001-fix-auth-timeout/contracts/session-endpoint.yaml)
- Data Model: [specs/001-fix-auth-timeout/data-model.md](../../specs/001-fix-auth-timeout/data-model.md)
- Related ADRs: None (first authentication-related ADR for this project)
- Evaluator Evidence: [history/prompts/001-fix-auth-timeout/](../../history/prompts/001-fix-auth-timeout/) (PHRs documenting decision process)
