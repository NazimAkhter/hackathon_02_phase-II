@echo off
REM Automated Deployment Script - Phase 2 & 3 (Windows)
REM This script automates all possible deployment steps

setlocal enabledelayedexpansion

echo ========================================
echo Todo App Deployment Script (Windows)
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "DEPLOYMENT_CHECKLIST.md" (
    echo [ERROR] Please run this script from the project root directory
    exit /b 1
)

echo [INFO] Step 1: Verifying Prerequisites
echo -----------------------------------

REM Check git status
git diff-index --quiet HEAD -- 2>nul
if %errorlevel% equ 0 (
    echo [OK] Git working directory is clean
) else (
    echo [WARNING] You have uncommitted changes
    git status --short
    echo.
    set /p continue="Continue anyway? (y/n): "
    if /i not "!continue!"=="y" exit /b 1
)

REM Check current branch
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
echo Current branch: !CURRENT_BRANCH!

echo.
echo [INFO] Step 2: Pushing Code to GitHub
echo -----------------------------------

git push origin !CURRENT_BRANCH!
if %errorlevel% equ 0 (
    echo [OK] Code pushed to GitHub successfully
) else (
    echo [ERROR] Failed to push to GitHub
    echo You can push manually with: git push origin !CURRENT_BRANCH!
    set /p continue="Continue with deployment anyway? (y/n): "
    if /i not "!continue!"=="y" exit /b 1
)

echo.
echo [INFO] Step 3: Generating Secrets
echo -----------------------------------

REM Generate BETTER_AUTH_SECRET if not exists
if not exist ".deployment-secrets" (
    echo Generating BETTER_AUTH_SECRET...

    REM Generate random base64 string (Windows compatible)
    powershell -Command "$bytes = New-Object byte[] 48; (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes); [Convert]::ToBase64String($bytes)" > .deployment-secrets.tmp
    set /p SECRET=<.deployment-secrets.tmp
    echo BETTER_AUTH_SECRET=!SECRET! > .deployment-secrets
    del .deployment-secrets.tmp

    echo [OK] Secret generated and saved to .deployment-secrets
) else (
    echo [INFO] Using existing secret from .deployment-secrets
    for /f "tokens=2 delims==" %%a in ('findstr BETTER_AUTH_SECRET .deployment-secrets') do set SECRET=%%a
)

echo.
echo ========================================
echo BACKEND DEPLOYMENT (Hugging Face Spaces)
echo ========================================
echo.
echo [MANUAL ACTION REQUIRED]
echo.
echo Please complete these steps:
echo.
echo 1. Visit: https://huggingface.co/new-space
echo.
echo 2. Create Space:
echo    - Name: todo-backend-api
echo    - SDK: Docker
echo    - Hardware: CPU basic (free)
echo    - Visibility: Public
echo.
echo 3. Link GitHub repository:
echo    - Repository: NazimAkhter/hackathon_02_phase-II
echo    - Branch: main
echo    - Subdirectory: backend/
echo    - Enable auto-rebuild: YES
echo.
echo 4. Add environment variables (Settings -^> Variables and secrets):
echo.
echo    Copy these values:
echo    ---
echo    BETTER_AUTH_SECRET = !SECRET! (mark as Secret)
echo    DATABASE_URL = postgresql://neondb_owner:npg_3ELxRU9gdine@ep-fragrant-poetry-ahunsmfz-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require^&channel_binding=require (mark as Secret)
echo    ENVIRONMENT = production
echo    PORT = 7860
echo    FRONTEND_URL = https://placeholder.vercel.app
echo    ---
echo.
pause

echo.
set /p BACKEND_URL="Enter your HF Space URL (e.g., https://huggingface.co/spaces/username/todo-backend-api): "

if "!BACKEND_URL!"=="" (
    echo [ERROR] Backend URL is required
    exit /b 1
)

echo [INFO] Validating backend deployment...
curl -s -f "!BACKEND_URL!" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend is accessible
) else (
    echo [WARNING] Could not reach backend URL
)

echo.
echo ========================================
echo FRONTEND DEPLOYMENT (Vercel)
echo ========================================
echo.
echo [MANUAL ACTION REQUIRED]
echo.
echo Please complete these steps:
echo.
echo 1. Visit: https://vercel.com/new
echo.
echo 2. Import Git Repository:
echo    - Select: NazimAkhter/hackathon_02_phase-II
echo    - Framework: Next.js
echo    - Root Directory: frontend/
echo    - Build Command: npm run build
echo    - Output Directory: .next
echo.
echo 3. Add environment variables (for Production AND Preview):
echo    ---
echo    BETTER_AUTH_SECRET = !SECRET!
echo    DATABASE_URL = postgresql://neondb_owner:npg_3ELxRU9gdine@ep-fragrant-poetry-ahunsmfz-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require^&channel_binding=require
echo    NEXT_PUBLIC_API_URL = !BACKEND_URL!
echo    NODE_ENV = production
echo    ---
echo.
echo 4. Click 'Deploy'
echo.
pause

echo.
set /p FRONTEND_URL="Enter your Vercel URL (e.g., https://your-app.vercel.app): "

if "!FRONTEND_URL!"=="" (
    echo [ERROR] Frontend URL is required
    exit /b 1
)

echo [INFO] Validating frontend deployment...
curl -s -f "!FRONTEND_URL!" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Frontend is accessible
) else (
    echo [WARNING] Could not reach frontend URL
)

echo.
echo ========================================
echo CONNECTING DEPLOYMENTS
echo ========================================
echo.
echo Now update environment variables to connect frontend and backend:
echo.
echo 1. In Hugging Face Space (Settings -^> Variables):
echo    Update FRONTEND_URL to: !FRONTEND_URL!
echo.
echo 2. In Vercel (Settings -^> Environment Variables):
echo    Update NEXT_PUBLIC_API_URL to: !BACKEND_URL!
echo.
echo Both platforms will automatically redeploy with new settings.
echo.
pause

echo.
echo ========================================
echo DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Deployment Summary:
echo -----------------------------------
echo Backend URL:  !BACKEND_URL!
echo Frontend URL: !FRONTEND_URL!
echo API Docs:     !BACKEND_URL!/docs
echo.
echo Security:
echo -----------------------------------
echo Your BETTER_AUTH_SECRET is saved in: .deployment-secrets
echo Keep this file secure and do NOT commit it to git!
echo.
echo Next Steps:
echo -----------------------------------
echo 1. Test complete user journey:
echo    - Visit !FRONTEND_URL!/signup
echo    - Create account and sign in
echo    - Create, edit, and delete tasks
echo.
echo 2. Verify automatic deployments:
echo    - Make a small change and push to GitHub
echo    - Verify both platforms auto-deploy
echo.
echo 3. Monitor for issues:
echo    - Check browser console for CORS errors
echo    - Verify all API calls succeed
echo.
echo Documentation:
echo -----------------------------------
echo - Deployment Checklist: DEPLOYMENT_CHECKLIST.md
echo - Implementation Status: PHASE_2_3_IMPLEMENTATION_STATUS.md
echo.
echo [OK] Deployment script completed successfully!
echo.

REM Save deployment info
echo BACKEND_URL=!BACKEND_URL! > .deployment-info
echo FRONTEND_URL=!FRONTEND_URL! >> .deployment-info
echo DEPLOYMENT_DATE=%date% %time% >> .deployment-info

echo Deployment info saved to: .deployment-info
echo.
pause
