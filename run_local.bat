@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   MEDINTEL AI - Local Research Platform Launcher
echo ===================================================

:: 1. Check Python
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not installed or not in PATH. Please install Python 3.10+.
    pause
    exit /b 1
)

:: 2. Check Node.js
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH. Please install Node.js 18+.
    pause
    exit /b 1
)

:: 3. Activate virtualenv if present
if exist "venv\Scripts\activate.bat" (
    echo [INFO] Activating virtual environment (venv)...
    call venv\Scripts\activate.bat
) else if exist ".venv\Scripts\activate.bat" (
    echo [INFO] Activating virtual environment (.venv)...
    call .venv\Scripts\activate.bat
)

:: 4. Verify dependencies
echo [INFO] Checking Python dependencies...
pip install -r requirements.txt -q
if not exist "frontend\node_modules" (
    echo [INFO] Installing frontend dependencies...
    npm --prefix frontend install
)

echo.
echo ===================================================
echo   MEDINTEL AI is running locally:
echo     Frontend:  http://localhost:5173
echo     Backend:   http://127.0.0.1:8000
echo     API docs:  http://127.0.0.1:8000/docs
echo   Press Ctrl+C to stop.
echo ===================================================
echo.

:: Launch backend in new minimized window
start "MEDINTEL_AI_BACKEND" /min python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload

:: Run frontend in current console
call npm --prefix frontend run dev

:: Clean up backend process on exit
taskkill /FI "WINDOWTITLE eq MEDINTEL_AI_BACKEND*" /T /F >nul 2>&1
