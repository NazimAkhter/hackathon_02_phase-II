"""
Integration tests for Task Management API endpoints.

Tests all 6 REST API endpoints with authentication and authorization checks.
"""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from src.main import app
from src.database import get_session
from src.models.task import Task
from src.auth.dependencies import get_current_user


# ============================================================================
# Test Fixtures
# ============================================================================


@pytest.fixture(name="session")
def session_fixture():
    """
    Create in-memory SQLite database for testing.

    Yields a clean database session for each test.
    """
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    """
    Create FastAPI test client with overridden dependencies.

    Overrides:
    - get_session: Uses test database session
    - get_current_user: Mocked to return test user ID
    """

    def get_session_override():
        return session

    def get_current_user_override():
        # Mock authenticated user ID
        return "test-user-123"

    app.dependency_overrides[get_session] = get_session_override
    app.dependency_overrides[get_current_user] = get_current_user_override

    client = TestClient(app)
    yield client

    app.dependency_overrides.clear()


@pytest.fixture(name="sample_tasks")
def sample_tasks_fixture(session: Session):
    """
    Create sample tasks for testing.

    Returns:
        list[Task]: Three sample tasks for test-user-123
    """
    tasks = [
        Task(user_id="test-user-123", title="Task 1", completed=False),
        Task(user_id="test-user-123", title="Task 2", completed=True),
        Task(user_id="test-user-123", title="Task 3", completed=False),
    ]

    for task in tasks:
        session.add(task)

    session.commit()

    for task in tasks:
        session.refresh(task)

    return tasks


# ============================================================================
# User Story 1: List All Tasks (GET /api/{user_id}/tasks)
# ============================================================================


def test_list_tasks_success(client: TestClient, sample_tasks):
    """Test successful retrieval of all user tasks."""
    response = client.get("/api/test-user-123/tasks")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    assert all("id" in task for task in data)
    assert all("title" in task for task in data)
    assert all("completed" in task for task in data)
    assert all(task["user_id"] == "test-user-123" for task in data)


def test_list_tasks_empty(client: TestClient):
    """Test listing tasks when user has no tasks."""
    response = client.get("/api/test-user-123/tasks")

    assert response.status_code == 200
    data = response.json()
    assert data == []


def test_list_tasks_forbidden_different_user(client: TestClient, sample_tasks):
    """Test that user cannot list another user's tasks."""
    response = client.get("/api/different-user-456/tasks")

    assert response.status_code == 403
    data = response.json()
    assert data["code"] == "ERR_FORBIDDEN"
    assert "cannot access another user's resources" in data["error"].lower()


# ============================================================================
# User Story 2: Create Task (POST /api/{user_id}/tasks)
# ============================================================================


