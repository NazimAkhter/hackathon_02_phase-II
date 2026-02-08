"""
Database engine and session management for PostgreSQL with Neon.

This module configures SQLModel/SQLAlchemy engine with NullPool
for serverless deployment compatibility.
"""

from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool
from sqlmodel import Session
from typing import Generator

from .config import settings


# Create SQLAlchemy engine with NullPool for Neon serverless
# NullPool ensures no connection pooling at application level,
# which is optimal for serverless PostgreSQL (Neon handles pooling)
engine = create_engine(
    settings.DATABASE_URL,
    poolclass=NullPool,  # No connection pooling for serverless
    echo=settings.is_development,  # Log SQL queries in development
    connect_args={
        "sslmode": "require",  # Required for Neon PostgreSQL
        "connect_timeout": 10,  # Fail fast if connection takes >10s
    },
)


def get_session() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a database session.

    Yields a SQLModel Session for the duration of the request,
    then closes it automatically.

    Usage:
        @app.get("/endpoint")
        def endpoint(session: Session = Depends(get_session)):
            # Use session here
            pass

    Yields:
        Session: SQLModel database session

    Example:
        from fastapi import Depends
        from sqlmodel import Session, select
        from .models.task import Task

        @app.get("/tasks")
        def get_tasks(session: Session = Depends(get_session)):
            statement = select(Task)
            tasks = session.exec(statement).all()
            return tasks
    """
    with Session(engine) as session:
        yield session
