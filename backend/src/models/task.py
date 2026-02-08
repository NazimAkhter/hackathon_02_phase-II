"""
Task model for todo items.

This model represents the tasks table owned and managed by this backend.
Each task belongs to exactly one user (via user_id foreign key).
"""

from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional


class Task(SQLModel, table=True):
    """
    Task model representing a user's todo item.

    Each task belongs to exactly one user. All queries MUST filter by
    authenticated user_id to enforce user isolation.

    Attributes:
        id: Auto-incrementing task identifier (primary key)
        user_id: UUID of task owner (foreign key to users.id)
        title: Task description/title (max 500 characters)
        completed: Whether task is marked complete (default: False)
        created_at: Task creation timestamp (auto-set)
        updated_at: Last modification timestamp (auto-updated by DB trigger)
    """

    __tablename__ = "tasks"

    # Primary Key
    id: Optional[int] = Field(
        default=None,
        primary_key=True,
        description="Auto-incrementing task identifier"
    )

    # Foreign Key to User
    user_id: str = Field(
        foreign_key="users.id",
        index=True,
        description="UUID of task owner from JWT token"
    )

    # Task Data
    title: str = Field(
        max_length=500,
        description="Task description/title"
    )

    completed: bool = Field(
        default=False,
        description="Whether task is marked complete"
    )

    # Timestamps
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Task creation timestamp"
    )

    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Last modification timestamp (updated by DB trigger)"
    )
