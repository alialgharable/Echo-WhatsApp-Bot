@echo off
echo ===============================
echo Starting Node.js application
echo ===============================

REM Check if index.js exists
if not exist index.js (
    echo ERROR: index.js not found.
    pause
    exit /b 1
)

REM Check if node is available
where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH.
    pause
    exit /b 1
)

REM Run the app
node ./index.js

echo ===============================
echo Application exited
echo ===============================
pause
