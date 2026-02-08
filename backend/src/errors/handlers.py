"""
Custom exception handlers for structured JSON error responses.

This module defines custom exceptions and exception handlers that return
consistent, machine-readable error responses across all endpoints.
"""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from typing import Dict, Any, Optional


# Custom Exception Classes


class AppException(Exception):
    """
    Base exception class for application-specific errors.

    All custom exceptions should inherit from this class to enable
    consistent error handling and response formatting.
    """

    def __init__(
        self,
        message: str,
        code: str,
        status_code: int,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class UnauthorizedError(AppException):
    """Raised when authentication fails (401)."""

    def __init__(self, message: str = "Unauthorized", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="ERR_UNAUTHORIZED",
            status_code=status.HTTP_401_UNAUTHORIZED,
            details=details
        )


class ForbiddenError(AppException):
    """Raised when user lacks permission (403)."""

    def __init__(self, message: str = "Forbidden", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="ERR_FORBIDDEN",
            status_code=status.HTTP_403_FORBIDDEN,
            details=details
        )


class NotFoundError(AppException):
    """Raised when resource not found (404)."""

    def __init__(self, message: str = "Resource not found", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="ERR_NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            details=details
        )


class ValidationFailedError(AppException):
    """Raised when request validation fails (400)."""

    def __init__(self, message: str = "Validation failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="ERR_VALIDATION_FAILED",
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details
        )


class DatabaseError(AppException):
    """Raised when database operation fails (500)."""

    def __init__(self, message: str = "Database error", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="ERR_DATABASE_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details
        )


# Exception Handlers


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """
    Handler for custom AppException errors.

    Returns structured JSON response with error, code, and details fields.
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.message,
            "code": exc.code,
            "details": exc.details
        }
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Handler for FastAPI/Pydantic validation errors.

    Transforms validation errors into consistent error response format
    with field-level error details.
    """
    errors = exc.errors()

    # Extract field-level validation errors
    field_errors = {}
    for error in errors:
        field = ".".join(str(loc) for loc in error["loc"] if loc != "body")
        field_errors[field] = error["msg"]

    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": "Validation failed",
            "code": "ERR_VALIDATION_FAILED",
            "details": {
                "fields": field_errors,
                "errors": errors
            }
        }
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Catch-all handler for unexpected exceptions.

    In production, hides internal error details for security.
    In development, includes full error details for debugging.
    """
    from ..config import settings

    # In production, hide internal error details
    if settings.is_production:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "Internal server error",
                "code": "ERR_INTERNAL_ERROR",
                "details": {}
            }
        )

    # In development, include error details for debugging
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "code": "ERR_INTERNAL_ERROR",
            "details": {
                "type": type(exc).__name__,
                "message": str(exc)
            }
        }
    )


# Registration Function


def register_exception_handlers(app: FastAPI) -> None:
    """
    Register all custom exception handlers with FastAPI app.

    This function should be called during app initialization in main.py.

    Args:
        app: FastAPI application instance

    Example:
        from fastapi import FastAPI
        from .errors.handlers import register_exception_handlers

        app = FastAPI()
        register_exception_handlers(app)
    """
    # Custom exception handlers
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)
