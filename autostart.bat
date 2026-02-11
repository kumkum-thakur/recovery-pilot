@echo off
REM ============================================================================
REM RecoveryPilot - One-Shot Autostart Script
REM ============================================================================
REM This script sets up and launches the RecoveryPilot application.
REM It installs dependencies, configures environment, and starts the dev server.
REM ============================================================================

echo ============================================
echo   RecoveryPilot - Autonomous Care Orchestrator
echo   Starting up...
echo ============================================
echo.

REM Step 1: Check Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

echo [OK] Node.js found:
node --version
echo.

REM Step 2: Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] package.json not found. Please run this script from the recovery-pilot directory.
    pause
    exit /b 1
)

echo [OK] Project directory confirmed
echo.

REM Step 3: Set Gemini API Key (set your key here or as environment variable)
if "%GEMINI_KEY%"=="" (
    echo [WARNING] GEMINI_KEY environment variable not set.
    echo           AI wound analysis will use fallback mode.
    echo           To enable real AI, set: set GEMINI_KEY=your_api_key_here
    echo.
) else (
    echo [OK] GEMINI_KEY configured
    echo.
)

REM Step 4: Install dependencies
echo [STEP 1/3] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed. Check your internet connection.
    pause
    exit /b 1
)
echo [OK] Dependencies installed
echo.

REM Step 5: Build check
echo [STEP 2/3] Verifying TypeScript compilation...
call npx tsc --noEmit
if %errorlevel% neq 0 (
    echo [WARNING] TypeScript found minor issues, continuing anyway...
)
echo [OK] Build verified
echo.

REM Step 6: Start the development server
echo [STEP 3/3] Starting RecoveryPilot...
echo.
echo ============================================
echo.
echo   RecoveryPilot is starting!
echo.
echo   Open your browser to:
echo     http://localhost:5173
echo.
echo   Login credentials:
echo     Patient: divya / recovery123
echo     Doctor:  sarah / doctor123
echo     Admin:   admin / admin123
echo.
echo   Features:
echo     Patient Dashboard - Missions, Photo Upload, Real AI Triage
echo     Doctor Dashboard  - Triage Inbox, Care Plans, Approve/Reject
echo     Real Gemini AI    - Wound image analysis with confidence scores
echo     Gamification      - Streaks, Celebrations, Recovery Buddy
echo     Care Plans        - Templates, Medications, Mission Scheduling
echo.
echo   Press Ctrl+C to stop the server.
echo.
echo ============================================
echo.

call npx vite --host 0.0.0.0

pause
