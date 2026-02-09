@echo off
REM Deployment Validation Script (Windows)
REM Tests all deployment endpoints and functionality

setlocal enabledelayedexpansion

echo ========================================
echo Deployment Validation Script (Windows)
echo ========================================
echo.

REM Load deployment info
if not exist ".deployment-info" (
    echo [ERROR] Deployment info not found. Please run deploy.bat first.
    exit /b 1
)

for /f "tokens=1,2 delims==" %%a in (.deployment-info) do (
    if "%%a"=="BACKEND_URL" set BACKEND_URL=%%b
    if "%%a"=="FRONTEND_URL" set FRONTEND_URL=%%b
)

echo Testing deployments:
echo Backend:  !BACKEND_URL!
echo Frontend: !FRONTEND_URL!
echo.

REM Test 1: Backend Health Check
echo [INFO] Test 1: Backend Health Check
curl -s "!BACKEND_URL!" > health-response.tmp
findstr /C:"status" health-response.tmp >nul
if %errorlevel% equ 0 (
    echo [OK] Backend health check passed
    type health-response.tmp
) else (
    echo [ERROR] Backend health check failed
    type health-response.tmp
)
del health-response.tmp
echo.

REM Test 2: Backend API Documentation
echo [INFO] Test 2: Backend API Documentation
curl -s -f "!BACKEND_URL!/docs" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] API documentation is accessible
) else (
    echo [ERROR] API documentation is not accessible
)
echo.

REM Test 3: Frontend Accessibility
echo [INFO] Test 3: Frontend Accessibility
curl -s -f "!FRONTEND_URL!" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Frontend is accessible
) else (
    echo [ERROR] Frontend is not accessible
)
echo.

REM Test 4: Frontend Signup Page
echo [INFO] Test 4: Frontend Signup Page
curl -s -f "!FRONTEND_URL!/signup" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Signup page is accessible
) else (
    echo [ERROR] Signup page is not accessible
)
echo.

REM Test 5: Frontend Signin Page
echo [INFO] Test 5: Frontend Signin Page
curl -s -f "!FRONTEND_URL!/signin" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Signin page is accessible
) else (
    echo [ERROR] Signin page is not accessible
)
echo.

echo ========================================
echo Validation Summary
echo ========================================
echo.
echo Manual Testing Required:
echo 1. Visit !FRONTEND_URL!/signup
echo 2. Create a test account
echo 3. Sign in with the account
echo 4. Create a task
echo 5. Edit the task
echo 6. Delete the task
echo 7. Check browser console for errors
echo.
echo Automated Tests: Check results above
echo.
echo [OK] Validation script completed
echo.
pause
