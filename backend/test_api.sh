#!/bin/bash

echo "==============================================="
echo "Testing Complete Authentication & Tasks Flow"
echo "==============================================="

# Test 1: Create a new user via signup
echo ""
echo "1. Testing Signup..."
SIGNUP_RESPONSE=$(curl -s -c test_cookies.txt http://localhost:3000/api/auth/signup \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"apitest@example.com","password":"testpass123"}')

echo "$SIGNUP_RESPONSE" | python3 -m json.tool
USER_ID=$(echo "$SIGNUP_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['user']['id'])")
echo "User ID: $USER_ID"

# Test 2: Create a task via backend API
echo ""
echo "2. Creating task via backend API..."
CREATE_RESPONSE=$(curl -s -b test_cookies.txt http://localhost:8000/api/${USER_ID}/tasks \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"title":"Test task from API"}')

echo "$CREATE_RESPONSE" | python3 -m json.tool

# Test 3: List tasks via backend API
echo ""
echo "3. Listing tasks via backend API..."
curl -s -b test_cookies.txt http://localhost:8000/api/${USER_ID}/tasks | python3 -m json.tool

# Cleanup
rm -f test_cookies.txt

echo ""
echo "==============================================="
echo "Test Complete!"
echo "==============================================="
