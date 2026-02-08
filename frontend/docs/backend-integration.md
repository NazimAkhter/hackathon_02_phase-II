# Backend Integration Guide - FastAPI JWT Verification

This guide explains how to integrate the Next.js authentication system with a FastAPI backend using JWT token verification.

## Overview

The authentication flow:

1. **Frontend (Next.js)**: User signs up/signs in → Receives JWT token in httpOnly cookie
2. **Browser**: Automatically sends cookie with every request to backend
3. **Backend (FastAPI)**: Extracts cookie → Verifies JWT → Authorizes request

## Prerequisites

### 1. Shared Secret

Both frontend and backend **must use the same `BETTER_AUTH_SECRET`** for JWT signing and verification.

**Frontend (.env.local):**
```bash
BETTER_AUTH_SECRET=YMUQqkzlCJ0cCGRWx5lWKB081cETI/yqIwuixAMY9qbRGR+vXlXsgTy4Sx5oj7H41BynG1pI6NzzgjdFWhqpDQ==
```

**Backend (.env):**
```bash
BETTER_AUTH_SECRET=YMUQqkzlCJ0cCGRWx5lWKB081cETI/yqIwuixAMY9qbRGR+vXlXsgTy4Sx5oj7H41BynG1pI6NzzgjdFWhqpDQ==
```

### 2. Install Dependencies

```bash
pip install pyjwt python-dotenv
```

## JWT Token Structure

The JWT payload contains:

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "iat": 1737258000,
  "exp": 1737862800
}
```

- **userId**: UUID of the authenticated user
- **email**: User's email address
- **iat**: Issued at timestamp (seconds since epoch)
- **exp**: Expiration timestamp (iat + 7 days)

## FastAPI Implementation

### Step 1: Cookie Extraction

The JWT token is stored in the `better-auth.session.token` httpOnly cookie. FastAPI needs to extract this cookie from incoming requests.

```python
from fastapi import Cookie, HTTPException
from typing import Optional

async def get_token_from_cookie(
    better_auth_session_token: Optional[str] = Cookie(None, alias="better-auth.session.token")
) -> str:
    """
    Extract JWT token from httpOnly cookie

    Args:
        better_auth_session_token: The JWT token from cookie

    Returns:
        JWT token string

    Raises:
        HTTPException: 401 if cookie is missing
    """
    if not better_auth_session_token:
        raise HTTPException(
            status_code=401,
            detail="Missing authentication token"
        )

    return better_auth_session_token
```

**Key Points:**
- Cookie name is `better-auth.session.token` (note the dot in the name)
- Use `alias` parameter to handle the dot in the cookie name
- Return 401 Unauthorized if cookie is missing

### Step 2: JWT Verification

Verify the token signature and decode the payload:

```python
import jwt
import os
from fastapi import HTTPException
from typing import Dict

# Load secret from environment
BETTER_AUTH_SECRET = os.getenv("BETTER_AUTH_SECRET")

if not BETTER_AUTH_SECRET:
    raise ValueError("BETTER_AUTH_SECRET environment variable is required")

def verify_jwt_token(token: str) -> Dict[str, str]:
    """
    Verify JWT token and extract payload

    Args:
        token: JWT token string from cookie

    Returns:
        Dictionary containing userId and email

    Raises:
        HTTPException: 401 if token is invalid or expired
    """
    try:
        # Decode and verify token signature
        payload = jwt.decode(
            token,
            BETTER_AUTH_SECRET,
            algorithms=["HS256"]
        )

        # Extract user information
        return {
            "user_id": payload["userId"],
            "email": payload["email"]
        }

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token expired. Please sign in again."
        )

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token signature"
        )

    except KeyError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token payload"
        )
```

**Security Notes:**
- Always specify `algorithms=["HS256"]` to prevent algorithm confusion attacks
- Handle all JWT exceptions and return 401 Unauthorized
- Never expose detailed error messages to clients (security risk)

### Step 3: Authentication Dependency

Create a reusable dependency for protected routes:

```python
from fastapi import Depends

async def get_current_user(
    token: str = Depends(get_token_from_cookie)
) -> Dict[str, str]:
    """
    Get current authenticated user from JWT token

    This dependency can be used in any route that requires authentication.

    Args:
        token: JWT token extracted from cookie

    Returns:
        Dictionary with user_id and email

    Raises:
        HTTPException: 401 if authentication fails
    """
    return verify_jwt_token(token)
```

### Step 4: Protect Routes

Use the dependency to protect your API endpoints:

```python
from fastapi import APIRouter, Depends

router = APIRouter()

@router.get("/api/todos")
async def get_todos(
    current_user: Dict[str, str] = Depends(get_current_user)
):
    """
    Get todos for the authenticated user

    This route is protected - only authenticated users can access it.
    """
    user_id = current_user["user_id"]
    email = current_user["email"]

    # Query todos for this user from database
    todos = await get_user_todos(user_id)

    return {
        "user": {"id": user_id, "email": email},
        "todos": todos
    }

