@echo off
REM Helper script to get Vercel Organization ID and Project ID (Windows)

echo ========================================
echo Vercel Project Information Retriever
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "frontend" (
    echo [ERROR] Please run this script from the project root directory
    exit /b 1
)

cd frontend

REM Check if Vercel CLI is installed
where vercel >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Vercel CLI not found. Installing...
    npm install -g vercel
)

echo [INFO] Logging in to Vercel...
echo Please follow the prompts to authenticate.
echo.

call vercel login

echo.
echo [INFO] Linking project to Vercel...
echo If you already have a Vercel project, select it.
echo Otherwise, create a new one.
echo.

call vercel link

echo.
echo [INFO] Retrieving Project Information...
echo.

if exist ".vercel\project.json" (
    echo [OK] Project information retrieved successfully!
    echo.
    echo ========================================
    echo COPY THESE VALUES TO GITHUB SECRETS
    echo ========================================
    echo.

    REM Read and display the IDs
    for /f "tokens=2 delims=:," %%a in ('findstr "orgId" .vercel\project.json') do (
        set ORG_ID=%%a
        set ORG_ID=!ORG_ID:"=!
        set ORG_ID=!ORG_ID: =!
    )

    for /f "tokens=2 delims=:," %%a in ('findstr "projectId" .vercel\project.json') do (
        set PROJECT_ID=%%a
        set PROJECT_ID=!PROJECT_ID:"=!
        set PROJECT_ID=!PROJECT_ID: =!
    )

    echo Secret Name: VERCEL_ORG_ID
    type .vercel\project.json | findstr "orgId"
    echo.
    echo Secret Name: VERCEL_PROJECT_ID
    type .vercel\project.json | findstr "projectId"
    echo.
    echo ========================================
    echo.
    echo [INFO] Add these secrets here:
    echo https://github.com/NazimAkhter/hackathon_02_phase-II/settings/secrets/actions
    echo.
    echo [INFO] You also need to add VERCEL_TOKEN:
    echo 1. Get token from: https://vercel.com/account/tokens
    echo 2. Add as secret: VERCEL_TOKEN
    echo.

    REM Display the raw JSON for easy copying
    echo [INFO] Raw project.json content:
    type .vercel\project.json
    echo.
) else (
    echo [ERROR] Could not find .vercel\project.json
    echo Please run 'vercel link' manually in the frontend directory
    exit /b 1
)

pause
