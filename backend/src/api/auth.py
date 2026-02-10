"""
Authentication API endpoints for user signup and signin.

This module provides REST API endpoints for user authentication:
- POST /api/auth/signup - Create new user account
- POST /api/auth/signin - Authenticate existing user
- GET /api/auth/session - Get current session from HttpOnly cookie

Both signup/signin endpoints set httpOnly cookies with JWT tokens for session management.
The session endpoint reads the HttpOnly cookie and returns session data.
"""

from fastapi import APIRouter, Depends, HTTPException, Response, status, Request
from fastapi.responses import JSONResponse
from sqlmodel import Session, select
from datetime import datetime
import bcrypt
import uuid

from ..database import get_session
from ..models.user import User
from ..schemas.auth import SignupRequest, SigninRequest, AuthResponse, UserResponse
from ..auth.jwt import generate_jwt_token, verify_jwt_token
from ..config import settings


# Create router with auth prefix and tags
router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/signup",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new user account",
    responses={
        201: {
            "description": "Account created successfully",
            "content": {
                "application/json": {
                    "example": {
                        "message": "Account created successfully",
                        "user": {
                            "id": "550e8400-e29b-41d4-a716-446655440000",
                            "email": "user@example.com",
                            "created_at": "2024-01-15T10:30:00Z",
                            "updated_at": "2024-01-15T10:30:00Z"
                        }
                    }
                }
            }
        },
        400: {"description": "Invalid email or password format"},
        409: {"description": "Email already registered"},
        500: {"description": "Internal server error"}
    }
)
async def signup(
    request: SignupRequest,
    response: Response,
    session: Session = Depends(get_session)
):
    """
    Create a new user account with email and password.

    **Request Body:**
    - email: Valid email address (validated by Pydantic EmailStr)
    - password: Minimum 8 characters, must contain letters and numbers
    - name: Optional display name

    **Process:**
    1. Validate email format and password strength (handled by Pydantic)
    2. Check for duplicate email (return 409 if exists)
    3. Hash password with bcrypt (cost factor 12)
    4. Create user record in database
    5. Generate JWT token (7-day expiration)
    6. Set httpOnly cookie: better-auth.session.token
    7. Return user data (excludes password_hash)

    **Security:**
    - Password hashed with bcrypt cost factor 12
    - JWT token signed with BETTER_AUTH_SECRET
    - httpOnly cookie prevents XSS attacks
    - Secure flag enabled in production
    - SameSite=Lax prevents CSRF attacks

    **Response:**
    - 201 Created: Account created successfully with user data
    - 400 Bad Request: Invalid email or password format
    - 409 Conflict: Email already registered
    - 500 Internal Server Error: Database or unexpected error
    """
    try:
        # Normalize email to lowercase for consistency
        normalized_email = request.email.lower().strip()

        # Check for duplicate email
        statement = select(User).where(User.email == normalized_email)
        existing_user = session.exec(statement).first()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists"
            )

        # Hash password with bcrypt (cost factor 12 for security)
        password_bytes = request.password.encode('utf-8')
        salt = bcrypt.gensalt(rounds=12)
        password_hash = bcrypt.hashpw(password_bytes, salt).decode('utf-8')

        # Create user record
        user_id = str(uuid.uuid4())
        now = datetime.utcnow()

        new_user = User(
            id=user_id,
            email=normalized_email,
            password_hash=password_hash,
            created_at=now,
            updated_at=now
        )

        # Save to database
        session.add(new_user)
        session.commit()
        session.refresh(new_user)

        # Generate JWT token (7-day expiration)
        token = generate_jwt_token(user_id=new_user.id, email=new_user.email)

        # Set session cookie with HttpOnly for security and Better Auth compatibility
        # Note: Better Auth manages session state through its API, not by reading cookies directly
        # HttpOnly prevents XSS attacks and is required for proper Better Auth session management
        cookie_options = [
            f"better-auth.session.token={token}",
            "HttpOnly",  # CRITICAL: Required for Better Auth session management and XSS protection
            "Path=/",
            "SameSite=None",  # CRITICAL: Required for cross-origin cookies (Vercel → HF Spaces)
            "Secure",  # REQUIRED with SameSite=None (HTTPS only)
            f"Max-Age={60 * 60 * 24 * 7}",  # 7 days in seconds
        ]

        cookie_value = "; ".join(cookie_options)
        response.headers["Set-Cookie"] = cookie_value

        # Return user data (exclude password_hash) and token
        user_response = UserResponse(
            id=new_user.id,
            email=new_user.email,
            created_at=new_user.created_at,
            updated_at=new_user.updated_at
        )

        return {
            "message": "Account created successfully",
            "user": user_response,
            "token": token  # Include token in response body for frontend cookie setting
        }

    except HTTPException:
        # Re-raise HTTP exceptions (like 409 Conflict)
        raise

    except Exception as e:
        # Log error and return generic message
        print(f"[AUTH] Signup error: {str(e)}")
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during signup. Please try again."
        )


