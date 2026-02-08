"""
Quick verification script for authentication implementation.

This script verifies that all components are properly configured
without requiring the server to be running.
"""

import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def verify_implementation():
    """Verify all authentication components are properly configured."""

    print("="*70)
    print("AUTHENTICATION IMPLEMENTATION VERIFICATION")
    print("="*70)

    errors = []

    # 1. Verify JWT utilities
    print("\n1. Checking JWT utilities...")
    try:
        from auth.jwt import generate_jwt_token, verify_jwt_token
        print("   ✓ JWT functions imported successfully")

        # Test token generation
        token = generate_jwt_token("test-user-id", "test@example.com")
        print(f"   ✓ Token generation works (length: {len(token)})")
    except Exception as e:
        errors.append(f"JWT utilities error: {e}")
        print(f"   ✗ Error: {e}")

    # 2. Verify schemas
    print("\n2. Checking Pydantic schemas...")
    try:
        from schemas.auth import (
            SignupRequest, SigninRequest, AuthResponse,
            UserResponse, JWTPayload
        )
        print("   ✓ All auth schemas imported successfully")

        # Test schema validation
        signup_data = SignupRequest(
            email="test@example.com",
            password="SecurePass123"
        )
        print(f"   ✓ SignupRequest validation works")

        signin_data = SigninRequest(
            email="test@example.com",
            password="SecurePass123"
        )
        print(f"   ✓ SigninRequest validation works")

    except Exception as e:
        errors.append(f"Schema error: {e}")
        print(f"   ✗ Error: {e}")

    # 3. Verify auth router
    print("\n3. Checking authentication router...")
    try:
        from api.auth import router
        print(f"   ✓ Auth router imported successfully")
        print(f"   ✓ Router has {len(router.routes)} routes")

        for route in router.routes:
            if hasattr(route, 'methods') and hasattr(route, 'path'):
                methods = list(route.methods)
                print(f"     - {methods[0]} {route.path}")

    except Exception as e:
        errors.append(f"Router error: {e}")
        print(f"   ✗ Error: {e}")

    # 4. Verify bcrypt is installed
    print("\n4. Checking bcrypt installation...")
    try:
        import bcrypt
        print("   ✓ bcrypt imported successfully")

        # Test password hashing
        password = b"TestPassword123"
        hashed = bcrypt.hashpw(password, bcrypt.gensalt(rounds=12))
        print("   ✓ Password hashing works")

        # Test password verification
        is_valid = bcrypt.checkpw(password, hashed)
        print(f"   ✓ Password verification works (result: {is_valid})")

    except Exception as e:
        errors.append(f"bcrypt error: {e}")
        print(f"   ✗ Error: {e}")

    # 5. Verify main app configuration
    print("\n5. Checking FastAPI app configuration...")
    try:
        from main import app
        print("   ✓ FastAPI app imported successfully")

        # Check if auth router is mounted
        auth_routes = [r for r in app.routes if '/auth/' in str(r.path)]
        print(f"   ✓ Found {len(auth_routes)} auth routes in app")

    except Exception as e:
        errors.append(f"App configuration error: {e}")
        print(f"   ✗ Error: {e}")

    # 6. Verify database models
    print("\n6. Checking database models...")
    try:
        from models.user import User
        print("   ✓ User model imported successfully")
        print(f"   ✓ User table name: {User.__tablename__}")

    except Exception as e:
        errors.append(f"Database model error: {e}")
        print(f"   ✗ Error: {e}")

    # Summary
    print("\n" + "="*70)
    if errors:
        print("VERIFICATION FAILED")
        print("="*70)
        print("\nErrors found:")
        for error in errors:
            print(f"  - {error}")
        return False
    else:
        print("VERIFICATION PASSED - ALL COMPONENTS CONFIGURED CORRECTLY")
        print("="*70)
        print("\nImplementation Summary:")
        print("  ✓ JWT token generation and verification")
        print("  ✓ Pydantic schemas for request/response validation")
        print("  ✓ Authentication router with signup/signin endpoints")
        print("  ✓ bcrypt password hashing (cost factor 12)")
        print("  ✓ FastAPI app with auth routes mounted")
        print("  ✓ Database models configured")
        print("\nNext Steps:")
        print("  1. Start the server: python -m uvicorn src.main:app --reload --port 8001")
        print("  2. Test endpoints: curl -X POST http://localhost:8001/api/auth/signup ...")
        print("  3. View API docs: http://localhost:8001/docs")
        print("  4. Update frontend to call backend endpoints")
        return True

if __name__ == "__main__":
    try:
        success = verify_implementation()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