@router.post("/api/todos")
async def create_todo(
    todo_data: dict,
    current_user: Dict[str, str] = Depends(get_current_user)
):
    """
    Create a new todo for the authenticated user
    """
    user_id = current_user["user_id"]

    # Create todo with ownership
    new_todo = await create_user_todo(user_id, todo_data)

    return new_todo
```

## Complete Example

Here's a full working example combining all steps:

```python
# auth.py
import jwt
import os
from fastapi import Cookie, HTTPException, Depends
from typing import Optional, Dict

# Load environment variable
BETTER_AUTH_SECRET = os.getenv("BETTER_AUTH_SECRET")

if not BETTER_AUTH_SECRET:
    raise ValueError("BETTER_AUTH_SECRET must be set in environment")

async def get_token_from_cookie(
    better_auth_session_token: Optional[str] = Cookie(
        None,
        alias="better-auth.session.token"
    )
) -> str:
    """Extract JWT token from httpOnly cookie"""
    if not better_auth_session_token:
        raise HTTPException(
            status_code=401,
            detail="Missing authentication token"
        )
    return better_auth_session_token

def verify_jwt_token(token: str) -> Dict[str, str]:
    """Verify JWT token and extract user info"""
    try:
        payload = jwt.decode(
            token,
            BETTER_AUTH_SECRET,
            algorithms=["HS256"]
        )
        return {
            "user_id": payload["userId"],
            "email": payload["email"]
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except KeyError:
        raise HTTPException(status_code=401, detail="Invalid token payload")

async def get_current_user(
    token: str = Depends(get_token_from_cookie)
) -> Dict[str, str]:
    """Get current authenticated user - use as dependency"""
    return verify_jwt_token(token)
```

```python
# main.py
from fastapi import FastAPI, Depends
from auth import get_current_user

app = FastAPI()

@app.get("/api/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return {
        "user_id": current_user["user_id"],
        "email": current_user["email"]
    }

@app.get("/api/protected")
async def protected_route(current_user: dict = Depends(get_current_user)):
    """Example protected route"""
    return {
        "message": f"Hello {current_user['email']}!",
        "user_id": current_user["user_id"]
    }
```

## CORS Configuration

If your frontend and backend are on different domains, configure CORS properly:

```python
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your Next.js dev server
    allow_credentials=True,  # REQUIRED for cookies
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Critical**: Set `allow_credentials=True` to allow cookies to be sent cross-origin.

## Testing the Integration

### 1. Sign up a user (Frontend)

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}' \
  -c cookies.txt
```

### 2. Call protected backend endpoint

```bash
curl http://localhost:8000/api/me \
  -b cookies.txt
```

Expected response:
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "test@example.com"
}
```

## Troubleshooting

### "Missing authentication token" (401)

**Cause**: Cookie not being sent or extracted correctly

**Solutions**:
- Verify cookie name is exactly `better-auth.session.token`
- Check CORS configuration includes `allow_credentials=True`
- Ensure frontend and backend domains match (or CORS is configured)
- Check browser DevTools → Application → Cookies to verify cookie exists

### "Invalid token signature" (401)

**Cause**: BETTER_AUTH_SECRET mismatch between frontend and backend

**Solutions**:
- Verify both frontend and backend use **exactly** the same secret
- Check for whitespace or encoding issues in .env files
- Regenerate secret and update both frontend and backend

### "Token expired" (401)

**Cause**: Token older than 7 days

**Solutions**:
- User needs to sign in again to get a fresh token
- Implement token refresh logic if needed
- Check server clock sync (time skew can cause issues)

### CORS errors in browser

**Cause**: Missing or incorrect CORS configuration

**Solutions**:
- Add `allow_credentials=True` to CORS middleware
- Add frontend origin to `allow_origins` list
- Check browser console for specific CORS error messages

## Security Best Practices

1. **Always use HTTPS in production**: httpOnly cookies with Secure flag require HTTPS
2. **Rotate secrets regularly**: Update BETTER_AUTH_SECRET periodically
3. **Validate payload fields**: Check userId and email exist before using them
4. **Log authentication failures**: Monitor for suspicious activity
5. **Rate limit authentication endpoints**: Prevent brute force attacks
6. **Use environment variables**: Never hardcode secrets in code
7. **Handle errors gracefully**: Don't expose internal details in error messages

## Next Steps

- Implement user-specific database queries using `user_id` from JWT
- Add role-based authorization (extend JWT payload with roles)
- Implement token refresh mechanism for long-lived sessions
- Add logout endpoint that clears the cookie
- Set up monitoring and alerting for authentication failures

## Additional Resources

- [PyJWT Documentation](https://pyjwt.readthedocs.io/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [OWASP JWT Security](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
