#!/bin/bash
# Helper script to get Vercel Organization ID and Project ID

echo "🔍 Vercel Project Information Retriever"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

cd frontend

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "🔐 Logging in to Vercel..."
echo "Please follow the prompts to authenticate."
echo ""

vercel login

echo ""
echo "🔗 Linking project to Vercel..."
echo "If you already have a Vercel project, select it."
echo "Otherwise, create a new one."
echo ""

vercel link

echo ""
echo "📋 Retrieving Project Information..."
echo ""

if [ -f ".vercel/project.json" ]; then
    ORG_ID=$(cat .vercel/project.json | grep -o '"orgId":"[^"]*"' | cut -d'"' -f4)
    PROJECT_ID=$(cat .vercel/project.json | grep -o '"projectId":"[^"]*"' | cut -d'"' -f4)

    echo "✅ Project information retrieved successfully!"
    echo ""
    echo "========================================"
    echo "📝 COPY THESE VALUES TO GITHUB SECRETS"
    echo "========================================"
    echo ""
    echo "Secret Name: VERCEL_ORG_ID"
    echo "Value: $ORG_ID"
    echo ""
    echo "Secret Name: VERCEL_PROJECT_ID"
    echo "Value: $PROJECT_ID"
    echo ""
    echo "========================================"
    echo ""
    echo "🔗 Add these secrets here:"
    echo "https://github.com/NazimAkhter/hackathon_02_phase-II/settings/secrets/actions"
    echo ""
    echo "📝 You also need to add VERCEL_TOKEN:"
    echo "1. Get token from: https://vercel.com/account/tokens"
    echo "2. Add as secret: VERCEL_TOKEN"
    echo ""
else
    echo "❌ Error: Could not find .vercel/project.json"
    echo "Please run 'vercel link' manually in the frontend directory"
    exit 1
fi
