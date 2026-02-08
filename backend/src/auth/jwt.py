"""
JWT token generation and verification using PyJWT.

This module handles JWT token creation, encoding, decoding and validation
for the authentication system.
"""

import jwt
from fastapi import HTTPException, status
from typing import Dict, Any
from datetime import datetime, timedelta

from ..config import settings
from ..schemas.auth import JWTPayload


def verify_jwt_token(token: str) -> JWTPayload:
    """
    Verify and decode a JWT token using BETTER_AUTH_SECRET.

    This function decodes JWT tokens issued by Better Auth using the HS256
    algorithm and the shared secret key. It validates the token signature
    and expiration time.

    Args:
        token: JWT token string from better-auth.session.token cookie

    Returns:
        JWTPayload: Validated token payload containing userId, email, iat, exp

    Raises:
        HTTPException: 401 Unauthorized if token is invalid or expired
            - Token expired: Token's exp timestamp is in the past
            - Invalid token: Signature verification failed or malformed token
            - Invalid payload: Token missing required fields (userId, email, etc.)

    Example:
        >>> token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        >>> payload = verify_jwt_token(token)
        >>> print(payload.userId)
        "550e8400-e29b-41d4-a716-446655440000"

    Security Notes:
        - Uses HS256 (HMAC-SHA256) symmetric algorithm
        - BETTER_AUTH_SECRET must match frontend secret exactly
        - Token expiration is automatically validated by PyJWT
        - Signature tampering is detected and rejected
    """
    try:
        # Decode and verify JWT token signature
        payload_dict: Dict[str, Any] = jwt.decode(
            token,
            settings.BETTER_AUTH_SECRET,
            algorithms=["HS256"]
        )

        # Validate payload structure with Pydantic
        payload = JWTPayload(**payload_dict)

        return payload

    except jwt.ExpiredSignatureError:
        # Token expiration time (exp) is in the past
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"}
        )

    except jwt.InvalidTokenError as e:
        # Token signature invalid, malformed, or algorithm mismatch
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"}
        )

    except Exception as e:
        # Pydantic validation error or unexpected error
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"}
        )


def generate_jwt_token(user_id: str, email: str, expires_delta: timedelta = timedelta(days=7)) -> str:
    """
    Generate a JWT token for authenticated user.

    Creates a JWT token with user information and expiration time.
    Token is signed with BETTER_AUTH_SECRET using HS256 algorithm.

    Args:
        user_id: User's UUID
        email: User's email address
        expires_delta: Token expiration duration (default: 7 days)

    Returns:
        str: Encoded JWT token string

    Example:
        >>> token = generate_jwt_token("550e8400-e29b-41d4-a716-446655440000", "user@example.com")
        >>> print(token)
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

    Security Notes:
        - Uses HS256 (HMAC-SHA256) symmetric algorithm
        - Token includes iat (issued at) and exp (expiration) timestamps
        - BETTER_AUTH_SECRET must be kept secure and match across services
    """
    now = datetime.utcnow()
    expire = now + expires_delta

    payload = {
        "userId": user_id,
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp())
    }

    token = jwt.encode(payload, settings.BETTER_AUTH_SECRET, algorithm="HS256")
    return token
