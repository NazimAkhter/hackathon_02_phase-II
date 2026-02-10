#!/bin/bash
# Check Backend Deployment Status

echo "🔍 Checking Backend Deployment Status..."
echo ""

# Check GitHub Actions workflow status
echo "1. GitHub Actions Status:"
echo "   Visit: https://github.com/NazimAkhter/hackathon_02_phase-II/actions"
echo "   Look for: 'Deploy Backend to Hugging Face Spaces'"
echo "   Latest commit: e68c230"
echo ""

# Check if backend has the fix
echo "2. Testing if SameSite=None is deployed:"
echo ""

# Make a test signin request and check cookie
RESPONSE=$(curl -s -i -X POST https://nazimbotexpert-todo-app.hf.space/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}' 2>&1)

# Check for Set-Cookie header
if echo "$RESPONSE" | grep -i "set-cookie.*SameSite=None" > /dev/null; then
    echo "   ✅ DEPLOYED: Backend has SameSite=None"
    echo "   Status: Ready to test"
    echo ""
    echo "   You can now test signup/signin at:"
    echo "   https://hackathon-02-phase-ii-lac.vercel.app"
elif echo "$RESPONSE" | grep -i "set-cookie.*SameSite=Lax" > /dev/null; then
    echo "   ⏳ NOT YET: Backend still has SameSite=Lax (old code)"
    echo "   Status: Deployment in progress"
    echo ""
    echo "   Wait 5-10 minutes and run this script again"
else
    echo "   ❓ UNKNOWN: Could not detect cookie settings"
    echo "   Status: Check manually"
    echo ""
    echo "   Check Set-Cookie header:"
    echo "$RESPONSE" | grep -i "set-cookie" | head -3
fi

echo ""
echo "3. Estimated deployment time:"
echo "   - GitHub Actions: 2-3 minutes"
echo "   - HF Space rebuild: 3-5 minutes"
echo "   - Total: 5-10 minutes from push"
echo ""
echo "4. Push time: $(git log -1 --format=%cd --date=relative)"
