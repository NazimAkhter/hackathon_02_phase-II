#!/bin/bash
set -e

echo "================================="
echo "Complete End-to-End API Test"
echo "================================="

# 1. Signin
echo ""
echo "1. Signing in..."
SIGNIN=$(curl -s -c cookies.txt http://localhost:3000/api/auth/signin \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test-probe@example.com","password":"testpass123"}')

echo "$SIGNIN" | python3 -m json.tool
USER_ID=$(echo "$SIGNIN" | python3 -c "import json,sys; print(json.load(sys.stdin)['user']['id'])" 2>/dev/null || echo "")

if [ -z "$USER_ID" ]; then
  echo "Failed to get user ID"
  exit 1
fi

echo "User ID: $USER_ID"

# 2. Create task
echo ""
echo "2. Creating task..."
CREATE=$(curl -s -b cookies.txt "http://localhost:8000/api/$USER_ID/tasks" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"title":"My first task - working!"}')

echo "$CREATE" | python3 -m json.tool

# 3. List tasks
echo ""
echo "3. Listing all tasks..."
curl -s -b cookies.txt "http://localhost:8000/api/$USER_ID/tasks" | python3 -m json.tool

# Cleanup
rm -f cookies.txt

echo ""
echo "================================="
echo "Test Complete!"
echo "================================="
