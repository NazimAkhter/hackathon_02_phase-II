"""
FastAPI authentication dependencies.

This module provides dependency functions for JWT-based authentication
via httpOnly cookies. Use these dependencies to protect endpoints.
"""

from fastapi import Depends, HTTPException, Request, status
from typing import Annotated

from .jwt import verify_jwt_token
from ..schemas.auth import JWTPayload


async def get_current_user(request: Request) -> str:
    """
    FastAPI dependency to extract and validate JWT token from cookie.

    This dependency extracts the JWT token from the 'better-auth.session.token'
    httpOnly cookie, validates it, and returns the authenticated user's ID.

    Cookie Name: better-auth.session.token (set by frontend Better Auth)

    Usage:
        @app.get("/protected")
        def protected_endpoint(user_id: str = Depends(get_current_user)):
            # user_id is the authenticated user's UUID
            return {"user_id": user_id}

    Args:
        request: FastAPI Request object containing cookies

    Returns:
        str: Authenticated user's UUID from JWT payload

    Raises:
        HTTPException: 401 Unauthorized if:
            - Cookie is missing
            - Token is invalid or expired
            - Token signature verification fails

    Security:
        - Validates JWT signature with BETTER_AUTH_SECRET
        - Checks token expiration automatically
        - Extracts user_id from validated token payload
        - Should be used on ALL protected endpoints

    Example:
        # In endpoint function signature:
        async def list_tasks(
            user_id: str = Depends(get_current_user),
            session: Session = Depends(get_session)
        ):
            # user_id is authenticated user from JWT
            statement = select(Task).where(Task.user_id == user_id)
            tasks = session.exec(statement).all()
            return tasks
    """
    # Extract JWT token from httpOnly cookie
    token = request.cookies.get("better-auth.session.token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Verify and decode JWT token
    payload: JWTPayload = verify_jwt_token(token)

    # Return authenticated user's ID from token payload
    return payload.userId


# Type alias for cleaner dependency injection syntax
CurrentUser = Annotated[str, Depends(get_current_user)]


# Usage example in endpoint:
# async def endpoint(current_user: CurrentUser):
#     # current_user is the authenticated user_id (str)
#     pass
