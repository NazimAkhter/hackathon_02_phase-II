#!/bin/bash
# Automated Deployment Script - Phase 2 & 3
# This script automates all possible deployment steps

set -e  # Exit on error

echo "🚀 Todo App Deployment Script"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "DEPLOYMENT_CHECKLIST.md" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_info "Step 1: Verifying Prerequisites"
echo "-----------------------------------"

# Check git status
if git diff-index --quiet HEAD --; then
    print_success "Git working directory is clean"
else
    print_warning "You have uncommitted changes"
    echo "Uncommitted files:"
    git status --short
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if on correct branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "006-deployment-cicd" ]; then
    print_warning "You're on branch '$CURRENT_BRANCH', expected '006-deployment-cicd'"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

print_info "Step 2: Pushing Code to GitHub"
echo "-----------------------------------"

# Push to GitHub
if git push origin "$CURRENT_BRANCH" 2>&1; then
    print_success "Code pushed to GitHub successfully"
else
    print_error "Failed to push to GitHub. Please check your SSH keys or use HTTPS"
    print_info "You can push manually with: git push origin $CURRENT_BRANCH"
    read -p "Continue with deployment anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
print_info "Step 3: Backend Deployment (Hugging Face Spaces)"
echo "-----------------------------------"
print_warning "Manual action required - Hugging Face Spaces has no API"
echo ""
echo "Please complete these steps:"
echo "1. Visit: https://huggingface.co/new-space"
echo "2. Create Space:"
echo "   - Name: todo-backend-api"
echo "   - SDK: Docker"
echo "   - Hardware: CPU basic (free)"
echo "   - Visibility: Public"
echo "3. Link GitHub repository:"
echo "   - Repository: NazimAkhter/hackathon_02_phase-II"
echo "   - Branch: main"
echo "   - Subdirectory: backend/"
echo "   - Enable auto-rebuild: ✓"
echo ""
echo "4. Add environment variables (Settings → Variables and secrets):"
echo ""

# Generate BETTER_AUTH_SECRET if not exists
if [ ! -f ".deployment-secrets" ]; then
    print_info "Generating BETTER_AUTH_SECRET..."
    SECRET=$(openssl rand -base64 64 | tr -d '\n')
    echo "BETTER_AUTH_SECRET=$SECRET" > .deployment-secrets
    chmod 600 .deployment-secrets
    print_success "Secret generated and saved to .deployment-secrets"
else
    print_info "Using existing secret from .deployment-secrets"
    SECRET=$(grep BETTER_AUTH_SECRET .deployment-secrets | cut -d'=' -f2)
fi

echo ""
echo "Copy these environment variables to HF Space:"
echo "---"
echo "BETTER_AUTH_SECRET = $SECRET (mark as Secret ✓)"
echo "DATABASE_URL = postgresql://neondb_owner:npg_3ELxRU9gdine@ep-fragrant-poetry-ahunsmfz-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require (mark as Secret ✓)"
echo "ENVIRONMENT = production"
echo "PORT = 7860"
echo "FRONTEND_URL = https://placeholder.vercel.app"
echo "---"
echo ""

read -p "Press Enter when backend deployment is complete and Space is running..."
echo ""

# Ask for backend URL
read -p "Enter your HF Space URL (e.g., https://huggingface.co/spaces/username/todo-backend-api): " BACKEND_URL
if [ -z "$BACKEND_URL" ]; then
    print_error "Backend URL is required"
    exit 1
fi

# Validate backend URL
print_info "Validating backend deployment..."
if curl -s -f "$BACKEND_URL" > /dev/null; then
    print_success "Backend is accessible"
else
    print_warning "Could not reach backend URL. Please verify it's correct."
fi

