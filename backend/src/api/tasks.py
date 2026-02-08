"""
Task Management API Endpoints.

This module implements all 6 REST API endpoints for task CRUD operations:
- GET /api/{user_id}/tasks - List all user tasks
- POST /api/{user_id}/tasks - Create new task
- PATCH /api/{user_id}/tasks/{task_id} - Update task completion status
- PUT /api/{user_id}/tasks/{task_id} - Full task update
- DELETE /api/{user_id}/tasks/{task_id} - Delete task
- GET /api/{user_id}/tasks/{task_id} - Get single task

All endpoints enforce JWT authentication and user ownership validation.
"""

import logging
from typing import List

from fastapi import APIRouter, Depends, Path, status
from sqlmodel import Session, select

from ..auth.dependencies import get_current_user
from ..database import get_session
from ..errors.handlers import (
    ForbiddenError,
    NotFoundError,
    DatabaseError,
    ValidationFailedError,
)
from ..models.task import Task
from ..schemas.task import TaskCreate, TaskUpdate, TaskPatch, TaskResponse


# Configure logging
logger = logging.getLogger(__name__)


# Create API router
router = APIRouter(
    tags=["Tasks"],
    responses={
        401: {"description": "Unauthorized - Missing or invalid JWT token"},
        403: {"description": "Forbidden - User ID mismatch"},
        500: {"description": "Internal Server Error - Database error"},
    },
)


# ============================================================================
# User Story 1 (P1 MVP): List All Tasks
# ============================================================================


