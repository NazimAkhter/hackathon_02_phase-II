"""
Configuration settings for the FastAPI backend.

This module uses Pydantic Settings to load environment variables
from .env file with type validation and defaults.
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """
    Application configuration loaded from environment variables.

    Required environment variables:
    - BETTER_AUTH_SECRET: JWT signing secret (must match frontend)
    - DATABASE_URL: PostgreSQL connection string for Neon

    Optional environment variables:
    - ENVIRONMENT: development, staging, or production (default: development)
    - FRONTEND_URL: Frontend origin for CORS (default: http://localhost:3000)
    """

    # JWT Authentication
    BETTER_AUTH_SECRET: str

    # Database
    DATABASE_URL: str

    # Application Environment
    ENVIRONMENT: str = "development"

    # CORS Configuration
    FRONTEND_URL: str = "http://localhost:3000"

    @property
    def allowed_origins(self) -> List[str]:
        """
        Returns list of allowed CORS origins based on environment.

        In development: allows localhost:3000
        In production: uses FRONTEND_URL from environment + Vercel preview domains
        """
        origins = [self.FRONTEND_URL]

        # Add development origins if in dev mode
        if self.ENVIRONMENT == "development":
            dev_origins = [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
            ]
            # Add unique origins only
            for origin in dev_origins:
                if origin not in origins:
                    origins.append(origin)

        # Add Vercel preview deployment support in production
        if self.ENVIRONMENT == "production":
            # Allow all Vercel preview deployments (*.vercel.app)
            # This is safe because Vercel preview URLs are unique per deployment
            origins.append("https://*.vercel.app")

        return origins

    @property
    def is_production(self) -> bool:
        """Returns True if running in production environment."""
        return self.ENVIRONMENT == "production"

    @property
    def is_development(self) -> bool:
        """Returns True if running in development environment."""
        return self.ENVIRONMENT == "development"

    class Config:
        """Pydantic configuration."""
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Global settings instance
# This will be imported throughout the application
settings = Settings()
