#!/bin/bash
# Deployment Validation Script
# Tests all deployment endpoints and functionality

set -e

echo "🧪 Deployment Validation Script"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }

# Load deployment info
if [ ! -f ".deployment-info" ]; then
    print_error "Deployment info not found. Please run deploy.sh first."
    exit 1
fi

source .deployment-info

echo "Testing deployments:"
echo "Backend:  $BACKEND_URL"
echo "Frontend: $FRONTEND_URL"
echo ""

# Test 1: Backend Health Check
print_info "Test 1: Backend Health Check"
HEALTH_RESPONSE=$(curl -s "$BACKEND_URL")
if echo "$HEALTH_RESPONSE" | grep -q "status"; then
    print_success "Backend health check passed"
    echo "Response: $HEALTH_RESPONSE"
else
    print_error "Backend health check failed"
    echo "Response: $HEALTH_RESPONSE"
fi
echo ""

# Test 2: Backend API Documentation
print_info "Test 2: Backend API Documentation"
if curl -s -f "$BACKEND_URL/docs" > /dev/null; then
    print_success "API documentation is accessible"
else
    print_error "API documentation is not accessible"
fi
echo ""

# Test 3: Frontend Accessibility
print_info "Test 3: Frontend Accessibility"
if curl -s -f "$FRONTEND_URL" > /dev/null; then
    print_success "Frontend is accessible"
else
    print_error "Frontend is not accessible"
fi
echo ""

# Test 4: Frontend Signup Page
print_info "Test 4: Frontend Signup Page"
if curl -s -f "$FRONTEND_URL/signup" > /dev/null; then
    print_success "Signup page is accessible"
else
    print_error "Signup page is not accessible"
fi
echo ""

# Test 5: Frontend Signin Page
print_info "Test 5: Frontend Signin Page"
if curl -s -f "$FRONTEND_URL/signin" > /dev/null; then
    print_success "Signin page is accessible"
else
    print_error "Signin page is not accessible"
fi
echo ""

# Test 6: CORS Configuration
print_info "Test 6: CORS Configuration"
CORS_RESPONSE=$(curl -s -I -X OPTIONS "$BACKEND_URL" -H "Origin: $FRONTEND_URL" -H "Access-Control-Request-Method: GET")
if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    print_success "CORS is configured"
else
    print_warning "CORS headers not detected (may need manual verification)"
fi
echo ""

# Test 7: Database Connection
print_info "Test 7: Database Connection"
if echo "$HEALTH_RESPONSE" | grep -q "database"; then
    print_success "Database connection verified in health check"
else
    print_warning "Database status not found in health check"
fi
echo ""

# Summary
echo "================================"
echo "Validation Summary"
echo "================================"
echo ""
echo "✅ Manual Testing Required:"
echo "1. Visit $FRONTEND_URL/signup"
echo "2. Create a test account"
echo "3. Sign in with the account"
echo "4. Create a task"
echo "5. Edit the task"
echo "6. Delete the task"
echo "7. Check browser console for errors"
echo ""
echo "📊 Automated Tests: Check results above"
echo ""
print_success "Validation script completed"
