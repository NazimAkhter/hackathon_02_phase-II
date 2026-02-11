"""
Test script to verify authentication fixes.

This script tests:
1. Signup with valid password (letters + numbers) - should succeed
2. Signup with invalid password (no numbers) - should fail with validation error
3. Signin with valid credentials - should succeed and return proper JSON
4. Response serialization (datetime objects should be properly converted)

Run this script after deploying the fixes to verify they work correctly.
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "https://nazimbotexpert-todo-app.hf.space"  # Production
# BASE_URL = "http://localhost:8000"  # Local testing

def test_signup_valid_password():
    """Test signup with valid password (letters + numbers)"""
    print("\n" + "="*60)
    print("TEST 1: Signup with valid password (letters + numbers)")
    print("="*60)

    # Generate unique email for testing
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    email = f"test{timestamp}@example.com"
    password = "TestPass123"  # Valid: has letters and numbers

    print(f"Email: {email}")
    print(f"Password: {password}")

    response = requests.post(
        f"{BASE_URL}/api/auth/signup",
        json={"email": email, "password": password},
        headers={"Content-Type": "application/json"}
    )

    print(f"\nStatus Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")

    try:
        data = response.json()
        print(f"Response Body: {json.dumps(data, indent=2)}")

        if response.status_code == 201:
            print("\n✅ TEST PASSED: Signup successful")
            print(f"   - User ID: {data.get('user', {}).get('id')}")
            print(f"   - Email: {data.get('user', {}).get('email')}")
            print(f"   - Token present: {'token' in data}")
            return True
        else:
            print(f"\n❌ TEST FAILED: Expected 201, got {response.status_code}")
            return False
    except Exception as e:
        print(f"\n❌ TEST FAILED: Error parsing response: {e}")
        return False


def test_signup_invalid_password_no_numbers():
    """Test signup with invalid password (no numbers)"""
    print("\n" + "="*60)
    print("TEST 2: Signup with invalid password (no numbers)")
    print("="*60)

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    email = f"test{timestamp}@example.com"
    password = "TestPassword"  # Invalid: no numbers

    print(f"Email: {email}")
    print(f"Password: {password}")

    response = requests.post(
        f"{BASE_URL}/api/auth/signup",
        json={"email": email, "password": password},
        headers={"Content-Type": "application/json"}
    )

    print(f"\nStatus Code: {response.status_code}")

    try:
        data = response.json()
        print(f"Response Body: {json.dumps(data, indent=2)}")

        if response.status_code == 400:
            print("\n✅ TEST PASSED: Validation error returned as expected")
            print(f"   - Error message: {data.get('detail')}")
            return True
        else:
            print(f"\n❌ TEST FAILED: Expected 400, got {response.status_code}")
            return False
    except Exception as e:
        print(f"\n❌ TEST FAILED: Error parsing response: {e}")
        return False


def test_signup_invalid_password_no_letters():
    """Test signup with invalid password (no letters)"""
    print("\n" + "="*60)
    print("TEST 3: Signup with invalid password (no letters)")
    print("="*60)

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    email = f"test{timestamp}@example.com"
    password = "12345678"  # Invalid: no letters

    print(f"Email: {email}")
    print(f"Password: {password}")

    response = requests.post(
        f"{BASE_URL}/api/auth/signup",
        json={"email": email, "password": password},
        headers={"Content-Type": "application/json"}
    )

    print(f"\nStatus Code: {response.status_code}")

    try:
        data = response.json()
        print(f"Response Body: {json.dumps(data, indent=2)}")

        if response.status_code == 400:
            print("\n✅ TEST PASSED: Validation error returned as expected")
            print(f"   - Error message: {data.get('detail')}")
            return True
        else:
            print(f"\n❌ TEST FAILED: Expected 400, got {response.status_code}")
            return False
    except Exception as e:
        print(f"\n❌ TEST FAILED: Error parsing response: {e}")
        return False


def test_signin_valid_credentials():
    """Test signin with valid credentials"""
    print("\n" + "="*60)
    print("TEST 4: Signin with valid credentials")
    print("="*60)

    # First create an account
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    email = f"signin{timestamp}@example.com"
    password = "SignIn123"

    print("Step 1: Creating test account...")
    signup_response = requests.post(
        f"{BASE_URL}/api/auth/signup",
        json={"email": email, "password": password},
        headers={"Content-Type": "application/json"}
    )

    if signup_response.status_code != 201:
        print(f"❌ Failed to create test account: {signup_response.status_code}")
        return False

    print(f"✅ Test account created: {email}")

    # Now test signin
    print("\nStep 2: Testing signin...")
    print(f"Email: {email}")
    print(f"Password: {password}")

    response = requests.post(
        f"{BASE_URL}/api/auth/signin",
        json={"email": email, "password": password},
        headers={"Content-Type": "application/json"}
    )

    print(f"\nStatus Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")

    try:
        data = response.json()
        print(f"Response Body: {json.dumps(data, indent=2)}")

        if response.status_code == 200:
            # Verify response structure
            has_message = 'message' in data
            has_user = 'user' in data
            has_token = 'token' in data
            has_user_id = data.get('user', {}).get('id') is not None
            has_email = data.get('user', {}).get('email') == email
            has_created_at = 'created_at' in data.get('user', {})
            has_updated_at = 'updated_at' in data.get('user', {})

            # Check datetime serialization (should be ISO 8601 strings)
            created_at = data.get('user', {}).get('created_at')
            updated_at = data.get('user', {}).get('updated_at')

            datetime_valid = True
            if created_at:
                try:
                    datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    print(f"   - created_at is valid ISO 8601: {created_at}")
                except:
                    datetime_valid = False
                    print(f"   - ❌ created_at is NOT valid ISO 8601: {created_at}")

            if updated_at:
                try:
                    datetime.fromisoformat(updated_at.replace('Z', '+00:00'))
                    print(f"   - updated_at is valid ISO 8601: {updated_at}")
                except:
                    datetime_valid = False
                    print(f"   - ❌ updated_at is NOT valid ISO 8601: {updated_at}")

            all_checks = all([
                has_message, has_user, has_token, has_user_id,
                has_email, has_created_at, has_updated_at, datetime_valid
            ])

            if all_checks:
                print("\n✅ TEST PASSED: Signin successful with proper response structure")
                print(f"   - Message: {data.get('message')}")
                print(f"   - User ID: {data.get('user', {}).get('id')}")
                print(f"   - Email: {data.get('user', {}).get('email')}")
                print(f"   - Token present: {has_token}")
                print(f"   - Datetime serialization: ✅ Valid ISO 8601")
                return True
            else:
                print("\n❌ TEST FAILED: Response structure incomplete")
                print(f"   - has_message: {has_message}")
                print(f"   - has_user: {has_user}")
                print(f"   - has_token: {has_token}")
                print(f"   - has_user_id: {has_user_id}")
                print(f"   - has_email: {has_email}")
                print(f"   - has_created_at: {has_created_at}")
                print(f"   - has_updated_at: {has_updated_at}")
                print(f"   - datetime_valid: {datetime_valid}")
                return False
        else:
            print(f"\n❌ TEST FAILED: Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print(f"\n❌ TEST FAILED: Error parsing response: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("AUTHENTICATION FIX VERIFICATION TESTS")
    print("="*60)
    print(f"Testing against: {BASE_URL}")

    results = []

    # Run tests
    results.append(("Signup with valid password", test_signup_valid_password()))
    results.append(("Signup with invalid password (no numbers)", test_signup_invalid_password_no_numbers()))
    results.append(("Signup with invalid password (no letters)", test_signup_invalid_password_no_letters()))
    results.append(("Signin with valid credentials", test_signin_valid_credentials()))

    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status}: {test_name}")

    print(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Authentication fixes are working correctly.")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please review the output above.")
        return 1


if __name__ == "__main__":
    exit(main())
