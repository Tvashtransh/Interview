@echo off
REM AI-NEXUS ML API Startup Script for Windows
echo ========================================
echo   AI-NEXUS ML API Server
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

echo [1/3] Checking Python version...
python --version

REM Check if virtual environment exists
if not exist "venv\" (
    echo [2/3] Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Activate virtual environment
echo [2/3] Activating virtual environment...
call venv\Scripts\activate.bat

REM Install/upgrade dependencies
echo [3/3] Installing dependencies...
pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Starting ML API Server...
echo   URL: http://localhost:8000
echo   Docs: http://localhost:8000/docs
echo ========================================
echo.
echo Press Ctrl+C to stop the server
echo.

REM Run the API server
REM Store the current directory before changing
set ML_API_DIR=%~dp0
cd app
"%ML_API_DIR%venv\Scripts\python.exe" -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

pause

