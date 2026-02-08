"""
Pydantic schemas for task request and response validation.

These schemas separate API request/response models from database models,
providing clear validation rules and documentation for each endpoint.
"""

from pydantic import BaseModel, Field
from datetime import datetime


class TaskCreate(BaseModel):
    """
    Request body for creating a new task.

    Used in: POST /api/{user_id}/tasks

    Validation:
        - title: Required, 1-500 characters
        - completed: Optional, defaults to False
    """

    title: str = Field(
        min_length=1,
        max_length=500,
        description="Task title/description",
        examples=["Buy groceries", "Complete project documentation"]
    )

    completed: bool = Field(
        default=False,
        description="Initial completion status"
    )

    class Config:
        """Pydantic configuration."""
        json_schema_extra = {
            "example": {
                "title": "Buy groceries",
                "completed": False
            }
        }


class TaskUpdate(BaseModel):
    """
    Request body for full task update (PUT).

    Used in: PUT /api/{user_id}/tasks/{task_id}

    Validation:
        - title: Required, 1-500 characters
        - completed: Required boolean

    All fields must be provided (full replacement).
    """

    title: str = Field(
        min_length=1,
        max_length=500,
        description="Updated task title"
    )

    completed: bool = Field(
        description="Updated completion status"
    )

    class Config:
        """Pydantic configuration."""
        json_schema_extra = {
            "example": {
                "title": "Buy groceries and cook dinner",
                "completed": True
            }
        }


class TaskPatch(BaseModel):
    """
    Request body for partial task update (PATCH).

    Used in: PATCH /api/{user_id}/tasks/{task_id}

    Validation:
        - completed: Required boolean

    Only completion status can be updated via PATCH.
    """

    completed: bool = Field(
        description="New completion status"
    )

    class Config:
        """Pydantic configuration."""
        json_schema_extra = {
            "example": {
                "completed": True
            }
        }


class TaskResponse(BaseModel):
    """
    Response body for task operations.

    Used in: All task endpoint responses

    Returns complete task data including timestamps and IDs.
    """

    id: int = Field(
        description="Task identifier"
    )

    user_id: str = Field(
        description="Owner's user ID (UUID)"
    )

    title: str = Field(
        description="Task title"
    )

    completed: bool = Field(
        description="Completion status"
    )

    created_at: datetime = Field(
        description="Creation timestamp"
    )

    updated_at: datetime = Field(
        description="Last update timestamp"
    )

    class Config:
        """Pydantic configuration."""
        from_attributes = True  # Enable ORM mode for SQLModel compatibility
        json_schema_extra = {
            "example": {
                "id": 42,
                "user_id": "550e8400-e29b-41d4-a716-446655440000",
                "title": "Buy groceries",
                "completed": False,
                "created_at": "2026-01-19T10:30:00Z",
                "updated_at": "2026-01-19T10:30:00Z"
            }
        }
