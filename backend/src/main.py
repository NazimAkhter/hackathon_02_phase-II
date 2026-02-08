"""
FastAPI application entry point.

This module initializes the FastAPI app with CORS middleware,
custom error handlers, and health check endpoint.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .errors.handlers import register_exception_handlers
# Import models to register them with SQLModel metadata
from .models.user import User  # noqa: F401
from .models.task import Task  # noqa: F401


# Create FastAPI application instance
app = FastAPI(
    title="Task Management API",
    description="Backend API for multi-user task management with JWT authentication",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)


# Configure CORS middleware for frontend cookie transmission
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,  # Frontend URLs from config
    allow_credentials=True,  # CRITICAL: Required for httpOnly cookie transmission
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# Register custom exception handlers
register_exception_handlers(app)


# Health Check Endpoint
@app.get(
    "/",
    tags=["Health"],
    summary="Health check",
    response_description="Server status and configuration"
)
async def health_check():
    """
    Health check endpoint to verify server is running.

    Returns:
        dict: Server status, environment, and configuration details

    Example Response:
        {
            "status": "ok",
            "environment": "development",
            "version": "1.0.0",
            "cors_origins": ["http://localhost:3000"]
        }
    """
    return JSONResponse(
        status_code=200,
        content={
            "status": "ok",
            "environment": settings.ENVIRONMENT,
            "version": "1.0.0",
            "cors_origins": settings.allowed_origins,
            "message": "Task Management API is running"
        }
    )


# Mount authentication router
from .api.auth import router as auth_router

app.include_router(auth_router, prefix="/api")

# Mount task management router
from .api.tasks import router as tasks_router

app.include_router(tasks_router, prefix="/api")


# Application startup event
@app.on_event("startup")
async def startup_event():
    """
    Execute on application startup.

    Validates configuration and logs startup information.
    """
    print(f"Starting Task Management API in {settings.ENVIRONMENT} mode")
    print(f"CORS allowed origins: {settings.allowed_origins}")
    print(f"Database: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else 'configured'}")


# Application shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """
    Execute on application shutdown.

    Cleanup resources and log shutdown information.
    """
    print("Shutting down Task Management API")


# Entry point for running with uvicorn
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.is_development,  # Auto-reload in development only
        log_level="info"
    )
