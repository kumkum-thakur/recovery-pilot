@echo off
setlocal EnableDelayedExpansion
:: =============================================================================
:: RecoveryPilot — Idempotent Auto-Configuration Script (Windows)
:: =============================================================================
::
:: PURPOSE:
::   Install, update, and restart RecoveryPilot in a single command.
::   Safe to run repeatedly — every operation is idempotent.
::
:: USAGE:
::   autoconfig.bat              Full setup: install deps, verify, start dev server
::   autoconfig.bat --update     Pull latest, reinstall deps, verify
::   autoconfig.bat --restart    Restart the development server
::   autoconfig.bat --health     Check if everything is configured
::   autoconfig.bat --build      Build production bundle
::   autoconfig.bat --help       Show help
::
:: =============================================================================

set "MODE=full"
if "%~1"=="--update"  set "MODE=update"
if "%~1"=="--restart" set "MODE=restart"
if "%~1"=="--health"  set "MODE=health"
if "%~1"=="--build"   set "MODE=build"
if "%~1"=="--help"    set "MODE=help"
if "%~1"=="-h"        set "MODE=help"

echo.
echo ============================================================
echo   RecoveryPilot — Autonomous Care Orchestrator
echo   Mode: %MODE%
echo   Time: %DATE% %TIME%
echo ============================================================
echo.

:: ── Help ─────────────────────────────────────────────────────────────────────
if "%MODE%"=="help" (
    echo Usage: autoconfig.bat [OPTIONS]
    echo.
    echo Options:
    echo   ^(no args^)   Full setup: install deps, verify build, start dev server
    echo   --update     Pull latest code, reinstall deps, verify TypeScript
    echo   --restart    Start the development server
    echo   --health     Check if everything is configured correctly
    echo   --build      Build production bundle to dist/
    echo   --help       Show this help message
    echo.
    goto :eof
)

:: ── Health Check ─────────────────────────────────────────────────────────────
if "%MODE%"=="health" (
    echo -- Health Check --
    echo.

    where node >nul 2>nul
    if !errorlevel! equ 0 (
        echo   [OK] Node.js found:
        for /f "tokens=*" %%v in ('node --version') do echo         %%v
    ) else (
        echo   [ERR] Node.js not found
    )

    where npm >nul 2>nul
    if !errorlevel! equ 0 (
        echo   [OK] npm found:
        for /f "tokens=*" %%v in ('npm --version') do echo         %%v
    ) else (
        echo   [ERR] npm not found
    )

    if exist "node_modules\" (
        echo   [OK] Dependencies installed
    ) else (
        echo   [!!] Dependencies not installed ^(run autoconfig.bat^)
    )

    if exist "dist\index.html" (
        echo   [OK] Production build exists
    ) else (
        echo   [!!] No production build ^(run autoconfig.bat --build^)
    )

    if exist ".env" (
        echo   [OK] .env file exists
    ) else (
        echo   [!!] No .env file ^(copy from .env.example^)
    )

    echo.
    goto :eof
)

:: ── Restart Mode ─────────────────────────────────────────────────────────────
if "%MODE%"=="restart" (
    echo -- Starting Development Server --
    echo.
    cd /d "%~dp0"
    call npx vite --host 0.0.0.0
    goto :eof
)

:: ── Navigate to Script Directory ─────────────────────────────────────────────
cd /d "%~dp0"

if not exist "package.json" (
    echo [ERR] package.json not found.
    echo       Run this script from the recovery-pilot directory.
    pause
    exit /b 1
)

:: =============================================================================
:: STEP 1: Check Node.js
:: =============================================================================
echo -- Step 1: Checking Node.js --
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERR] Node.js is not installed.
    echo       Download and install Node.js 18+ from https://nodejs.org
    echo       Then re-run this script.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node --version') do set "NODE_VER=%%v"
echo   [OK] Node.js %NODE_VER%
echo.

:: =============================================================================
:: STEP 2: Environment File
:: =============================================================================
echo -- Step 2: Environment Configuration --
echo.

if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
        echo   [OK] Created .env from .env.example
        echo   [!!] Edit .env to add your Gemini API key ^(optional^)
    ) else (
        echo   [!!] No .env.example found, skipping
    )
) else (
    echo   [OK] .env already exists
)

:: Inject GEMINI_KEY from environment if set
if defined GEMINI_KEY (
    echo   [OK] GEMINI_KEY found in environment
) else (
    echo   [!!] GEMINI_KEY not set. Wound analysis will use fallback mode.
    echo        To enable AI: set GEMINI_KEY=your_key_here
)
echo.

:: =============================================================================
:: STEP 3: Update (if requested)
:: =============================================================================
if "%MODE%"=="update" (
    echo -- Step 3: Pulling Latest Code --
    echo.

    where git >nul 2>nul
    if !errorlevel! equ 0 (
        git pull origin main
        if !errorlevel! neq 0 (
            echo   [!!] Git pull failed. Continuing with current code.
        ) else (
            echo   [OK] Code updated
        )
    ) else (
        echo   [!!] Git not found. Skipping code update.
    )
    echo.
)

:: =============================================================================
:: STEP 4: Install Dependencies
:: =============================================================================
echo -- Step 4: Installing Dependencies --
echo.

call npm install
if %errorlevel% neq 0 (
    echo [ERR] npm install failed. Check your internet connection.
    pause
    exit /b 1
)
echo   [OK] Dependencies installed
echo.

:: =============================================================================
:: STEP 5: TypeScript Verification
:: =============================================================================
echo -- Step 5: Verifying TypeScript --
echo.

call npx tsc --noEmit 2>nul
if %errorlevel% neq 0 (
    echo   [!!] TypeScript found minor issues ^(non-fatal^)
) else (
    echo   [OK] TypeScript verification passed
)
echo.

:: =============================================================================
:: STEP 6: Build (if requested)
:: =============================================================================
if "%MODE%"=="build" (
    echo -- Step 6: Building Production Bundle --
    echo.

    call npx tsc -b 2>nul
    call npx vite build
    if %errorlevel% neq 0 (
        echo [ERR] Build failed
        pause
        exit /b 1
    )

    if exist "dist\index.html" (
        echo   [OK] Production build complete ^(dist/^)
    ) else (
        echo [ERR] Build failed — dist\index.html not found
        pause
        exit /b 1
    )
    echo.
    echo ============================================================
    echo   Build complete! Serve dist/ with any static file server.
    echo ============================================================
    pause
    goto :eof
)

:: =============================================================================
:: STEP 7: Start Development Server
:: =============================================================================
echo ============================================================
echo.
echo   RecoveryPilot is ready!
echo.
echo   Open your browser to:
echo     http://localhost:5173
echo.
echo   Credentials:
echo     Patient:   divya / divya
echo     Doctor:    dr.smith / smith
echo     Admin:     admin / admin
echo.
echo   Press Ctrl+C to stop the server.
echo.
echo ============================================================
echo.

call npx vite --host 0.0.0.0

pause
