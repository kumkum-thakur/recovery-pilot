@echo off
setlocal EnableDelayedExpansion

:: ==========================================
:: Recovery Pilot - Development Server Launcher
:: ==========================================

echo ==========================================
echo   Recovery Pilot - Starting Development
echo ==========================================
echo.

:: Navigate to the directory where this script is located
cd /d "%~dp0"

:: ==========================================
:: CHECK NODE MODULES
:: ==========================================
if not exist "node_modules" (
    echo [SETUP] node_modules not found. Installing dependencies...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
    echo.
    echo [SUCCESS] Dependencies installed.
    echo.
)

:: ==========================================
:: START DEVELOPMENT SERVER WITH AUTO-RESTART
:: ==========================================
echo [STARTING] Launching Vite development server...
echo.
echo The application will be available at:
echo   http://localhost:5173
echo.
echo Server will auto-restart every 2 minutes
echo Press Ctrl+C to stop completely
echo ==========================================
echo.

:restart_loop
echo.
echo [%TIME%] Starting development server...
echo.

:: Start the dev server with a 2-minute timeout (120 seconds)
start /b "" npm run dev
set DEV_PID=%ERRORLEVEL%

:: Wait for 2 minutes
timeout /t 120 /nobreak >nul

:: Kill the dev server process
echo.
echo [%TIME%] Restarting server to keep session fresh...
taskkill /F /IM node.exe /T >nul 2>&1

:: Small delay before restart
timeout /t 2 /nobreak >nul

:: Loop back to restart
goto restart_loop
