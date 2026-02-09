#!/bin/bash

# Backend Deployment Validation Script
# Validates configuration before deploying to Hugging Face Spaces

set +e

echo "=========================================="
echo "Backend Deployment Validation"
echo "=========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Validation counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2 exists"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $2 missing"
        ((FAILED++))
        return 1
    fi
}

# Function to check if directory exists
check_directory() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $2 exists"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $2 missing"
        ((FAILED++))
        return 1
    fi
}

# Function to check file content
check_content() {
    if grep -q "$2" "$1"; then
        echo -e "${GREEN}✓${NC} $3"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $3"
        ((FAILED++))
        return 1
    fi
}

# Function to warn about content
warn_content() {
    if grep -q "$2" "$1"; then
        echo -e "${YELLOW}⚠${NC} $3"
        ((WARNINGS++))
        return 1
    else
        echo -e "${GREEN}✓${NC} $3"
        ((PASSED++))
        return 0
    fi
}

echo "1. Checking Required Files"
echo "----------------------------"
check_file "Dockerfile" "Dockerfile"
check_file "requirements.txt" "requirements.txt"
check_file ".env.example" ".env.example"
check_file ".dockerignore" ".dockerignore"
check_file "README.md" "README.md"
check_directory "src" "src/ directory"
echo ""

echo "2. Validating Dockerfile Configuration"
echo "----------------------------------------"
check_content "Dockerfile" "FROM python:3.12-slim" "Dockerfile uses Python 3.12"
check_content "Dockerfile" "EXPOSE 7860" "Dockerfile exposes port 7860"
check_content "Dockerfile" 'uvicorn.*--port.*7860' "Dockerfile uses port 7860 for uvicorn"
check_content "Dockerfile" 'COPY requirements.txt' "Dockerfile copies requirements.txt"
check_content "Dockerfile" 'COPY src' "Dockerfile copies src directory"
echo ""

echo "3. Validating requirements.txt"
echo "--------------------------------"
check_content "requirements.txt" "fastapi" "FastAPI included"
check_content "requirements.txt" "sqlmodel" "SQLModel included"
check_content "requirements.txt" "pyjwt" "PyJWT included"
check_content "requirements.txt" "bcrypt" "Bcrypt included"
check_content "requirements.txt" "uvicorn" "Uvicorn included"
check_content "requirements.txt" "psycopg2-binary" "PostgreSQL driver included"
check_content "requirements.txt" "pydantic-settings" "Pydantic settings included"
echo ""

echo "4. Validating Environment Template"
echo "------------------------------------"
check_content ".env.example" "BETTER_AUTH_SECRET" "BETTER_AUTH_SECRET documented"
check_content ".env.example" "DATABASE_URL" "DATABASE_URL documented"
check_content ".env.example" "ENVIRONMENT" "ENVIRONMENT documented"
check_content ".env.example" "FRONTEND_URL" "FRONTEND_URL documented"
check_content ".env.example" "PORT" "PORT documented"
echo ""

echo "5. Checking for Security Issues"
echo "---------------------------------"
warn_content ".env" "BETTER_AUTH_SECRET=.*[^e]$" ".env not committed (or has placeholder only)"
if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠${NC} Warning: .env file exists (should be in .gitignore)"
    ((WARNINGS++))
fi

# Check if secrets are in git history
if git rev-parse --git-dir > /dev/null 2>&1; then
    if git log --all -S "BETTER_AUTH_SECRET" --pretty=format:"%H" | head -1 > /dev/null 2>&1; then
        echo -e "${RED}✗${NC} CRITICAL: BETTER_AUTH_SECRET found in Git history!"
        ((FAILED++))
    else
        echo -e "${GREEN}✓${NC} No secrets in Git history"
        ((PASSED++))
    fi
else
    echo -e "${YELLOW}⚠${NC} Not a Git repository - skipping history check"
    ((WARNINGS++))
fi
echo ""

echo "6. Validating Source Code Structure"
echo "-------------------------------------"
check_file "src/main.py" "src/main.py"
check_file "src/config.py" "src/config.py"
check_directory "src/api" "src/api/ directory"
check_directory "src/models" "src/models/ directory"
echo ""

echo "7. Validating FastAPI Configuration"
echo "-------------------------------------"
check_content "src/main.py" "FastAPI" "FastAPI app initialized"
check_content "src/main.py" "CORSMiddleware" "CORS middleware configured"
check_content "src/main.py" "async def health_check" "Health check endpoint exists"
check_content "src/main.py" 'include_router.*auth' "Auth router included"
check_content "src/main.py" 'include_router.*task' "Task router included"
echo ""

echo "8. Validating Configuration Module"
echo "------------------------------------"
check_content "src/config.py" "class Settings" "Settings class defined"
check_content "src/config.py" "BETTER_AUTH_SECRET" "BETTER_AUTH_SECRET in settings"
check_content "src/config.py" "DATABASE_URL" "DATABASE_URL in settings"
check_content "src/config.py" "allowed_origins" "CORS origins configured"
echo ""

echo "9. Checking README.md Metadata"
echo "--------------------------------"
check_content "README.md" "sdk: docker" "HF Spaces SDK specified as docker"
check_content "README.md" "app_port: 7860" "HF Spaces port specified as 7860"
check_content "README.md" "license: mit" "License specified"
echo ""

echo "10. Git Repository Validation"
echo "-------------------------------"
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Git repository initialized"
    ((PASSED++))

    # Check remote
    if git remote -v | grep -q "github.com"; then
        REMOTE_URL=$(git remote get-url origin)
        echo -e "${GREEN}✓${NC} GitHub remote configured: $REMOTE_URL"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} GitHub remote not configured"
        ((FAILED++))
    fi

    # Check if files are committed
    if git status --porcelain | grep -q "^??"; then
        echo -e "${YELLOW}⚠${NC} Untracked files present"
        ((WARNINGS++))
    else
        echo -e "${GREEN}✓${NC} No untracked files"
        ((PASSED++))
    fi
else
    echo -e "${RED}✗${NC} Not a Git repository"
    ((FAILED++))
fi
echo ""

echo "=========================================="
echo "Validation Summary"
echo "=========================================="
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${RED}Failed:${NC} $FAILED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ Backend is ready for deployment to Hugging Face Spaces!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Go to https://huggingface.co/new-space"
    echo "2. Create a new Space with Docker SDK"
    echo "3. Link your GitHub repository"
    echo "4. Configure environment variables in HF Spaces settings"
    echo "5. Wait for build to complete"
    echo ""
    echo "See ../HF_SPACES_DEPLOYMENT_GUIDE.md for detailed instructions"
    exit 0
else
    echo -e "${RED}✗ Validation failed. Please fix the issues above before deploying.${NC}"
    exit 1
fi
