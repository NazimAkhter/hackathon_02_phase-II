"""
Pydantic schemas for authentication and JWT token validation.

These schemas define request/response models for authentication endpoints
and JWT token payload structure.
"""

from pydantic import BaseModel, Field, EmailStr, field_validator
from datetime import datetime
from typing import Optional
import re


class JWTPayload(BaseModel):
    """
    JWT token payload structure from Better Auth.

    This schema validates the decoded JWT token payload to ensure
    it contains all required fields for user authentication.

    Better Auth token structure:
    {
        "userId": "550e8400-e29b-41d4-a716-446655440000",
        "email": "user@example.com",
        "iat": 1737285600,
        "exp": 1737372000
    }

    Attributes:
        userId: User's UUID from Better Auth
        email: User's email address
        iat: Issued at timestamp (Unix timestamp)
        exp: Expiration timestamp (Unix timestamp)
    """

    userId: str = Field(
        description="User's UUID from Better Auth",
        examples=["550e8400-e29b-41d4-a716-446655440000"]
    )

    email: str = Field(
        description="User's email address",
        examples=["user@example.com"]
    )

    iat: int = Field(
        description="Issued at timestamp (Unix timestamp)",
        examples=[1737285600]
    )

    exp: int = Field(
        description="Expiration timestamp (Unix timestamp)",
        examples=[1737372000]
    )

    class Config:
        """Pydantic configuration."""
        json_schema_extra = {
            "example": {
                "userId": "550e8400-e29b-41d4-a716-446655440000",
                "email": "user@example.com",
                "iat": 1737285600,
                "exp": 1737372000
            }
        }


class SignupRequest(BaseModel):
    """
    Request schema for user signup endpoint.

    Validates email format and password strength requirements.
    """

    email: EmailStr = Field(
        description="User's email address",
        examples=["user@example.com"]
    )

    password: str = Field(
        min_length=8,
        max_length=128,
        description="User's password (min 8 chars, must contain letters and numbers)",
        examples=["SecurePass123"]
    )

    name: Optional[str] = Field(
        default=None,
        max_length=255,
        description="User's display name (optional)",
        examples=["John Doe"]
    )

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """
        Validate password contains both letters and numbers.

        Requirements:
        - Minimum 8 characters
        - At least one letter
        - At least one number
        """
        if not re.search(r'[A-Za-z]', v):
            raise ValueError('Password must contain at least one letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')
        return v

    class Config:
        """Pydantic configuration."""
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "SecurePass123",
                "name": "John Doe"
            }
        }


class SigninRequest(BaseModel):
    """
    Request schema for user signin endpoint.

    Simple email/password authentication.
    """

    email: EmailStr = Field(
        description="User's email address",
        examples=["user@example.com"]
    )

    password: str = Field(
        min_length=1,
        description="User's password",
        examples=["SecurePass123"]
    )

    class Config:
        """Pydantic configuration."""
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "SecurePass123"
            }
        }


class UserResponse(BaseModel):
    """
    Response schema for user data (excludes sensitive fields).

    Used in signup/signin responses and user profile endpoints.
    """

    id: str = Field(
        description="User's UUID",
        examples=["550e8400-e29b-41d4-a716-446655440000"]
    )

    email: str = Field(
        description="User's email address",
        examples=["user@example.com"]
    )

    created_at: datetime = Field(
        description="Account creation timestamp",
        examples=["2024-01-15T10:30:00Z"]
    )

    updated_at: datetime = Field(
        description="Last update timestamp",
        examples=["2024-01-15T10:30:00Z"]
    )

    class Config:
        """Pydantic configuration."""
        from_attributes = True  # Enable ORM mode for SQLModel compatibility
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "email": "user@example.com",
                "created_at": "2024-01-15T10:30:00Z",
                "updated_at": "2024-01-15T10:30:00Z"
            }
        }


class AuthResponse(BaseModel):
    """
    Response schema for successful authentication.

    Returned by signup and signin endpoints.
    """

    message: str = Field(
        description="Success message",
        examples=["Account created successfully"]
    )

    user: UserResponse = Field(
        description="User data (excludes password_hash)"
    )

    token: str = Field(
        description="JWT authentication token",
        examples=["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."]
    )

    class Config:
        """Pydantic configuration."""
        json_schema_extra = {
            "example": {
                "message": "Account created successfully",
                "user": {
                    "id": "550e8400-e29b-41d4-a716-446655440000",
                    "email": "user@example.com",
                    "created_at": "2024-01-15T10:30:00Z",
                    "updated_at": "2024-01-15T10:30:00Z"
                },
                "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
        }
