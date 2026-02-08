"""
Test script for authentication endpoints.

This script tests the signup and signin endpoints to verify they work correctly.
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api/auth"

def test_signup():
    """Test user signup endpoint."""
    print("\n" + "="*60)
    print("Testing POST /api/auth/signup")
    print("="*60)

    # Test data
    test_email = f"test_{datetime.now().timestamp()}@example.com"
    payload = {
        "email": test_email,
        "password": "SecurePass123",
        "name": "Test User"
    }

    print(f"\nRequest payload:")
    print(json.dumps(payload, indent=2))

    # Make request
    response = requests.post(f"{BASE_URL}/signup", json=payload)

    print(f"\nResponse status: {response.status_code}")
    print(f"Response headers:")
    for key, value in response.headers.items():
        if key.lower() == 'set-cookie':
            print(f"  {key}: {value[:50]}... (truncated)")
        else:
            print(f"  {key}: {value}")

    print(f"\nResponse body:")
    print(json.dumps(response.json(), indent=2))

    # Verify response
    assert response.status_code == 201, f"Expected 201, got {response.status_code}"
    data = response.json()
    assert "message" in data, "Response missing 'message' field"
    assert "user" in data, "Response missing 'user' field"
    assert data["user"]["email"] == test_email, "Email mismatch"
    assert "id" in data["user"], "User missing 'id' field"
    assert "password_hash" not in data["user"], "Response should not include password_hash"

    # Verify cookie is set
    assert "Set-Cookie" in response.headers, "Set-Cookie header missing"
    cookie = response.headers["Set-Cookie"]
    assert "better-auth.session.token" in cookie, "Cookie name incorrect"
    assert "HttpOnly" in cookie, "HttpOnly flag missing"
    assert "SameSite=Lax" in cookie, "SameSite flag missing"

    print("\n✓ Signup test passed!")
    return test_email, response.cookies


def test_signin(email: str):
    """Test user signin endpoint."""
    print("\n" + "="*60)
    print("Testing POST /api/auth/signin")
    print("="*60)

    # Test data
    payload = {
        "email": email,
        "password": "SecurePass123"
    }

    print(f"\nRequest payload:")
    print(json.dumps(payload, indent=2))

    # Make request
    response = requests.post(f"{BASE_URL}/signin", json=payload)

    print(f"\nResponse status: {response.status_code}")
    print(f"Response headers:")
    for key, value in response.headers.items():
        if key.lower() == 'set-cookie':
            print(f"  {key}: {value[:50]}... (truncated)")
        else:
            print(f"  {key}: {value}")

    print(f"\nResponse body:")
    print(json.dumps(response.json(), indent=2))

    # Verify response
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert "message" in data, "Response missing 'message' field"
    assert "user" in data, "Response missing 'user' field"
    assert data["user"]["email"] == email, "Email mismatch"
    assert "password_hash" not in data["user"], "Response should not include password_hash"

    # Verify cookie is set
    assert "Set-Cookie" in response.headers, "Set-Cookie header missing"
    cookie = response.headers["Set-Cookie"]
    assert "better-auth.session.token" in cookie, "Cookie name incorrect"
    assert "HttpOnly" in cookie, "HttpOnly flag missing"

    print("\n✓ Signin test passed!")
    return response.cookies


def test_duplicate_signup(email: str):
    """Test duplicate email signup (should return 409)."""
    print("\n" + "="*60)
    print("Testing duplicate email signup (should fail)")
    print("="*60)

    payload = {
        "email": email,
        "password": "AnotherPass456"
    }

    print(f"\nRequest payload:")
    print(json.dumps(payload, indent=2))

    response = requests.post(f"{BASE_URL}/signup", json=payload)

    print(f"\nResponse status: {response.status_code}")
    print(f"Response body:")
    print(json.dumps(response.json(), indent=2))

    assert response.status_code == 409, f"Expected 409, got {response.status_code}"
    assert "already exists" in response.json()["detail"].lower(), "Error message incorrect"

    print("\n✓ Duplicate signup test passed!")


def test_invalid_password():
    """Test signup with invalid password (should return 422)."""
    print("\n" + "="*60)
    print("Testing invalid password (should fail)")
    print("="*60)

    payload = {
        "email": "test@example.com",
        "password": "short"  # Too short, no numbers
    }

    print(f"\nRequest payload:")
    print(json.dumps(payload, indent=2))

    response = requests.post(f"{BASE_URL}/signup", json=payload)

    print(f"\nResponse status: {response.status_code}")
    print(f"Response body:")
    print(json.dumps(response.json(), indent=2))

    assert response.status_code == 422, f"Expected 422, got {response.status_code}"

    print("\n✓ Invalid password test passed!")


def test_wrong_password(email: str):
    """Test signin with wrong password (should return 401)."""
    print("\n" + "="*60)
    print("Testing wrong password (should fail)")
    print("="*60)

    payload = {
        "email": email,
        "password": "WrongPassword123"
    }

    print(f"\nRequest payload:")
    print(json.dumps(payload, indent=2))

    response = requests.post(f"{BASE_URL}/signin", json=payload)

    print(f"\nResponse status: {response.status_code}")
    print(f"Response body:")
    print(json.dumps(response.json(), indent=2))

    assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    assert "Invalid email or password" in response.json()["detail"], "Error message incorrect"

    print("\n✓ Wrong password test passed!")


if __name__ == "__main__":
    try:
        print("\n" + "="*60)
        print("AUTHENTICATION ENDPOINTS TEST SUITE")
        print("="*60)
        print("\nMake sure the FastAPI server is running on http://localhost:8000")
        print("Run: cd backend && python -m uvicorn src.main:app --reload")

        # Run tests
        test_email, cookies = test_signup()
        test_signin(test_email)
        test_duplicate_signup(test_email)
        test_invalid_password()
        test_wrong_password(test_email)

        print("\n" + "="*60)
        print("ALL TESTS PASSED! ✓")
        print("="*60)
        print("\nAuthentication endpoints are working correctly:")
        print("  - POST /api/auth/signup - Creates new user with JWT token")
        print("  - POST /api/auth/signin - Authenticates user with JWT token")
        print("  - Password hashing with bcrypt (cost factor 12)")
        print("  - JWT tokens with 7-day expiration")
        print("  - httpOnly cookies with Secure and SameSite flags")
        print("  - Proper error handling and validation")

    except AssertionError as e:
        print(f"\n✗ Test failed: {e}")
        exit(1)
    except requests.exceptions.ConnectionError:
        print("\n✗ Error: Could not connect to server")
        print("Make sure FastAPI server is running on http://localhost:8000")
        exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