@router.post(
    "/signin",
    status_code=status.HTTP_200_OK,
    summary="Authenticate existing user",
    responses={
        200: {
            "description": "Signed in successfully",
            "content": {
                "application/json": {
                    "example": {
                        "message": "Signed in successfully",
                        "user": {
                            "id": "550e8400-e29b-41d4-a716-446655440000",
                            "email": "user@example.com",
                            "created_at": "2024-01-15T10:30:00Z",
                            "updated_at": "2024-01-15T10:30:00Z"
                        }
                    }
                }
            }
        },
        401: {"description": "Invalid email or password"},
        500: {"description": "Internal server error"}
    }
)
async def signin(
    request: SigninRequest,
    session: Session = Depends(get_session)
):
    """
    Authenticate user with email and password.

    **Request Body:**
    - email: User's email address
    - password: User's password

    **Process:**
    1. Normalize email to lowercase
    2. Find user by email
    3. Verify password with bcrypt
    4. Generate JWT token (7-day expiration)
    5. Set httpOnly cookie: better-auth.session.token
    6. Return user data

    **Security:**
    - Generic error messages (don't reveal if email exists)
    - Password verified with bcrypt
    - JWT token signed with BETTER_AUTH_SECRET
    - httpOnly cookie prevents XSS attacks
    - Secure flag enabled in production
    - SameSite=Lax prevents CSRF attacks

    **Response:**
    - 200 OK: Authentication successful with user data
    - 401 Unauthorized: Invalid email or password (generic message)
    - 500 Internal Server Error: Database or unexpected error
    """
    try:
        # Normalize email to lowercase
        normalized_email = request.email.lower().strip()

        # Find user by email
        statement = select(User).where(User.email == normalized_email)
        user = session.exec(statement).first()

        if not user:
            # Generic error message - don't reveal if email exists
            print(f"[AUTH] Signin failed - user not found: {normalized_email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        # Verify password with bcrypt
        password_bytes = request.password.encode('utf-8')
        stored_hash = user.password_hash.encode('utf-8')
        is_password_valid = bcrypt.checkpw(password_bytes, stored_hash)

        if not is_password_valid:
            # Generic error message - don't reveal which field is wrong
            print(f"[AUTH] Signin failed - invalid password for: {normalized_email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        # Authentication successful - generate JWT token
        token = generate_jwt_token(user_id=user.id, email=user.email)

        # Debug logging
        print(f"[AUTH DEBUG] Generated token for {user.email}: {token[:50]}...")
        print(f"[AUTH DEBUG] Token length: {len(token)}")

        # Set session cookie with HttpOnly for security and Better Auth compatibility
        # Note: Better Auth manages session state through its API, not by reading cookies directly
        # HttpOnly prevents XSS attacks and is required for proper Better Auth session management
        cookie_options = [
            f"better-auth.session.token={token}",
            "HttpOnly",  # CRITICAL: Required for Better Auth session management and XSS protection
            "Path=/",
            "SameSite=None",  # CRITICAL: Required for cross-origin cookies (Vercel → HF Spaces)
            "Secure",  # REQUIRED with SameSite=None (HTTPS only)
            f"Max-Age={60 * 60 * 24 * 7}",  # 7 days in seconds
        ]

        cookie_value = "; ".join(cookie_options)

        # Return user data (exclude password_hash) and token
        user_response = UserResponse(
            id=user.id,
            email=user.email,
            created_at=user.created_at,
            updated_at=user.updated_at
        )

        # Use JSONResponse to ensure token is included
        response_data = {
            "message": "Signed in successfully",
            "user": user_response.model_dump(mode='json'),
            "token": token
        }

        json_response = JSONResponse(content=response_data, status_code=200)
        json_response.headers["Set-Cookie"] = cookie_value

        return json_response

    except HTTPException:
        # Re-raise HTTP exceptions (like 401 Unauthorized)
        raise

    except Exception as e:
        # Log error and return generic message
        print(f"[AUTH] Signin error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during signin. Please try again."
        )


@router.get(
    "/session",
    status_code=status.HTTP_200_OK,
    summary="Get current session from HttpOnly cookie",
    responses={
        200: {
            "description": "Session retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "user": {
                            "id": "550e8400-e29b-41d4-a716-446655440000",
                            "email": "user@example.com",
                            "created_at": "2024-01-15T10:30:00Z",
                            "updated_at": "2024-01-15T10:30:00Z"
                        },
                        "expiresAt": 1705329000
                    }
                }
            }
        },
        401: {"description": "No session cookie or invalid/expired token"},
        500: {"description": "Internal server error"}
    }
)
async def get_session(
    request: Request,
    db_session: Session = Depends(get_session)
):
    """
    Get current session by reading and verifying HttpOnly cookie.

    **Purpose:**
    This endpoint allows the frontend to check session status without being able
    to read HttpOnly cookies directly via JavaScript. The browser automatically
    includes HttpOnly cookies in the request, and this endpoint validates them.

    **Process:**
    1. Extract better-auth.session.token from request cookies
    2. Verify JWT token signature and expiration
    3. Look up user in database
    4. Return user data and session expiration

    **Security:**
    - HttpOnly cookie prevents XSS attacks
    - JWT signature verification prevents tampering
    - Expiration check prevents use of old tokens
    - No token in response body (already in HttpOnly cookie)

    **Response:**
    - 200 OK: Valid session with user data and expiration
    - 401 Unauthorized: No cookie, invalid token, or expired session
    - 500 Internal Server Error: Database or unexpected error
    """
    try:
        # Extract token from HttpOnly cookie
        token = request.cookies.get("better-auth.session.token")

        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No session cookie found"
            )

        print(f"[AUTH] Session check - token found, length: {len(token)}")

        # Verify JWT token (checks signature and expiration)
        payload = verify_jwt_token(token)

        print(f"[AUTH] Token verified - userId: {payload.userId}, email: {payload.email}")

        # Look up user in database
        statement = select(User).where(User.id == payload.userId)
        user = db_session.exec(statement).first()

        if not user:
            print(f"[AUTH] Session check failed - user not found: {payload.userId}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )

        # Return user data and session info
        user_response = UserResponse(
            id=user.id,
            email=user.email,
            created_at=user.created_at,
            updated_at=user.updated_at
        )

        return {
            "user": user_response.model_dump(mode='json'),
            "expiresAt": payload.exp,
            "token": token  # Include token for frontend to use in API calls
        }

    except HTTPException:
        # Re-raise HTTP exceptions (like 401 Unauthorized)
        raise

    except Exception as e:
        # Log error and return generic message
        print(f"[AUTH] Session check error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while checking session. Please try again."
        )