@router.get(
    "/{user_id}/tasks",
    response_model=List[TaskResponse],
    status_code=status.HTTP_200_OK,
    summary="List all tasks for authenticated user",
    description="""
    Retrieve all tasks belonging to the authenticated user.

    **Authentication:** JWT token required in cookie (better-auth.session.token)

    **Authorization:** URL user_id must match authenticated user_id from JWT

    **Returns:** List of tasks with 200 status code (empty list if no tasks)

    **Errors:**
    - 401: Missing or invalid JWT token
    - 403: URL user_id does not match authenticated user_id
    - 500: Database query failure
    """,
    response_description="List of user's tasks",
)
async def list_tasks(
    user_id: str = Path(
        description="User ID (UUID) from URL - must match authenticated user"
    ),
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> List[TaskResponse]:
    """
    List all tasks for authenticated user.

    Security:
    - Validates JWT token from cookie
    - Ensures URL user_id matches JWT user_id
    - Queries only tasks belonging to authenticated user

    Args:
        user_id: User ID from URL path
        current_user: Authenticated user ID from JWT token
        session: Database session

    Returns:
        List[TaskResponse]: All tasks belonging to the user

    Raises:
        ForbiddenError: If URL user_id doesn't match JWT user_id
        DatabaseError: If database query fails
    """
    # Security: Validate URL user_id matches authenticated user_id
    if user_id != current_user:
        logger.warning(
            f"User {current_user} attempted to access tasks for user {user_id}"
        )
        raise ForbiddenError("Cannot access another user's resources")

    logger.info(f"User {current_user} listing tasks")

    try:
        # Query tasks for authenticated user only
        statement = select(Task).where(Task.user_id == current_user)
        tasks = session.exec(statement).all()

        logger.info(f"User {current_user} retrieved {len(tasks)} tasks")
        # Convert SQLModel Tasks to TaskResponse list
        return [
            TaskResponse(
                id=task.id,
                user_id=task.user_id,
                title=task.title,
                completed=task.completed,
                created_at=task.created_at,
                updated_at=task.updated_at
            )
            for task in tasks
        ]

    except Exception as e:
        logger.error(f"Database error listing tasks for user {current_user}: {str(e)}")
        raise DatabaseError(f"Failed to retrieve tasks: {str(e)}")


# ============================================================================
# User Story 2 (P1 MVP): Create Task
# ============================================================================


@router.post(
    "/{user_id}/tasks",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new task",
    description="""
    Create a new task for the authenticated user.

    **Authentication:** JWT token required in cookie (better-auth.session.token)

    **Authorization:** URL user_id must match authenticated user_id from JWT

    **Request Body:** TaskCreate with title (1-500 chars) and optional completed flag

    **Returns:** Created task with 201 status code

    **Security:** Task is assigned to authenticated user_id from JWT (not URL)

    **Errors:**
    - 400: Invalid request body (validation failure)
    - 401: Missing or invalid JWT token
    - 403: URL user_id does not match authenticated user_id
    - 500: Database insertion failure
    """,
    response_description="Created task",
)
async def create_task(
    user_id: str = Path(
        description="User ID (UUID) from URL - must match authenticated user"
    ),
    task_data: TaskCreate = ...,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> TaskResponse:
    """
    Create a new task for authenticated user.

    Security:
    - Validates JWT token from cookie
    - Ensures URL user_id matches JWT user_id
    - Assigns task to authenticated user_id (from JWT, not URL)

    Args:
        user_id: User ID from URL path
        task_data: Task creation data (title, completed)
        current_user: Authenticated user ID from JWT token
        session: Database session

    Returns:
        TaskResponse: Created task with auto-generated ID and timestamps

    Raises:
        ForbiddenError: If URL user_id doesn't match JWT user_id
        ValidationFailedError: If request body validation fails
        DatabaseError: If database insertion fails
    """
    # Security: Validate URL user_id matches authenticated user_id
    if user_id != current_user:
        logger.warning(
            f"User {current_user} attempted to create task for user {user_id}"
        )
        raise ForbiddenError("Cannot create tasks for another user")

    logger.info(
        f"User {current_user} creating task: title='{task_data.title}', "
        f"completed={task_data.completed}"
    )

    try:
        # Create task with authenticated user_id from JWT (CRITICAL: not from URL)
        new_task = Task(
            user_id=current_user,  # Use JWT user_id, not URL user_id
            title=task_data.title,
            completed=task_data.completed,
        )

        # Persist to database
        session.add(new_task)
        session.flush()  # Flush to get the ID without committing yet

        # Store values before commit (to avoid Pydantic issues after refresh)
        task_id = new_task.id
        task_user_id = new_task.user_id
        task_title = new_task.title
        task_completed = new_task.completed
        task_created_at = new_task.created_at
        task_updated_at = new_task.updated_at

        session.commit()

        logger.info(f"User {current_user} created task {task_id}")
        # Convert stored values to TaskResponse
        return TaskResponse(
            id=task_id,
            user_id=task_user_id,
            title=task_title,
            completed=task_completed,
            created_at=task_created_at,
            updated_at=task_updated_at
        )

    except Exception as e:
        session.rollback()
        import traceback
        logger.error(f"Database error creating task for user {current_user}: {str(e)}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise DatabaseError(f"Failed to create task: {str(e)}")


# ============================================================================
# User Story 3 (P2): Update Task Completion Status (PATCH)
# ============================================================================


@router.patch(
    "/{user_id}/tasks/{task_id}",
    response_model=TaskResponse,
    status_code=status.HTTP_200_OK,
    summary="Update task completion status",
    description="""
    Update only the completion status of a task (partial update).

    **Authentication:** JWT token required in cookie (better-auth.session.token)

    **Authorization:** URL user_id must match authenticated user_id from JWT

    **Ownership:** Task must exist AND belong to authenticated user

    **Request Body:** TaskPatch with completed boolean field

    **Returns:** Updated task with 200 status code

    **Errors:**
    - 400: Invalid request body
    - 401: Missing or invalid JWT token
    - 403: URL user_id does not match authenticated user_id
    - 404: Task not found or does not belong to user
    - 500: Database update failure
    """,
    response_description="Updated task",
)
async def update_task_completion(
    user_id: str = Path(
        description="User ID (UUID) from URL - must match authenticated user"
    ),
    task_id: int = Path(
        description="Task ID to update",
        gt=0,
    ),
    task_data: TaskPatch = ...,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> TaskResponse:
    """
    Update task completion status only (PATCH).

    Security:
    - Validates JWT token from cookie
    - Ensures URL user_id matches JWT user_id
    - Verifies task exists AND belongs to authenticated user
    - Returns 404 (not 403) if task not found or not owned

    Args:
        user_id: User ID from URL path
        task_id: Task ID to update
        task_data: Patch data with completion status
        current_user: Authenticated user ID from JWT token
        session: Database session

    Returns:
        TaskResponse: Updated task

    Raises:
        ForbiddenError: If URL user_id doesn't match JWT user_id
        NotFoundError: If task not found or doesn't belong to user
        DatabaseError: If database update fails
    """
    # Security: Validate URL user_id matches authenticated user_id
    if user_id != current_user:
        logger.warning(
            f"User {current_user} attempted to update task {task_id} for user {user_id}"
        )
        raise ForbiddenError("Cannot modify another user's resources")

    logger.info(
        f"User {current_user} updating task {task_id} completion to "
        f"{task_data.completed}"
    )

    try:
        # Query task with ownership check (both task_id AND user_id must match)
        statement = select(Task).where(
            Task.id == task_id,
            Task.user_id == current_user,  # CRITICAL: ownership check
        )
        task = session.exec(statement).first()

        # Return 404 if task not found or not owned (don't reveal existence)
        if not task:
            logger.warning(
                f"User {current_user} attempted to update non-existent or "
                f"unauthorized task {task_id}"
            )
            raise NotFoundError(f"Task {task_id} not found")

        # Update completion status
        task.completed = task_data.completed

        # Persist changes
        session.add(task)
        session.commit()
        session.refresh(task)

        logger.info(f"User {current_user} updated task {task_id}")
        return TaskResponse(id=task.id, user_id=task.user_id, title=task.title, completed=task.completed, created_at=task.created_at, updated_at=task.updated_at)

    except NotFoundError:
        # Re-raise NotFoundError without wrapping
        raise
    except Exception as e:
        session.rollback()
        logger.error(
            f"Database error updating task {task_id} for user {current_user}: {str(e)}"
        )
        raise DatabaseError(f"Failed to update task: {str(e)}")


# ============================================================================
# User Story 4 (P2): Full Task Update (PUT)
# ============================================================================


@router.put(
    "/{user_id}/tasks/{task_id}",
    response_model=TaskResponse,
    status_code=status.HTTP_200_OK,
    summary="Full task update",
    description="""
    Update both title and completion status of a task (full update).

    **Authentication:** JWT token required in cookie (better-auth.session.token)

    **Authorization:** URL user_id must match authenticated user_id from JWT

    **Ownership:** Task must exist AND belong to authenticated user

    **Request Body:** TaskUpdate with both title (1-500 chars) and completed fields

    **Returns:** Updated task with 200 status code

    **Errors:**
    - 400: Invalid request body (missing required fields)
    - 401: Missing or invalid JWT token
    - 403: URL user_id does not match authenticated user_id
    - 404: Task not found or does not belong to user
    - 500: Database update failure
    """,
    response_description="Updated task",
)
async def update_task_full(
    user_id: str = Path(
        description="User ID (UUID) from URL - must match authenticated user"
    ),
    task_id: int = Path(
        description="Task ID to update",
        gt=0,
    ),
    task_data: TaskUpdate = ...,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> TaskResponse:
    """
    Full task update (title + completion status).

    Security:
    - Validates JWT token from cookie
    - Ensures URL user_id matches JWT user_id
    - Verifies task exists AND belongs to authenticated user
    - Returns 404 (not 403) if task not found or not owned

    Args:
        user_id: User ID from URL path
        task_id: Task ID to update
        task_data: Full update data (title and completed)
        current_user: Authenticated user ID from JWT token
        session: Database session

    Returns:
        TaskResponse: Updated task

    Raises:
        ForbiddenError: If URL user_id doesn't match JWT user_id
        NotFoundError: If task not found or doesn't belong to user
        DatabaseError: If database update fails
    """
    # Security: Validate URL user_id matches authenticated user_id
    if user_id != current_user:
        logger.warning(
            f"User {current_user} attempted to update task {task_id} for user {user_id}"
        )
        raise ForbiddenError("Cannot modify another user's resources")

    logger.info(
        f"User {current_user} fully updating task {task_id}: "
        f"title='{task_data.title}', completed={task_data.completed}"
    )

    try:
        # Query task with ownership check (both task_id AND user_id must match)
        statement = select(Task).where(
            Task.id == task_id,
            Task.user_id == current_user,  # CRITICAL: ownership check
        )
        task = session.exec(statement).first()

        # Return 404 if task not found or not owned (don't reveal existence)
        if not task:
            logger.warning(
                f"User {current_user} attempted to update non-existent or "
                f"unauthorized task {task_id}"
            )
            raise NotFoundError(f"Task {task_id} not found")

        # Update both title and completion status
        task.title = task_data.title
        task.completed = task_data.completed

        # Persist changes
        session.add(task)
        session.commit()
        session.refresh(task)

        logger.info(f"User {current_user} fully updated task {task_id}")
        return TaskResponse(id=task.id, user_id=task.user_id, title=task.title, completed=task.completed, created_at=task.created_at, updated_at=task.updated_at)

    except NotFoundError:
        # Re-raise NotFoundError without wrapping
        raise
    except Exception as e:
        session.rollback()
        logger.error(
            f"Database error updating task {task_id} for user {current_user}: {str(e)}"
        )
        raise DatabaseError(f"Failed to update task: {str(e)}")


# ============================================================================
# User Story 5 (P3): Delete Task
# ============================================================================


@router.delete(
    "/{user_id}/tasks/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete task",
    description="""
    Delete a task permanently.

    **Authentication:** JWT token required in cookie (better-auth.session.token)

    **Authorization:** URL user_id must match authenticated user_id from JWT

    **Ownership:** Task must exist AND belong to authenticated user

    **Returns:** 204 No Content on successful deletion (no body)

    **Errors:**
    - 401: Missing or invalid JWT token
    - 403: URL user_id does not match authenticated user_id
    - 404: Task not found or does not belong to user
    - 500: Database deletion failure
    """,
    response_description="No content (successful deletion)",
)
async def delete_task(
    user_id: str = Path(
        description="User ID (UUID) from URL - must match authenticated user"
    ),
    task_id: int = Path(
        description="Task ID to delete",
        gt=0,
    ),
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> None:
    """
    Delete task permanently.

    Security:
    - Validates JWT token from cookie
    - Ensures URL user_id matches JWT user_id
    - Verifies task exists AND belongs to authenticated user
    - Returns 404 (not 403) if task not found or not owned

    Args:
        user_id: User ID from URL path
        task_id: Task ID to delete
        current_user: Authenticated user ID from JWT token
        session: Database session

    Returns:
        None (204 No Content)

    Raises:
        ForbiddenError: If URL user_id doesn't match JWT user_id
        NotFoundError: If task not found or doesn't belong to user
        DatabaseError: If database deletion fails
    """
    # Security: Validate URL user_id matches authenticated user_id
    if user_id != current_user:
        logger.warning(
            f"User {current_user} attempted to delete task {task_id} for user {user_id}"
        )
        raise ForbiddenError("Cannot delete another user's resources")

    logger.info(f"User {current_user} deleting task {task_id}")

    try:
        # Query task with ownership check (both task_id AND user_id must match)
        statement = select(Task).where(
            Task.id == task_id,
            Task.user_id == current_user,  # CRITICAL: ownership check
        )
        task = session.exec(statement).first()

        # Return 404 if task not found or not owned (don't reveal existence)
        if not task:
            logger.warning(
                f"User {current_user} attempted to delete non-existent or "
                f"unauthorized task {task_id}"
            )
            raise NotFoundError(f"Task {task_id} not found")

        # Delete task
        session.delete(task)
        session.commit()

        logger.info(f"User {current_user} deleted task {task_id}")
        # Return None for 204 No Content

    except NotFoundError:
        # Re-raise NotFoundError without wrapping
        raise
    except Exception as e:
        session.rollback()
        logger.error(
            f"Database error deleting task {task_id} for user {current_user}: {str(e)}"
        )
        raise DatabaseError(f"Failed to delete task: {str(e)}")


# ============================================================================
# User Story 6 (P3): Get Single Task Details
# ============================================================================


@router.get(
    "/{user_id}/tasks/{task_id}",
    response_model=TaskResponse,
    status_code=status.HTTP_200_OK,
    summary="Get single task details",
    description="""
    Retrieve detailed information for a specific task.

    **Authentication:** JWT token required in cookie (better-auth.session.token)

    **Authorization:** URL user_id must match authenticated user_id from JWT

    **Ownership:** Task must exist AND belong to authenticated user

    **Returns:** Task details with 200 status code

    **Errors:**
    - 401: Missing or invalid JWT token
    - 403: URL user_id does not match authenticated user_id
    - 404: Task not found or does not belong to user
    - 500: Database query failure
    """,
    response_description="Task details",
)
async def get_task(
    user_id: str = Path(
        description="User ID (UUID) from URL - must match authenticated user"
    ),
    task_id: int = Path(
        description="Task ID to retrieve",
        gt=0,
    ),
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> TaskResponse:
    """
    Get single task details.

    Security:
    - Validates JWT token from cookie
    - Ensures URL user_id matches JWT user_id
    - Verifies task exists AND belongs to authenticated user
    - Returns 404 (not 403) if task not found or not owned

    Args:
        user_id: User ID from URL path
        task_id: Task ID to retrieve
        current_user: Authenticated user ID from JWT token
        session: Database session

    Returns:
        TaskResponse: Task details

    Raises:
        ForbiddenError: If URL user_id doesn't match JWT user_id
        NotFoundError: If task not found or doesn't belong to user
        DatabaseError: If database query fails
    """
    # Security: Validate URL user_id matches authenticated user_id
    if user_id != current_user:
        logger.warning(
            f"User {current_user} attempted to access task {task_id} for user {user_id}"
        )
        raise ForbiddenError("Cannot access another user's resources")

    logger.info(f"User {current_user} retrieving task {task_id}")

    try:
        # Query task with ownership check (both task_id AND user_id must match)
        statement = select(Task).where(
            Task.id == task_id,
            Task.user_id == current_user,  # CRITICAL: ownership check
        )
        task = session.exec(statement).first()

        # Return 404 if task not found or not owned (don't reveal existence)
        if not task:
            logger.warning(
                f"User {current_user} attempted to access non-existent or "
                f"unauthorized task {task_id}"
            )
            raise NotFoundError(f"Task {task_id} not found")

        logger.info(f"User {current_user} retrieved task {task_id}")
        return TaskResponse(id=task.id, user_id=task.user_id, title=task.title, completed=task.completed, created_at=task.created_at, updated_at=task.updated_at)

    except NotFoundError:
        # Re-raise NotFoundError without wrapping
        raise
    except Exception as e:
        logger.error(
            f"Database error retrieving task {task_id} for user {current_user}: {str(e)}"
        )
        raise DatabaseError(f"Failed to retrieve task: {str(e)}")