def test_create_task_success(client: TestClient):
    """Test successful task creation."""
    payload = {
        "title": "New test task",
        "completed": False,
    }

    response = client.post("/api/test-user-123/tasks", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "New test task"
    assert data["completed"] is False
    assert data["user_id"] == "test-user-123"
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


def test_create_task_minimal(client: TestClient):
    """Test creating task with minimal data (completed defaults to False)."""
    payload = {
        "title": "Minimal task",
    }

    response = client.post("/api/test-user-123/tasks", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Minimal task"
    assert data["completed"] is False


def test_create_task_validation_error_missing_title(client: TestClient):
    """Test validation error when title is missing."""
    payload = {
        "completed": False,
    }

    response = client.post("/api/test-user-123/tasks", json=payload)

    assert response.status_code == 400
    data = response.json()
    assert data["code"] == "ERR_VALIDATION_FAILED"


def test_create_task_validation_error_title_too_long(client: TestClient):
    """Test validation error when title exceeds 500 characters."""
    payload = {
        "title": "x" * 501,  # 501 characters
        "completed": False,
    }

    response = client.post("/api/test-user-123/tasks", json=payload)

    assert response.status_code == 400
    data = response.json()
    assert data["code"] == "ERR_VALIDATION_FAILED"


def test_create_task_forbidden_different_user(client: TestClient):
    """Test that user cannot create task for another user."""
    payload = {
        "title": "Unauthorized task",
        "completed": False,
    }

    response = client.post("/api/different-user-456/tasks", json=payload)

    assert response.status_code == 403
    data = response.json()
    assert data["code"] == "ERR_FORBIDDEN"


# ============================================================================
# User Story 3: Update Task Completion (PATCH /api/{user_id}/tasks/{task_id})
# ============================================================================


def test_update_task_completion_success(client: TestClient, sample_tasks):
    """Test successful task completion status update."""
    task_id = sample_tasks[0].id
    payload = {
        "completed": True,
    }

    response = client.patch(f"/api/test-user-123/tasks/{task_id}", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == task_id
    assert data["completed"] is True
    assert data["title"] == sample_tasks[0].title  # Title unchanged


def test_update_task_completion_not_found(client: TestClient):
    """Test updating non-existent task returns 404."""
    payload = {
        "completed": True,
    }

    response = client.patch("/api/test-user-123/tasks/99999", json=payload)

    assert response.status_code == 404
    data = response.json()
    assert data["code"] == "ERR_NOT_FOUND"


def test_update_task_completion_forbidden_different_user(client: TestClient, sample_tasks):
    """Test that user cannot update another user's task."""
    task_id = sample_tasks[0].id
    payload = {
        "completed": True,
    }

    response = client.patch(f"/api/different-user-456/tasks/{task_id}", json=payload)

    assert response.status_code == 403
    data = response.json()
    assert data["code"] == "ERR_FORBIDDEN"


# ============================================================================
# User Story 4: Full Task Update (PUT /api/{user_id}/tasks/{task_id})
# ============================================================================


def test_update_task_full_success(client: TestClient, sample_tasks):
    """Test successful full task update."""
    task_id = sample_tasks[0].id
    payload = {
        "title": "Updated task title",
        "completed": True,
    }

    response = client.put(f"/api/test-user-123/tasks/{task_id}", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == task_id
    assert data["title"] == "Updated task title"
    assert data["completed"] is True


def test_update_task_full_validation_error_missing_title(client: TestClient, sample_tasks):
    """Test validation error when title is missing in PUT."""
    task_id = sample_tasks[0].id
    payload = {
        "completed": True,
    }

    response = client.put(f"/api/test-user-123/tasks/{task_id}", json=payload)

    assert response.status_code == 400
    data = response.json()
    assert data["code"] == "ERR_VALIDATION_FAILED"


def test_update_task_full_not_found(client: TestClient):
    """Test full update of non-existent task returns 404."""
    payload = {
        "title": "Updated task",
        "completed": True,
    }

    response = client.put("/api/test-user-123/tasks/99999", json=payload)

    assert response.status_code == 404
    data = response.json()
    assert data["code"] == "ERR_NOT_FOUND"


def test_update_task_full_forbidden_different_user(client: TestClient, sample_tasks):
    """Test that user cannot fully update another user's task."""
    task_id = sample_tasks[0].id
    payload = {
        "title": "Hacked title",
        "completed": True,
    }

    response = client.put(f"/api/different-user-456/tasks/{task_id}", json=payload)

    assert response.status_code == 403
    data = response.json()
    assert data["code"] == "ERR_FORBIDDEN"


# ============================================================================
# User Story 5: Delete Task (DELETE /api/{user_id}/tasks/{task_id})
# ============================================================================


def test_delete_task_success(client: TestClient, sample_tasks):
    """Test successful task deletion."""
    task_id = sample_tasks[0].id

    response = client.delete(f"/api/test-user-123/tasks/{task_id}")

    assert response.status_code == 204
    assert response.content == b""

    # Verify task is deleted
    get_response = client.get(f"/api/test-user-123/tasks/{task_id}")
    assert get_response.status_code == 404


def test_delete_task_not_found(client: TestClient):
    """Test deleting non-existent task returns 404."""
    response = client.delete("/api/test-user-123/tasks/99999")

    assert response.status_code == 404
    data = response.json()
    assert data["code"] == "ERR_NOT_FOUND"


def test_delete_task_forbidden_different_user(client: TestClient, sample_tasks):
    """Test that user cannot delete another user's task."""
    task_id = sample_tasks[0].id

    response = client.delete(f"/api/different-user-456/tasks/{task_id}")

    assert response.status_code == 403
    data = response.json()
    assert data["code"] == "ERR_FORBIDDEN"


# ============================================================================
# User Story 6: Get Single Task (GET /api/{user_id}/tasks/{task_id})
# ============================================================================


def test_get_task_success(client: TestClient, sample_tasks):
    """Test successful retrieval of single task."""
    task_id = sample_tasks[0].id

    response = client.get(f"/api/test-user-123/tasks/{task_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == task_id
    assert data["title"] == sample_tasks[0].title
    assert data["completed"] == sample_tasks[0].completed
    assert data["user_id"] == "test-user-123"


def test_get_task_not_found(client: TestClient):
    """Test retrieving non-existent task returns 404."""
    response = client.get("/api/test-user-123/tasks/99999")

    assert response.status_code == 404
    data = response.json()
    assert data["code"] == "ERR_NOT_FOUND"


def test_get_task_forbidden_different_user(client: TestClient, sample_tasks):
    """Test that user cannot get another user's task."""
    task_id = sample_tasks[0].id

    response = client.get(f"/api/different-user-456/tasks/{task_id}")

    assert response.status_code == 403
    data = response.json()
    assert data["code"] == "ERR_FORBIDDEN"


# ============================================================================
# Additional Security Tests
# ============================================================================


def test_cannot_access_other_users_tasks_by_id(client: TestClient, session: Session):
    """
    Test that querying by task_id alone doesn't expose other users' tasks.

    Creates task for different user and verifies authenticated user cannot access it.
    """
    # Create task for different user
    other_task = Task(user_id="other-user-999", title="Other user task", completed=False)
    session.add(other_task)
    session.commit()
    session.refresh(other_task)

    # Try to access other user's task (should return 404, not the task)
    response = client.get(f"/api/test-user-123/tasks/{other_task.id}")

    assert response.status_code == 404  # Not 200, protecting data
    data = response.json()
    assert data["code"] == "ERR_NOT_FOUND"


def test_list_tasks_only_returns_own_tasks(client: TestClient, session: Session):
    """
    Test that list endpoint only returns authenticated user's tasks.

    Creates tasks for multiple users and verifies isolation.
    """
    # Create tasks for authenticated user
    task1 = Task(user_id="test-user-123", title="My task 1", completed=False)
    task2 = Task(user_id="test-user-123", title="My task 2", completed=True)

    # Create tasks for other user
    task3 = Task(user_id="other-user-999", title="Other task 1", completed=False)
    task4 = Task(user_id="other-user-999", title="Other task 2", completed=True)

    session.add_all([task1, task2, task3, task4])
    session.commit()

    # List authenticated user's tasks
    response = client.get("/api/test-user-123/tasks")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2  # Only 2 tasks, not 4
    assert all(task["user_id"] == "test-user-123" for task in data)
    assert not any(task["user_id"] == "other-user-999" for task in data)
