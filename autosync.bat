@echo off
setlocal EnableDelayedExpansion

:: ==========================================
:: CONFIGURATION
:: ==========================================
set "REPO_URL=https://github.com/kumkum-thakur/recovery-pilot.git"
set "BRANCH=main"
set "SYNC_INTERVAL=30"
set "AGENT_ID=Agent 1"

:: Navigate to the directory where this script is located
cd /d "%~dp0"

echo ==========================================
echo   YOU ARE: %AGENT_ID%
echo   The other system is Agent 2
echo ==========================================
echo.

:: ==========================================
:: INITIALIZATION CHECK
:: ==========================================
echo [STATUS] Checking repository status...

if not exist ".git" (
    echo [INIT] Folder is blank or not a git repo. Initializing...
    git init
    git branch -M %BRANCH%
    git remote add origin "%REPO_URL%"
    
    echo [INIT] Attempting first pull...
    git pull origin %BRANCH%
    
    if %ERRORLEVEL% NEQ 0 (
        echo [WARN] Pull failed. If the remote repo is completely empty, 
        echo        create a local file and wait for the first push cycle.
    )
)

:: ==========================================
:: SYNC LOOP
:: ==========================================
:loop
cls
echo ==============================================
echo   AUTO-SYNC: %REPO_URL%
echo   YOU ARE: %AGENT_ID%
echo   TIME: %TIME%
echo ==============================================

:: 1. Add all changes
git add .

:: 2. Commit (only if there are changes)
:: We check status first to avoid empty commit errors in the log
git diff-index --quiet HEAD --
if %ERRORLEVEL% NEQ 0 (
    echo [ACTION] Changes detected. Committing...
    git commit -m "%AGENT_ID%: Auto-sync !DATE! !TIME!"
) else (
    echo [INFO] No local changes to commit.
)

:: 3. Pull (Fetch + Merge/Rebase)
:: Using --rebase to keep history clean and avoid merge conflicts loop
echo [ACTION] Pulling latest changes from Agent 2...
git pull origin %BRANCH% --rebase

:: 4. Push
echo [ACTION] Pushing to remote...
git push origin %BRANCH%

:: 5. Failsafe Verification
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Push failed. Possible reasons:
    echo         - Network disconnected
    echo         - Authentication issue (check your token)
    echo         - Remote rejected changes
    echo         - Agent 2 pushed at the same time (will auto-resolve on next pull)
    echo [RETRY] Will retry in %SYNC_INTERVAL% seconds...
) else (
    echo [SUCCESS] Sync complete. Agent 2 can now see your changes.
)

:: 6. Wait
echo.
echo [WAIT] Sleeping for %SYNC_INTERVAL% seconds...
timeout /t %SYNC_INTERVAL% >nul
goto loop