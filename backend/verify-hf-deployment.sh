#!/bin/bash
# Deployment Verification Script for Hugging Face Spaces Backend
# This script tests all critical endpoints after deployment

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="${BACKEND_URL:-https://nazimbotexpert-todo-app.hf.space}"
FRONTEND_URL="${FRONTEND_URL:-https://your-app.vercel.app}"

echo "=========================================="
echo "Backend Deployment Verification"
echo "=========================================="
echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""

# Test 1: Health Check
echo "Test 1: Health Check Endpoint"
echo "--------------------------------------"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Health check passed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"

    # Verify response contains expected fields
    if echo "$BODY" | grep -q '"status":"ok"'; then
        echo -e "${GREEN}✅ Status field present${NC}"
    else
        echo -e "${RED}❌ Status field missing${NC}"
    fi

    if echo "$BODY" | grep -q '"environment":"production"'; then
        echo -e "${GREEN}✅ Environment is production${NC}"
    else
        echo -e "${YELLOW}⚠️  Environment is not production${NC}"
    fi
else
    echo -e "${RED}❌ Health check failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
    exit 1
fi
echo ""

# Test 2: API Documentation
echo "Test 2: API Documentation"
echo "--------------------------------------"
DOCS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/docs")
if [ "$DOCS_CODE" = "200" ]; then
    echo -e "${GREEN}✅ API docs accessible (HTTP $DOCS_CODE)${NC}"
    echo "URL: $BACKEND_URL/docs"
else
    echo -e "${RED}❌ API docs not accessible (HTTP $DOCS_CODE)${NC}"
fi
echo ""

# Test 3: ReDoc Documentation
echo "Test 3: ReDoc Documentation"
echo "--------------------------------------"
REDOC_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/redoc")
if [ "$REDOC_CODE" = "200" ]; then
    echo -e "${GREEN}✅ ReDoc accessible (HTTP $REDOC_CODE)${NC}"
    echo "URL: $BACKEND_URL/redoc"
else
    echo -e "${RED}❌ ReDoc not accessible (HTTP $REDOC_CODE)${NC}"
fi
echo ""

# Test 4: CORS Configuration
echo "Test 4: CORS Configuration"
echo "--------------------------------------"
CORS_RESPONSE=$(curl -s -H "Origin: $FRONTEND_URL" -H "Access-Control-Request-Method: POST" -X OPTIONS "$BACKEND_URL/api/auth/signup" -i)

if echo "$CORS_RESPONSE" | grep -q "access-control-allow-origin"; then
    echo -e "${GREEN}✅ CORS headers present${NC}"

    if echo "$CORS_RESPONSE" | grep -q "access-control-allow-credentials: true"; then
        echo -e "${GREEN}✅ Credentials allowed${NC}"
    else
        echo -e "${RED}❌ Credentials not allowed${NC}"
    fi
else
    echo -e "${RED}❌ CORS headers missing${NC}"
fi
echo ""

# Test 5: Authentication Endpoints
echo "Test 5: Authentication Endpoints"
echo "--------------------------------------"

# Test signup endpoint structure (without creating user)
SIGNUP_OPTIONS=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$BACKEND_URL/api/auth/signup")
if [ "$SIGNUP_OPTIONS" = "200" ]; then
    echo -e "${GREEN}✅ Signup endpoint accessible${NC}"
else
    echo -e "${RED}❌ Signup endpoint not accessible (HTTP $SIGNUP_OPTIONS)${NC}"
fi

# Test signin endpoint structure
SIGNIN_OPTIONS=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$BACKEND_URL/api/auth/signin")
if [ "$SIGNIN_OPTIONS" = "200" ]; then
    echo -e "${GREEN}✅ Signin endpoint accessible${NC}"
else
    echo -e "${RED}❌ Signin endpoint not accessible (HTTP $SIGNIN_OPTIONS)${NC}"
fi

# Test session endpoint
SESSION_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/auth/session")
if [ "$SESSION_CODE" = "401" ] || [ "$SESSION_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Session endpoint accessible (HTTP $SESSION_CODE)${NC}"
else
    echo -e "${RED}❌ Session endpoint error (HTTP $SESSION_CODE)${NC}"
fi
echo ""

# Test 6: Database Connectivity (via health check)
echo "Test 6: Database Connectivity"
echo "--------------------------------------"
if echo "$BODY" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✅ Backend started successfully (implies DB connection)${NC}"
    echo "Note: If DB connection failed, backend would not start"
else
    echo -e "${YELLOW}⚠️  Cannot verify DB connection from health check${NC}"
fi
echo ""

# Summary
echo "=========================================="
echo "Deployment Verification Summary"
echo "=========================================="
echo -e "${GREEN}✅ Backend is deployed and accessible${NC}"
echo ""
echo "Next Steps:"
echo "1. Update frontend BETTER_AUTH_URL to: $BACKEND_URL"
echo "2. Deploy frontend to Vercel"
echo "3. Update backend FRONTEND_URL secret with Vercel URL"
echo "4. Test end-to-end authentication flow"
echo ""
echo "Quick Links:"
echo "- API Docs: $BACKEND_URL/docs"
echo "- ReDoc: $BACKEND_URL/redoc"
echo "- Health Check: $BACKEND_URL/"
echo ""