echo ""
print_info "Step 4: Frontend Deployment (Vercel)"
echo "-----------------------------------"
print_warning "Manual action required - Vercel MCP cannot create new projects"
echo ""
echo "Please complete these steps:"
echo "1. Visit: https://vercel.com/new"
echo "2. Import Git Repository:"
echo "   - Select: NazimAkhter/hackathon_02_phase-II"
echo "   - Framework: Next.js"
echo "   - Root Directory: frontend/"
echo "   - Build Command: npm run build"
echo "   - Output Directory: .next"
echo ""
echo "3. Add environment variables (for Production AND Preview):"
echo "---"
echo "BETTER_AUTH_SECRET = $SECRET"
echo "DATABASE_URL = postgresql://neondb_owner:npg_3ELxRU9gdine@ep-fragrant-poetry-ahunsmfz-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
echo "NEXT_PUBLIC_API_URL = $BACKEND_URL"
echo "NODE_ENV = production"
echo "---"
echo ""
echo "4. Click 'Deploy'"
echo ""

read -p "Press Enter when frontend deployment is complete..."
echo ""

# Ask for frontend URL
read -p "Enter your Vercel URL (e.g., https://your-app.vercel.app): " FRONTEND_URL
if [ -z "$FRONTEND_URL" ]; then
    print_error "Frontend URL is required"
    exit 1
fi

# Validate frontend URL
print_info "Validating frontend deployment..."
if curl -s -f "$FRONTEND_URL" > /dev/null; then
    print_success "Frontend is accessible"
else
    print_warning "Could not reach frontend URL. Please verify it's correct."
fi

echo ""
print_info "Step 5: Connecting Deployments"
echo "-----------------------------------"

echo "Now update environment variables to connect frontend and backend:"
echo ""
echo "1. In Hugging Face Space (Settings → Variables):"
echo "   Update FRONTEND_URL to: $FRONTEND_URL"
echo ""
echo "2. In Vercel (Settings → Environment Variables):"
echo "   Update NEXT_PUBLIC_API_URL to: $BACKEND_URL"
echo ""
echo "Both platforms will automatically redeploy with new settings."
echo ""

read -p "Press Enter when environment variables are updated..."
echo ""

print_info "Step 6: Validation"
echo "-----------------------------------"

echo "Testing deployments..."
echo ""

# Test backend health check
print_info "Testing backend health check..."
if curl -s "$BACKEND_URL" | grep -q "status"; then
    print_success "Backend health check passed"
else
    print_warning "Backend health check failed or returned unexpected response"
fi

# Test frontend
print_info "Testing frontend..."
if curl -s -f "$FRONTEND_URL" > /dev/null; then
    print_success "Frontend is accessible"
else
    print_warning "Frontend test failed"
fi

echo ""
print_success "Deployment Complete!"
echo "================================"
echo ""
echo "📊 Deployment Summary:"
echo "-----------------------------------"
echo "Backend URL:  $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo "API Docs:     $BACKEND_URL/docs"
echo ""
echo "🔐 Security:"
echo "-----------------------------------"
echo "Your BETTER_AUTH_SECRET is saved in: .deployment-secrets"
echo "Keep this file secure and do NOT commit it to git!"
echo ""
echo "✅ Next Steps:"
echo "-----------------------------------"
echo "1. Test complete user journey:"
echo "   - Visit $FRONTEND_URL/signup"
echo "   - Create account and sign in"
echo "   - Create, edit, and delete tasks"
echo ""
echo "2. Verify automatic deployments:"
echo "   - Make a small change and push to GitHub"
echo "   - Verify both platforms auto-deploy"
echo ""
echo "3. Monitor for issues:"
echo "   - Check browser console for CORS errors"
echo "   - Verify all API calls succeed"
echo ""
echo "📚 Documentation:"
echo "-----------------------------------"
echo "- Deployment Checklist: DEPLOYMENT_CHECKLIST.md"
echo "- Implementation Status: PHASE_2_3_IMPLEMENTATION_STATUS.md"
echo ""
print_success "Deployment script completed successfully!"
