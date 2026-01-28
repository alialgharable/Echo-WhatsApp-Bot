@echo off
echo ===============================
echo Installing Node.js dependencies
echo ===============================

REM Check if package.json exists
if not exist package.json (
    echo ERROR: package.json not found in this directory.
    pause
    exit /b 1
)

REM Check if npm is available
where npm >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not installed or not in PATH.
    pause
    exit /b 1
)

REM Install dependencies
echo Running npm install...
npm install && npm install -g pm2

if errorlevel 1 (
    echo ERROR: npm install failed.
    pause
    exit /b 1
)

echo ===============================
echo Dependencies installed successfully!
echo ===============================
pause
