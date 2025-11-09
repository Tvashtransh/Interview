@echo off
REM AI-NEXUS Quick Start Script for Windows
REM This script helps you start all services quickly

echo.
echo 🚀 AI-NEXUS Quick Start
echo ========================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Python is not installed. Please install Python 3.9+ first.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed
echo.

echo 📦 Starting Backend...
cd backend
if not exist "node_modules" (
    echo    Installing dependencies...
    call npm install
)
start "AI-NEXUS Backend" cmd /k "npm run dev"
cd ..
timeout /t 3 /nobreak >nul

echo 🐍 Starting ML API...
cd ml-api
if not exist "venv" (
    echo    Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate.bat
if not exist "venv\Scripts\uvicorn.exe" (
    echo    Installing dependencies...
    pip install -r requirements.txt
)
start "AI-NEXUS ML API" cmd /k "python -m uvicorn app.main:app --reload --port 8000"
cd ..
timeout /t 3 /nobreak >nul

echo ⚛️  Starting Frontend...
cd frontend
if not exist "node_modules" (
    echo    Installing dependencies...
    call npm install
)
start "AI-NEXUS Frontend" cmd /k "npm run dev"
cd ..

echo.
echo 🎉 All services started!
echo.
echo 📍 Services:
echo    - Backend:    http://localhost:5000
echo    - ML API:     http://localhost:8000
echo    - Frontend:   http://localhost:3000
echo.
echo 📝 Close the command windows to stop services
echo.
pause

